export type Period = 'morning' | 'afternoon' | 'night';

export interface Measurement {
  id?: string;
  userId: string;
  period: Period;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: Date;
}

export type Classification = 'Normal' | 'Elevada' | 'Hipertensão 1' | 'Hipertensão 2';

export interface ClassificationResult {
  label: Classification;
  color: string;
  bgColor: string;
}
