import asyncio
import os
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from models import Base, MachineMaster, ProductionLog, ShiftReport, Target

BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = BACKEND_DIR / "prodtrack.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH.as_posix()}")

DEMO_REPORTS = [
    ("A", "Tony", "TY-104", 2500, [305, 318, 322, 310, 330, 325, 315, 320]),
    ("B", "Bolt", "TY-208", 2800, [340, 350, 345, 355, 330, 342, 348, 352]),
    ("A", "Stego", "TY-104", 2500, [300, 295, 280, 210, 275, 290, 305, 310]),
    ("C", "Cedric Front", "TY-208", 2800, [2675]),
]

MACHINE_SPECS = [
    {"machine_no": "Tony", "product_code": "TY-104", "target_per_shift": 2500, "active": True},
    {"machine_no": "Bolt", "product_code": "TY-208", "target_per_shift": 2800, "active": True},
    {"machine_no": "Stego", "product_code": "TY-104", "target_per_shift": 2500, "active": True},
    {"machine_no": "Demogorgon", "product_code": "TY-208", "target_per_shift": 2800, "active": True},
    {"machine_no": "Cedric Front", "product_code": "TY-104", "target_per_shift": 2550, "active": True},
    {"machine_no": "Cedric Rear", "product_code": "TY-208", "target_per_shift": 2850, "active": True},
    {"machine_no": "HP Upgrade Front", "product_code": "TY-104", "target_per_shift": 2600, "active": True},
    {"machine_no": "HP Upgrade Rear", "product_code": "TY-208", "target_per_shift": 2900, "active": True},
    {"machine_no": "Zoro", "product_code": "TY-104", "target_per_shift": 2450, "active": True},
    {"machine_no": "Alpha", "product_code": "TY-208", "target_per_shift": 2750, "active": True},
    {"machine_no": "Bravo", "product_code": "TY-104", "target_per_shift": 2520, "active": True},
    {"machine_no": "Delta", "product_code": "TY-208", "target_per_shift": 2820, "active": True},
    {"machine_no": "Omega", "product_code": "TY-104", "target_per_shift": 2580, "active": True},
    {"machine_no": "Nova", "product_code": "TY-208", "target_per_shift": 2880, "active": True},
    {"machine_no": "Orbit", "product_code": "TY-104", "target_per_shift": 2480, "active": True},
    {"machine_no": "Raptor", "product_code": "TY-208", "target_per_shift": 2920, "active": True},
    {"machine_no": "Vector", "product_code": "TY-104", "target_per_shift": 2560, "active": True},
    {"machine_no": "Helix", "product_code": "TY-208", "target_per_shift": 2840, "active": True},
    {"machine_no": "Echo", "product_code": "TY-104", "target_per_shift": 2540, "active": True},
    {"machine_no": "Fenix", "product_code": "TY-208", "target_per_shift": 2860, "active": True},
    {"machine_no": "Kestrel", "product_code": "TY-104", "target_per_shift": 2620, "active": True},
    {"machine_no": "Meridian", "product_code": "TY-208", "target_per_shift": 2780, "active": True},
    {"machine_no": "Nimbus", "product_code": "TY-104", "target_per_shift": 2490, "active": True},
    {"machine_no": "Atlas", "product_code": "TY-208", "target_per_shift": 2940, "active": True},
]

TIME_SLOTS = {
    "A": ["8-9", "9-10", "10-11", "11-12", "12-1", "1-2", "2-3", "3-4"],
    "B": ["4-5", "5-6", "6-7", "7-8", "8-9", "9-10", "10-11", "11-12"],
    "C": ["Shift Total"],
}


async def seed_demo() -> None:
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        for spec in MACHINE_SPECS:
            existing_machine = (
                await session.execute(
                    select(MachineMaster).where(MachineMaster.machine_no == spec["machine_no"])
                )
            ).scalar_one_or_none()
            if existing_machine is None:
                session.add(
                    MachineMaster(
                        machine_no=spec["machine_no"],
                        product_code=spec["product_code"],
                        target_per_shift=spec["target_per_shift"],
                        active=spec["active"],
                    )
                )

        for target in [
            Target(toy_code="TY-104", target_per_hour=312.5, target_per_shift=2500),
            Target(toy_code="TY-208", target_per_hour=350, target_per_shift=2800),
        ]:
            existing = await session.get(Target, target.toy_code)
            if existing is None:
                session.add(target)

        base_date = date.today() - timedelta(days=3)
        for index, (shift, machine, product, target, pieces) in enumerate(DEMO_REPORTS):
            report_date = base_date + timedelta(days=index % 3)
            existing_query = select(ShiftReport.id).where(
                ShiftReport.date == report_date,
                ShiftReport.shift == shift,
                ShiftReport.machine_no == machine,
                ShiftReport.toy_code == product,
            )
            if (await session.execute(existing_query)).scalar_one_or_none() is not None:
                continue

            total = sum(pieces)
            efficiency = round(total / target * 100, 2)
            status = "Good" if efficiency >= 100 else "Warning" if efficiency >= 80 else "Poor"
            session.add(
                ShiftReport(
                    date=report_date,
                    shift=shift,
                    machine_no=machine,
                    toy_code=product,
                    total_pieces=total,
                    target_pieces=target,
                    efficiency=efficiency,
                    status=status,
                    submitted=True,
                )
            )
            for time_slot, output in zip(TIME_SLOTS[shift], pieces):
                session.add(
                    ProductionLog(
                        date=report_date,
                        shift=shift,
                        machine_no=machine,
                        toy_code=product,
                        time_slot=time_slot,
                        pieces=output,
                    )
                )

        await session.commit()
    await engine.dispose()
    print("Demo production data is ready.")


if __name__ == "__main__":
    asyncio.run(seed_demo())
