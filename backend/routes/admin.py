from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from .. import analytics
    from .. import models
except ImportError:
    import analytics
    import models

HourlyProduction = analytics.HourlyProduction
ReportContext = analytics.ReportContext
ReportSnapshot = analytics.ReportSnapshot
analyze_shift = analytics.analyze_shift
build_intelligence_summary = analytics.build_intelligence_summary
generate_shift_insights = analytics.generate_shift_insights

router = APIRouter()


class ReportResponse(BaseModel):
    id: int
    date: str
    shift: str
    machine_no: str
    toy_code: str
    total_pieces: int
    target_pieces: int
    efficiency: float
    status: str
    submitted: bool
    reviewed: bool
    admin_remark: str | None
    analytics: dict


class ProductionLogResponse(BaseModel):
    time_slot: str
    pieces: int


class DetailedReport(BaseModel):
    id: int
    date: str
    shift: str
    machine_no: str
    toy_code: str
    total_pieces: int
    target_pieces: int
    efficiency: float
    status: str
    logs: List[ProductionLogResponse]
    insights: List[str]
    analytics: dict


class IntelligenceResponse(BaseModel):
    worst_performing_machine: dict | None
    average_efficiency: float
    best_performing_hour: dict | None
    most_inconsistent_machine: dict | None
    today_vs_yesterday: dict
    shift_trends: List[dict]
    machine_comparison: List[dict]
    shift_comparison: List[dict]
    daily_production: List[dict]
    weekly_trend: List[dict]
    monthly_trend: List[dict]
    top_machines: List[dict]
    forecast: dict
    kpis: dict
    decision_support: List[str]


class ReviewUpdate(BaseModel):
    reviewed: bool
    admin_remark: str | None = None


async def get_db():
    try:
        from ..main import async_session
    except ImportError:
        from main import async_session

    async with async_session() as session:
        yield session


@router.get("/reports", response_model=List[ReportResponse])
async def get_reports(db: AsyncSession = Depends(get_db)):
    query = select(models.ShiftReport).order_by(models.ShiftReport.efficiency.asc())
    result = await db.execute(query)
    reports = result.scalars().all()
    logs_by_report = await load_logs_by_report(db, reports)
    return [
        ReportResponse(
            id=report.id,
            date=str(report.date),
            shift=report.shift,
            machine_no=report.machine_no,
            toy_code=report.toy_code,
            total_pieces=report.total_pieces,
            target_pieces=report.target_pieces,
            efficiency=report.efficiency,
            status=report.status,
            submitted=bool(report.submitted),
            reviewed=bool(report.reviewed),
            admin_remark=report.admin_remark,
            analytics=analyze_shift(
                logs_by_report.get(report.id, []),
                ReportContext(
                    machine_no=report.machine_no,
                    target_pieces=report.target_pieces,
                    efficiency=report.efficiency,
                ),
            ),
        )
        for report in reports
    ]


@router.get("/intelligence", response_model=IntelligenceResponse)
async def get_intelligence(db: AsyncSession = Depends(get_db)):
    query = select(models.ShiftReport).order_by(models.ShiftReport.date.asc())
    result = await db.execute(query)
    reports = result.scalars().all()
    logs_by_report = await load_logs_by_report(db, reports)
    snapshots = [
        ReportSnapshot(
            id=report.id,
            date=report.date,
            shift=report.shift,
            machine_no=report.machine_no,
            toy_code=report.toy_code,
            total_pieces=report.total_pieces,
            target_pieces=report.target_pieces,
            efficiency=report.efficiency,
            logs=logs_by_report.get(report.id, []),
        )
        for report in reports
    ]
    return IntelligenceResponse(**build_intelligence_summary(snapshots))


@router.get("/report/{report_id}", response_model=DetailedReport)
async def get_report_detail(report_id: int, db: AsyncSession = Depends(get_db)):
    report_query = select(models.ShiftReport).where(models.ShiftReport.id == report_id)
    report_result = await db.execute(report_query)
    report = report_result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    logs_query = (
        select(models.ProductionLog)
        .where(
            models.ProductionLog.date == report.date,
            models.ProductionLog.shift == report.shift,
            models.ProductionLog.machine_no == report.machine_no,
            models.ProductionLog.toy_code == report.toy_code,
        )
        .order_by(models.ProductionLog.id.asc())
    )
    logs_result = await db.execute(logs_query)
    logs = logs_result.scalars().all()
    insight_logs = [
        HourlyProduction(time_slot=log.time_slot, pieces=int(log.pieces))
        for log in logs
    ]
    insights = generate_shift_insights(
        insight_logs,
        ReportContext(
            machine_no=report.machine_no,
            target_pieces=report.target_pieces,
            efficiency=report.efficiency,
        ),
    )

    return DetailedReport(
        id=report.id,
        date=str(report.date),
        shift=report.shift,
        machine_no=report.machine_no,
        toy_code=report.toy_code,
        total_pieces=report.total_pieces,
        target_pieces=report.target_pieces,
        efficiency=report.efficiency,
        status=report.status,
        logs=[
            ProductionLogResponse(time_slot=log.time_slot, pieces=log.pieces)
            for log in logs
        ],
        insights=insights,
        analytics=analyze_shift(
            insight_logs,
            ReportContext(
                machine_no=report.machine_no,
                target_pieces=report.target_pieces,
                efficiency=report.efficiency,
            ),
        ),
    )


@router.put("/report/{report_id}/review")
async def review_report(
    report_id: int,
    update_data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
):
    report_query = select(models.ShiftReport.id).where(models.ShiftReport.id == report_id)
    report_result = await db.execute(report_query)
    if report_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Report not found")

    query = (
        update(models.ShiftReport)
        .where(models.ShiftReport.id == report_id)
        .values(reviewed=update_data.reviewed, admin_remark=update_data.admin_remark)
    )
    await db.execute(query)
    await db.commit()
    return {"message": "Report updated"}


async def load_logs_by_report(db: AsyncSession, reports) -> dict[int, list[HourlyProduction]]:
    if not reports:
        return {}

    logs_query = select(models.ProductionLog).order_by(models.ProductionLog.id.asc())
    logs_result = await db.execute(logs_query)
    logs = logs_result.scalars().all()

    grouped_logs: dict[tuple, list[HourlyProduction]] = {}
    for log in logs:
        key = (log.date, log.shift, log.machine_no, log.toy_code)
        grouped_logs.setdefault(key, []).append(
            HourlyProduction(time_slot=log.time_slot, pieces=int(log.pieces))
        )

    return {
        report.id: grouped_logs.get(
            (report.date, report.shift, report.machine_no, report.toy_code),
            [],
        )
        for report in reports
    }
