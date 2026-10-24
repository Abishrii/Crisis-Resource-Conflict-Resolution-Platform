"""0002_disable_legacy_viewer_accounts

The viewer role was removed. Existing rows keep the old role string so the
account is not silently reinterpreted; disabling them means they can no longer
sign in until an administrator assigns a supported role.

Revision ID: c3f1a9b2d4e6
Revises: 7b2b4481daea
Create Date: 2026-10-24
"""

from typing import Sequence, Union

from alembic import op

revision: str = "c3f1a9b2d4e6"
down_revision: Union[str, Sequence[str], None] = "7b2b4481daea"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET status = 'disabled' WHERE role = 'viewer'")


def downgrade() -> None:
    # The previous status of each account is not known; leave them disabled.
    pass
