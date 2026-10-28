from typing import Dict, Any, List, Optional
from backend.app.database import execute_query, execute_single
from backend.app.security.pii_masker import mask_identifier

def list_orders(
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    page_size: int = 10
) -> Dict[str, Any]:
    """
    Paginated orders ledger with customer location, item count, and total amount.
    Reconciles item sales and payment records so canceled/unfulfilled orders reflect
    their real customer payment/transaction value rather than artificial 0.00.
    Applies PII masking to customer identifiers.
    """
    offset = (max(1, page) - 1) * page_size
    conditions = ["1=1"]
    params: List[Any] = []

    if status and status.lower() != "all":
        conditions.append("o.order_status = %s")
        params.append(status.lower())

    if start_date:
        conditions.append("o.purchased_at >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("o.purchased_at <= %s")
        params.append(f"{end_date} 23:59:59" if len(end_date) == 10 else end_date)

    where_str = " AND ".join(conditions)

    sql = f"""
        SELECT 
            o.order_id,
            o.customer_id,
            o.order_status,
            o.purchased_at,
            o.delivered_customer_at,
            c.city,
            c.state,
            COALESCE(items_agg.items_count, 0) AS items_count,
            ROUND(COALESCE(items_agg.total_items_val, pay_agg.total_pay_val, 0), 2) AS total_value
        FROM olist.orders o
        LEFT JOIN olist.customers c ON o.customer_id = c.customer_id
        LEFT JOIN (
            SELECT order_id, COUNT(order_item_id) AS items_count, SUM(price + freight_value) AS total_items_val
            FROM olist.order_items GROUP BY order_id
        ) items_agg ON o.order_id = items_agg.order_id
        LEFT JOIN (
            SELECT order_id, SUM(payment_value) AS total_pay_val
            FROM olist.order_payments GROUP BY order_id
        ) pay_agg ON o.order_id = pay_agg.order_id
        WHERE {where_str}
        ORDER BY o.purchased_at DESC
        LIMIT %s OFFSET %s;
    """
    rows = execute_query(sql, tuple(params + [page_size, offset]))

    count_sql = f"SELECT COUNT(*) AS total FROM olist.orders o WHERE {where_str};"
    total_count = int((execute_single(count_sql, tuple(params)) or {}).get("total", len(rows)))

    orders = []
    for r in rows:
        orders.append({
            "order_id": mask_identifier(r["order_id"]),
            "raw_order_id": r["order_id"],
            "customer_id": mask_identifier(r["customer_id"]),
            "status": r["order_status"],
            "purchased_at": str(r["purchased_at"]),
            "delivered_at": str(r["delivered_customer_at"]) if r["delivered_customer_at"] else None,
            "city": (r["city"] or "").title(),
            "state": (r["state"] or "").upper(),
            "items_count": int(r["items_count"] or 0),
            "total_value": float(r["total_value"] or 0.0)
        })

    return {
        "items": orders,
        "page": page,
        "page_size": page_size,
        "total_items": total_count,
        "total_pages": (total_count + page_size - 1) // page_size
    }
