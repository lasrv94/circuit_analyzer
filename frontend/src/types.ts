export interface MeterPoint {
  id: string;
  label: string;
  circuit_name: string;
  type: 'main' | 'subcircuit';
  x: number; // Porcentaje 0 a 100 horizontal
  y: number; // Porcentaje 0 a 100 vertical
  radius: number; // Radio visual
  rating_amps?: number; // Amperios nominales o sugeridos
  confidence: number;
  legal_notes?: string;
  page: number;
}

export interface AnalysisResponse {
  page: number;
  points: MeterPoint[];
  summary: string;
  rules_applied: string[];
}

export type ToolMode = 'select' | 'add_meter' | 'pan';

export type DocType = 'pdf' | 'image';

export interface CodexStatusInfo {
  found: boolean;
  path: string | null;
  version: string | null;
  message: string;
}
