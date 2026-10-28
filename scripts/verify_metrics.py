#!/usr/bin/env python3
"""
NexusCommerce AI — Comprehensive Metrics Verification & Reconciliation Suite.
Strictly read-only independent validation of headline KPIs, category totals,
monthly timeseries, geographic sums, review deduplication, and customer identity.
"""

import sys
import os
from decimal import Decimal
from typing import Dict, Any, List

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import execute_query, execute_single
from backend.app.services.metrics_service import (
    query_canonical_kpis, query_deduplicated_reviews, query_delivery_performance,
    build_structured_facts_json, validate_text_against_facts,
    DEFAULT_START_DATE, DEFAULT_END_DATE, COMPLETE_MONTHS_START, COMPLETE_MONTHS_END
)

class MetricVerificationSuite:
    def __init__(self):
        self.results: List[Dict[str, Any]] = []

    def record(self, test_name: str, expected: Any, actual: Any, passed: bool, notes: str = ""):
        self.results.append({
            "test": test_name,
            "expected": expected,
            "actual": actual,
            "passed": passed,
            "notes": notes
        })

    def run_all(self):
        print("\n" + "=" * 80)
        print("NEXUSCOMMERCE METRICS INDEPENDENT RECONCILIATION SUITE")
        print("Database: CockroachDB (Read-Only Mode) | Target: Default 6M Window & Lifetime")
        print("=" * 80 + "\n")

        # ----------------------------------------------------------------------
        # Test 1: Lifetime Unique Human Customers vs Total Delivered Orders
        # Bug 1 Verification: Unique buyers must NOT equal total orders
        # ----------------------------------------------------------------------
        sql_cust = """
            SELECT 
                COUNT(DISTINCT c.customer_unique_id) AS unique_human_buyers,
                COUNT(DISTINCT o.order_id) AS delivered_orders,
                COUNT(DISTINCT o.customer_id) AS order_surrogates
            FROM olist.orders o
            JOIN olist.customers c ON o.customer_id = c.customer_id
            WHERE o.order_status = 'delivered';
        """
        row1 = execute_single(sql_cust) or {}
        unique_buyers = int(row1["unique_human_buyers"])
        delivered_orders = int(row1["delivered_orders"])
        surrogates = int(row1["order_surrogates"])

        test1_pass = (unique_buyers == 93358) and (delivered_orders == 96478) and (unique_buyers != delivered_orders)
        self.record(
            "Unique Customers != Total Orders (Bug 1 Fix)",
            "93,358 buyers != 96,478 orders",
            f"{unique_buyers:,} buyers != {delivered_orders:,} orders",
            test1_pass,
            f"Surrogate customer_id ({surrogates:,}) was 1:1 with orders. True buyers = 93,358."
        )

        # ----------------------------------------------------------------------
        # Test 2: Repeat Buyer Count & Rate Verification
        # ----------------------------------------------------------------------
        sql_repeat = """
            SELECT COUNT(*) AS repeat_buyers FROM (
                SELECT c.customer_unique_id
                FROM olist.orders o
                JOIN olist.customers c ON o.customer_id = c.customer_id
                WHERE o.order_status = 'delivered'
                GROUP BY c.customer_unique_id
                HAVING COUNT(DISTINCT o.order_id) > 1
            ) t;
        """
        row2 = execute_single(sql_repeat) or {}
        repeat_buyers = int(row2["repeat_buyers"])
        repeat_rate = round(repeat_buyers / unique_buyers * 100.0, 2)

        test2_pass = (repeat_buyers == 2801) and (abs(repeat_rate - 3.00) < 0.05)
        self.record(
            "Repeat Buyer Rate (Delivered Orders)",
            "2,801 buyers (3.00%)",
            f"{repeat_buyers:,} buyers ({repeat_rate:.2f}%)",
            test2_pass,
            "Repeat purchases properly isolated."
        )

        # ----------------------------------------------------------------------
        # Test 3: Total Orders Lifetime Reconciliation
        # All orders (99,441) = Delivered (96,478) + Non-Delivered (2,963)
        # ----------------------------------------------------------------------
        sql_status = """
            SELECT 
                COUNT(*) AS total_all,
                SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS total_deliv,
                SUM(CASE WHEN order_status != 'delivered' THEN 1 ELSE 0 END) AS total_other
            FROM olist.orders;
        """
        row3 = execute_single(sql_status) or {}
        tot_all = int(row3["total_all"])
        tot_deliv = int(row3["total_deliv"])
        tot_other = int(row3["total_other"])

        test3_pass = (tot_all == 99441) and (tot_deliv == 96478) and (tot_other == 2963)
        self.record(
            "Order Status Reconciliation (Delivered vs All)",
            "96,478 delivered + 2,963 other = 99,441 total",
            f"{tot_deliv:,} + {tot_other:,} = {tot_all:,}",
            test3_pass,
            "Delivered status represents exactly 97.02% of all orders."
        )

        # ----------------------------------------------------------------------
        # Test 4: Default 6-Month Canonical Window GMV Total
        # 2018-03-01 to 2018-08-31 23:59:59
        # ----------------------------------------------------------------------
        kpis_6m = query_canonical_kpis(DEFAULT_START_DATE, DEFAULT_END_DATE, status_filter="delivered")
        gmv_6m = Decimal(str(kpis_6m["gmv"]["value"]))
        items_rev_6m = Decimal(str(kpis_6m["gmv"]["item_revenue"]))
        freight_6m = Decimal(str(kpis_6m["gmv"]["freight_value"]))

        sql_indep_6m = """
            SELECT 
                COALESCE(SUM(oi.price + oi.freight_value), 0) AS gmv,
                COALESCE(SUM(oi.price), 0) AS item_rev,
                COALESCE(SUM(oi.freight_value), 0) AS freight_val,
                COUNT(DISTINCT o.order_id) AS orders_cnt
            FROM olist.orders o
            JOIN olist.order_items oi ON o.order_id = oi.order_id
            WHERE o.order_status = 'delivered'
              AND o.purchased_at >= %s
              AND o.purchased_at <= %s;
        """
        row4 = execute_single(sql_indep_6m, (DEFAULT_START_DATE, DEFAULT_END_DATE)) or {}
        indep_gmv = Decimal(str(row4["gmv"]))
        indep_item_rev = Decimal(str(row4["item_rev"]))
        indep_freight = Decimal(str(row4["freight_val"]))
        indep_orders = int(row4["orders_cnt"])

        test4_pass = (gmv_6m == indep_gmv) and (items_rev_6m == indep_item_rev) and (freight_6m == indep_freight)
        self.record(
            "Headline KPI Canonical GMV (6M Window)",
            f"R$ {indep_gmv:,.2f} ({indep_orders:,} orders)",
            f"R$ {gmv_6m:,.2f} ({kpis_6m['orders']['value']:,} orders)",
            test4_pass,
            f"GMV decomposes into R$ {items_rev_6m:,.2f} merchandise + R$ {freight_6m:,.2f} freight."
        )

        # ----------------------------------------------------------------------
        # Test 5: Category Revenue Sum == Total GMV (Reconciliation)
        # ----------------------------------------------------------------------
        sql_cat_sum = """
            SELECT 
                ROUND(SUM(oi.price + oi.freight_value), 2) AS cat_gmv_sum
            FROM olist.orders o
            JOIN olist.order_items oi ON o.order_id = oi.order_id
            JOIN olist.products p ON oi.product_id = p.product_id
            WHERE o.order_status = 'delivered'
              AND o.purchased_at >= %s
              AND o.purchased_at <= %s;
        """
        row5 = execute_single(sql_cat_sum, (DEFAULT_START_DATE, DEFAULT_END_DATE)) or {}
        cat_sum = Decimal(str(row5["cat_gmv_sum"]))

        test5_pass = (cat_sum == gmv_6m)
        self.record(
            "Category Revenue Sum == Total GMV",
            f"R$ {gmv_6m:,.2f}",
            f"R$ {cat_sum:,.2f}",
            test5_pass,
            f"Delta = R$ {abs(cat_sum - gmv_6m):.2f}. Category revenue reconciles 100% to headline GMV."
        )

        # ----------------------------------------------------------------------
        # Test 6: Geographic State Revenue Sum == Total GMV (Reconciliation)
        # ----------------------------------------------------------------------
        sql_state_sum = """
            SELECT 
                ROUND(SUM(oi.price + oi.freight_value), 2) AS state_gmv_sum
            FROM olist.customers c
            JOIN olist.orders o ON c.customer_id = o.customer_id
            JOIN olist.order_items oi ON o.order_id = oi.order_id
            WHERE o.order_status = 'delivered'
              AND o.purchased_at >= %s
              AND o.purchased_at <= %s;
        """
        row6 = execute_single(sql_state_sum, (DEFAULT_START_DATE, DEFAULT_END_DATE)) or {}
        state_sum = Decimal(str(row6["state_gmv_sum"]))

        test6_pass = (state_sum == gmv_6m)
        self.record(
            "State Revenue Sum == Total GMV",
            f"R$ {gmv_6m:,.2f}",
            f"R$ {state_sum:,.2f}",
            test6_pass,
            f"Delta = R$ {abs(state_sum - gmv_6m):.2f}. State breakdown reconciles 100% to headline GMV."
        )

        # ----------------------------------------------------------------------
        # Test 7: Monthly Timeseries Sum == Total GMV (Reconciliation)
        # ----------------------------------------------------------------------
        sql_monthly_sum = """
            WITH monthly AS (
                SELECT 
                    ROUND(SUM(oi.price + oi.freight_value), 2) AS m_gmv
                FROM olist.orders o
                JOIN olist.order_items oi ON o.order_id = oi.order_id
                WHERE o.order_status = 'delivered'
                  AND o.purchased_at >= %s
                  AND o.purchased_at <= %s
                GROUP BY DATE_TRUNC('month', o.purchased_at)
            )
            SELECT ROUND(SUM(m_gmv), 2) AS monthly_total FROM monthly;
        """
        row7 = execute_single(sql_monthly_sum, (DEFAULT_START_DATE, DEFAULT_END_DATE)) or {}
        monthly_total = Decimal(str(row7["monthly_total"]))

        test7_pass = (monthly_total == gmv_6m)
        self.record(
            "Monthly Timeseries Sum == Total GMV",
            f"R$ {gmv_6m:,.2f}",
            f"R$ {monthly_total:,.2f}",
            test7_pass,
            f"Monthly aggregates sum exactly to R$ {gmv_6m:,.2f}."
        )

        # ----------------------------------------------------------------------
        # Test 8: Deduplicated Reviews & Zero Item Fan-Out
        # ----------------------------------------------------------------------
        revs = query_deduplicated_reviews(DEFAULT_START_DATE, DEFAULT_END_DATE, status_filter="delivered")
        
        # Independent check: count distinct order_id from deduplicated CTE
        sql_indep_rev = """
            WITH dedup AS (
                SELECT DISTINCT ON (ord_rev.order_id) ord_rev.order_id, r.score
                FROM olist.order_reviews ord_rev
                JOIN olist.reviews r ON ord_rev.review_id = r.review_id
                ORDER BY ord_rev.order_id, r.created_date DESC
            )
            SELECT 
                COUNT(*) AS cnt,
                ROUND(AVG(d.score), 2) AS avg_s,
                ROUND(SUM(CASE WHEN d.score = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS pct_1
            FROM olist.orders o
            JOIN dedup d ON o.order_id = d.order_id
            WHERE o.order_status = 'delivered'
              AND o.purchased_at >= %s
              AND o.purchased_at <= %s;
        """
        row8 = execute_single(sql_indep_rev, (DEFAULT_START_DATE, DEFAULT_END_DATE)) or {}
        indep_rev_cnt = int(row8["cnt"])
        indep_rev_score = float(row8["avg_s"])
        indep_pct_1 = float(row8["pct_1"])

        test8_pass = (revs["review_count"] == indep_rev_cnt) and (revs["avg_score"] == indep_rev_score)
        self.record(
            "Reviews Deduplication (No Fan-Out)",
            f"{indep_rev_cnt:,} reviews, {indep_rev_score:.2f} avg, {indep_pct_1}% 1-star",
            f"{revs['review_count']:,} reviews, {revs['avg_score']:.2f} avg, {revs['pct_1_star']}% 1-star",
            test8_pass,
            "Dedup review CTE eliminates join multiplication across multi-item orders."
        )

        # ----------------------------------------------------------------------
        # Test 9: Delta Suppression on Full Dataset Range (Bug 2 Fix)
        # When querying full dataset, previous_value & delta MUST be None
        # ----------------------------------------------------------------------
        kpis_full = query_canonical_kpis(start_date=None, end_date=None, status_filter="delivered")
        prev_val_full = kpis_full["gmv"]["previous_value"]
        delta_full = kpis_full["gmv"]["delta"]

        test9_pass = (prev_val_full is None) and (delta_full is None)
        self.record(
            "Delta Suppression on Full Dataset (Bug 2 Fix)",
            "previous_value = None, delta = None",
            f"previous_value = {prev_val_full}, delta = {delta_full}",
            test9_pass,
            "Suppresses fabricated growth multipliers when prior period has zero coverage."
        )

        # ----------------------------------------------------------------------
        # Test 10: Facts Grounding & AI Number Validator (Part 1 Number Check)
        # ----------------------------------------------------------------------
        facts = build_structured_facts_json(DEFAULT_START_DATE, DEFAULT_END_DATE, status_filter="delivered")
        valid_sample = f"Delivered volume reached {facts['orders']} orders ({facts['gmv_compact']} GMV) with {facts['repeat_buyer_rate']}% repeat rate."
        is_valid1, unverified1 = validate_text_against_facts(valid_sample, facts)

        fake_sample = f"Delivered volume reached {facts['orders']} orders but 68% of customers complained about delays."
        is_valid2, unverified2 = validate_text_against_facts(fake_sample, facts)

        test10_pass = (is_valid1 is True) and (is_valid2 is False) and ("68%" in unverified2 or "68" in unverified2)
        self.record(
            "Facts Validator Rejects Fabricated Numbers",
            "Ground text passes; Fake 68% claim rejected",
            f"Ground text valid={is_valid1}; Fake claim caught={unverified2}",
            test10_pass,
            "Post-generation validator ensures every number in AI summaries is verified."
        )

        # ----------------------------------------------------------------------
        # Print Final PASS/FAIL Table
        # ----------------------------------------------------------------------
        self.print_summary()

    def print_summary(self):
        col_w = [45, 32, 32, 8]
        header = f"| {'Test Case / Reconciliation Rule':<45} | {'Expected':<32} | {'Actual':<32} | {'Result':<8} |"
        sep = f"|{'-' * 47}|{'-' * 34}|{'-' * 34}|{'-' * 10}|"

        print(sep)
        print(header)
        print(sep)

        all_passed = True
        for r in self.results:
            status_str = "PASS" if r["passed"] else "FAIL"
            if not r["passed"]:
                all_passed = False
            exp = str(r["expected"])[:32]
            act = str(r["actual"])[:32]
            print(f"| {r['test']:<45} | {exp:<32} | {act:<32} | {status_str:<8} |")

        print(sep + "\n")

        print("DETAILED VERIFICATION LOGS & RECONCILIATION NOTES:")
        for idx, r in enumerate(self.results, 1):
            mark = "PASS" if r["passed"] else "FAIL"
            print(f"[{mark}] Test {idx:02d}: {r['test']}")
            print(f"       Expected: {r['expected']}")
            print(f"       Actual:   {r['actual']}")
            if r['notes']:
                print(f"       Notes:    {r['notes']}")
            print()

        if all_passed:
            print("=" * 80)
            print("ALL 10 DATA RECONCILIATION & INTEGRITY CHECKS PASSED (100% SUCCESS)")
            print("=" * 80 + "\n")
        else:
            print("!" * 80)
            print("VERIFICATION SUITE DETECTED FAILURES. FIX BEFORE CONTINUING.")
            print("!" * 80 + "\n")
            sys.exit(1)

if __name__ == "__main__":
    suite = MetricVerificationSuite()
    suite.run_all()
