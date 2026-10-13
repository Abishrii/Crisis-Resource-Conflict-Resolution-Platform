"""Fictional India training dataset (identical to the one the interface used to build in the browser),
plus demo accounts. Only loaded when SEED_DEMO_DATA is on."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import utcnow
from app.models import (
    Allocation,
    Attachment,
    AuditLog,
    Crisis,
    CrisisEvent,
    Decision,
    Demand,
    HelpRequest,
    HelpRequestEvent,
    Message,
    Meta,
    Negotiation,
    Notification,
    NotificationRead,
    OutboxMessage,
    Resource,
    ResourceEvent,
    Simulation,
    User,
)
from app.security import hash_password

DEMO_USERS = [
    ("Aditi Rao", "aditi@example.org", "Western Response Collective", "admin"),
    ("Arjun Nair", "arjun@example.org", "Southern Response Collective", "crisis-manager"),
    ("Meera Iyer", "meera@example.org", "Regional Trauma Consortium", "resource-coordinator"),
    ("Rohan Das", "rohan@example.org", "Eastern Relief Network", "viewer"),
    ("Demo Help Seeker", "seeker@example.org", "Community", "help-seeker"),
]


def demo_accounts(settings: Settings | None = None) -> list[dict]:
    if settings and settings.seed_demo_data:
        return [{"name": n, "email": e, "role": r, "password": settings.demo_password} for n, e, _o, r in DEMO_USERS]
    admin_email = (
        settings.bootstrap_admin_email if settings and settings.bootstrap_admin_email else "admin@resqsync.org"
    ).lower()
    admin_pw = settings.bootstrap_admin_password if settings and settings.bootstrap_admin_password else "Admin#2026"
    demo_pw = settings.demo_password if settings else "Resqsync#2026"
    return [
        {"name": "Crisis Director", "email": admin_email, "role": "admin", "password": admin_pw},
        {"name": "Crisis Manager", "email": "manager@resqsync.org", "role": "crisis-manager", "password": demo_pw},
        {
            "name": "Resource Coordinator",
            "email": "coordinator@resqsync.org",
            "role": "resource-coordinator",
            "password": demo_pw,
        },
        {"name": "Field Viewer", "email": "viewer@resqsync.org", "role": "viewer", "password": demo_pw},
        {"name": "Citizen Seeker", "email": "citizen@resqsync.org", "role": "help-seeker", "password": demo_pw},
    ]


def _ago(minutes: float):
    return utcnow() - timedelta(minutes=minutes)


def seed_users(db: Session, settings: Settings) -> None:
    pw = hash_password(settings.demo_password)
    for name, email, org, role in DEMO_USERS:
        if db.scalar(select(User.id).where(User.email == email)) is None:
            db.add(User(name=name, email=email, organization=org, role=role, password_hash=pw))
    db.flush()


def bootstrap_admin(db: Session, settings: Settings) -> None:
    if db.scalar(select(func.count(User.id))):
        return
    if settings.bootstrap_admin_email and settings.bootstrap_admin_password:
        db.add(
            User(
                name=settings.bootstrap_admin_name,
                email=settings.bootstrap_admin_email,
                role="admin",
                organization="Administration",
                password_hash=hash_password(settings.bootstrap_admin_password),
            )
        )
        db.flush()


def seed_workspace(db: Session) -> None:
    def crisis(id, title, city, region, lat, lng, category, severity, status, population, response, age):
        c = Crisis(
            id=id,
            title=title,
            city=city,
            region=region,
            lat=lat,
            lng=lng,
            category=category,
            severity=severity,
            status=status,
            population=population,
            response_minutes=response,
            created_at=_ago(age),
        )
        db.add(c)
        db.add(
            CrisisEvent(
                crisis_id=id,
                at=_ago(age),
                actor="Demo seed",
                text="Training incident created. Fictional scenario, not a live alert.",
            )
        )
        return c

    crisis(
        "C-MUM",
        "Mumbai monsoon flooding",
        "Mumbai",
        "Maharashtra",
        19.076,
        72.8777,
        "Flood",
        5,
        "escalating",
        240,
        16,
        35,
    )
    crisis("C-DEL", "Delhi hospital surge", "New Delhi", "Delhi", 28.6139, 77.209, "Medical", 4, "active", 85, 21, 100)
    crisis("C-ASM", "Assam river evacuation", "Guwahati", "Assam", 26.1445, 91.7362, "Flood", 5, "active", 360, 19, 170)
    crisis(
        "C-WAY",
        "Wayanad slope instability",
        "Wayanad",
        "Kerala",
        11.605,
        76.083,
        "Landslide",
        4,
        "active",
        125,
        28,
        220,
    )
    crisis(
        "C-CHE",
        "Chennai coastal preparedness",
        "Chennai",
        "Tamil Nadu",
        13.0827,
        80.2707,
        "Storm",
        2,
        "active",
        180,
        24,
        310,
    )
    crisis(
        "C-PUN",
        "Pune warehouse fire drill",
        "Pune",
        "Maharashtra",
        18.5204,
        73.8567,
        "Fire",
        4,
        "resolved",
        45,
        12,
        4200,
    )
    crisis(
        "C-DEH",
        "Dehradun evacuation drill",
        "Dehradun",
        "Uttarakhand",
        30.3165,
        78.0322,
        "Landslide",
        3,
        "resolved",
        70,
        17,
        14400,
    )
    db.add(
        CrisisEvent(
            crisis_id="C-MUM",
            at=_ago(12),
            actor="Arjun Nair",
            text="Status escalated after an illustrative access update.",
        )
    )
    db.add(CrisisEvent(crisis_id="C-PUN", at=_ago(3900), actor="Aditi Rao", text="Training incident resolved."))
    db.add(CrisisEvent(crisis_id="C-DEH", at=_ago(14000), actor="Aditi Rao", text="Training incident resolved."))

    def resource(id, name, type, total, unit, org, capability, cost, allocations=(), maintenance=False):
        db.add(
            Resource(
                id=id,
                name=name,
                type=type,
                total=total,
                unit=unit,
                organization=org,
                capability=capability,
                cost=cost,
                maintenance=maintenance,
            )
        )
        db.flush()
        for crisis_id, qty in allocations:
            db.add(Allocation(resource_id=id, crisis_id=crisis_id, quantity=qty, at=_ago(20), actor="Demo seed"))
        db.add(
            ResourceEvent(
                resource_id=id,
                kind="history",
                at=_ago(90),
                actor="Demo seed",
                text="Inventory and capability profile verified in the training dataset.",
            )
        )
        if maintenance:
            db.add(
                ResourceEvent(
                    resource_id=id,
                    kind="maintenance",
                    at=_ago(60),
                    actor="Meera Iyer",
                    text="Scheduled inspection. Pool temporarily unavailable.",
                )
            )
        else:
            db.add(
                ResourceEvent(
                    resource_id=id,
                    kind="maintenance",
                    at=_ago(2880),
                    actor="Meera Iyer",
                    text="Training readiness check completed.",
                )
            )

    resource(
        "R-TEAM",
        "Swiftwater rescue teams",
        "Personnel",
        4,
        "teams",
        "Western Response Collective",
        "Water rescue; 6 trained responders per team; 45-minute mobilization",
        18000,
        [("C-MUM", 1)],
    )
    resource(
        "R-BOAT",
        "Inflatable rescue boats",
        "Equipment",
        6,
        "boats",
        "Eastern Relief Network",
        "8-person capacity; outboard motor; shallow-water access",
        6000,
        [("C-ASM", 2)],
    )
    resource(
        "R-OXY",
        "Medical oxygen reserve",
        "Supplies",
        24,
        "cylinders",
        "Regional Trauma Consortium",
        "Approved handling required; illustrative 47-litre reserve units",
        1800,
        [("C-DEL", 8), ("C-WAY", 6)],
    )
    resource(
        "R-AMB",
        "ALS ambulance pool",
        "Equipment",
        8,
        "vehicles",
        "Regional Trauma Consortium",
        "Advanced life support capability; staffed units in sample pool",
        12000,
        [("C-MUM", 2), ("C-DEL", 2)],
    )
    resource(
        "R-KIT",
        "Family relief kits",
        "Supplies",
        1200,
        "kits",
        "Eastern Relief Network",
        "Water containers, hygiene supplies, and temporary shelter materials",
        850,
        [("C-ASM", 200)],
    )
    resource(
        "R-MED",
        "Trauma response teams",
        "Personnel",
        5,
        "teams",
        "Regional Trauma Consortium",
        "4-person clinical response team; credentials illustrative only",
        22000,
        [("C-DEL", 1)],
    )
    resource(
        "R-CAMP",
        "District relief-camp capacity",
        "Facilities",
        320,
        "places",
        "Southern Response Collective",
        "Sheltered accommodation; water and sanitation availability",
        450,
        [("C-ASM", 100)],
    )
    resource(
        "R-GEN",
        "Portable generator pool",
        "Equipment",
        4,
        "units",
        "Southern Response Collective",
        "20 kVA; weather-protected; operator required",
        4500,
        [],
        True,
    )
    resource(
        "R-VENT",
        "Ventilator reserve",
        "Equipment",
        10,
        "units",
        "Regional Trauma Consortium",
        "Illustrative transport-compatible units; clinical approval required",
        5500,
    )
    resource(
        "R-COMM",
        "Emergency communication kits",
        "Equipment",
        6,
        "kits",
        "Western Response Collective",
        "Portable radio, battery reserve, and antenna package",
        2500,
        [("C-ASM", 1)],
    )

    for n, (res, cri, qty) in enumerate(
        [
            ("R-TEAM", "C-MUM", 3),
            ("R-TEAM", "C-ASM", 2),
            ("R-BOAT", "C-ASM", 4),
            ("R-BOAT", "C-MUM", 3),
            ("R-VENT", "C-DEL", 6),
            ("R-VENT", "C-WAY", 5),
            ("R-VENT", "C-ASM", 4),
            ("R-OXY", "C-DEL", 12),
            ("R-OXY", "C-WAY", 10),
        ],
        start=1,
    ):
        db.add(Demand(id=f"Q{n}", resource_id=res, crisis_id=cri, quantity=qty, created_at=_ago(60 - n)))

    db.add_all(
        [
            Message(
                id="M1",
                channel="network",
                author="Arjun Nair",
                at=_ago(30),
                text="Training update: all regions are visible in the shared picture. Please add resource gaps to the relevant incident thread.",
            ),
            Message(
                id="M2",
                channel="C-MUM",
                author="Meera Iyer",
                at=_ago(18),
                text="One swiftwater team is assigned. Three more teams have been requested in this fictional scenario.",
            ),
            Message(
                id="M3",
                channel="decisions",
                author="Aditi Rao",
                at=_ago(15),
                text="Clinical allocations need authorized approval. Keep the rationale with any override.",
            ),
            Notification(
                id="N1",
                text="Four resource pools have competing requests in the training dataset.",
                at=_ago(5),
                channel="In-app",
            ),
            AuditLog(
                at=_ago(35),
                actor="Demo seed",
                action="Workspace initialized",
                detail="Fictional India response dataset loaded. No agency affiliation.",
            ),
        ]
    )
    db.flush()

    # Help-request desk (same shared inventory as the workspace)
    def help_request(seq, name, address, phone, brief, adults, children, status, age, resource_id, crisis_id, history):
        req = HelpRequest(
            seq=seq,
            name=name,
            address=address,
            phone=phone,
            brief=brief,
            adults=adults,
            children=children,
            status=status,
            created_at=_ago(age),
            resource_id=resource_id,
            crisis_id=crisis_id,
        )
        db.add(req)
        db.flush()
        for minutes, label in history:
            db.add(HelpRequestEvent(request_id=req.id, at=_ago(minutes), label=label, actor=""))
        if resource_id and status in ("assigned", "enroute"):
            db.add(
                Allocation(
                    resource_id=resource_id, help_request_id=req.id, quantity=1, at=_ago(age - 18), actor="Demo seed"
                )
            )

    help_request(
        41,
        "S. Iyer",
        "12 Marine Drive, Kochi",
        "+91 98470 11223",
        "Roof access needed, water rising fast around the house.",
        3,
        2,
        "enroute",
        160,
        "R-BOAT",
        None,
        [
            (160, "Request opened"),
            (150, "Verified by crisis manager"),
            (142, "Inflatable rescue boats assigned"),
            (131, "Dispatch confirmed"),
        ],
    )
    help_request(
        42,
        "A. Rahman",
        "Old City, Hyderabad",
        "+91 90000 44556",
        "Elderly patient needs an oxygen cylinder within the hour.",
        2,
        0,
        "assigned",
        74,
        "R-OXY",
        None,
        [(74, "Request opened"), (66, "Verified by crisis manager"), (58, "Medical oxygen reserve assigned")],
    )
    help_request(
        43,
        "P. Das",
        "Riverside colony, Guwahati",
        "+91 98640 77889",
        "Family stranded on the first floor, need evacuation and dry rations.",
        4,
        3,
        "verified",
        22,
        None,
        "C-ASM",
        [(22, "Request opened"), (14, "Verified by crisis manager")],
    )
    db.flush()


def seed_all(db: Session, settings: Settings) -> None:
    """Idempotent startup seeding."""
    if db.get(Meta, "revision") is None:
        db.add(Meta(key="revision", value=1))
    bootstrap_admin(db, settings)
    if settings.seed_demo_data:
        seed_users(db, settings)
        if not db.scalar(select(func.count(Crisis.id))) and not db.scalar(select(func.count(Resource.id))):
            seed_workspace(db)
    db.commit()


def reset_demo(db: Session) -> None:
    """Wipe operational data (never accounts) and reload the training dataset."""
    for model in (
        NotificationRead,
        OutboxMessage,
        Simulation,
        Negotiation,
        Decision,
        Attachment,
        Message,
        Notification,
        Demand,
        Allocation,
        HelpRequestEvent,
        HelpRequest,
        ResourceEvent,
        Resource,
        CrisisEvent,
        Crisis,
        AuditLog,
    ):
        db.execute(delete(model))
    db.flush()
    seed_workspace(db)
