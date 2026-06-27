from pathlib import Path
from typing import Optional

import typer

app = typer.Typer(help="TMDT database & file storage backup/restore tool")
user_app = typer.Typer(help="Quản lý tài khoản người dùng")
app.add_typer(user_app, name="user")


@app.command()
def export(
    output_dir: Path = typer.Option(Path("."), "--output-dir", "-o", help="Directory to write archive"),
):
    """Export database + uploads to a timestamped .tar.gz archive."""
    from src.exporter import export_backup

    output_dir.mkdir(parents=True, exist_ok=True)
    archive = export_backup(output_dir)
    typer.echo(f"\n✓ Exported: {archive}")


@app.command("import")
def import_cmd(
    archive: Path = typer.Argument(..., help="Path to .tar.gz backup archive"),
    target_db: Optional[str] = typer.Option(None, "--target-db", "-d",
                                             help="Target DB name (default: tmdt-backup)"),
    overwrite: bool = typer.Option(False, "--overwrite", help="Drop and recreate target DB"),
    no_files: bool = typer.Option(False, "--no-files", help="Skip file storage restore"),
):
    """Import a backup archive into a target database (default: tmdt-backup)."""
    from src.importer import import_backup

    if not archive.exists():
        typer.echo(f"Error: {archive} not found", err=True)
        raise typer.Exit(1)

    import_backup(
        archive_path=archive,
        target_db=target_db,
        restore_files=not no_files,
        overwrite_db=overwrite,
    )
    typer.echo("\n✓ Import complete")


@user_app.command("create")
def user_create():
    """Tạo tài khoản mới."""
    from src.user_manager import create_user, user_exists, pick_role

    email = typer.prompt("Email").strip()
    if user_exists(email):
        typer.echo(f"Lỗi: email '{email}' đã tồn tại.", err=True)
        raise typer.Exit(1)

    full_name = typer.prompt("Họ tên").strip()
    password = typer.prompt("Mật khẩu", hide_input=True, confirmation_prompt=True)
    role = pick_role("Chọn role")

    create_user(email, full_name, password, role)


@user_app.command("change-password")
def user_change_password():
    """Đổi mật khẩu (không cần mật khẩu cũ)."""
    from src.user_manager import change_password, user_exists

    email = typer.prompt("Email").strip()
    if not user_exists(email):
        typer.echo(f"Lỗi: không tìm thấy '{email}'.", err=True)
        raise typer.Exit(1)

    new_password = typer.prompt("Mật khẩu mới", hide_input=True, confirmation_prompt=True)
    change_password(email, new_password)


@user_app.command("change-role")
def user_change_role():
    """Thay đổi role."""
    from src.user_manager import change_role, user_exists, pick_role

    email = typer.prompt("Email").strip()
    if not user_exists(email):
        typer.echo(f"Lỗi: không tìm thấy '{email}'.", err=True)
        raise typer.Exit(1)

    role = pick_role("Chọn role mới")
    change_role(email, role)


@app.command()
def reset(
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation prompt"),
):
    """Reset DB to clean state: keep users, delete everything else."""
    from src.resetter import reset_db, TABLES_TO_CLEAR, _count

    typer.echo("\nTables to be cleared:")
    totals: dict[str, int] = {}
    for table in TABLES_TO_CLEAR:
        count = _count(table)
        totals[table] = count
        status = f"{count:>6} rows" if count >= 0 else "  (not found)"
        typer.echo(f"  {table:<30} {status}")

    total_rows = sum(c for c in totals.values() if c >= 0)
    typer.echo(f"\nTotal: {total_rows} rows will be deleted. Users kept.\n")

    if not yes:
        typer.confirm("Continue?", abort=True)

    typer.echo("Resetting...")
    reset_db()
    typer.echo("✓ Done — DB clean, users intact.")


if __name__ == "__main__":
    app()
