from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


async def migrate_piece_count_schema(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        production_columns = await conn.execute(text("PRAGMA table_info(production_logs)"))
        production_column_names = {row[1] for row in production_columns.fetchall()}
        if "weight" in production_column_names and "pieces" not in production_column_names:
            await conn.execute(text("ALTER TABLE production_logs RENAME COLUMN weight TO pieces"))

        report_columns = await conn.execute(text("PRAGMA table_info(shift_reports)"))
        report_column_names = {row[1] for row in report_columns.fetchall()}
        if "total_output" in report_column_names and "total_pieces" not in report_column_names:
            await conn.execute(text("ALTER TABLE shift_reports RENAME COLUMN total_output TO total_pieces"))
        if "target_output" in report_column_names and "target_pieces" not in report_column_names:
            await conn.execute(text("ALTER TABLE shift_reports RENAME COLUMN target_output TO target_pieces"))
