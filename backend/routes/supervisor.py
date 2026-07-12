from datetime import datetime
from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from .. import models
except ImportError:
    import models

router = APIRouter()


class ProductionEntry(BaseModel):
    time_slot: str = Field(..., min_length=1, max_length=20)
    pieces: int = Field(..., ge=0, le=1_000_000)


class ShiftSubmission(BaseModel):
    date: str
    shift: str = Field(..., min_length=1, max_length=30)
    machine_no: str = Field(..., min_length=1, max_length=50)
    toy_code: str = Field(..., min_length=1, max_length=50)
    target_pieces: int = Field(..., gt=0, le=1_000_000)
    entries: List[ProductionEntry] = Field(..., min_length=1, max_length=8)

    @field_validator("date")
    @classmethod
    def validate_date(cls, value: str) -> str:
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("Date must use YYYY-MM-DD format") from exc
        return value

    @model_validator(mode="after")
    def validate_shift_entries(self):
        normalized_shift = self.shift.strip().upper()
        expected_entries = 1 if normalized_shift in {"3", "C", "SHIFT 3"} else 8
        if len(self.entries) != expected_entries:
            label = "one direct total" if expected_entries == 1 else "eight hourly entries"
            raise ValueError(f"{normalized_shift} requires {label}")
        return self


class ShiftSubmissionResponse(BaseModel):
    message: str
    report_id: int
    total_pieces: int
    target_pieces: int
    efficiency: float
    status: Literal["Good", "Warning", "Poor"]


class BulkShiftSubmission(BaseModel):
    reports: List[ShiftSubmission] = Field(..., min_length=1, max_length=250)


class BulkShiftSubmissionResponse(BaseModel):
    message: str
    saved_count: int
    report_ids: List[int]


async def get_db():
    try:
        from ..main import async_session
    except ImportError:
        from main import async_session

    async with async_session() as session:
        yield session


@router.get("/targets")
async def get_targets(db: AsyncSession = Depends(get_db)):
    query = select(models.Target)
    result = await db.execute(query)
    targets = result.scalars().all()
    return [
        {
            "toy_code": target.toy_code,
            "target_per_hour": target.target_per_hour,
            "target_per_shift": target.target_per_shift,
        }
        for target in targets
    ]


@router.get("/machines")
async def get_machines(db: AsyncSession = Depends(get_db)):
    query = (
        select(models.MachineMaster)
        .where(models.MachineMaster.active.is_(True))
        .order_by(models.MachineMaster.machine_no.asc())
    )
    result = await db.execute(query)
    return [
        {
            "id": machine.id,
            "machine_no": machine.machine_no,
            "product_code": machine.product_code,
            "target_per_shift": machine.target_per_shift,
        }
        for machine in result.scalars().all()
    ]


@router.post("/submit-shift", response_model=ShiftSubmissionResponse)
async def submit_shift(data: ShiftSubmission, db: AsyncSession = Depends(get_db)):
    response = await save_shift(data, db)
    await db.commit()
    return response


@router.post("/submit-bulk", response_model=BulkShiftSubmissionResponse)
async def submit_bulk(data: BulkShiftSubmission, db: AsyncSession = Depends(get_db)):
    report_ids: list[int] = []
    try:
        for report in data.reports:
            response = await save_shift(report, db)
            report_ids.append(response.report_id)
        await db.commit()
    except HTTPException:
        await db.rollback()
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save uploaded reports") from exc

    return BulkShiftSubmissionResponse(
        message=f"{len(report_ids)} reports imported successfully",
        saved_count=len(report_ids),
        report_ids=report_ids,
    )


async def save_shift(data: ShiftSubmission, db: AsyncSession) -> ShiftSubmissionResponse:
    parsed_date = datetime.strptime(data.date, "%Y-%m-%d").date()
    normalized_shift = data.shift.strip().upper()
    normalized_machine = data.machine_no.strip()
    normalized_toy_code = data.toy_code.strip().upper()

    if not normalized_machine:
        raise HTTPException(status_code=422, detail="Machine number is required")
    if not normalized_toy_code:
        raise HTTPException(status_code=422, detail="Toy code is required")

    duplicate_query = select(models.ShiftReport.id).where(
        models.ShiftReport.date == parsed_date,
        models.ShiftReport.shift == normalized_shift,
        models.ShiftReport.machine_no == normalized_machine,
        models.ShiftReport.toy_code == normalized_toy_code,
    )
    duplicate_result = await db.execute(duplicate_query)
    if duplicate_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Duplicate report for {data.date}, shift {normalized_shift}, "
                f"machine {normalized_machine}, product {normalized_toy_code}"
            ),
        )

    total_pieces = sum(entry.pieces for entry in data.entries)
    efficiency = round((total_pieces / data.target_pieces) * 100, 2)
    status = "Good" if efficiency >= 100 else "Warning" if efficiency >= 80 else "Poor"

    shift_report = models.ShiftReport(
        date=parsed_date,
        shift=normalized_shift,
        machine_no=normalized_machine,
        toy_code=normalized_toy_code,
        total_pieces=total_pieces,
        target_pieces=data.target_pieces,
        efficiency=efficiency,
        status=status,
        submitted=True,
    )
    db.add(shift_report)

    for entry in data.entries:
        db.add(
            models.ProductionLog(
                date=parsed_date,
                shift=normalized_shift,
                machine_no=normalized_machine,
                toy_code=normalized_toy_code,
                time_slot=entry.time_slot.strip(),
                pieces=entry.pieces,
            )
        )

    await db.flush()

    return ShiftSubmissionResponse(
        message="Shift submitted successfully",
        report_id=shift_report.id,
        total_pieces=total_pieces,
        target_pieces=data.target_pieces,
        efficiency=efficiency,
        status=status,
    )
