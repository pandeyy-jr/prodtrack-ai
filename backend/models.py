from sqlalchemy import Boolean, Column, Date, Float, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ProductionLog(Base):
    __tablename__ = "production_logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    shift = Column(String, nullable=False)  # Morning, Afternoon, Night
    machine_no = Column(String, nullable=False)
    toy_code = Column(String, nullable=False)
    time_slot = Column(String, nullable=False)  # e.g., 8-9, 9-10
    pieces = Column(Integer, nullable=False)

class ShiftReport(Base):
    __tablename__ = "shift_reports"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    shift = Column(String, nullable=False)
    machine_no = Column(String, nullable=False)
    toy_code = Column(String, nullable=False)
    total_pieces = Column(Integer, nullable=False)
    target_pieces = Column(Integer, nullable=False)
    efficiency = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # Good, Warning, Poor
    submitted = Column(Boolean, default=False)
    reviewed = Column(Boolean, default=False)
    admin_remark = Column(String, nullable=True)

class Target(Base):
    __tablename__ = "targets"
    toy_code = Column(String, primary_key=True)
    target_per_hour = Column(Float, nullable=False)
    target_per_shift = Column(Float, nullable=False)


class MachineMaster(Base):
    __tablename__ = "machine_master"
    id = Column(Integer, primary_key=True, index=True)
    machine_no = Column(String, nullable=False, unique=True, index=True)
    product_code = Column(String, nullable=False)
    target_per_shift = Column(Integer, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
