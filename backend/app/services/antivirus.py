"""Optional ClamAV antivirus scanner hook for uploaded documents."""

from __future__ import annotations

import logging
import socket
import struct
from typing import TYPE_CHECKING

from app.errors import DomainError

if TYPE_CHECKING:
    from app.config import Settings

log = logging.getLogger("resqsync.antivirus")


def scan_bytes(data: bytes, settings: Settings) -> None:
    """Scan file bytes with ClamAV daemon if enabled. Off by default."""
    if not settings.clamav_enabled:
        return

    host = settings.clamav_host
    port = settings.clamav_port

    try:
        with socket.create_connection((host, port), timeout=10.0) as s:
            # ClamAV INSTREAM protocol
            s.sendall(b"zINSTREAM\0")
            chunk_size = 2048
            for i in range(0, len(data), chunk_size):
                chunk = data[i : i + chunk_size]
                s.sendall(struct.pack(">I", len(chunk)) + chunk)
            s.sendall(struct.pack(">I", 0))

            response = b""
            while True:
                part = s.recv(1024)
                if not part:
                    break
                response += part

            resp_str = response.decode("utf-8", errors="replace").strip()
            log.info("ClamAV scan response: %s", resp_str)
            if "FOUND" in resp_str:
                virus_name = resp_str.replace("stream:", "").replace("FOUND", "").strip()
                log.warning("Malware detected in upload: %s", virus_name)
                raise DomainError("The uploaded file was rejected by antivirus scanning.", 400)
    except DomainError:
        raise
    except Exception as e:
        log.error("ClamAV antivirus connection failed (%s:%s): %s", host, port, e)
        # Fail safe or log depending on requirements
        raise DomainError("Antivirus service unavailable; upload could not be verified.", 503)
