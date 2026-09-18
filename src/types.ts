export type CVSSMetricKey = 'AV' | 'AC' | 'PR' | 'UI' | 'S' | 'C' | 'I' | 'A';

export interface CVSSOption {
  name: string;
  l: string;
  d: string;
}

export interface CVSSMetric {
  key: CVSSMetricKey;
  name: string;
  help: string;
  options: CVSSOption[];
}

export type CVSSSelections = Partial<Record<CVSSMetricKey, string>>;

export interface CVSSSeverityRating {
  name: 'None' | 'Low' | 'Medium' | 'High' | 'Critical' | '?';
  bottom: number | string;
  top: number | string;
  color: string;
}

export interface CVSSCalculationResult {
  score: number | null;
  scoreString: string;
  string: string;
  selections: Record<string, string>;
  ratingDetails: CVSSSeverityRating;
  isComplete: boolean;
}

export interface CVSSParseResult {
  ok: boolean;
  version?: string;
  selections?: Record<string, string>;
  error?: {
    title: string;
    message: string;
  };
}

export interface CVSSCalcProps {
  title?: string;
  vector?: string;
  readOnly?: boolean;
  isShowPopups?: boolean;
  onChange?: (output: CVSSCalculationResult) => void;
  className?: string;
}
