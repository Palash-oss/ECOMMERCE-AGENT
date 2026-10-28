# NexusCommerce AI — Diagnostic Audit & System Review
**Document Path**: `/docs/AUDIT.md`  
**Status**: Completed Diagnostic (Part 0 Deliverable — Awaiting User Approval)  
**Database**: CockroachDB Cloud CCL v26.2.9 (AWS `ap-south-1`) — Read-Only Mode  
**Dataset**: Brazilian E-Commerce Public Dataset by Olist (99,441 total orders, 110,197 order items, 32,951 products, 73 categories, 98,410 reviews)

---

## 1. Complete KPI Card & Chart Audit

Below is the exhaustive mapping of every KPI card, dashboard chart, catalog query, and AI agent tool in the existing codebase, showing the exact SQL, underlying tables, filter conditions, and how order statuses (`delivered`, `canceled`, all) are handled.

### A. Executive Headline KPI Cards (`backend/app/services/kpi_service.py`)

| Widget / Card | Tables Used | Status Filter | Exact SQL Executed in Code |
| :--- | :--- | :--- | :--- |
| **Total Sales (GMV)** | `olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT COALESCE(SUM(oi.price + oi.freight_value), 0) AS gmv<br>FROM olist.orders o<br>LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered' [AND date filter];<br>``` |
| **Merchandise Revenue** | `olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT COALESCE(SUM(oi.price), 0) AS merchandise_rev<br>FROM olist.orders o<br>LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered' [AND date filter];<br>``` |
| **Total Orders** | `olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT COUNT(DISTINCT o.order_id) AS total_orders<br>FROM olist.orders o<br>LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered' [AND date filter];<br>``` |
| **Products Sold** | `olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT COUNT(oi.order_item_id) AS items_sold<br>FROM olist.orders o<br>LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered' [AND date filter];<br>``` |
| **Active Customers** *(BUGGY)* | `olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT COUNT(DISTINCT o.customer_id) AS active_customers<br>FROM olist.orders o<br>LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered' [AND date filter];<br>``` |
| **Sparklines** (GMV, Orders, Items) | `olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT DATE_TRUNC('month', o.purchased_at) AS period,<br>COALESCE(SUM(oi.price + oi.freight_value), 0) AS gmv,<br>COUNT(DISTINCT o.order_id) AS orders,<br>COUNT(oi.order_item_id) AS items<br>FROM olist.orders o<br>JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered'<br>GROUP BY DATE_TRUNC('month', o.purchased_at)<br>ORDER BY period DESC LIMIT 7;<br>``` |

### B. Dashboard Visualizations & Analytics (`backend/app/services/analytics_service.py`)

| Component | Tables Used | Status Filter | Exact SQL Executed in Code |
| :--- | :--- | :--- | :--- |
| **Sales & Logistics Velocity** (`CustomerHabitsChart.tsx`) | `olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT TO_CHAR(DATE_TRUNC('month', o.purchased_at), 'YYYY-MM-DD') AS period,<br>TO_CHAR(DATE_TRUNC('month', o.purchased_at), 'Mon YY') AS display_name,<br>ROUND(SUM(oi.price), 2) AS sales,<br>ROUND(SUM(oi.freight_value), 2) AS freight,<br>ROUND(SUM(oi.price + oi.freight_value), 2) AS total_gmv,<br>COUNT(DISTINCT o.order_id) AS orders,<br>COUNT(oi.order_item_id) AS items<br>FROM olist.orders o<br>JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered'<br>GROUP BY DATE_TRUNC('month', o.purchased_at)<br>ORDER BY DATE_TRUNC('month', o.purchased_at) ASC;<br>``` |
| **Product Statistics** (`CategoryDonutChart.tsx`) | `olist.order_items oi`<br>`olist.products p`<br>`olist.product_categories c` | **NONE** (All orders, even canceled/unavailable, because `orders` is not joined!) | ```sql<br>SELECT COALESCE(c.category_name_en, 'Other') AS category,<br>COALESCE(c.category_name_pt, 'Outros') AS category_pt,<br>COUNT(oi.order_item_id) AS units_sold,<br>ROUND(SUM(oi.price), 2) AS revenue,<br>ROUND(AVG(oi.price), 2) AS avg_price,<br>ROUND(SUM(oi.price) * 100.0 / NULLIF((SELECT SUM(price) FROM olist.order_items), 0), 2) AS share_pct<br>FROM olist.order_items oi<br>JOIN olist.products p ON oi.product_id = p.product_id<br>LEFT JOIN olist.product_categories c ON p.category_id = c.category_id<br>GROUP BY c.category_name_en, c.category_name_pt<br>ORDER BY revenue DESC LIMIT %s;<br>``` |
| **Geographic Customer Hubs** (`GeoGrowthChart.tsx`) | `olist.customers c`<br>`olist.orders o`<br>`olist.order_items oi` | `WHERE o.order_status = 'delivered'` | ```sql<br>SELECT c.state,<br>COUNT(DISTINCT c.customer_unique_id) AS customers,<br>COUNT(DISTINCT o.order_id) AS orders,<br>ROUND(SUM(oi.price + oi.freight_value), 2) AS total_revenue,<br>ROUND(AVG(oi.freight_value), 2) AS avg_freight<br>FROM olist.customers c<br>JOIN olist.orders o ON c.customer_id = o.customer_id<br>JOIN olist.order_items oi ON o.order_id = oi.order_id<br>WHERE o.order_status = 'delivered'<br>GROUP BY c.state<br>ORDER BY total_revenue DESC LIMIT %s;<br>``` |

### C. Product Catalog & Details (`backend/app/services/product_service.py`)

| Component | Tables Used | Status Filter | Exact SQL Executed in Code |
| :--- | :--- | :--- | :--- |
| **Product Catalog List** (`ProductList.tsx`) | `olist.products p`<br>`olist.product_categories c`<br>`olist.order_items oi` | **NONE** (All items regardless of order status) | ```sql<br>SELECT p.product_id, COALESCE(c.category_name_en, 'Other') AS category_en, ...<br>COUNT(oi.order_item_id) AS units_sold, ROUND(COALESCE(SUM(oi.price), 0), 2) AS total_revenue, ...<br>FROM olist.products p<br>LEFT JOIN olist.product_categories c ON p.category_id = c.category_id<br>LEFT JOIN olist.order_items oi ON p.product_id = oi.product_id<br>WHERE [search / category / price filters]<br>GROUP BY p.product_id, c.category_name_en, ...<br>ORDER BY total_revenue DESC LIMIT %s OFFSET %s;<br>``` |
| **Frequently Bought Together** (`ProductDetailModal.tsx`) | `olist.order_items oi1`<br>`olist.order_items oi2`<br>`olist.products p2`<br>`olist.product_categories c2` | **NONE** (Co-occurrence within `order_items` across all orders) | ```sql<br>SELECT oi2.product_id, COALESCE(c2.category_name_en, 'Related SKU') AS category, COUNT(*) AS co_occurrence_count, ROUND(AVG(oi2.price), 2) AS avg_price<br>FROM olist.order_items oi1<br>JOIN olist.order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id<br>LEFT JOIN olist.products p2 ON oi2.product_id = p2.product_id<br>LEFT JOIN olist.product_categories c2 ON p2.category_id = c2.category_id<br>WHERE oi1.product_id = %s<br>GROUP BY oi2.product_id, c2.category_name_en<br>ORDER BY co_occurrence_count DESC LIMIT 4;<br>``` |
| **Product Reviews** | `olist.order_items oi`<br>`olist.order_reviews ord_rev`<br>`olist.reviews r` | **NONE** (Reviews linked to order items) | ```sql<br>SELECT r.score, r.comment_title, r.comment_message, r.created_date<br>FROM olist.order_items oi<br>JOIN olist.order_reviews ord_rev ON oi.order_id = ord_rev.order_id<br>JOIN olist.reviews r ON ord_rev.review_id = r.review_id<br>WHERE oi.product_id = %s<br>ORDER BY r.created_date DESC LIMIT 5;<br>``` |

### D. AI Agent Specialized Tools (`backend/app/agent/tools.py`)

| Tool Name | Underlying Tables | Status Filter | Logic / Query Description |
| :--- | :--- | :--- | :--- |
| `get_kpis` | `orders`, `order_items` | `delivered` | Delegates directly to `get_kpi_metrics()` |
| `sales_by_category` | `order_items`, `products`, `product_categories` | **NONE** | Delegates to `get_categories_breakdown()` |
| `top_products` | `order_items`, `products`, `product_categories` | **NONE** | Groups `order_items` by `product_id` and category |
| `orders_trend` | `orders`, `order_items` | `delivered` | Delegates to `get_timeseries_data()` |
| `customers_by_country` | `customers`, `orders`, `order_items` | `delivered` | Delegates to `get_geographic_distribution()` |
| `compare_periods` | `orders`, `order_items` | `delivered` | Calls `get_kpi_metrics` twice across two date windows and computes variance |
| `find_anomalies` (`delivery_delay`) | `orders` | `delivered` | `WHERE order_status = 'delivered' AND delivered_customer_at > estimated_delivery_date` |
| `find_anomalies` (`freight`) | `order_items`, `orders`, `customers` | **NONE** | Groups by `c.state`, calculates `AVG(freight_value) / AVG(price)` |
| `find_anomalies` (`reviews`) | `reviews` | **NONE** | Aggregates `score` distribution from `olist.reviews` |

---

## 2. Ranked List of Bugs & Inconsistencies

| Rank | Severity | Issue Summary | Impact |
| :---: | :---: | :--- | :--- |
| **#1** | **CRITICAL** | **Active Customers equals Total Orders (96,478)** | Metric is fundamentally wrong. Reports 100% single-buyer rate by confusing order-level surrogate keys with unique humans. |
| **#2** | **CRITICAL** | **Fake "vs prior period" delta computation** | Synthetically multiplies numbers by `0.884`, `0.902`, `0.915` to invent +13.1% growth for periods that don't exist. |
| **#3** | **CRITICAL** | **Hardcoded Executive Summary & Unverified AI Claims** | `generate_executive_summary()` returns static claims not anchored in verified tool facts (e.g. "68% cite transit delay" without NLP text classifier). Must be generated from live tool facts JSON with a strict number validator. |
| **#4** | **HIGH** | **PDF Download failure & unreliability** | Users cannot reliably download reports due to missing client credentials, lack of Content-Type inspection (saving error JSON as PDF), and swallowed UI errors. |
| **#5** | **HIGH** | **Header badge (99,441) vs KPI (96,478) discrepancy** | Header displays all orders, KPI card shows delivered orders, without explanation or reconciling label. |
| **#6** | **MEDIUM** | **Product cards show IDs / "SKU #hash" as names** | Dataset contains no product titles; cards invent `"Health & Beauty SKU #e0d64fb9"`. |
| **#7** | **MEDIUM** | **Chat renders raw markdown symbols (`###`, `**`, `*`)** | Text displayed via unparsed `<div>` with `whitespace-pre-wrap`, destroying executive presentation. |
| **#8** | **MEDIUM** | **AI Agent executes duplicate tool calls (`get_kpis`)** | No turn-level tool memoization causes 2-3 duplicate DB round-trips per user question. |
| **#9** | **MEDIUM** | **Status inconsistency across widgets** | KPI cards filter by `delivered`, but Category and Product views aggregate across all statuses without declaring so. |

---

### Detailed Analysis of Confirmed Bugs

#### Bug 1: "Active Customers" equals "Total Orders" (96,478)
- **Code Location**: `backend/app/services/kpi_service.py`, line 35:
  ```python
  COUNT(DISTINCT o.customer_id) AS active_customers
  ```
- **Live Database Ground Truth**:
  - In the Olist database schema, `olist.orders.customer_id` is a 1-to-1 surrogate key generated **per order**!
  - `SELECT COUNT(DISTINCT customer_id) FROM olist.orders WHERE order_status = 'delivered'` = **96,478**.
  - Total human customers are identified by `olist.customers.customer_unique_id`.
  - Joining `olist.customers c ON o.customer_id = c.customer_id`:
    - **Total unique buyers (all statuses)**: **96,096**
    - **Total unique buyers (delivered orders)**: **93,358**
    - **Total repeat buyers (all statuses, >1 order)**: **2,997** (Repeat Buyer Rate: **3.12%**)
    - **Total repeat buyers (delivered orders, >1 delivered order)**: **2,801** (Repeat Buyer Rate: **3.00%**)
- **Fix Required**: Change query to `COUNT(DISTINCT c.customer_unique_id)` joining `olist.customers c`, and display the repeat buyer count (2,801 / 3.00%) as a dedicated secondary metric.

#### Bug 2: "vs prior period" Computed Against a Non-Existent Window
- **Code Location**: `backend/app/services/kpi_service.py`, lines 50–53:
  ```python
  prev_gmv = gmv * 0.884  # +13.1% historical growth
  prev_orders = int(orders * 0.902)  # +10.8% order growth
  prev_customers = int(customers * 0.915)  # +9.3% customer acquisition
  prev_items = int(items * 0.895)  # +11.7% units growth
  ```
- **The Issue**:
  - The dataset begins on `2016-09-04` and ends on `2018-10-17`.
  - When viewing the full dataset (the default view), there is **zero data** prior to September 2016.
  - The code manufactured fake previous period numbers by multiplying current values by ~0.9.
- **Fix Required**:
  - Compare against the exact preceding equal-length date window in SQL.
  - If the preceding window has no orders (e.g. full-dataset view or early 2016/2017 views), **hide the delta pill completely** and set `previous_value = None`, rather than showing a fabricated percentage.

#### Bug 3: Header Badge (99,441) vs KPI Card (96,478) Discrepancy
- **Code Locations**:
  - `frontend/src/components/layout/Topbar.tsx`, line 43:
    ```tsx
    <span className="..."><CheckCircle2 className="w-3 h-3" /> 99,441 Orders</span>
    ```
  - `frontend/src/components/dashboard/KpiCard.tsx` / `kpi_service.py`, line 33:
    Displays `96,478` (delivered orders only).
- **The Issue**:
  - In Olist, there are **99,441 total orders** across 8 statuses:
    - `delivered`: 96,478 (97.0%)
    - `shipped`: 1,107 (1.1%)
    - `canceled`: 625 (0.6%)
    - `unavailable`: 609 (0.6%)
    - `invoiced`: 314 (0.3%)
    - `processing`: 301 (0.3%)
    - `created`: 5 (0.01%)
    - `approved`: 2 (0.002%)
  - The user sees `99,441` in the header and `96,478` in the main KPI card with zero explanation, appearing like a calculation error.
- **Fix Required**: Add an explicit status toggle or label: Default to `Delivered Orders: 96,478` with a subtitle/pill `(all statuses: 99,441)`.

#### Bug 4: Agent Executes Duplicate Tool Calls (`get_kpis`)
- **Code Location**: `backend/app/agent/engine.py`, lines 48–92:
  ```python
  while turn_count < max_turns:
      tool_calls, direct_text, usage = provider.generate_chat_response(...)
      for tc in tool_calls:
          fn_name = tc["name"]
          ...
  ```
- **The Issue**:
  - The agent loop has no execution cache or deduplication. When Gemini/Groq requests `get_kpis` in turn 1 and again in turn 2, or issues redundant simultaneous calls in `tool_calls`, `tool_get_kpis` runs repeatedly.
- **Fix Required**: Memoize tool execution within the turn session using `(fn_name, json.dumps(fn_args, sort_keys=True))` as key. If already executed in this turn, return the memoized result immediately.

#### Bug 5: Product Cards Show IDs / "SKU #hash" as Names
- **Code Locations**:
  - `backend/app/services/product_service.py`, line 40:
    ```python
    "title": f"{r['category'].replace('_', ' ').title()} SKU #{r['product_id'][:8]}"
    ```
  - `backend/app/services/product_service.py`, lines 133, 205, 272.
- **Database Reality**:
  - `olist.products` columns are: `product_id`, `category_id`, `name_length`, `description_length`, `photos_qty`, `weight_g`, `length_cm`, `height_cm`, `width_cm`.
  - There is **no product title or name column in any table**.
- **Fix Required**:
  - Never show `"SKU #<hash>"` as the main card title.
  - Use clean English categories from `product_categories.category_name_en` (e.g. "Health & Beauty", "Bed, Bath & Table").
  - Card Title: `"<Category> Item"` accompanied by a short 4–6 character uppercase monospace badge chip (e.g. `[E0D64F]` with click-to-copy full ID).
  - Prominently display real physical specs: `weight_g`, dimensions (`L×W×H cm`), `photos_qty`, and sales metrics.
  - Include an honest header notice: *"Source data has no product names; items are identified by category + short code."*

#### Bug 6: Chat Renders Raw Markdown Symbols (`###`, `**`, `*`)
- **Code Location**: `frontend/src/components/agent/AiChatPanel.tsx`, lines 216–218:
  ```tsx
  <div className="whitespace-pre-wrap leading-relaxed">
    {m.text || (isStreaming ? 'Thinking...' : '')}
  </div>
  ```
- **The Issue**:
  - Assistant responses containing structured markdown (headers `###`, bullet points `*`, bold `**bold**`, tables `| col |`) are rendered into a raw `<div>` with `whitespace-pre-wrap`. The user sees ugly literal markdown tags.
- **Fix Required**: Render message content with `react-markdown` + `remark-gfm` + custom Tailwind styling for headers, lists, code chips, and zebra-striped tables.

#### Bug 3: Hardcoded Executive Summary & Unverified AI Claims (CRITICAL)
- **Code Locations**: `backend/app/agent/engine.py`, lines 120–141, and `backend/app/agent/tools.py`, lines 135, 154, 169.
- **Audit of Every Claim & Exact SQL Proof / Deletion Decision**:
  1. *"97.0% fulfilment rate across 96,478 completed shipments"*:
     - **Status**: **VERIFIED**.
     - **Exact SQL**:
       ```sql
       SELECT 
           COUNT(*) AS total_orders,
           SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
           ROUND(SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS fulfillment_rate
       FROM olist.orders;
       ```
       Returns: `total_orders = 99,441`, `delivered_orders = 96,478`, `fulfillment_rate = 97.02%`.
  2. *"11.46% of reviews are 1-star ratings"*:
     - **Status**: **VERIFIED** on raw table (`11,282 / 98,410 = 11.46%`).
     - **When deduplicated per order**: `11,365 / 98,673 = 11.52%`.
     - **Exact SQL (deduplicated per order)**:
       ```sql
       WITH dedup AS (
           SELECT DISTINCT ON (ord_rev.order_id) ord_rev.order_id, r.score 
           FROM olist.order_reviews ord_rev 
           JOIN olist.reviews r ON ord_rev.review_id = r.review_id 
           ORDER BY ord_rev.order_id, r.created_date DESC
       )
       SELECT 
           COUNT(*) AS total_reviews, 
           SUM(CASE WHEN score = 1 THEN 1 ELSE 0 END) AS one_star_count, 
           ROUND(SUM(CASE WHEN score = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS pct_1_star 
       FROM dedup;
       ```
  3. *"68% of 1-star reviews cite transit delay past the estimated date"*:
     - **Status**: **DELETED & REMOVED (UNVERIFIABLE)**.
     - **Ground Truth**: Review messages in Olist are free-text in Portuguese (e.g. `Não recebi o produto`). There is NO NLP sentiment or topic classification column in CockroachDB. Running a real SQL cross-tabulation of orders where `delivered_customer_at > estimated_delivery_date` against 1-star reviews reveals:
       - 1-star reviews with actual delayed delivery = **37.79%** (3,554 / 9,405).
       - Delayed orders receiving a 1-star review = **46.16%** (3,554 / 7,699).
       - The `"68% cite transit delay"` figure was completely hardcoded and fabricated. All unverified free-text assertions are deleted.
  4. *"Regional freight disparity: Remote Northern states face freight charges up to 65% higher"*:
     - **Status**: **VERIFIED WITH EXACT SQL**.
     - **Exact SQL**:
       ```sql
       SELECT c.state, ROUND(AVG(oi.freight_value), 2) AS avg_freight
       FROM olist.customers c
       JOIN olist.orders o ON c.customer_id = o.customer_id
       JOIN olist.order_items oi ON o.order_id = oi.order_id
       WHERE o.order_status = 'delivered'
       GROUP BY c.state
       ORDER BY avg_freight DESC;
       ```
       Highest: Roraima (`RR`) = R$ 43.09, Paraíba (`PB`) = R$ 43.09.
       Lowest: São Paulo (`SP`) = R$ 15.12.
       Disparity: RR/PB is 2.85x higher (+185%) than SP.
- **Fix Required**: Executive summary and AI answers must be deterministically synthesized from a live structured facts JSON produced by data tools. A post-generation number validator verifies that every number in the output exists in the facts JSON before serving.

#### Bug 4: PDF Download Fails / Is Unreliable (HIGH)
- **Empirical Reproduction Results**:
  1. *Standalone Generator Test*: Running `build_server_side_pdf_report(start_date='2018-01-01', end_date='2018-06-30')` completes in 5.68 seconds and generates a 6,690-byte valid PDF without exceptions.
  2. *Endpoint Test with curl*: `curl.exe -i -X POST http://127.0.0.1:8000/api/v1/report/pdf -H "Content-Type: application/json" -d "{}"` returns HTTP 200 OK with `Content-Type: application/pdf`.
  3. *Vite Dev Proxy Test*: `curl.exe -i -X POST http://localhost:5173/api/v1/report/pdf ...` returns HTTP 200 OK and properly proxies to port 8000.
  4. *Proven Root Causes*:
     - **Root Cause B (Missing Credentials)**: In `client.ts`, `fetch()` omits `credentials: 'include'`. In production or authenticated setups, cookies are dropped across ports.
     - **Root Cause C (No Content-Type Check)**: If the backend throws a 429 rate limit or 500 error, `res.blob()` blindly saves the error JSON as a `.pdf` file, corrupting the document.
     - **Root Cause F (UI Swallows Errors)**: `Topbar.tsx` provides no parameter options, no progress stepper, and dumps exceptions into an uninformative browser `alert()`.
     - **Rate Limiter Keying**: The rate limiter was keying by IP address instead of the authenticated user ID.

#### Bug 5: Header Badge (99,441) vs KPI Card (96,478) Discrepancy
- **Code Locations**: `frontend/src/components/layout/Topbar.tsx`, line 43 vs `kpi_service.py`, line 33.
- **Fix Required**: Add a clear status toggle / subtitle: `Delivered Orders: 96,478 (all statuses: 99,441)`.

#### Bug 6: Product Cards Show IDs / "SKU #hash" as Names
- **Code Locations**: `backend/app/services/product_service.py`, lines 40, 133, 205, 272.
- **Fix Required**: Replace fake SKU names with clean English category titles + short code chip (e.g. `[E0D64F]`) and real physical dimensions.

#### Bug 7: Chat Renders Raw Markdown Symbols (`###`, `**`, `*`)
- **Code Location**: `frontend/src/components/agent/AiChatPanel.tsx`, lines 216–218.
- **Fix Required**: Implement `react-markdown` + `remark-gfm` formatting.

#### Bug 8: AI Agent Executes Duplicate Tool Calls (`get_kpis`)
- **Code Location**: `backend/app/agent/engine.py`, lines 48–92.
- **Fix Required**: Per-turn tool result memoization to execute tools once per turn.

#### Bug 9: Status Inconsistency Across Widgets
- **Fix Required**: Unify all analytics and category aggregations on the same status rule and revenue definition.

---

## 3. Root Cause Analysis: PDF Download Failure
*(Empirically tested and verified above: ReportLab standalone engine works; primary failure vectors are client fetch credentials, missing content-type validation, and error handling).*

### Root Cause D: Client Hardcodes Timestamp & Discards `Content-Disposition`
- **Exact File & Lines**:
  - Backend: `backend/app/routers/report.py`, line 32:
    ```python
    headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    ```
  - Frontend: `frontend/src/api/client.ts`, line 126:
    ```typescript
    a.download = `NexusCommerce_Executive_Dossier_${Date.now()}.pdf`;
    ```
- **Technical Explanation**:
  - The client ignores the server-provided filename and header.
  - If CORS is invoked without `Access-Control-Expose-Headers: Content-Disposition`, browsers block client access to the header anyway.

### Root Cause E: Synchronous Blocking Execution & Rate Limiting
- **Exact File & Lines**:
  - Backend: `backend/app/routers/report.py`, line 22:
    ```python
    rate_limiter.enforce(request.client.host if request.client else user["id"], cost=2.0)
    ```
  - Backend: `backend/app/services/pdf_service.py`, lines 11–14:
    Executes 5 heavy DB queries sequentially on the web thread (`get_kpi_metrics`, `get_categories_breakdown`, `get_geographic_distribution`, `list_products`, `generate_executive_summary`).
- **Technical Explanation**:
  - If CockroachDB takes >5 seconds, the browser or client gateway times out.
  - If the user clicks "Download Report" twice quickly, the token bucket enforces `cost=2.0` and immediately blocks them with HTTP 429 Too Many Requests, which the UI shows as a broken download.

### Root Cause F: UI Swallows Errors with Crude `alert()`
- **Exact File & Lines**: `frontend/src/components/layout/Topbar.tsx`, lines 27–29:
  ```typescript
  } catch (err) {
    alert('Report download error: ' + (err instanceof Error ? err.message : String(err)));
  }
  ```
- **Technical Explanation**:
  - There is no download modal, no progress stepper, no retry option, and no date range parameters passed (`api.downloadPdfReport()` is called with no arguments).

---

## 4. Immediate Action Plan (Upon User Approval)

With Part 0 diagnostics completed, the system is primed for surgical resolution in subsequent phases:

1. **Part 1 (Data Correctness)**:
   - Create `/docs/METRICS.md` with strict canonical definitions.
   - Implement shared backend metric module with `customer_unique_id` distinct counts (delivering true 93,358 active buyers and 3.00% repeat buyer rate).
   - Anchor dates to dataset (last 12 complete months: `2017-09-01` to `2018-08-31`).
   - Hide delta pills when prior period data does not exist.
   - Write `/scripts/verify_metrics.py` reconciliation test and verify 100% PASS.
2. **Part 2 (Products)**:
   - Category + short code labels (e.g. `"Health & Beauty Item [E0D64F]"`).
   - Category-first browsing with real specs and metrics.
3. **Part 3 (Design Tokens)**:
   - Dark neon orange (`#FF5A1F` / `#FF6A2B`) & clean `#F4F4F2` / `#0A0A0B` palettes, eliminating purple/indigo.
4. **Part 4 (Sidebar)**:
   - 240px / 72px GSAP morphing sidebar with non-wrapping labels and animated active pills.
5. **Part 5 (Command Palette & Widgets)**:
   - Centered `Ctrl+K` palette and custom dropdowns.
6. **Part 6 (AI Chat)**:
   - `react-markdown` + `remark-gfm` styling, tool call deduplication, structured answers.
7. **Part 7 (Motion & Landing)**:
   - GSAP + Lenis landing page at `/`, dashboard at `/app`.
8. **Part 8 (PDF Overhaul)**:
   - Rock-solid generation, multi-page vector layout, interactive UI modal with live progress.
