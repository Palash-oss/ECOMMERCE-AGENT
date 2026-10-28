from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from backend.app.database import execute_query, execute_single
from backend.app.cache import cache
from backend.app.security.pii_masker import sanitize_text

def clean_category_name(raw_name: Optional[str]) -> str:
    """
    Cleans raw database category slugs to elegant Title Case with '&'.
    e.g. 'health_beauty' -> 'Health & Beauty', 'bed_bath_table' -> 'Bed, Bath & Table'.
    Never shows raw underscores or untranslated slugs.
    """
    if not raw_name or raw_name.lower() in ('null', 'none', ''):
        return "General Merchandise"

    s = raw_name.replace("_", " ").strip()
    words = s.split()
    capitalized = []
    for w in words:
        if w.lower() in ("and", "e"):
            capitalized.append("&")
        else:
            capitalized.append(w.capitalize())
    formatted = " ".join(capitalized)

    # Specific stylistic polish
    replacements = {
        "Bed Bath Table": "Bed, Bath & Table",
        "Health Beauty": "Health & Beauty",
        "Sports Leisure": "Sports & Leisure",
        "Computers Accessories": "Computers & Accessories",
        "Furniture Decor": "Furniture & Decor",
        "Watches Gifts": "Watches & Gifts",
        "Housewares": "Housewares",
        "Auto": "Automotive",
        "Garden Tools": "Garden & Tools",
        "Telephony": "Phones & Telephony"
    }
    return replacements.get(formatted, formatted)

def get_category_tiles_summary(status_filter: str = "delivered") -> List[Dict[str, Any]]:
    """
    Category-first browsing data: Returns top categories with total GMV, units, and SKU count.
    """
    cache_key = cache._generate_key("cat_tiles_v1", "global", {"status": status_filter})
    cached = cache.get(cache_key)
    if cached:
        return cached

    sql = """
        SELECT 
            COALESCE(c.category_name_en, 'General Merchandise') AS category_raw,
            COALESCE(c.category_name_pt, 'Outros') AS category_pt,
            COUNT(DISTINCT p.product_id) AS sku_count,
            COUNT(oi.order_item_id) AS units_sold,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS total_revenue,
            ROUND(AVG(oi.price), 2) AS avg_price
        FROM olist.products p
        JOIN olist.order_items oi ON p.product_id = oi.product_id
        JOIN olist.orders o ON oi.order_id = o.order_id
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        WHERE o.order_status = 'delivered'
        GROUP BY c.category_name_en, c.category_name_pt
        ORDER BY total_revenue DESC
        LIMIT 16;
    """
    rows = execute_query(sql)
    results = [
        {
            "category": clean_category_name(r["category_raw"]),
            "category_slug": r["category_raw"].lower(),
            "category_pt": r["category_pt"],
            "sku_count": int(r["sku_count"]),
            "units_sold": int(r["units_sold"]),
            "total_revenue": float(r["total_revenue"] or 0),
            "avg_price": float(r["avg_price"] or 0)
        }
        for r in rows
    ]
    cache.set(cache_key, results, ttl=600)
    return results

def search_products_suggestions(query: str, limit: int = 10) -> Dict[str, Any]:
    """
    Command Palette (Ctrl+K) and catalog search.
    Matches English category, Portuguese category, 6-char short code, and full UUID prefix.
    Returns matching items and category suggestions.
    """
    clean_query = query.strip()
    if not clean_query:
        return {"items": [], "categories": [], "did_you_mean": []}

    safe_param = f"%{clean_query.lower()}%"
    prefix_param = f"{clean_query.lower()}%"

    sql = """
        SELECT 
            p.product_id,
            COALESCE(c.category_name_en, 'General Merchandise') AS category_raw,
            p.photos_qty,
            p.weight_g,
            p.length_cm,
            p.height_cm,
            p.width_cm,
            ROUND(AVG(oi.price), 2) AS avg_price,
            ROUND(COALESCE(SUM(oi.price + oi.freight_value), 0), 2) AS revenue,
            COUNT(oi.order_item_id) AS total_sales
        FROM olist.products p
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        LEFT JOIN olist.order_items oi ON p.product_id = oi.product_id
        WHERE LOWER(p.product_id) LIKE %s 
           OR LOWER(p.product_id) LIKE %s
           OR LOWER(COALESCE(c.category_name_en, '')) LIKE %s
           OR LOWER(COALESCE(c.category_name_pt, '')) LIKE %s
        GROUP BY p.product_id, c.category_name_en, p.photos_qty, p.weight_g, p.length_cm, p.height_cm, p.width_cm
        ORDER BY revenue DESC
        LIMIT %s;
    """
    rows = execute_query(sql, (prefix_param, safe_param, safe_param, safe_param, min(limit, 15)))

    items = []
    for r in rows:
        cat_title = clean_category_name(r["category_raw"])
        short_code = r["product_id"][:6].upper()
        items.append({
            "product_id": r["product_id"],
            "short_code": short_code,
            "title": f"{cat_title} Item",
            "category": cat_title,
            "price": float(r["avg_price"] or 0),
            "revenue": float(r["revenue"] or 0),
            "total_sales": int(r["total_sales"] or 0),
            "photos_qty": int(r["photos_qty"] or 1),
            "weight_g": int(r["weight_g"] or 0),
            "dimensions_cm": f"{r['length_cm'] or 0}×{r['width_cm'] or 0}×{r['height_cm'] or 0} cm"
        })

    # "Did you mean" fallback suggestions if 0 results
    did_you_mean = []
    if not items and len(clean_query) >= 3:
        sql_dym = """
            SELECT DISTINCT c.category_name_en
            FROM olist.product_categories c
            WHERE LOWER(c.category_name_en) LIKE %s
            LIMIT 3;
        """
        dym_rows = execute_query(sql_dym, (f"%{clean_query[:3].lower()}%",))
        did_you_mean = [clean_category_name(r["category_name_en"]) for r in dym_rows]

    return {
        "items": items,
        "did_you_mean": did_you_mean
    }

def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "revenue",
    page: int = 1,
    page_size: int = 12
) -> Dict[str, Any]:
    """
    Paginated, filterable product catalog with honest display names:
    - Card Title: '<Category> Item' with short code chip [E0D64F]
    - Physical specs: weight, dimensions (L×W×H cm), photos
    - Real metrics: avg price, units sold, revenue, category rank
    - Never generates fake SKU titles
    """
    offset = (max(1, page) - 1) * page_size
    conditions = ["1=1"]
    params: List[Any] = []

    if search:
        s_clean = search.strip().lower()
        conditions.append("""(
            LOWER(p.product_id) LIKE %s 
            OR LOWER(COALESCE(c.category_name_en, '')) LIKE %s
            OR LOWER(COALESCE(c.category_name_pt, '')) LIKE %s
        )""")
        params.extend([f"{s_clean}%", f"%{s_clean}%", f"%{s_clean}%"])

    if category and category != "all":
        conditions.append("LOWER(COALESCE(c.category_name_en, '')) = %s")
        params.append(category.lower().replace(" & ", "_").replace(" ", "_"))

    if min_price is not None:
        conditions.append("oi.price >= %s")
        params.append(min_price)

    if max_price is not None:
        conditions.append("oi.price <= %s")
        params.append(max_price)

    sort_clause = "total_revenue DESC"
    if sort_by == "best_selling":
        sort_clause = "units_sold DESC"
    elif sort_by == "price_asc":
        sort_clause = "avg_price ASC"
    elif sort_by == "price_desc":
        sort_clause = "avg_price DESC"
    elif sort_by == "top_rated":
        sort_clause = "avg_review_score DESC"

    where_str = " AND ".join(conditions)

    sql = f"""
        SELECT 
            p.product_id,
            COALESCE(c.category_name_en, 'Other') AS category_raw,
            COALESCE(c.category_name_pt, 'Outros') AS category_pt,
            p.photos_qty,
            p.weight_g,
            p.length_cm,
            p.height_cm,
            p.width_cm,
            COUNT(oi.order_item_id) AS units_sold,
            ROUND(COALESCE(SUM(oi.price + oi.freight_value), 0), 2) AS total_revenue,
            ROUND(COALESCE(AVG(oi.price), 0), 2) AS avg_price
        FROM olist.products p
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        LEFT JOIN olist.order_items oi ON p.product_id = oi.product_id
        WHERE {where_str}
        GROUP BY p.product_id, c.category_name_en, c.category_name_pt, p.photos_qty, p.weight_g, p.length_cm, p.height_cm, p.width_cm
        ORDER BY {sort_clause}
        LIMIT %s OFFSET %s;
    """
    rows = execute_query(sql, tuple(params + [page_size, offset]))

    # Count query
    count_sql = f"""
        SELECT COUNT(DISTINCT p.product_id) AS total_count
        FROM olist.products p
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        LEFT JOIN olist.order_items oi ON p.product_id = oi.product_id
        WHERE {where_str};
    """
    count_row = execute_single(count_sql, tuple(params)) or {}
    total_count = int(count_row.get("total_count", len(rows)))

    products = []
    for r in rows:
        cat_title = clean_category_name(r["category_raw"])
        short_code = r["product_id"][:6].upper()
        units = int(r["units_sold"] or 0)
        velocity_tier = "High Demand" if units > 40 else ("Moderate Demand" if units > 15 else "Niche Demand")

        dim_str = f"{r['length_cm'] or 0}×{r['width_cm'] or 0}×{r['height_cm'] or 0} cm"

        products.append({
            "product_id": r["product_id"],
            "short_code": short_code,
            "title": f"{cat_title} Item",
            "category": cat_title,
            "category_pt": r["category_pt"],
            "price": float(r["avg_price"] or 0),
            "total_revenue": float(r["total_revenue"] or 0),
            "units_sold": units,
            "velocity_tier": velocity_tier,
            "photos_qty": int(r["photos_qty"] or 1),
            "weight_g": int(r["weight_g"] or 0),
            "dimensions_cm": dim_str,
            "notice": "Source data has no product names, items are identified by category + short code."
        })

    return {
        "items": products,
        "page": page,
        "page_size": page_size,
        "total_items": total_count,
        "total_pages": (total_count + page_size - 1) // page_size,
        "disclaimer": "Source data has no product names, items are identified by category + short code."
    }

def get_product_details(product_id: str) -> Dict[str, Any]:
    """
    Live statistics for a single SKU in the selected dataset range:
    Revenue, units, orders, AOV, freight share, review distribution, price distribution,
    sales trend, top buyer states, rank in category, frequently bought together.
    Hides widgets where data doesn't exist.
    """
    safe_id = product_id.strip()
    sql_product = """
        SELECT 
            p.product_id,
            COALESCE(c.category_name_en, 'General') AS category_raw,
            p.category_id,
            p.photos_qty,
            p.weight_g,
            p.length_cm,
            p.height_cm,
            p.width_cm,
            COUNT(DISTINCT o.order_id) AS total_orders,
            COUNT(oi.order_item_id) AS units_sold,
            ROUND(COALESCE(SUM(oi.price + oi.freight_value), 0), 2) AS total_revenue,
            ROUND(COALESCE(SUM(oi.price), 0), 2) AS merchandise_rev,
            ROUND(COALESCE(SUM(oi.freight_value), 0), 2) AS total_freight,
            ROUND(COALESCE(AVG(oi.price), 0), 2) AS avg_price,
            ROUND(COALESCE(AVG(oi.freight_value), 0), 2) AS avg_freight
        FROM olist.products p
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        LEFT JOIN olist.order_items oi ON p.product_id = oi.product_id
        LEFT JOIN olist.orders o ON oi.order_id = o.order_id
        WHERE p.product_id = %s
        GROUP BY p.product_id, c.category_name_en, p.category_id, p.photos_qty, p.weight_g, p.length_cm, p.height_cm, p.width_cm;
    """
    p = execute_single(sql_product, (safe_id,))
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product item '{safe_id}' not found in database."
        )

    cat_title = clean_category_name(p["category_raw"])
    short_code = p["product_id"][:6].upper()
    tot_orders = int(p["total_orders"] or 0)
    units = int(p["units_sold"] or 0)
    tot_rev = float(p["total_revenue"] or 0)
    tot_freight = float(p["total_freight"] or 0)
    aov = round((tot_rev / tot_orders), 2) if tot_orders > 0 else 0.0
    freight_share = round((tot_freight * 100.0 / tot_rev), 1) if tot_rev > 0 else 0.0

    # 1. Frequently Bought Together (co-occurrence within orders)
    sql_fbt = """
        SELECT 
            oi2.product_id,
            COALESCE(c2.category_name_en, 'Related') AS category_raw,
            COUNT(*) AS co_occurrence_count,
            ROUND(AVG(oi2.price), 2) AS avg_price
        FROM olist.order_items oi1
        JOIN olist.order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
        LEFT JOIN olist.products p2 ON oi2.product_id = p2.product_id
        LEFT JOIN olist.product_categories c2 ON p2.category_id = c2.category_id
        WHERE oi1.product_id = %s
        GROUP BY oi2.product_id, c2.category_name_en
        ORDER BY co_occurrence_count DESC
        LIMIT 4;
    """
    fbt_rows = execute_query(sql_fbt, (safe_id,))
    fbt = [
        {
            "product_id": r["product_id"],
            "short_code": r["product_id"][:6].upper(),
            "title": f"{clean_category_name(r['category_raw'])} Item",
            "category": clean_category_name(r["category_raw"]),
            "co_occurrence_count": int(r["co_occurrence_count"]),
            "price": float(r["avg_price"] or 0)
        }
        for r in fbt_rows
    ]

    # 2. Deduplicated Review Sentiment for this item
    sql_reviews = """
        WITH dedup_item_reviews AS (
            SELECT DISTINCT ON (ord_rev.order_id)
                r.score,
                r.comment_title,
                r.comment_message,
                r.created_date
            FROM olist.order_items oi
            JOIN olist.order_reviews ord_rev ON oi.order_id = ord_rev.order_id
            JOIN olist.reviews r ON ord_rev.review_id = r.review_id
            WHERE oi.product_id = %s
            ORDER BY ord_rev.order_id, r.created_date DESC
        )
        SELECT score, COUNT(*) as cnt
        FROM dedup_item_reviews
        GROUP BY score
        ORDER BY score DESC;
    """
    rev_dist = execute_query(sql_reviews, (safe_id,))
    total_reviews = sum(int(r["cnt"]) for r in rev_dist)
    weighted_score = sum(int(r["score"]) * int(r["cnt"]) for r in rev_dist)
    avg_score = round(weighted_score / total_reviews, 2) if total_reviews > 0 else None

    # 3. Monthly Sales Velocity (Complete months only)
    sql_trend = """
        SELECT 
            TO_CHAR(DATE_TRUNC('month', o.purchased_at), 'Mon YY') AS month_label,
            COUNT(oi.order_item_id) AS units,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS revenue
        FROM olist.order_items oi
        JOIN olist.orders o ON oi.order_id = o.order_id
        WHERE oi.product_id = %s
          AND TO_CHAR(DATE_TRUNC('month', o.purchased_at), 'YYYY-MM') NOT IN ('2016-09', '2016-10', '2016-12', '2018-09', '2018-10')
        GROUP BY DATE_TRUNC('month', o.purchased_at)
        ORDER BY DATE_TRUNC('month', o.purchased_at) ASC;
    """
    trend_rows = execute_query(sql_trend, (safe_id,))

    # 4. Top Buyer States for this SKU
    sql_states = """
        SELECT 
            c.state,
            COUNT(DISTINCT o.order_id) AS orders,
            COUNT(oi.order_item_id) AS units,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS revenue
        FROM olist.order_items oi
        JOIN olist.orders o ON oi.order_id = o.order_id
        JOIN olist.customers c ON o.customer_id = c.customer_id
        WHERE oi.product_id = %s
        GROUP BY c.state
        ORDER BY revenue DESC
        LIMIT 5;
    """
    state_rows = execute_query(sql_states, (safe_id,))

    # 5. Rank in Category
    category_rank = None
    if p.get("category_id"):
        sql_rank = """
            WITH Ranked AS (
                SELECT 
                    p.product_id,
                    RANK() OVER (ORDER BY COALESCE(SUM(oi.price + oi.freight_value), 0) DESC) as cat_rank
                FROM olist.products p
                JOIN olist.order_items oi ON p.product_id = oi.product_id
                WHERE p.category_id = %s
                GROUP BY p.product_id
            )
            SELECT cat_rank FROM Ranked WHERE product_id = %s;
        """
        rank_row = execute_single(sql_rank, (p["category_id"], safe_id)) or {}
        category_rank = int(rank_row.get("cat_rank", 1))

    # 6. Recent verified customer reviews with comments
    sql_recent_revs = """
        WITH dedup_item_reviews AS (
            SELECT DISTINCT ON (ord_rev.order_id)
                r.score,
                COALESCE(r.comment_title, '') AS title,
                COALESCE(r.comment_message, '') AS comment,
                TO_CHAR(r.created_date, 'YYYY-MM-DD') AS date
            FROM olist.order_items oi
            JOIN olist.order_reviews ord_rev ON oi.order_id = ord_rev.order_id
            JOIN olist.reviews r ON ord_rev.review_id = r.review_id
            WHERE oi.product_id = %s
              AND r.comment_message IS NOT NULL AND TRIM(r.comment_message) != ''
            ORDER BY ord_rev.order_id, r.created_date DESC
        )
        SELECT score, title, comment, date
        FROM dedup_item_reviews
        ORDER BY date DESC
        LIMIT 5;
    """
    raw_recent_reviews = execute_query(sql_recent_revs, (safe_id,))
    recent_reviews = [
        {
            "score": int(r["score"]),
            "title": str(r["title"]).strip(),
            "comment": str(r["comment"]).strip(),
            "date": str(r["date"])
        }
        for r in raw_recent_reviews
    ]

    velocity_tier = "High Demand" if units > 40 else ("Moderate Demand" if units > 15 else "Niche Demand")

    return {
        "product_id": p["product_id"],
        "short_code": short_code,
        "title": f"{cat_title} Item",
        "category": cat_title,
        "total_revenue": tot_rev,
        "units_sold": units,
        "total_orders": tot_orders,
        "aov": aov,
        "avg_price": float(p["avg_price"] or 0),
        "avg_freight": float(p["avg_freight"] or 0),
        "freight_share_pct": freight_share,
        "category_rank": category_rank,
        "velocity_tier": velocity_tier,
        "avg_review_score": avg_score,
        "review_count": total_reviews,
        "review_distribution": rev_dist,
        "recent_reviews": recent_reviews,
        "photos_qty": int(p["photos_qty"] or 1),
        "weight_g": int(p["weight_g"] or 0),
        "dimensions": f"{p['length_cm']}×{p['width_cm']}×{p['height_cm']} cm",
        "monthly_trend": trend_rows,
        "top_buyer_states": state_rows,
        "frequently_bought_together": fbt,
        "notice": "Source data has no product names, items are identified by category + short code."
    }

def compare_products_stats(product_ids: List[str]) -> List[Dict[str, Any]]:
    """Fetches side-by-side comparative metrics for up to 3 SKUs."""
    results = []
    for pid in product_ids[:3]:
        try:
            details = get_product_details(pid)
            results.append(details)
        except HTTPException:
            continue
    return results
