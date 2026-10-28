from typing import Dict, Any, List, Optional
from backend.app.database import execute_query, execute_single
from backend.app.cache import cache
from backend.app.services.metrics_service import (
    DEFAULT_START_DATE, DEFAULT_END_DATE, COMPLETE_MONTHS_START, COMPLETE_MONTHS_END
)

STATE_NAMES = {
    "SP": "São Paulo", "RJ": "Rio de Janeiro", "MG": "Minas Gerais",
    "RS": "Rio Grande do Sul", "PR": "Paraná", "SC": "Santa Catarina",
    "BA": "Bahia", "DF": "Distrito Federal", "GO": "Goiás", "PE": "Pernambuco",
    "ES": "Espírito Santo", "CE": "Ceará", "PA": "Pará", "MT": "Mato Grosso",
    "MA": "Maranhão", "MS": "Mato Grosso do Sul", "PB": "Paraíba", "PI": "Piauí",
    "RN": "Rio Grande do Norte", "AL": "Alagoas", "SE": "Sergipe", "TO": "Tocantins",
    "RO": "Rondônia", "AM": "Amazonas", "AC": "Acre", "AP": "Amapá", "RR": "Roraima"
}

def get_timeseries_data(
    granularity: str = "month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: str = "delivered",
    user_id: str = "anon"
) -> List[Dict[str, Any]]:
    """
    Computes monthly sales velocity across time using complete calendar months.
    Excludes partial edge months (Sep/Oct 2016, Sep/Oct 2018).
    """
    effective_start = start_date or COMPLETE_MONTHS_START
    effective_end = end_date or COMPLETE_MONTHS_END

    cache_key = cache._generate_key("timeseries_v2", user_id, {
        "gran": granularity, "start": effective_start, "end": effective_end, "status": status_filter
    })
    cached = cache.get(cache_key)
    if cached:
        return cached

    conditions = []
    params: List[Any] = []

    if status_filter and status_filter.lower() != "all":
        conditions.append("o.order_status = %s")
        params.append(status_filter.lower())

    conditions.append("o.purchased_at >= %s")
    params.append(effective_start)
    conditions.append("o.purchased_at <= %s")
    params.append(effective_end)

    where_str = f"WHERE {' AND '.join(conditions)}"

    trunc_unit = "month" if granularity == "month" else "week"
    sql = f"""
        SELECT 
            TO_CHAR(DATE_TRUNC('{trunc_unit}', o.purchased_at), 'YYYY-MM-DD') AS period,
            TO_CHAR(DATE_TRUNC('{trunc_unit}', o.purchased_at), 'Mon YY') AS display_name,
            ROUND(SUM(oi.price), 2) AS sales,
            ROUND(SUM(oi.freight_value), 2) AS freight,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS total_gmv,
            COUNT(DISTINCT o.order_id) AS orders,
            COUNT(oi.order_item_id) AS items
        FROM olist.orders o
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        {where_str}
        GROUP BY DATE_TRUNC('{trunc_unit}', o.purchased_at)
        HAVING TO_CHAR(DATE_TRUNC('{trunc_unit}', o.purchased_at), 'YYYY-MM') NOT IN ('2016-09', '2016-10', '2016-12', '2018-09', '2018-10')
        ORDER BY DATE_TRUNC('{trunc_unit}', o.purchased_at) ASC;
    """
    rows = execute_query(sql, tuple(params))
    cache.set(cache_key, rows, ttl=300)
    return rows

def get_categories_breakdown(
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: str = "delivered",
    user_id: str = "anon"
) -> List[Dict[str, Any]]:
    """
    Fetches top product categories ranked by total GMV revenue (incl. freight).
    Joins orders and applies the exact same status rule and date window so that
    sum of all categories equals headline GMV.
    """
    effective_start = start_date or DEFAULT_START_DATE
    effective_end = end_date or DEFAULT_END_DATE

    cache_key = cache._generate_key("categories_v2", user_id, {
        "limit": limit, "start": effective_start, "end": effective_end, "status": status_filter
    })
    cached = cache.get(cache_key)
    if cached:
        return cached

    conditions = []
    params: List[Any] = []

    if status_filter and status_filter.lower() != "all":
        conditions.append("o.order_status = %s")
        params.append(status_filter.lower())
    if effective_start:
        conditions.append("o.purchased_at >= %s")
        params.append(effective_start)
    if effective_end:
        conditions.append("o.purchased_at <= %s")
        params.append(effective_end)

    where_str = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = f"""
        SELECT 
            COALESCE(c.category_name_en, 'Other') AS category,
            COALESCE(c.category_name_pt, 'Outros') AS category_pt,
            COUNT(oi.order_item_id) AS units_sold,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS revenue,
            ROUND(SUM(oi.price), 2) AS item_revenue,
            ROUND(SUM(oi.freight_value), 2) AS freight_revenue,
            ROUND(AVG(oi.price), 2) AS avg_price
        FROM olist.orders o
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        JOIN olist.products p ON oi.product_id = p.product_id
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        {where_str}
        GROUP BY c.category_name_en, c.category_name_pt
        ORDER BY revenue DESC
        LIMIT %s;
    """
    rows = execute_query(sql, tuple(params + [limit]))

    # Total window GMV for share percentage
    tot_sql = f"""
        SELECT COALESCE(SUM(oi.price + oi.freight_value), 0) AS total_gmv
        FROM olist.orders o
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        {where_str};
    """
    tot_row = execute_single(tot_sql, tuple(params) if params else None) or {}
    total_gmv = float(tot_row.get("total_gmv", 0.0))

    enriched = []
    for r in rows:
        rev = float(r["revenue"] or 0.0)
        share = round((rev * 100.0 / total_gmv), 2) if total_gmv > 0 else 0.0
        enriched.append({
            "category": r["category"],
            "category_pt": r["category_pt"],
            "units_sold": int(r["units_sold"] or 0),
            "revenue": rev,
            "item_revenue": float(r["item_revenue"] or 0.0),
            "freight_revenue": float(r["freight_revenue"] or 0.0),
            "avg_price": float(r["avg_price"] or 0.0),
            "share_pct": share
        })

    cache.set(cache_key, enriched, ttl=300)
    return enriched

def get_geographic_distribution(
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: str = "delivered",
    user_id: str = "anon"
) -> List[Dict[str, Any]]:
    """
    Computes regional order concentration and GMV across Brazilian states,
    reconciled against the same date window and order status.
    """
    effective_start = start_date or DEFAULT_START_DATE
    effective_end = end_date or DEFAULT_END_DATE

    cache_key = cache._generate_key("geo_v2", user_id, {
        "limit": limit, "start": effective_start, "end": effective_end, "status": status_filter
    })
    cached = cache.get(cache_key)
    if cached:
        return cached

    conditions = []
    params: List[Any] = []

    if status_filter and status_filter.lower() != "all":
        conditions.append("o.order_status = %s")
        params.append(status_filter.lower())
    if effective_start:
        conditions.append("o.purchased_at >= %s")
        params.append(effective_start)
    if effective_end:
        conditions.append("o.purchased_at <= %s")
        params.append(effective_end)

    where_str = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = f"""
        SELECT 
            c.state,
            COUNT(DISTINCT c.customer_unique_id) AS customers,
            COUNT(DISTINCT o.order_id) AS orders,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS total_revenue,
            ROUND(SUM(oi.price), 2) AS merchandise_revenue,
            ROUND(SUM(oi.freight_value), 2) AS freight_revenue,
            ROUND(AVG(oi.freight_value), 2) AS avg_freight
        FROM olist.customers c
        JOIN olist.orders o ON c.customer_id = o.customer_id
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        {where_str}
        GROUP BY c.state
        ORDER BY total_revenue DESC
        LIMIT %s;
    """
    rows = execute_query(sql, tuple(params + [limit]))
    enriched = []
    for r in rows:
        st = r["state"]
        enriched.append({
            "state_code": st,
            "state_name": STATE_NAMES.get(st, st),
            "country": "Brazil",
            "country_code": "BR",
            "customers": int(r["customers"]),
            "orders": int(r["orders"]),
            "total_revenue": float(r["total_revenue"] or 0),
            "merchandise_revenue": float(r["merchandise_revenue"] or 0),
            "freight_revenue": float(r["freight_revenue"] or 0),
            "avg_freight": float(r["avg_freight"] or 0)
        })

    cache.set(cache_key, enriched, ttl=300)
    return enriched
