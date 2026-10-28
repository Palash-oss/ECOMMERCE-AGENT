"""
Canonical Metric Calculation Module for NexusCommerce AI.
Single source of truth implementing /docs/METRICS.md.
All APIs, Agent Tools, Dashboard widgets, and PDF generators consume this module.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from backend.app.database import execute_query, execute_single
from backend.app.cache import cache

# Global Date Coverage Anchors (Strictly Complete Months in Olist Dataset)
DATASET_MIN_DATE = "2016-09-04"
DATASET_MAX_DATE = "2018-10-17"
COMPLETE_MONTHS_START = "2017-01-01"
COMPLETE_MONTHS_END = "2018-08-31 23:59:59"

# Default Canonical Window: Last 6 complete months vs Preceding 6 complete months
DEFAULT_START_DATE = "2018-03-01"
DEFAULT_END_DATE = "2018-08-31 23:59:59"

def parse_iso_date(dt_str: str) -> datetime:
    """Robust ISO date parser supporting YYYY-MM-DD or full timestamp."""
    clean = dt_str.strip()
    if len(clean) == 10:
        return datetime.strptime(clean, "%Y-%m-%d")
    return datetime.fromisoformat(clean)

def format_compact_currency(amount: float) -> str:
    """Formats Brazilian Reais compactly with R$ prefix (e.g. R$ 6.41M, R$ 159.83)."""
    if abs(amount) >= 1_000_000:
        return f"R$ {amount / 1_000_000:.2f}M"
    if abs(amount) >= 1_000:
        return f"R$ {amount / 1_000:.1f}K"
    return f"R$ {amount:.2f}"

def format_compact_number(val: int) -> str:
    """Formats integers compactly (e.g. 96.5K, 2,801)."""
    if abs(val) >= 1_000_000:
        return f"{val / 1_000_000:.2f}M"
    if abs(val) >= 10_000:
        return f"{val / 1_000:.1f}K"
    return f"{val:,}"

def compute_preceding_window(
    start_date: Optional[str],
    end_date: Optional[str]
) -> Tuple[Optional[str], Optional[str], bool]:
    """
    Computes the immediately preceding equal-length date window.
    Returns (prev_start, prev_end, is_valid_coverage).
    If the preceding period falls before continuous data coverage (2017-01-01)
    or no dates are supplied (full dataset audit), is_valid_coverage is False.
    """
    if not start_date or not end_date:
        return None, None, False

    try:
        start_dt = parse_iso_date(start_date)
        end_dt = parse_iso_date(end_date)
    except Exception:
        return None, None, False

    duration = end_dt - start_dt
    if duration.total_seconds() <= 0:
        return None, None, False

    prev_end = start_dt - timedelta(seconds=1)
    prev_start = prev_end - duration

    coverage_floor = parse_iso_date(COMPLETE_MONTHS_START)
    if prev_start < coverage_floor:
        # Preceding window lacks complete full-month data coverage
        return None, None, False

    return (
        prev_start.strftime("%Y-%m-%d %H:%M:%S"),
        prev_end.strftime("%Y-%m-%d %H:%M:%S"),
        True
    )

def query_canonical_kpis(
    start_date: Optional[str] = DEFAULT_START_DATE,
    end_date: Optional[str] = DEFAULT_END_DATE,
    status_filter: str = "delivered"
) -> Dict[str, Any]:
    """
    Single source of truth for headline e-commerce metrics.
    Guarantees:
    - Active Customers uses DISTINCT customer_unique_id (never customer_id).
    - Repeat buyers and repeat buyer rate computed accurately.
    - Previous period delta computed only if preceding period has valid coverage.
    - Returns exact figures + compact formatting.
    """
    # 1. Base conditions
    conditions = []
    params: List[Any] = []

    if status_filter and status_filter.lower() != "all":
        conditions.append("o.order_status = %s")
        params.append(status_filter.lower())

    if start_date:
        conditions.append("o.purchased_at >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("o.purchased_at <= %s")
        params.append(end_date)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Current period query:
    # Uses a single clean join avoiding fan-out on customer counts
    sql_current = f"""
        SELECT 
            COALESCE(SUM(oi.price + oi.freight_value), 0) AS gmv,
            COALESCE(SUM(oi.price), 0) AS merchandise_rev,
            COALESCE(SUM(oi.freight_value), 0) AS freight_val,
            COUNT(DISTINCT o.order_id) AS total_orders,
            COUNT(oi.order_item_id) AS items_sold,
            COUNT(DISTINCT c.customer_unique_id) AS unique_customers
        FROM olist.orders o
        LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id
        LEFT JOIN olist.customers c ON o.customer_id = c.customer_id
        {where_clause};
    """
    row = execute_single(sql_current, tuple(params) if params else None) or {}

    gmv = float(row.get("gmv", 0.0))
    merchandise_rev = float(row.get("merchandise_rev", 0.0))
    freight_val = float(row.get("freight_val", 0.0))
    orders = int(row.get("total_orders", 0))
    items = int(row.get("items_sold", 0))
    customers = int(row.get("unique_customers", 0))
    aov = (gmv / orders) if orders > 0 else 0.0
    avg_price = (merchandise_rev / items) if items > 0 else 0.0

    # Repeat buyers calculation in the same window
    sql_repeat = f"""
        SELECT COUNT(*) AS repeat_buyers FROM (
            SELECT c.customer_unique_id
            FROM olist.orders o
            JOIN olist.customers c ON o.customer_id = c.customer_id
            {where_clause}
            GROUP BY c.customer_unique_id
            HAVING COUNT(DISTINCT o.order_id) > 1
        ) t;
    """
    repeat_row = execute_single(sql_repeat, tuple(params) if params else None) or {}
    repeat_buyers = int(repeat_row.get("repeat_buyers", 0))
    repeat_rate = round((repeat_buyers / customers * 100.0), 2) if customers > 0 else 0.0

    # Total all-status orders count for reconciling header badge
    all_orders_count = int((execute_single("SELECT COUNT(*) as c FROM olist.orders;") or {}).get("c", 99441))

    # Preceding Period Benchmark (Strictly Real SQL — Zero Synthetic Multipliers)
    prev_start, prev_end, has_valid_prior = compute_preceding_window(start_date, end_date)
    prior_kpis = None
    deltas = {}

    if has_valid_prior and prev_start and prev_end:
        prior_params = []
        prior_conditions = []
        if status_filter and status_filter.lower() != "all":
            prior_conditions.append("o.order_status = %s")
            prior_params.append(status_filter.lower())
        prior_conditions.append("o.purchased_at >= %s")
        prior_params.append(prev_start)
        prior_conditions.append("o.purchased_at <= %s")
        prior_params.append(prev_end)
        prior_where = f"WHERE {' AND '.join(prior_conditions)}"

        sql_prior = f"""
            SELECT 
                COALESCE(SUM(oi.price + oi.freight_value), 0) AS gmv,
                COUNT(DISTINCT o.order_id) AS total_orders,
                COUNT(oi.order_item_id) AS items_sold,
                COUNT(DISTINCT c.customer_unique_id) AS unique_customers
            FROM olist.orders o
            LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id
            LEFT JOIN olist.customers c ON o.customer_id = c.customer_id
            {prior_where};
        """
        prior_row = execute_single(sql_prior, tuple(prior_params)) or {}
        p_gmv = float(prior_row.get("gmv", 0.0))
        p_orders = int(prior_row.get("total_orders", 0))
        p_items = int(prior_row.get("items_sold", 0))
        p_customers = int(prior_row.get("unique_customers", 0))

        def calc_delta(curr: float, prev: float) -> Dict[str, Any]:
            if prev <= 0:
                return {"percentage": 0.0, "direction": "neutral", "has_data": False}
            pct = round(((curr - prev) / prev) * 100.0, 1)
            return {
                "percentage": pct,
                "direction": "positive" if pct >= 0 else "negative",
                "has_data": True
            }

        deltas = {
            "gmv": calc_delta(gmv, p_gmv),
            "orders": calc_delta(orders, p_orders),
            "customers": calc_delta(customers, p_customers),
            "items": calc_delta(items, p_items),
        }
        prior_kpis = {
            "gmv": round(p_gmv, 2),
            "orders": p_orders,
            "customers": p_customers,
            "items": p_items
        }

    # Sparkline (Complete Months in Window, Excludes Partial Months)
    sql_sparkline = f"""
        SELECT 
            TO_CHAR(DATE_TRUNC('month', o.purchased_at), 'YYYY-MM') AS month_key,
            COALESCE(SUM(oi.price + oi.freight_value), 0) AS gmv,
            COUNT(DISTINCT o.order_id) AS orders,
            COUNT(oi.order_item_id) AS items
        FROM olist.orders o
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        {where_clause}
        GROUP BY DATE_TRUNC('month', o.purchased_at)
        HAVING TO_CHAR(DATE_TRUNC('month', o.purchased_at), 'YYYY-MM') NOT IN ('2016-09', '2016-10', '2016-12', '2018-09', '2018-10')
        ORDER BY month_key ASC;
    """
    spark_rows = execute_query(sql_sparkline, tuple(params) if params else None)
    gmv_spark = [round(float(r["gmv"]), 2) for r in spark_rows]
    orders_spark = [int(r["orders"]) for r in spark_rows]
    items_spark = [int(r["items"]) for r in spark_rows]

    return {
        "reporting_window": {
            "start_date": start_date or DATASET_MIN_DATE,
            "end_date": end_date or DATASET_MAX_DATE,
            "status_filter": status_filter,
            "has_valid_prior": has_valid_prior,
            "prior_start": prev_start,
            "prior_end": prev_end,
            "all_orders_count": all_orders_count
        },
        "gmv": {
            "title": "Total GMV (incl. freight)",
            "value": round(gmv, 2),
            "formatted": f"R$ {gmv:,.2f}",
            "compact": format_compact_currency(gmv),
            "item_revenue": round(merchandise_rev, 2),
            "freight_value": round(freight_val, 2),
            "previous_value": prior_kpis["gmv"] if prior_kpis else None,
            "delta": deltas.get("gmv"),
            "sparkline": gmv_spark,
            "is_hero": True
        },
        "orders": {
            "title": "Delivered Orders",
            "value": orders,
            "formatted": f"{orders:,}",
            "compact": format_compact_number(orders),
            "all_statuses_total": all_orders_count,
            "reconciliation_subtitle": f"(all statuses: {all_orders_count:,})",
            "previous_value": prior_kpis["orders"] if prior_kpis else None,
            "delta": deltas.get("orders"),
            "sparkline": orders_spark,
            "is_hero": False
        },
        "customers": {
            "title": "Active Customers",
            "value": customers,
            "formatted": f"{customers:,}",
            "compact": format_compact_number(customers),
            "repeat_buyers": repeat_buyers,
            "repeat_buyer_rate": repeat_rate,
            "note": f"Unique buyers (Repeat rate: {repeat_rate}%)",
            "previous_value": prior_kpis["customers"] if prior_kpis else None,
            "delta": deltas.get("customers"),
            "sparkline": orders_spark,
            "is_hero": False
        },
        "products_sold": {
            "title": "Products Sold",
            "value": items,
            "formatted": f"{items:,}",
            "compact": format_compact_number(items),
            "aov": round(aov, 2),
            "aov_formatted": f"R$ {aov:,.2f}",
            "avg_item_price": round(avg_price, 2),
            "previous_value": prior_kpis["items"] if prior_kpis else None,
            "delta": deltas.get("items"),
            "sparkline": items_spark,
            "is_hero": False
        }
    }

def query_deduplicated_reviews(
    start_date: Optional[str] = DEFAULT_START_DATE,
    end_date: Optional[str] = DEFAULT_END_DATE,
    status_filter: str = "delivered"
) -> Dict[str, Any]:
    """
    Computes review score metrics deduplicated per order.
    Eliminates join fan-out when orders contain multiple items.
    """
    conditions = []
    params: List[Any] = []

    if status_filter and status_filter.lower() != "all":
        conditions.append("o.order_status = %s")
        params.append(status_filter.lower())
    if start_date:
        conditions.append("o.purchased_at >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("o.purchased_at <= %s")
        params.append(end_date)

    where_str = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = f"""
        WITH dedup_reviews AS (
            SELECT DISTINCT ON (ord_rev.order_id)
                ord_rev.order_id,
                r.score,
                r.created_date
            FROM olist.order_reviews ord_rev
            JOIN olist.reviews r ON ord_rev.review_id = r.review_id
            ORDER BY ord_rev.order_id, r.created_date DESC
        )
        SELECT 
            COUNT(dr.score) AS review_count,
            ROUND(AVG(dr.score), 2) AS avg_score,
            SUM(CASE WHEN dr.score = 1 THEN 1 ELSE 0 END) AS one_star_count,
            SUM(CASE WHEN dr.score = 5 THEN 1 ELSE 0 END) AS five_star_count,
            ROUND(SUM(CASE WHEN dr.score = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(dr.score), 0), 2) AS pct_1_star,
            ROUND(SUM(CASE WHEN dr.score = 5 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(dr.score), 0), 2) AS pct_5_star
        FROM olist.orders o
        JOIN dedup_reviews dr ON o.order_id = dr.order_id
        {where_str};
    """
    res = execute_single(sql, tuple(params) if params else None) or {}
    return {
        "review_count": int(res.get("review_count") or 0),
        "avg_score": float(res.get("avg_score") or 0.0),
        "one_star_count": int(res.get("one_star_count") or 0),
        "five_star_count": int(res.get("five_star_count") or 0),
        "pct_1_star": float(res.get("pct_1_star") or 0.0),
        "pct_5_star": float(res.get("pct_5_star") or 0.0)
    }

def query_delivery_performance(
    start_date: Optional[str] = DEFAULT_START_DATE,
    end_date: Optional[str] = DEFAULT_END_DATE
) -> Dict[str, Any]:
    """
    Computes on-time fulfillment rate and average turnaround days,
    excluding NULL delivery timestamps.
    """
    conditions = [
        "order_status = 'delivered'",
        "delivered_customer_at IS NOT NULL",
        "estimated_delivery_date IS NOT NULL"
    ]
    params: List[Any] = []
    if start_date:
        conditions.append("purchased_at >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("purchased_at <= %s")
        params.append(end_date)

    where_str = f"WHERE {' AND '.join(conditions)}"

    sql = f"""
        SELECT 
            COUNT(*) AS total_delivered,
            SUM(CASE WHEN delivered_customer_at <= estimated_delivery_date THEN 1 ELSE 0 END) AS on_time_count,
            ROUND(SUM(CASE WHEN delivered_customer_at <= estimated_delivery_date THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS on_time_pct,
            ROUND(AVG(EXTRACT(EPOCH FROM (delivered_customer_at - purchased_at))/86400)::numeric, 1) AS avg_delivery_days
        FROM olist.orders
        {where_str};
    """
    res = execute_single(sql, tuple(params) if params else None) or {}
    return {
        "total_delivered": int(res.get("total_delivered") or 0),
        "on_time_count": int(res.get("on_time_count") or 0),
        "on_time_pct": float(res.get("on_time_pct") or 0.0),
        "avg_delivery_days": float(res.get("avg_delivery_days") or 0.0)
    }

# ------------------------------------------------------------------------------
# Structured Facts & Verification Validator for AI Engine
# ------------------------------------------------------------------------------

def build_structured_facts_json(
    start_date: Optional[str] = DEFAULT_START_DATE,
    end_date: Optional[str] = DEFAULT_END_DATE,
    status_filter: str = "delivered"
) -> Dict[str, Any]:
    """
    Builds the ground-truth facts JSON for executive summarization and AI answers.
    Every figure emitted in the summary must match a value in this dictionary.
    """
    kpis = query_canonical_kpis(start_date, end_date, status_filter)
    reviews = query_deduplicated_reviews(start_date, end_date, status_filter)
    delivery = query_delivery_performance(start_date, end_date)

    # Top category revenue
    from backend.app.services.analytics_service import get_categories_breakdown
    top_cats = get_categories_breakdown(limit=3, start_date=start_date, end_date=end_date)

    # Top state revenue
    from backend.app.services.analytics_service import get_geographic_distribution
    top_states = get_geographic_distribution(limit=3, start_date=start_date, end_date=end_date)

    return {
        "date_range": f"{start_date} to {end_date}",
        "status_filter": status_filter,
        "gmv": kpis["gmv"]["value"],
        "gmv_compact": kpis["gmv"]["compact"],
        "item_revenue": kpis["gmv"]["item_revenue"],
        "freight_value": kpis["gmv"]["freight_value"],
        "orders": kpis["orders"]["value"],
        "all_orders_count": kpis["orders"]["all_statuses_total"],
        "customers": kpis["customers"]["value"],
        "repeat_buyers": kpis["customers"]["repeat_buyers"],
        "repeat_buyer_rate": kpis["customers"]["repeat_buyer_rate"],
        "units_sold": kpis["products_sold"]["value"],
        "aov": kpis["products_sold"]["aov"],
        "avg_item_price": kpis["products_sold"]["avg_item_price"],
        "avg_review_score": reviews["avg_score"],
        "pct_1_star": reviews["pct_1_star"],
        "pct_5_star": reviews["pct_5_star"],
        "on_time_pct": delivery["on_time_pct"],
        "avg_delivery_days": delivery["avg_delivery_days"],
        "top_categories": [
            {"category": c["category"], "revenue": c["revenue"], "share_pct": c.get("share_pct")}
            for c in top_cats
        ],
        "top_states": [
            {"state": s["state_code"], "orders": s["orders"], "revenue": s["total_revenue"], "avg_freight": s["avg_freight"]}
            for s in top_states
        ]
    }

def validate_text_against_facts(text: str, facts: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates that every number in the generated summary or AI answer is grounded in facts.
    Extracts all numeric tokens (including currency, compact suffixes, and percentages)
    and checks if they exist in facts within standard rounding tolerances (±3%).
    Returns (is_valid, list_of_unverified_numbers).
    """
    allowed_values = set()

    def add_numeric(val: float):
        allowed_values.add(round(val, 2))
        allowed_values.add(round(val, 1))
        allowed_values.add(int(round(val)))
        if val >= 100_000:
            millions = round(val / 1_000_000.0, 2)
            allowed_values.add(millions)
            allowed_values.add(round(millions, 1))
        if val >= 1_000:
            thousands = round(val / 1_000.0, 1)
            allowed_values.add(thousands)

    def harvest(obj):
        if isinstance(obj, (int, float)):
            add_numeric(float(obj))
        elif isinstance(obj, str):
            tokens = re.findall(r'\b\d+(?:,\d{3})*(?:\.\d+)?', obj)
            for t in tokens:
                try:
                    add_numeric(float(t.replace(',', '')))
                except ValueError:
                    pass
        elif isinstance(obj, dict):
            for v in obj.values(): harvest(v)
        elif isinstance(obj, list):
            for i in obj: harvest(i)

    harvest(facts)

    # Explicitly allow delayed shipment rate (100 - on_time_pct)
    if "on_time_pct" in facts:
        try:
            delay_pct = round(100.0 - float(facts["on_time_pct"]), 1)
            allowed_values.add(delay_pct)
        except (ValueError, TypeError):
            pass

    raw_matches = re.finditer(r'(?:R\$\s*)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKMmB%])?', text)
    
    unverified = []
    for m in raw_matches:
        num_str = m.group(1).replace(',', '')
        suffix = (m.group(2) or '').upper()

        try:
            val = float(num_str)
        except ValueError:
            continue

        if val in (1.0, 2.0, 3.0, 4.0, 5.0, 2016.0, 2017.0, 2018.0):
            continue

        test_values = [val]
        if suffix == 'M':
            test_values.append(val * 1_000_000.0)
        elif suffix == 'K':
            test_values.append(val * 1_000.0)

        matched = False
        for candidate in test_values:
            for target in allowed_values:
                if target == 0 and abs(candidate) < 0.05:
                    matched = True
                    break
                if target > 0 and abs(candidate - target) / target <= 0.03:
                    matched = True
                    break
                if abs(candidate - target) < 0.15:
                    matched = True
                    break
            if matched:
                break

        if not matched:
            full_token = m.group(0).strip()
            unverified.append(full_token)

    return (len(unverified) == 0, unverified)
