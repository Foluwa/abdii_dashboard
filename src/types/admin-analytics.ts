export interface CurriculumOpsMetricRow {
  day: string; // YYYY-MM-DD
  action: string;
  result: string;
  count: number;
}

export interface CurriculumOpsMetricsResponse {
  window_days: number;
  rows: CurriculumOpsMetricRow[];
}
