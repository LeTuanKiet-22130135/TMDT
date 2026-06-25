from pathlib import Path
from typing import Optional

import typer

app = typer.Typer(help="TMDT database & file storage backup/restore tool")


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


if __name__ == "__main__":
    app()
