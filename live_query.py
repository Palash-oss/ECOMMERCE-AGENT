import os
import sys
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv("DATABASE_URL")
root_cert = os.getenv("DATABASE_SSLROOTCERT", os.path.abspath("root.crt"))

if not db_url:
    print("[ERROR] DATABASE_URL is not set in .env! Terminating.")
    sys.exit(1)

print("\n" + "="*70)
print("  COCKROACHDB LIVE ENTERPRISE CONNECTION DEMONSTRATOR")
print("="*70)
print(f"Cluster Host : test-db-35576.j77.aws-ap-south-1.cockroachlabs.cloud:26257")
print(f"Database     : defaultdb | User: test")
print(f"SSL Cert     : {root_cert}")
print("Connecting...")

start = time.time()
try:
    conn = psycopg2.connect(db_url, sslrootcert=root_cert)
    latency = round((time.time() - start) * 1000, 2)
    cur = conn.cursor()
    print(f"\n STATUS: [CONNECTED LIVE] (Ping Latency: {latency} ms)")
    
    # 1. Version and node info
    cur.execute("SELECT current_database(), current_user, version();")
    db, user, ver = cur.fetchone()
    print(f"Active DB    : {db}")
    print(f"User         : {user}")
    print(f"Engine       : {ver.split()[0]} {ver.split()[1]} {ver.split()[2]}")

    import sys
    if len(sys.argv) > 1:
        custom_sql = " ".join(sys.argv[1:])
        print("\n" + "-"*70)
        print(f" EXECUTING CUSTOM QUERY: {custom_sql}")
        print("-"*70)
        cur.execute(custom_sql)
        cols = [desc[0] for desc in cur.description]
        print(" | ".join([f"{c:<20}" for c in cols]))
        print("-" * (23 * len(cols)))
        rows = cur.fetchall()
        for r in rows[:10]:
            print(" | ".join([f"{str(val)[:18]:<20}" for val in r]))
        if len(rows) > 10:
            print(f"... and {len(rows) - 10} more rows")
    else:
        # 2. Live Record Counts
        print("\n" + "-"*70)
        print(" LIVE RECORD COUNTS IN CLUSTER:")
        print("-"*70)
        tables_to_check = [
            "olist.orders",
            "olist.order_items",
            "olist.customers",
            "olist.products",
            "olist.reviews",
            "olist.sellers",
            "olist.order_payments"
        ]
        for tbl in tables_to_check:
            cur.execute(f"SELECT COUNT(*) FROM {tbl};")
            cnt = cur.fetchone()[0]
            print(f" [+] {tbl:<25} -> {cnt:,} records")

        # 3. Live Revenue Check
        cur.execute("SELECT ROUND(SUM(payment_value), 2) FROM olist.order_payments;")
        total_rev = cur.fetchone()[0]
        print(f"\n [+] Total Payment Volume Processed : R$ {total_rev:,.2f}")

    print("\n" + "="*70)
    print(" Live connection verified 100%! Ready to present to evaluators.")
    print("="*70 + "\n")

    cur.close()
    conn.close()

except Exception as e:
    print(f"\n[ERROR] Connection failed: {e}")
