import shutil
import subprocess
import tarfile
import tempfile
from datetime import datetime
from pathlib import Path

from src.config import UPLOADS_DIR, PG_CONTAINER, PG_USER, PG_DB


def run_pg_dump(container: str, user: str, db: str) -> bytes:
    result = subprocess.run(
        ["docker", "exec", container, "pg_dump", "-U", user, "--no-owner", "--no-acl", db],
        capture_output=True,
        check=True,
    )
    return result.stdout


def export_backup(output_dir: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"tmdt_backup_{timestamp}.tar.gz"
    archive_path = output_dir / archive_name

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)

        # 1. Dump database
        print(f"[export] pg_dump from container '{PG_CONTAINER}'...")
        sql_bytes = run_pg_dump(PG_CONTAINER, PG_USER, PG_DB)
        dump_file = tmp_path / "dump.sql"
        dump_file.write_bytes(sql_bytes)
        print(f"[export] dump size: {len(sql_bytes) // 1024} KB")

        # 2. Copy uploads
        uploads_dst = tmp_path / "uploads"
        if UPLOADS_DIR.exists():
            shutil.copytree(UPLOADS_DIR, uploads_dst)
            file_count = sum(1 for _ in uploads_dst.rglob("*") if _.is_file())
            print(f"[export] copied {file_count} file(s) from uploads")
        else:
            uploads_dst.mkdir()
            print(f"[export] uploads dir not found, skipping files")

        # 3. Bundle into tar.gz
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(dump_file, arcname="dump.sql")
            tar.add(uploads_dst, arcname="uploads")

    size_kb = archive_path.stat().st_size // 1024
    print(f"[export] archive: {archive_path} ({size_kb} KB)")
    return archive_path
