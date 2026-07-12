from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from statistics import pvariance
from typing import Any


@dataclass(frozen=True)
class HourlyProduction:
    time_slot: str
    pieces: int


@dataclass(frozen=True)
class ReportContext:
    machine_no: str
    target_pieces: int
    efficiency: float


@dataclass(frozen=True)
class ReportSnapshot:
    id: int
    date: date
    shift: str
    machine_no: str
    toy_code: str
    total_pieces: int
    target_pieces: int
    efficiency: float
    logs: list[HourlyProduction]


def calculate_consistency_score(pieces: list[int]) -> float:
    if not pieces:
        return 0

    mean_pieces = sum(pieces) / len(pieces)
    if mean_pieces <= 0:
        return 0

    variance = pvariance(pieces) if len(pieces) > 1 else 0
    coefficient = (variance ** 0.5) / mean_pieces
    return round(max(0, min(1, 1 - coefficient)), 2)


def calculate_variance(pieces: list[int]) -> float:
    return round(pvariance(pieces), 2) if len(pieces) > 1 else 0


def classify_efficiency(efficiency: float) -> str:
    if efficiency > 110:
        return "Excellent"
    if efficiency >= 90:
        return "Good"
    return "Poor"


def find_biggest_drop(logs: list[HourlyProduction]) -> dict[str, Any] | None:
    biggest_drop = None

    for index in range(1, len(logs)):
        previous = logs[index - 1].pieces
        current = logs[index].pieces
        if previous <= 0:
            continue

        drop_percent = ((previous - current) / previous) * 100
        if drop_percent > 0 and (
            biggest_drop is None or drop_percent > biggest_drop["drop_percent"]
        ):
            biggest_drop = {
                "from_hour": logs[index - 1].time_slot,
                "to_hour": logs[index].time_slot,
                "largest_drop": logs[index].time_slot,
                "drop_percent": round(drop_percent, 1),
            }

    return biggest_drop


def analyze_shift(logs: list[HourlyProduction], report: ReportContext) -> dict[str, Any]:
    if not logs:
        return {
            "lowest_hour": None,
            "best_hour": None,
            "largest_drop": None,
            "largest_drop_from": None,
            "largest_drop_percent": 0,
            "variance": 0,
            "consistency_score": 0,
            "efficiency_classification": classify_efficiency(report.efficiency),
            "remark": "No hourly production entries were recorded.",
            "sudden_drop": False,
        }

    pieces = [log.pieces for log in logs]
    lowest = min(logs, key=lambda log: log.pieces)
    highest = max(logs, key=lambda log: log.pieces)
    biggest_drop = find_biggest_drop(logs)
    consistency_score = calculate_consistency_score(pieces)
    efficiency_classification = classify_efficiency(report.efficiency)

    if biggest_drop and biggest_drop["drop_percent"] >= 25:
        remark = f"Production unstable after {biggest_drop['from_hour']}."
    elif efficiency_classification == "Poor":
        remark = f"Machine {report.machine_no} needs attention; output is below 90% efficiency."
    elif consistency_score < 0.75:
        remark = f"Machine {report.machine_no} has inconsistent hourly production."
    else:
        remark = f"Machine {report.machine_no} is running within expected production range."

    return {
        "lowest_hour": lowest.time_slot,
        "best_hour": highest.time_slot,
        "largest_drop": biggest_drop["largest_drop"] if biggest_drop else None,
        "largest_drop_from": biggest_drop["from_hour"] if biggest_drop else None,
        "largest_drop_percent": biggest_drop["drop_percent"] if biggest_drop else 0,
        "variance": calculate_variance(pieces),
        "consistency_score": consistency_score,
        "efficiency_classification": efficiency_classification,
        "remark": remark,
        "sudden_drop": bool(biggest_drop and biggest_drop["drop_percent"] >= 25),
    }


def generate_shift_insights(
    logs: list[HourlyProduction],
    report: ReportContext,
) -> list[str]:
    analytics = analyze_shift(logs, report)
    if not logs:
        return [analytics["remark"]]

    insights = [
        f"Lowest performing hour was {analytics['lowest_hour']}.",
        f"Best performing hour was {analytics['best_hour']}.",
        f"Efficiency is classified as {analytics['efficiency_classification']}.",
        analytics["remark"],
    ]

    if analytics["largest_drop"]:
        insights.append(
            f"Production dropped by {analytics['largest_drop_percent']:.1f}% between "
            f"{analytics['largest_drop_from']} and {analytics['largest_drop']}."
        )

    insights.append(
        f"Consistency score is {analytics['consistency_score']:.2f} across the shift."
    )

    expected_per_hour = report.target_pieces / len(logs)
    for log in logs:
        if expected_per_hour > 0 and log.pieces < expected_per_hour * 0.6:
            insights.append(
                f"Anomaly detected: {log.time_slot} produced below 60% of expected output."
            )

    return insights


def build_intelligence_summary(reports: list[ReportSnapshot]) -> dict[str, Any]:
    if not reports:
        return {
            "worst_performing_machine": None,
            "average_efficiency": 0,
            "best_performing_hour": None,
            "most_inconsistent_machine": None,
            "today_vs_yesterday": {"today": 0, "yesterday": 0, "delta": 0},
            "shift_trends": [],
            "machine_comparison": [],
            "shift_comparison": [],
            "daily_production": [],
            "weekly_trend": [],
            "monthly_trend": [],
            "top_machines": [],
            "forecast": {"expected_next_shift": 0, "confidence": 0, "risk": "No data"},
            "kpis": {
                "total_production": 0,
                "target_achievement": 0,
                "productivity_index": 0,
                "oee_score": 0,
                "quality_rate": 100,
            },
            "decision_support": ["No production reports are available yet."],
        }

    report_analytics = {
        report.id: analyze_shift(
            report.logs,
            ReportContext(
                machine_no=report.machine_no,
                target_pieces=report.target_pieces,
                efficiency=report.efficiency,
            ),
        )
        for report in reports
    }

    worst = min(reports, key=lambda report: report.efficiency)
    average_efficiency = round(
        sum(report.efficiency for report in reports) / len(reports),
        1,
    )

    hourly_totals: dict[str, int] = defaultdict(int)
    for report in reports:
        for log in report.logs:
            hourly_totals[log.time_slot] += log.pieces
    best_hour = max(hourly_totals.items(), key=lambda item: item[1]) if hourly_totals else None

    machine_variance: dict[str, list[float]] = defaultdict(list)
    machine_efficiency: dict[str, list[float]] = defaultdict(list)
    machine_output: dict[str, int] = defaultdict(int)
    for report in reports:
        machine_variance[report.machine_no].append(report_analytics[report.id]["variance"])
        machine_efficiency[report.machine_no].append(report.efficiency)
        machine_output[report.machine_no] += report.total_pieces

    most_inconsistent = max(
        machine_variance.items(),
        key=lambda item: sum(item[1]) / len(item[1]),
    )

    latest_day = max(report.date for report in reports)
    previous_day = latest_day - timedelta(days=1)
    today_total = sum(report.total_pieces for report in reports if report.date == latest_day)
    yesterday_total = sum(
        report.total_pieces for report in reports if report.date == previous_day
    )

    shift_trends = [
        {
            "label": f"{report.date.isoformat()} / {report.shift} / {report.machine_no}",
            "date": report.date.isoformat(),
            "shift": report.shift,
            "machine_no": report.machine_no,
            "efficiency": round(report.efficiency, 1),
            "total_pieces": report.total_pieces,
        }
        for report in sorted(reports, key=lambda item: (item.date, item.shift, item.machine_no))
    ]

    machine_comparison = [
        {
            "machine_no": machine_no,
            "average_efficiency": round(sum(values) / len(values), 1),
            "total_pieces": machine_output[machine_no],
        }
        for machine_no, values in sorted(machine_efficiency.items())
    ]

    shift_groups: dict[str, list[ReportSnapshot]] = defaultdict(list)
    daily_groups: dict[date, list[ReportSnapshot]] = defaultdict(list)
    weekly_groups: dict[str, list[ReportSnapshot]] = defaultdict(list)
    monthly_groups: dict[str, list[ReportSnapshot]] = defaultdict(list)
    for report in reports:
        shift_groups[report.shift].append(report)
        daily_groups[report.date].append(report)
        iso_year, iso_week, _ = report.date.isocalendar()
        weekly_groups[f"{iso_year}-W{iso_week:02d}"].append(report)
        monthly_groups[report.date.strftime("%Y-%m")].append(report)

    def summarize_period(label: str, values: list[ReportSnapshot]) -> dict[str, Any]:
        total = sum(item.total_pieces for item in values)
        target = sum(item.target_pieces for item in values)
        return {
            "label": label,
            "total_pieces": total,
            "target_pieces": target,
            "efficiency": round((total / target) * 100, 1) if target else 0,
        }

    shift_comparison = [
        summarize_period(shift, values)
        for shift, values in sorted(shift_groups.items())
    ]
    daily_production = [
        summarize_period(day.isoformat(), values)
        for day, values in sorted(daily_groups.items())
    ]
    weekly_trend = [
        summarize_period(week, values)
        for week, values in sorted(weekly_groups.items())
    ]
    monthly_trend = [
        summarize_period(month, values)
        for month, values in sorted(monthly_groups.items())
    ]
    top_machines = sorted(
        machine_comparison,
        key=lambda item: item["average_efficiency"],
        reverse=True,
    )[:5]

    recent_reports = sorted(reports, key=lambda item: (item.date, item.id))[-5:]
    forecast_output = round(
        sum(report.total_pieces for report in recent_reports) / len(recent_reports)
    )
    recent_efficiencies = [report.efficiency for report in recent_reports]
    forecast_confidence = round(calculate_consistency_score([round(value) for value in recent_efficiencies]) * 100)
    forecast_risk = (
        "High"
        if sum(recent_efficiencies) / len(recent_efficiencies) < 80
        else "Medium"
        if sum(recent_efficiencies) / len(recent_efficiencies) < 95
        else "Low"
    )

    total_production = sum(report.total_pieces for report in reports)
    total_target = sum(report.target_pieces for report in reports)
    target_achievement = round((total_production / total_target) * 100, 1) if total_target else 0
    productivity_index = round(average_efficiency * (len(reports) / max(len(reports), 1)), 1)
    oee_score = round(min(100, average_efficiency) * 0.9, 1)

    stable_machine = max(
        machine_variance.items(),
        key=lambda item: 1 / ((sum(item[1]) / len(item[1])) + 1),
    )[0]

    decision_support = [
        f"Machine {worst.machine_no} is the weakest performer at {worst.efficiency:.1f}% efficiency.",
        f"Machine {most_inconsistent[0]} is the most inconsistent based on hourly variance.",
        f"Machine {stable_machine} is the most stable performer.",
    ]

    if best_hour:
        decision_support.append(
            f"The strongest production hour is {best_hour[0]} with {best_hour[1]} total pieces."
        )

    if len(daily_production) >= 2:
        previous = daily_production[-2]["total_pieces"]
        current = daily_production[-1]["total_pieces"]
        if previous:
            delta_percent = ((current - previous) / previous) * 100
            direction = "increased" if delta_percent >= 0 else "dropped"
            decision_support.append(
                f"Latest daily production {direction} by {abs(delta_percent):.1f}% versus the previous day."
            )

    for report in reports:
        analytics = report_analytics[report.id]
        if analytics["sudden_drop"]:
            decision_support.append(
                f"Machine {report.machine_no} drops sharply after {analytics['largest_drop_from']}."
            )

    return {
        "worst_performing_machine": {
            "machine_no": worst.machine_no,
            "efficiency": round(worst.efficiency, 1),
            "shift": worst.shift,
            "date": worst.date.isoformat(),
        },
        "average_efficiency": average_efficiency,
        "best_performing_hour": {
            "time_slot": best_hour[0],
            "pieces": best_hour[1],
        }
        if best_hour
        else None,
        "most_inconsistent_machine": {
            "machine_no": most_inconsistent[0],
            "variance": round(sum(most_inconsistent[1]) / len(most_inconsistent[1]), 2),
        },
        "today_vs_yesterday": {
            "today": today_total,
            "yesterday": yesterday_total,
            "delta": today_total - yesterday_total,
        },
        "shift_trends": shift_trends,
        "machine_comparison": machine_comparison,
        "shift_comparison": shift_comparison,
        "daily_production": daily_production,
        "weekly_trend": weekly_trend,
        "monthly_trend": monthly_trend,
        "top_machines": top_machines,
        "forecast": {
            "expected_next_shift": forecast_output,
            "confidence": forecast_confidence,
            "risk": forecast_risk,
        },
        "kpis": {
            "total_production": total_production,
            "target_achievement": target_achievement,
            "productivity_index": productivity_index,
            "oee_score": oee_score,
            "quality_rate": 100,
        },
        "decision_support": decision_support[:8],
    }
