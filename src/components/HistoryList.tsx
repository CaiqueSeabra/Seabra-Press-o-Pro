import React, { useState } from 'react';
import { Measurement } from '../types';
import { classifyBloodPressure } from '../lib/bloodPressure';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sun, Sunset, Moon, Activity, Trash2, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  measurements: Measurement[];
  onDelete: (id: string) => void;
}

const PeriodIcon = ({ period }: { period: string }) => {
  switch (period) {
    case 'morning': return <Sun className="w-4 h-4 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" />;
    case 'afternoon': return <Sunset className="w-4 h-4 text-orange-400" />;
    case 'night': return <Moon className="w-4 h-4 text-indigo-400" />;
    default: return null;
  }
};

const PeriodLabel = ({ period }: { period: string }) => {
  switch (period) {
    case 'morning': return 'Manhã';
    case 'afternoon': return 'Tarde';
    case 'night': return 'Noite';
    default: return period;
  }
};

export function HistoryList({ measurements, onDelete }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (measurements.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800">
        <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-400">Nenhuma medição registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100 px-2">Histórico</h2>
      <div className="space-y-3">
        {measurements.map((measurement) => {
          const classification = classifyBloodPressure(measurement.systolic, measurement.diastolic);
          
          return (
            <div 
              key={measurement.id} 
              className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <PeriodIcon period={measurement.period} />
                  <span className="font-medium"><PeriodLabel period={measurement.period} /></span>
                  <span>•</span>
                  <span>{format(measurement.timestamp, "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  {confirmDeleteId === measurement.id ? (
                    <div className="flex items-center gap-1 bg-red-500/10 rounded-lg p-1 border border-red-500/20">
                      <span className="text-xs text-red-400 font-medium px-2">Excluir?</span>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (measurement.id) onDelete(measurement.id);
                          setConfirmDeleteId(null);
                        }}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => measurement.id && setConfirmDeleteId(measurement.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-100">{measurement.systolic}</span>
                  <span className="text-xl text-zinc-500 font-light">/</span>
                  <span className="text-3xl font-bold text-zinc-100">{measurement.diastolic}</span>
                  <span className="text-sm text-zinc-500 ml-1">mmHg</span>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-zinc-400 justify-end mb-1">
                    <span className="text-lg font-semibold text-zinc-200">{measurement.pulse}</span>
                    <span className="text-xs">bpm</span>
                  </div>
                </div>
              </div>
              
              <div className={cn("mt-1 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium w-fit", classification.bgColor, classification.color)}>
                {classification.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
