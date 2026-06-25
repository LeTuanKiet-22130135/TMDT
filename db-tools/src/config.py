import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection
PG_CONTAINER = os.getenv("PG_CONTAINER", "tmdt_db")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "123")
PG_DB = os.getenv("PG_DB", "tmdt")
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")

# File storage
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(Path(__file__).resolve().parents[2] / "bk-tmdt" / "uploads")))

# Backup target
BACKUP_DB = os.getenv("BACKUP_DB", "tmdt-backup")
