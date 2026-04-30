import { ClassificationResult, Measurement } from '../types';

export function classifyBloodPressure(systolic: number, diastolic: number): ClassificationResult {
  // Crise hipertensiva / Estágio 3
  if (systolic >= 180 || diastolic >= 110) {
    return {
      label: 'Crise Hipertensiva',
      status: 'Emergência',
      color: 'text-red-600',
      bgColor: 'bg-red-600/20',
      level: 'emergency',
    };
  }

  // Alta (Estágio 2)
  if (systolic >= 160 || diastolic >= 100) {
    return {
      label: 'Alta (Estágio 2)',
      status: 'Moderada',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      level: 'stage2',
    };
  }

  // Alta (Estágio 1)
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'Alta (Estágio 1)',
      status: 'Hipertensão',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      level: 'stage1',
    };
  }

  // Pré-hipertensão
  if (systolic >= 120 || diastolic >= 80) {
    return {
      label: 'Pré-hipertensão',
      status: 'Alerta',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      level: 'elevated',
    };
  }

  // Muito Baixa
  if (systolic < 90 || diastolic < 60) {
    return {
      label: 'Muito Baixa',
      status: 'Hipotensão',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      level: 'low',
    };
  }

  // Baixa
  if ((systolic >= 90 && systolic <= 99) || (diastolic >= 60 && diastolic <= 69)) {
    return {
      label: 'Baixa',
      status: 'Atenção',
      color: 'text-teal-400',
      bgColor: 'bg-teal-400/10',
      level: 'low',
    };
  }

  // Normal
  return {
    label: 'Normal',
    status: 'Saudável',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    level: 'normal',
  };
}

export type AlertLevel = 'warning' | 'danger' | 'critical';

export interface RiskAlert {
  level: AlertLevel;
  title: string;
  message: string;
}

export function analyzeRisk(measurements: Measurement[]): RiskAlert | null {
  if (!measurements || measurements.length === 0) return null;

  // Assume measurements are sorted by timestamp desc (newest first)
  const latest = measurements[0];

  // 1. Crise Hipertensiva (Emergência)
  if (latest.systolic >= 180 || latest.diastolic >= 120) {
    return {
      level: 'critical',
      title: 'CRISE HIPERTENSIVA',
      message: 'Sua pressão está perigosamente alta. Procure atendimento médico de emergência imediatamente.'
    };
  }

  // 2. Hipotensão (Pressão muito baixa)
  if (latest.systolic < 90 || latest.diastolic < 60) {
    return {
      level: 'warning',
      title: 'Hipotensão (Pressão Baixa)',
      message: 'Sua pressão está muito baixa. Se sentir tontura, fraqueza ou desmaio, procure ajuda médica.'
    };
  }

  // 3. Padrão de Risco (Últimas 3 medições consistentemente altas)
  if (measurements.length >= 3) {
    const last3 = measurements.slice(0, 3);
    const highCount = last3.filter(m => m.systolic >= 140 || m.diastolic >= 90).length;
    if (highCount >= 2) {
      return {
        level: 'danger',
        title: 'Padrão de Risco Detectado',
        message: 'Suas últimas medições indicam pressão arterial consistentemente alta. Recomendamos agendar uma consulta médica.'
      };
    }
  }

  // 4. Hipertensão Sistólica Isolada
  if (latest.systolic >= 140 && latest.diastolic < 90) {
    return {
      level: 'warning',
      title: 'Hipertensão Sistólica Isolada',
      message: 'Apenas a pressão máxima está alta. Este é um padrão comum, mas que exige acompanhamento médico.'
    };
  }

  // 5. Pressão de Pulso Alargada (Diferença grande entre Sistólica e Diastólica)
  if ((latest.systolic - latest.diastolic) > 60) {
    return {
      level: 'warning',
      title: 'Pressão de Pulso Alargada',
      message: 'A diferença entre a pressão máxima e mínima está alta. Comente sobre isso na sua próxima consulta.'
    };
  }

  // 6. Anomalia no Pulso (Bradicardia ou Taquicardia)
  if (latest.pulse > 100 || latest.pulse < 50) {
    return {
      level: 'warning',
      title: 'Atenção ao Pulso',
      message: `Seu pulso está ${latest.pulse > 100 ? 'acelerado' : 'baixo'} (${latest.pulse} bpm). Fique em repouso e meça novamente em alguns minutos.`
    };
  }

  return null;
}
