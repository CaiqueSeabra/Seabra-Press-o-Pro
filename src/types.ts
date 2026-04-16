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

export type Classification = 
  | 'Hipotensão' 
  | 'Atenção' 
  | 'Saudável' 
  | 'Alerta' 
  | 'Hipertensão' 
  | 'Moderada' 
  | 'Grave' 
  | 'Emergência';

export interface ClassificationResult {
  label: string; // Display label (e.g., "Muito Baixa")
  status: Classification; // Status from the table (e.g., "Hipotensão (risco)")
  color: string;
  bgColor: string;
  level: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'emergency' | 'low';
}
