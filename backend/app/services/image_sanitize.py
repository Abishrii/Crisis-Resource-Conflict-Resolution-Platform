"""Strip EXIF and GPS metadata from uploaded images before persisting to storage."""

from __future__ import annotations

import struct


def strip_jpeg_exif(data: bytes) -> bytes:
    """Remove APP1 (EXIF / XMP) marker segments from JPEG while keeping image data intact."""
    if not data.startswith(b"\xff\xd8"):
        return data
    out = bytearray(b"\xff\xd8")
    pos = 2
    n = len(data)
    while pos < n:
        if data[pos] != 0xFF:
            break
        while pos < n and data[pos] == 0xFF:
            pos += 1
        if pos >= n:
            break
        marker = data[pos]
        pos += 1
        if marker in (0xD8, 0xD9):  # SOI, EOI
            out.extend([0xFF, marker])
            continue
        if 0xD0 <= marker <= 0xD7:  # Restart markers
            out.extend([0xFF, marker])
            continue
        if marker == 0xDA:  # SOS: Start of Scan (image stream begins)
            out.extend([0xFF, marker])
            out.extend(data[pos:])
            break
        if pos + 2 > n:
            break
        length = int.from_bytes(data[pos : pos + 2], "big")
        # 0xE1 is APP1 (EXIF, GPS, and XMP). Also strip 0xE2 (APP2) if it contains FlashPix/metadata
        if marker == 0xE1:
            pos += length
            continue
        out.extend([0xFF, marker])
        out.extend(data[pos : pos + length])
        pos += length
    return bytes(out)


def strip_png_metadata(data: bytes) -> bytes:
    """Remove eXIf, tEXt, zTXt, iTXt chunks from PNG to remove GPS and camera metadata."""
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return data
    out = bytearray(b"\x89PNG\r\n\x1a\n")
    pos = 8
    n = len(data)
    while pos + 8 <= n:
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        chunk_type = data[pos + 4 : pos + 8]
        total_len = 4 + 4 + length + 4  # length + type + data + crc
        if pos + total_len > n:
            break
        # Skip metadata chunks
        if chunk_type in (b"eXIf", b"tEXt", b"zTXt", b"iTXt"):
            pos += total_len
            continue
        out.extend(data[pos : pos + total_len])
        pos += total_len
        if chunk_type == b"IEND":
            break
    return bytes(out)


def strip_webp_metadata(data: bytes) -> bytes:
    """Remove EXIF and XMP chunks from WebP RIFF container."""
    if not (data.startswith(b"RIFF") and data[8:12] == b"WEBP"):
        return data
    out_body = bytearray()
    pos = 12
    n = len(data)
    while pos + 8 <= n:
        fourcc = data[pos : pos + 4]
        size = struct.unpack("<I", data[pos + 4 : pos + 8])[0]
        padded_size = size + (size % 2)
        total_len = 8 + padded_size
        if pos + total_len > n:
            break
        if fourcc in (b"EXIF", b"XMP "):
            pos += total_len
            continue
        out_body.extend(data[pos : pos + total_len])
        pos += total_len
    file_size = 4 + len(out_body)
    return b"RIFF" + struct.pack("<I", file_size) + b"WEBP" + bytes(out_body)


def sanitize_image(data: bytes, mime_type: str) -> bytes:
    """Strip all EXIF, GPS, and metadata tags from image bytes."""
    if mime_type == "image/jpeg":
        return strip_jpeg_exif(data)
    if mime_type == "image/png":
        return strip_png_metadata(data)
    if mime_type == "image/webp":
        return strip_webp_metadata(data)
    return data
