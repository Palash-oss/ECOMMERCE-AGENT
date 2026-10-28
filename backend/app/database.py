import time
import random
import logging
from contextlib import contextmanager
from typing import Generator, Any, List, Dict, Tuple, Optional
import psycopg2
from psycopg2 import pool, errors
from backend.app.config import settings

logger = logging.getLogger("nexus.database")

# Global thread-safe connection pool
_pool: Optional[pool.ThreadedConnectionPool] = None

def init_connection_pool(minconn: int = 2, maxconn: int = 15):
    """Initializes the CockroachDB ThreadedConnectionPool with verified SSL root cert."""
    global _pool
    if _pool is not None and not _pool.closed:
        return

    logger.info("Initializing CockroachDB connection pool (min=%d, max=%d)...", minconn, maxconn)
    _pool = pool.ThreadedConnectionPool(
        minconn=minconn,
        maxconn=maxconn,
        dsn=settings.DATABASE_URL,
        sslrootcert=settings.DATABASE_SSLROOTCERT
    )
    logger.info("CockroachDB connection pool initialized successfully.")

def close_connection_pool():
    """Closes all connections in the pool on shutdown."""
    global _pool
    if _pool is not None and not _pool.closed:
        _pool.closeall()
        logger.info("CockroachDB connection pool closed.")

@contextmanager
def get_db_connection() -> Generator[psycopg2.extensions.connection, None, None]:
    """
    Context manager that checks out a connection from the pool,
    strictly enforces READ-ONLY session status and 5s statement timeout,
    and returns the connection cleanly.
    """
    global _pool
    if _pool is None or _pool.closed:
        init_connection_pool()

    conn = _pool.getconn()
    try:
        # Enforce Read-Only session and 5000ms statement timeout
        with conn.cursor() as cur:
            cur.execute("SET default_transaction_read_only = on;")
            cur.execute("SET statement_timeout = 5000;")
        yield conn
    finally:
        _pool.putconn(conn)

def execute_query(
    sql: str,
    params: Optional[Tuple[Any, ...] | Dict[str, Any]] = None,
    max_retries: int = 3
) -> List[Dict[str, Any]]:
    """
    Executes a SELECT query with strict parameterization and automatic 
    CockroachDB transaction retry (SQLSTATE 40001) with exponential backoff & jitter.
    """
    # Safety Check: Guarantee no write statements can ever run
    sanitized_sql = sql.strip().upper()
    destructive_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT"]
    for kw in destructive_keywords:
        if sanitized_sql.startswith(kw) or f" {kw} " in sanitized_sql:
            raise PermissionError(f"Database security policy violation: Destructive keyword '{kw}' is forbidden.")

    attempt = 0
    while True:
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    if cur.description is None:
                        return []
                    cols = [desc[0] for desc in cur.description]
                    rows = cur.fetchall()
                    return [dict(zip(cols, row)) for row in rows]
        except errors.lookup("40001") as retry_err:
            attempt += 1
            if attempt >= max_retries:
                logger.error("CockroachDB transaction retry limit reached (40001): %s", retry_err)
                raise
            # Exponential backoff with jitter
            backoff = (2 ** attempt * 0.05) + random.uniform(0.01, 0.05)
            logger.warning("Encountered CockroachDB 40001 retry error. Retrying in %.3fs (attempt %d/%d)...", backoff, attempt, max_retries)
            time.sleep(backoff)
        except Exception as e:
            logger.error("Query execution failed: %s | SQL: %s", str(e), sql[:120])
            raise

def execute_single(
    sql: str,
    params: Optional[Tuple[Any, ...] | Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """Executes a query and returns the first row or None."""
    results = execute_query(sql, params)
    return results[0] if results else None
