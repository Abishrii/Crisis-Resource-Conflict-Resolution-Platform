"""Server-side report generation: an Excel-compatible SpreadsheetML workbook and a dependency-free PDF."""

from __future__ import annotations

import unicodedata
from datetime import datetime, timedelta, timezone
from xml.sax.saxutils import escape

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import iso
from app.models import AuditLog, Resource
from app.services.analytics import metrics, period_crises
from app.services.operations import SEVERITY_NAMES


def export_data(db: Session, days: int) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    resources = db.scalars(select(Resource).order_by(Resource.name)).all()
    audit = db.scalars(
        select(AuditLog).where(AuditLog.at >= cutoff).order_by(AuditLog.at.desc(), AuditLog.id.desc()).limit(2000)
    ).all()
    return [
        {
            "name": "Crisis records",
            "headers": [
                "ID",
                "Incident",
                "City",
                "State",
                "Category",
                "Severity",
                "Status",
                "Response minutes",
                "Latitude",
                "Longitude",
                "Created",
            ],
            "rows": [
                [
                    c.id,
                    c.title,
                    c.city,
                    c.region,
                    c.category,
                    SEVERITY_NAMES[c.severity],
                    c.status,
                    c.response_minutes if c.response_minutes is not None else "Not recorded",
                    c.lat,
                    c.lng,
                    iso(c.created_at),
                ]
                for c in period_crises(db, days)
            ],
        },
        {
            "name": "Resource inventory",
            "headers": [
                "ID",
                "Resource",
                "Type",
                "Organization",
                "Capacity",
                "Unit",
                "Assigned",
                "Available",
                "Maintenance",
                "Daily unit cost INR",
            ],
            "rows": [
                [
                    r.id,
                    r.name,
                    r.type,
                    r.organization,
                    r.total,
                    r.unit,
                    r.used,
                    r.available,
                    "Yes" if r.maintenance else "No",
                    r.cost,
                ]
                for r in resources
            ],
        },
        {
            "name": "Audit trail",
            "headers": ["Time", "Actor", "Action", "Details"],
            "rows": [[iso(a.at), a.actor, a.action, a.detail] for a in audit],
        },
    ]


def build_xml(sheets: list[dict]) -> bytes:
    def cell(value, header=False):
        kind = "Number" if isinstance(value, (int, float)) and not isinstance(value, bool) else "String"
        style = ' ss:StyleID="Header"' if header else ""
        return f'<Cell{style}><Data ss:Type="{kind}">{escape(str(value))}</Data></Cell>'

    body = "".join(
        f'<Worksheet ss:Name="{escape(s["name"])}"><Table><Row>{"".join(cell(h, True) for h in s["headers"])}</Row>'
        + "".join(f"<Row>{''.join(cell(v) for v in row)}</Row>" for row in s["rows"])
        + "</Table></Worksheet>"
        for s in sheets
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>'
        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
        f'<Styles><Style ss:ID="Header"><Font ss:Bold="1"/></Style></Styles>{body}</Workbook>'
    )
    return xml.encode("utf-8")


def _ascii(value) -> str:
    text = unicodedata.normalize("NFKD", str(value))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    for a, b in (("\u2013", "-"), ("\u2014", "-"), ("\u2019", "'"), ("\u2018", "'"), ("\u201c", '"'), ("\u201d", '"')):
        text = text.replace(a, b)
    return "".join(ch for ch in text if 0x20 <= ord(ch) <= 0x7E)


def _wrap(value, width=91) -> list[str]:
    text, lines = _ascii(value), []
    while len(text) > width:
        cut = text.rfind(" ", 0, width + 1)
        cut = cut if cut > 25 else width
        lines.append(text[:cut])
        text = text[cut:].lstrip()
    lines.append(text)
    return lines


def build_pdf(db: Session, days: int, sheets: list[dict]) -> bytes:
    stats = metrics(db)
    lines = [
        "INDIA OPERATIONS / RESQSYNC REPORT",
        f"Prepared {datetime.now(timezone.utc).date().isoformat()} | Last {days} days",
        "",
        f"Active incidents: {stats['active']} | Resource pressure: {stats['conflicts']} pools",
        f"Current mean pool utilization: {stats['utilization']}% | Mean recorded response: {stats['response']} min",
        "",
    ]
    for sheet in sheets:
        lines += [sheet["name"].upper(), " | ".join(sheet["headers"]), ""]
        for row in sheet["rows"]:
            lines += _wrap(" | ".join(str(v) for v in row))
        lines += ["", ""]
    flat = [w for line in lines for w in _wrap(line)]
    pages = [flat[i : i + 43] for i in range(0, len(flat), 43)] or [[]]

    def pdf_text(t: str) -> str:
        return _ascii(t).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ]
    objects[1] = (
        f"<< /Type /Pages /Count {len(pages)} /Kids [{' '.join(f'{5 + i * 2} 0 R' for i in range(len(pages)))}] >>"
    )
    for index, page in enumerate(pages):
        _page_id, stream_id = 5 + index * 2, 6 + index * 2
        body = "".join(f"({pdf_text(line)}) Tj T*\n" for line in page)
        commands = (
            "BT /F2 22 Tf 40 790 Td (ResQSync) Tj ET\n"
            f"BT /F1 9 Tf 40 756 Td 15 TL {body} ET\n"
            f"BT /F1 8 Tf 40 36 Td (Page {index + 1} of {len(pages)}) Tj ET\n"
        )
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {stream_id} 0 R >>"
        )
        objects.append(f"<< /Length {len(commands.encode('latin-1'))} >>\nstream\n{commands}endstream")
    out = bytearray(b"%PDF-1.4\n%ResQSync\n")
    offsets = []
    for number, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n{obj}\nendobj\n".encode("latin-1")
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()
    return bytes(out)
