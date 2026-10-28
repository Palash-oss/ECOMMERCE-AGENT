-- ==============================================================================
-- PROPOSED DATABASE OPTIMIZATIONS & SECURITY HARDENING (DO NOT EXECUTE AUTOMATICALLY)
-- Target Database: CockroachDB CCL v26.2.9 | Database: defaultdb | Schema: olist
-- Purpose: Read-Only Security Role, Index Optimization, and Performance Views
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY: DEDICATED READ-ONLY ROLE CREATION
-- Finding: The current user 'test' holds ALL privileges on tables in schema 'olist'.
-- Recommendation: Create an unprivileged read-only service account for the API/AI Agent.
-- ------------------------------------------------------------------------------

-- CREATE ROLE ecommerce_readonly WITH LOGIN PASSWORD '<STRONG_GENERATED_PASSWORD>';
-- GRANT CONNECT ON DATABASE defaultdb TO ecommerce_readonly;
-- GRANT USAGE ON SCHEMA olist TO ecommerce_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA olist TO ecommerce_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA olist GRANT SELECT ON TABLES TO ecommerce_readonly;

-- ------------------------------------------------------------------------------
-- 2. PERFORMANCE INDEXES (PROPOSED FOR FUTURE OPTIMIZATION)
-- Reason: CockroachDB executes distributed range scans. Adding these covering indexes
-- drastically optimizes date-filtering, category joins, and product aggregations.
-- ------------------------------------------------------------------------------

-- Index 1: Optimize order filtering by purchased_at date range and delivery status
-- Eliminates full table scans during timeseries and KPI queries
-- CREATE INDEX IF NOT EXISTS idx_orders_purchased_status 
-- ON olist.orders (purchased_at DESC, order_status) 
-- STORING (customer_id, estimated_delivery_date);

-- Index 2: Optimize order item lookups by product_id and price
-- Accelerates product detail analytics, top products rankings, and revenue computations
-- CREATE INDEX IF NOT EXISTS idx_order_items_product_price 
-- ON olist.order_items (product_id, price) 
-- STORING (order_id, freight_value, seller_id);

-- Index 3: Optimize order item lookups by order_id
-- Accelerates order joins with order_items
-- CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
-- ON olist.order_items (order_id) 
-- STORING (product_id, price, freight_value);

-- Index 4: Accelerate product categorization joins
-- CREATE INDEX IF NOT EXISTS idx_products_category 
-- ON olist.products (category_id) 
-- STORING (weight_g, photos_qty);

-- Index 5: Accelerate customer location aggregations
-- CREATE INDEX IF NOT EXISTS idx_customers_state_city 
-- ON olist.customers (state, city) 
-- STORING (customer_unique_id, zip_code_prefix);

-- Index 6: Accelerate review lookups by order_id
-- CREATE INDEX IF NOT EXISTS idx_order_reviews_order 
-- ON olist.order_reviews (order_id, review_id);

-- ------------------------------------------------------------------------------
-- 3. ANALYTICAL REPORTING VIEWS (PROPOSED FOR HEAVY AGGREGATES)
-- Provides pre-joined clean interfaces for reporting without table alteration.
-- ------------------------------------------------------------------------------

-- CREATE VIEW olist.v_order_summary AS
-- SELECT 
--     o.order_id,
--     o.customer_id,
--     o.order_status,
--     o.purchased_at,
--     DATE_TRUNC('day', o.purchased_at) AS purchase_date,
--     DATE_TRUNC('month', o.purchased_at) AS purchase_month,
--     COALESCE(SUM(oi.price), 0) AS total_items_value,
--     COALESCE(SUM(oi.freight_value), 0) AS total_freight_value,
--     COALESCE(SUM(oi.price + oi.freight_value), 0) AS total_order_value,
--     COUNT(oi.order_item_id) AS items_count
-- FROM olist.orders o
-- LEFT JOIN olist.order_items oi ON o.order_id = oi.order_id
-- GROUP BY o.order_id, o.customer_id, o.order_status, o.purchased_at;
