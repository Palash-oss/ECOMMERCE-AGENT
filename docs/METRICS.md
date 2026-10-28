# NexusCommerce — Canonical Metrics Dictionary
**Document Path**: `/docs/METRICS.md`  
**Purpose**: Single source of truth for all metric calculations across Frontend widgets, Backend APIs, AI Agent tools, and Executive PDF reports.  
**Dataset Reference**: CockroachDB Olist Dataset (99,441 orders, 110,197 order items, 96,096 unique customer identifiers, 32,951 products, 73 categories).

---

## 1. Metric Definitions & Formulas

| Metric Name | Short Name | Database Column / Aggregation | Status Filter (Default) | Unit / Format | Description & Reconciling Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gross Merchandise Value** | `gmv` | `SUM(oi.price + oi.freight_value)` | `order_status = 'delivered'` | Currency (`R$ #,##0.00`) | Total value of merchandise plus shipping paid by customers. Display label: **"GMV (incl. freight)"**. |
| **Item Revenue** | `merchandise_revenue` | `SUM(oi.price)` | `order_status = 'delivered'` | Currency (`R$ #,##0.00`) | Net product merchandise price excluding freight. Display label: **"Item Revenue"**. |
| **Freight Overhead** | `freight_value` | `SUM(oi.freight_value)` | `order_status = 'delivered'` | Currency (`R$ #,##0.00`) | Shipping and logistics fees collected from buyers. `GMV = Item Revenue + Freight`. |
| **Delivered Orders** | `delivered_orders` | `COUNT(DISTINCT o.order_id)` | `order_status = 'delivered'` | Integer (`#,##0`) | Orders successfully fulfilled and delivered. Default headline count: **96,478** (or filtered date range). |
| **All Orders** | `all_orders` | `COUNT(DISTINCT o.order_id)` | `NONE` (All statuses) | Integer (`#,##0`) | Every order created in the platform. Full dataset count: **99,441**. Subtitle: `(all statuses: 99,441)`. |
| **Active Customers** | `active_customers` | `COUNT(DISTINCT c.customer_unique_id)` | `order_status = 'delivered'` | Integer (`#,##0`) | Real unique human buyers identified by `customer_unique_id`. **Must NOT use `o.customer_id`** (which is per-order). |
| **Repeat Buyers** | `repeat_buyers` | `COUNT(DISTINCT customer_unique_id)` with `>1 order` | `order_status = 'delivered'` | Integer (`#,##0`) | Buyers who placed 2 or more delivered orders. Full dataset delivered: **2,801**. |
| **Repeat Buyer Rate** | `repeat_buyer_rate` | `repeat_buyers / active_customers * 100` | `order_status = 'delivered'` | Percentage (`0.0%`) | Percentage of buyers with multiple purchases. Full dataset delivered: **3.00%** (2,801 / 93,358). |
| **Products Sold (Units)** | `units_sold` | `COUNT(oi.order_item_id)` | `order_status = 'delivered'` | Integer (`#,##0`) | Total physical items in fulfilled orders. Full dataset delivered: **110,197 items**. |
| **Average Order Value** | `aov` | `GMV / delivered_orders` | `order_status = 'delivered'` | Currency (`R$ #,##0.00`) | Average customer expenditure per completed order. Full dataset delivered: **R$ 159.83**. |
| **Average Item Price** | `avg_item_price` | `Item Revenue / units_sold` | `order_status = 'delivered'` | Currency (`R$ #,##0.00`) | Average unit sale price of catalog products. Full dataset delivered: **R$ 120.65**. |
| **Average Review Score** | `avg_review_score` | `AVG(r.score)` | Deduplicated per order | Rating (`0.00 / 5.00`) | Order customer review rating, taking latest review per order to eliminate multiple-item join fan-out. |
| **1-Star Review Rate** | `pct_1_star` | `COUNT(score=1) / COUNT(reviews) * 100` | Deduplicated per order | Percentage (`0.0%`) | Percentage of reviewed orders receiving a 1-star dissatisfaction rating. |
| **On-Time Delivery %** | `on_time_pct` | `COUNT(delivered <= estimated) / COUNT(*) * 100` | `delivered_customer_at IS NOT NULL` | Percentage (`0.0%`) | Shipments that reached customer on or before the estimated carrier delivery date. |
| **Average Delivery Days** | `avg_delivery_days` | `AVG(EXTRACT(EPOCH FROM (delivered - purchased)) / 86400)` | Non-null timestamps | Days (`0.0 days`) | Mean elapsed turnaround days from customer order placement to physical receipt. |

---

## 2. Temporal Anchoring & Windowing Rules

1. **Data-Anchored Defaults (No "Today" Assumptions)**:
   - The Olist dataset is historical (2016-09 to 2018-10).
   - Incomplete partial months at edges:
     - 2016-09 (4 orders), 2016-10 (324 orders), 2016-12 (1 order).
     - 2018-09 (16 orders), 2018-10 (4 orders).
   - **Continuous Complete Coverage**: Exactly 20 months: **2017-01-01 00:00:00 to 2018-08-31 23:59:59**.
   - **Default Benchmark Window**: The last 6 complete months: **`2018-03-01` to `2018-08-31`**.
   - **Preceding Period**: The immediately prior 6 complete months: **`2017-09-01` to `2018-02-28`**.
2. **Delta Suppression Rule**:
   - If the user selects a time range whose immediately preceding equal-length window has incomplete data (e.g. range starting prior to 2017-07-01, or the full-dataset view), the delta pill **MUST BE HIDDEN** (`previous_value = None`, `delta = None`). No fabricated multipliers are permitted.
3. **Monthly Trend Buckets**:
   - Timeseries visualizations and sparklines must filter exclusively for complete calendar months: `purchased_at >= '2017-01-01' AND purchased_at < '2018-09-01'`.
   - Tooltip notice: *"Partial months (Sep/Oct 2016, Sep/Oct 2018) excluded to prevent artificial velocity dips."*

---

## 3. Strict Reconciliation Sanity Equations

Every implementation must pass the following mathematical identities:
1. `Total GMV = Category Revenue Sum = State Revenue Sum = Monthly Timeseries Sum` (exact down to 2 decimal places).
2. `Unique Customers (93,358) != Total Delivered Orders (96,478)` (Difference = 3,120 repeat order occurrences).
3. `Delivered Orders (96,478) + Non-Delivered Orders (2,963) = Total Orders (99,441)`.
4. `Deduplicated Reviewed Orders (98,673) <= Total Orders (99,441)`.
