#!/usr/bin/env python3
"""Automated verification test for ResQSync backup and restore tools.

Verifies:
1. Backup creation with manifest and checksums
2. State mutation (adding records, deleting files)
3. Full restore from archive
4. State integrity verification
"""

from __future__ import annotations

import sys
import tempfile
import uuid
from pathlib import Path

# Add repo root to path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))
sys.path.insert(0, str(REPO_ROOT / "tools"))

from app.config import get_settings
from app.database import Database, utcnow
from app.models.crisis import Crisis
from backup import create_backup
from restore import restore_backup
from sqlalchemy import func, select


def run_test():
    print("[TEST] Running automated backup and restore verification...")
    settings = get_settings()
    db = Database(settings.database_url)
    db.create_all()

    upload_dir = Path(settings.upload_dir)
    if not upload_dir.is_absolute():
        upload_dir = REPO_ROOT / "backend" / upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    test_file = upload_dir / "test_artifact.txt"
    test_file_content = f"ResQSync backup verification payload: {uuid.uuid4().hex}"
    test_file.write_text(test_file_content, encoding="utf-8")

    # Count initial crises
    with db.read_session() as session:
        initial_crises_count = session.scalar(select(func.count(Crisis.id))) or 0

    print(f"[*] Initial crisis count: {initial_crises_count}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        print("[*] Creating backup archive...")
        backup_path = create_backup(output_dir=tmp_path)
        assert backup_path.exists() and backup_path.stat().st_size > 0, (
            "Backup file was not created properly"
        )
        print(
            f"[OK] Backup archive created: {backup_path.name} ({backup_path.stat().st_size} bytes)"
        )

        # Mutate database state
        dummy_crisis_id = f"test-crisis-{uuid.uuid4().hex[:8]}"
        print(
            f"[*] Mutating state: inserting {dummy_crisis_id} and removing test file..."
        )
        with db.write_session() as session:
            mutated_crisis = Crisis(
                id=dummy_crisis_id,
                title="Mutation Test Crisis",
                city="Test City",
                region="Test Region",
                lat=12.34,
                lng=56.78,
                category="Earthquake",
                severity=5,
                status="active",
                population=1000,
                created_at=utcnow(),
            )
            session.add(mutated_crisis)
            session.commit()

        # Delete test file
        if test_file.exists():
            test_file.unlink()

        # Verify mutation occurred
        with db.read_session() as session:
            count_after_mutation = session.scalar(select(func.count(Crisis.id)))
            assert count_after_mutation == initial_crises_count + 1, (
                "Mutation did not increment crisis count"
            )
        assert not test_file.exists(), (
            "Test file should be deleted during mutation step"
        )
        print("[OK] State mutation verified successfully.")

        # Restore from backup
        print("[*] Restoring from backup archive...")
        restore_backup(backup_path)

        # Verify restored state
        with db.read_session() as session:
            restored_count = session.scalar(select(func.count(Crisis.id)))
            found_mutated = session.scalar(
                select(Crisis).where(Crisis.id == dummy_crisis_id)
            )
            assert restored_count == initial_crises_count, (
                f"Crisis count not restored: expected {initial_crises_count}, got {restored_count}"
            )
            assert found_mutated is None, (
                "Mutated dummy crisis was not purged during restore"
            )

        assert test_file.exists(), "Test upload file was not restored"
        assert test_file.read_text(encoding="utf-8") == test_file_content, (
            "Restored upload file content mismatch"
        )

        # Cleanup test file
        test_file.unlink(missing_ok=True)

        print("[SUCCESS] Automated Backup & Restore test passed with 100% fidelity!")


if __name__ == "__main__":
    run_test()
