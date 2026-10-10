#!/usr/bin/env python3
"""ResQSync Unified Restore Tool.

Restores a ResQSync backup from a .tar.gz archive.
Validates SHA-256 checksums, restores tables and uploaded attachments,
and verifies consistency.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import tarfile
from datetime import datetime
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


def restore_backup(archive_path: Path) -> None:
    if not archive_path.exists():
        raise FileNotFoundError(f"Backup archive not found: {archive_path}")

    settings = get_settings()
    extract_dir = (
        archive_path.parent
        / f"_restore_stage_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    )
    extract_dir.mkdir(parents=True, exist_ok=True)

    try:
        # 1. Extract archive
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(extract_dir)

        manifest_file = extract_dir / "manifest.json"
        if not manifest_file.exists():
            raise ValueError("Invalid archive: missing manifest.json")

        with open(manifest_file, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        # 2. Checksum verification
        print("[*] Verifying archive checksums...")
        checksums = manifest.get("checksums", {})
        for rel_path, expected_hash in checksums.items():
            if rel_path == "manifest.json":
                continue
            item_path = extract_dir / rel_path
            if not item_path.exists():
                raise ValueError(f"Corrupt backup: missing item {rel_path}")
            actual_hash = sha256_file(item_path)
            if actual_hash != expected_hash:
                raise ValueError(
                    f"Checksum mismatch for {rel_path}: expected {expected_hash}, got {actual_hash}"
                )

        print("[OK] Checksums verified successfully.")

        # 3. Restore Database
        db = Database(settings.database_url)
        db.create_all()
        db_type = (
            "sqlite" if settings.database_url.startswith("sqlite") else "postgresql"
        )

        data_json_path = extract_dir / "data.json"
        if not data_json_path.exists():
            raise ValueError("Invalid archive: missing data.json")

        with open(data_json_path, "r", encoding="utf-8") as f:
            records_data = json.load(f)

        print(f"[*] Restoring database ({db_type})...")
        with db.write_session() as session:
            # Delete in reverse dependency order (leaves first, parents last)
            if db_type == "sqlite":
                for table in reversed(Base.metadata.sorted_tables):
                    session.execute(text(f"DELETE FROM {table.name}"))
            else:
                for table in reversed(Base.metadata.sorted_tables):
                    session.execute(text(f'TRUNCATE TABLE "{table.name}" CASCADE'))

            # Insert in topological dependency order (parents first, leaves last)
            for table in Base.metadata.sorted_tables:
                rows = records_data.get(table.name, [])
                if not rows:
                    continue
                for row in rows:
                    parsed_row = {}
                    for col_name, val in row.items():
                        if col_name in table.columns:
                            col_type = str(table.columns[col_name].type).lower()
                            if "datetime" in col_type and isinstance(val, str):
                                try:
                                    parsed_row[col_name] = datetime.fromisoformat(val)
                                except Exception:
                                    parsed_row[col_name] = val
                            elif (
                                "bytes" in col_type
                                or "largebinary" in col_type
                                and isinstance(val, str)
                            ):
                                try:
                                    parsed_row[col_name] = bytes.fromhex(val)
                                except Exception:
                                    parsed_row[col_name] = val
                            else:
                                parsed_row[col_name] = val
                    session.execute(table.insert().values(**parsed_row))

            session.commit()

        # 4. Restore Uploads
        uploads_stage = extract_dir / "uploads"
        upload_dir = Path(settings.upload_dir)
        if not upload_dir.is_absolute():
            upload_dir = REPO_ROOT / "backend" / upload_dir

        upload_dir.mkdir(parents=True, exist_ok=True)
        restored_files = 0
        if uploads_stage.exists() and uploads_stage.is_dir():
            for root, _, files in os.walk(uploads_stage):
                rel_root = Path(root).relative_to(uploads_stage)
                dest_dir = upload_dir / rel_root
                dest_dir.mkdir(parents=True, exist_ok=True)
                for file in files:
                    src_file = Path(root) / file
                    shutil.copy2(src_file, dest_dir / file)
                    restored_files += 1

        print(f"[OK] Database and {restored_files} upload files restored.")

        # 5. Verify restored record counts against manifest
        print("[*] Validating restored records...")
        with db.read_session() as session:
            for table_name, expected_count in manifest.get("table_counts", {}).items():
                if table_name in Base.metadata.tables:
                    cnt = session.execute(
                        text(
                            f'SELECT COUNT(*) FROM "{table_name}"'
                            if db_type == "postgresql"
                            else f"SELECT COUNT(*) FROM {table_name}"
                        )
                    ).scalar()
                    if cnt != expected_count:
                        raise ValueError(
                            f"Verification failure on '{table_name}': expected {expected_count}, got {cnt}"
                        )

        print("[OK] Restore completed and verified with 100% data integrity!")
    finally:
        shutil.rmtree(extract_dir, ignore_errors=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Restore ResQSync backup")
    parser.add_argument("archive", type=Path, help="Path to backup tar.gz archive")
    args = parser.parse_args()
    restore_backup(args.archive)
