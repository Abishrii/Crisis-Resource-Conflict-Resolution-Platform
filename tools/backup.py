#!/usr/bin/env python3
"""ResQSync Unified Backup Tool.

Backs up the ResQSync database (SQLite or PostgreSQL) and uploaded files into
a timestamped, checksummed .tar.gz archive.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sqlite3
import sys
import tarfile
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

import app.models  # noqa: F401
from app.config import get_settings
from app.database import Base, Database
from sqlalchemy import text


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def create_backup(output_dir: Path | None = None) -> Path:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    ts_str = now.strftime("%Y%m%d_%H%M%S")
    target_dir = output_dir or (REPO_ROOT / "backups")
    target_dir.mkdir(parents=True, exist_ok=True)

    stage_dir = target_dir / f"_staging_{ts_str}"
    stage_dir.mkdir(parents=True, exist_ok=True)

    try:
        db = Database(settings.database_url)
        db_type = (
            "sqlite" if settings.database_url.startswith("sqlite") else "postgresql"
        )
        table_counts: dict[str, int] = {}
        records_data: dict[str, list[dict]] = {}

        # 1. Export records across all defined tables
        with db.read_session() as session:
            for table_name in Base.metadata.tables.keys():
                try:
                    result = session.execute(
                        text(
                            f'SELECT * FROM "{table_name}"'
                            if db_type == "postgresql"
                            else f"SELECT * FROM {table_name}"
                        )
                    )
                    keys = list(result.keys())
                    rows = []
                    for row in result.fetchall():
                        row_dict = {}
                        for k, v in zip(keys, row):
                            if isinstance(v, datetime):
                                row_dict[k] = v.isoformat()
                            elif isinstance(v, bytes):
                                row_dict[k] = v.hex()
                            else:
                                row_dict[k] = v
                        rows.append(row_dict)
                    table_counts[table_name] = len(rows)
                    records_data[table_name] = rows
                except Exception:
                    # Table might not exist yet
                    table_counts[table_name] = 0
                    records_data[table_name] = []

        data_json_path = stage_dir / "data.json"
        with open(data_json_path, "w", encoding="utf-8") as f:
            json.dump(records_data, f, indent=2)

        # 2. Database native dump if SQLite
        if db_type == "sqlite":
            raw_path = settings.database_url.replace("sqlite:///", "").split("?")[0]
            sqlite_file = Path(raw_path)
            if not sqlite_file.is_absolute():
                sqlite_file = REPO_ROOT / "backend" / sqlite_file

            dump_sql_path = stage_dir / "database.sql"
            if sqlite_file.exists():
                with (
                    sqlite3.connect(str(sqlite_file)) as s_conn,
                    open(dump_sql_path, "w", encoding="utf-8") as f,
                ):
                    f.writelines(f"{line}\n" for line in s_conn.iterdump())
            else:
                dump_sql_path.write_text("-- empty sqlite db --\n", encoding="utf-8")

        # 3. Copy uploads directory
        uploads_stage = stage_dir / "uploads"
        uploads_stage.mkdir(exist_ok=True)
        upload_dir = Path(settings.upload_dir)
        if not upload_dir.is_absolute():
            upload_dir = REPO_ROOT / "backend" / upload_dir

        file_count = 0
        if upload_dir.exists() and upload_dir.is_dir():
            for root, _, files in os.walk(upload_dir):
                rel_root = Path(root).relative_to(upload_dir)
                dest_dir = uploads_stage / rel_root
                dest_dir.mkdir(parents=True, exist_ok=True)
                for file in files:
                    src_file = Path(root) / file
                    shutil.copy2(src_file, dest_dir / file)
                    file_count += 1

        # 4. Create manifest with checksums
        manifest = {
            "version": "1.0",
            "timestamp": now.isoformat(),
            "database_type": db_type,
            "database_url_masked": settings.database_url.split("@")[-1]
            if "@" in settings.database_url
            else settings.database_url,
            "table_counts": table_counts,
            "uploads_file_count": file_count,
            "checksums": {},
        }

        # Calculate checksums of stage files
        for p in stage_dir.rglob("*"):
            if p.is_file():
                rel = str(p.relative_to(stage_dir)).replace("\\", "/")
                manifest["checksums"][rel] = sha256_file(p)

        manifest_path = stage_dir / "manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        # 5. Pack into tar.gz archive
        archive_name = f"resqsync-backup-{ts_str}.tar.gz"
        archive_path = target_dir / archive_name
        with tarfile.open(archive_path, "w:gz") as tar:
            for item in stage_dir.iterdir():
                tar.add(item, arcname=item.name)

        print(f"[OK] Backup created: {archive_path}")
        print(f"     Tables: {len(table_counts)}, Uploaded files: {file_count}")
        return archive_path
    finally:
        shutil.rmtree(stage_dir, ignore_errors=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create ResQSync backup")
    parser.add_argument("--out", "-o", type=Path, help="Output directory")
    args = parser.parse_args()
    create_backup(args.out)
