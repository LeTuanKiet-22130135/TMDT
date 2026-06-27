"""Reset DB to clean state — keep users, delete everything else."""
import subprocess

from src.config import PG_CONTAINER, PG_USER, PG_DB

# Tables cleared in one TRUNCATE CASCADE (order doesn't matter — CASCADE handles FKs)
TABLES_TO_CLEAR = [
    "reviews",
    "payments",
    "order_items",
    "orders",
    "reports",
    "product_likes",
    "comments",
    "cart_items",
    "shopping_cart",
    "user_follows",
    "products",
    "stores",
    "categories",
    "product_red_profile",
    "user_red_profile",
]


def _run_sql(sql: str) -> str:
    result = subprocess.run(
        ["docker", "exec", PG_CONTAINER, "psql", "-U", PG_USER, "-d", PG_DB, "-t", "-c", sql],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def _count(table: str) -> int:
    try:
        out = _run_sql(f"SELECT COUNT(*) FROM {table};")
        return int(out.strip())
    except Exception:
        return -1  # table might not exist (e.g. bk-cacao tables before first run)


def reset_db() -> dict[str, int]:
    """
    Count rows, truncate all non-user tables, return {table: rows_deleted}.
    Raises subprocess.CalledProcessError on SQL failure.
    """
    counts: dict[str, int] = {}
    for table in TABLES_TO_CLEAR:
        counts[table] = _count(table)

    existing = [t for t, c in counts.items() if c >= 0]
    if not existing:
        return counts

    truncate_sql = "TRUNCATE " + ", ".join(existing) + " CASCADE;"
    _run_sql(truncate_sql)

    return counts
