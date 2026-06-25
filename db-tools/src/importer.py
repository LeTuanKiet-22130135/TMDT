import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path

from src.config import UPLOADS_DIR, PG_CONTAINER, PG_USER, BACKUP_DB


def _db_exists(container: str, user: str, db: str) -> bool:
    result = subprocess.run(
        ["docker", "exec", container, "psql", "-U", user, "-tAc",
         f"SELECT 1 FROM pg_database WHERE datname='{db}'"],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() == "1"


def _create_db(container: str, user: str, db: str):
    subprocess.run(
        ["docker", "exec", container, "createdb", "-U", user, db],
        check=True,
    )
    print(f"[import] created database '{db}'")


def _drop_db(container: str, user: str, db: str):
    subprocess.run(
        ["docker", "exec", container, "dropdb", "--if-exists", "-U", user, db],
        check=True,
    )
    print(f"[import] dropped database '{db}'")


def _restore_sql(container: str, user: str, db: str, sql: bytes):
    proc = subprocess.run(
        ["docker", "exec", "-i", container, "psql", "-U", user, "-d", db,
         "-v", "ON_ERROR_STOP=1"],
        input=sql,
        capture_output=True,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.decode(errors="replace")
        raise RuntimeError(f"psql failed:\n{stderr}")


def import_backup(
    archive_path: Path,
    target_db: str | None = None,
    restore_files: bool = True,
    overwrite_db: bool = False,
):
    target_db = target_db or BACKUP_DB

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)

        print(f"[import] extracting {archive_path.name}...")
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(tmp_path)

        dump_file = tmp_path / "dump.sql"
        uploads_src = tmp_path / "uploads"

        if not dump_file.exists():
            raise FileNotFoundError("dump.sql not found in archive")

        # 1. Prepare target DB
        if overwrite_db and _db_exists(PG_CONTAINER, PG_USER, target_db):
            _drop_db(PG_CONTAINER, PG_USER, target_db)

        if not _db_exists(PG_CONTAINER, PG_USER, target_db):
            _create_db(PG_CONTAINER, PG_USER, target_db)
        else:
            print(f"[import] using existing database '{target_db}'")

        # 2. Restore SQL
        print(f"[import] restoring dump into '{target_db}'...")
        sql_bytes = dump_file.read_bytes()
        _restore_sql(PG_CONTAINER, PG_USER, target_db, sql_bytes)
        print(f"[import] database restored")

        # 3. Restore uploads
        if restore_files and uploads_src.exists():
            file_count = sum(1 for _ in uploads_src.rglob("*") if _.is_file())
            dest = UPLOADS_DIR.parent / f"uploads_{target_db}"
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(uploads_src, dest)
            print(f"[import] {file_count} file(s) restored to {dest}")
        else:
            print("[import] skipping file restore")

    print(f"[import] done — target: '{target_db}'")
