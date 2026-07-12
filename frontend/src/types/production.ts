export type HourlyStatus = 'Good' | 'Warning' | 'Poor' | 'Pending';

export type ShiftKey = 'A' | 'B' | 'C';

export interface HourlyEntry {
  timeSlot: string;
  pieces: string;
}

export interface SupervisorShiftForm {
  date: string;
  shift: ShiftKey;
  machineNo: string;
  toyCode: string;
  targetPieces: string;
}

export interface HourlyResult {
  timeSlot: string;
  pieces: number | null;
  expectedPieces: number;
  percentage: number | null;
  status: HourlyStatus;
}

export interface ShiftMetrics {
  totalPieces: number;
  targetPieces: number;
  expectedPerHour: number;
  efficiency: number;
  status: HourlyStatus;
  filledHours: number;
  hourlyResults: HourlyResult[];
}

export interface ShiftSubmissionPayload {
  date: string;
  shift: string;
  machine_no: string;
  toy_code: string;
  target_pieces: number;
  entries: {
    time_slot: string;
    pieces: number;
  }[];
}

export interface ShiftSubmissionResponse {
  message: string;
  report_id: number;
  total_pieces: number;
  target_pieces: number;
  efficiency: number;
  status: Exclude<HourlyStatus, 'Pending'>;
}

export interface BulkShiftSubmissionResponse {
  message: string;
  saved_count: number;
  report_ids: number[];
}

export interface MachineMaster {
  id: number;
  machine_no: string;
  product_code: string;
  target_per_shift: number;
}

export interface ProductionMatrixRow {
  machineNo: string;
  productCode: string;
  targetPieces: number;
  values: string[];
}

export interface ImportedProductionRow {
  rowNumber: number;
  date: string;
  shift: ShiftKey;
  machineNo: string;
  toyCode: string;
  targetPieces: number;
  hours: number[];
  totalPieces: number;
  errors: string[];
  warnings: string[];
}

export interface ShiftReport {
  id: number;
  date: string;
  shift: string;
  machine_no: string;
  toy_code: string;
  total_pieces: number;
  target_pieces: number;
  efficiency: number;
  status: Exclude<HourlyStatus, 'Pending'>;
  submitted: boolean;
  reviewed: boolean;
  admin_remark: string | null;
  analytics: ShiftAnalytics;
}

export interface DetailedShiftReport extends ShiftReport {
  logs: {
    time_slot: string;
    pieces: number;
  }[];
  insights: string[];
}

export interface ShiftAnalytics {
  lowest_hour: string | null;
  best_hour: string | null;
  largest_drop: string | null;
  largest_drop_from: string | null;
  largest_drop_percent: number;
  variance: number;
  consistency_score: number;
  efficiency_classification: 'Excellent' | 'Good' | 'Poor';
  remark: string;
  sudden_drop: boolean;
}

export interface ProductionIntelligence {
  worst_performing_machine: {
    machine_no: string;
    efficiency: number;
    shift: string;
    date: string;
  } | null;
  average_efficiency: number;
  best_performing_hour: {
    time_slot: string;
    pieces: number;
  } | null;
  most_inconsistent_machine: {
    machine_no: string;
    variance: number;
  } | null;
  today_vs_yesterday: {
    today: number;
    yesterday: number;
    delta: number;
  };
  shift_trends: {
    label: string;
    date: string;
    shift: string;
    machine_no: string;
    efficiency: number;
    total_pieces: number;
  }[];
  machine_comparison: {
    machine_no: string;
    average_efficiency: number;
    total_pieces: number;
  }[];
  shift_comparison: PeriodSummary[];
  daily_production: PeriodSummary[];
  weekly_trend: PeriodSummary[];
  monthly_trend: PeriodSummary[];
  top_machines: {
    machine_no: string;
    average_efficiency: number;
    total_pieces: number;
  }[];
  forecast: {
    expected_next_shift: number;
    confidence: number;
    risk: string;
  };
  kpis: {
    total_production: number;
    target_achievement: number;
    productivity_index: number;
    oee_score: number;
    quality_rate: number;
  };
  decision_support: string[];
}

export interface PeriodSummary {
  label: string;
  total_pieces: number;
  target_pieces: number;
  efficiency: number;
}
