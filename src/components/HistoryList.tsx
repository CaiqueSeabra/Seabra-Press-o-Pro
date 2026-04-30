import React, { useState } from 'react';
import { Measurement } from '../types';
import { classifyBloodPressure } from '../lib/bloodPressure';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sun, Sunset, Moon, Activity, Trash2, X, Check, ChevronDown, History } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  measurements: Measurement[];
  onDelete: (id: string) => void;
}

const PeriodIcon = ({ period }: { period: string }) => {
  switch (period) {
    case 'morning': return <Sun className="w-4 h-4 text-white" />;
    case 'afternoon': return <Sunset className="w-4 h-4 text-yellow-500" />;
    case 'night': return <Moon className="w-4 h-4 text-cyan-400" />;
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
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
    // Expand the most recent month by default
    if (measurements.length > 0) {
      const mostRecentMonth = format(measurements[0].timestamp, 'MMMM yyyy', { locale: ptBR });
      return { [mostRecentMonth]: true };
    }
    return {};
  });

  if (measurements.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
          <Activity className="w-8 h-8 text-zinc-700" />
        </div>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Nenhuma medição registrada ainda.</p>
      </div>
    );
  }

  // Group measurements by month and year
  const groupedMeasurements = measurements.reduce((acc, measurement) => {
    const monthYear = format(measurement.timestamp, 'MMMM yyyy', { locale: ptBR });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(measurement);
    return acc;
  }, {} as Record<string, Measurement[]>);

  const toggleMonth = (monthYear: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthYear]: !prev[monthYear]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="px-2 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Histórico</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Suas aferições organizadas por mês</p>
        </div>
        <History className="w-6 h-6 text-zinc-800" />
      </div>
      
      <div className="space-y-4">
        {Object.entries(groupedMeasurements).map(([monthYear, monthMeasurements]) => {
          const isExpanded = expandedMonths[monthYear];
          
          return (
            <div key={monthYear} className="space-y-3">
              {/* Month Header / Folder */}
              <button
                onClick={() => toggleMonth(monthYear)}
                className={cn(
                  "w-full glass-card p-4 flex items-center justify-between group transition-all active:scale-[0.99]",
                  isExpanded ? "border-zinc-700 bg-zinc-900/50" : "hover:border-zinc-800"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    isExpanded ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                  )}>
                    <History className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className={cn(
                      "font-black text-lg capitalize tracking-tight",
                      isExpanded ? "text-white" : "text-zinc-400"
                    )}>
                      {monthYear}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">
                      {monthMeasurements.length} {monthMeasurements.length === 1 ? 'MEDIÇÃO' : 'MEDIÇÕES'}
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-zinc-600 transition-transform duration-300",
                  isExpanded && "rotate-180 text-blue-500"
                )} />
              </button>

              {/* Month Content */}
              {isExpanded && (
                <div className="space-y-4 pl-4 border-l border-zinc-900 ml-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  {monthMeasurements.map((measurement) => {
                    const classification = classifyBloodPressure(measurement.systolic, measurement.diastolic);
                    
                    return (
                      <div 
                        key={measurement.id} 
                        className="glass-card p-5 flex flex-col gap-4 group hover:border-zinc-700 transition-all relative"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl",
                              measurement.period === 'morning' && "bg-zinc-800 text-white",
                              measurement.period === 'afternoon' && "bg-yellow-500/10 text-yellow-500",
                              measurement.period === 'night' && "bg-cyan-400/10 text-cyan-400"
                            )}>
                              <PeriodIcon period={measurement.period} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                  <PeriodLabel period={measurement.period} />
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                  {format(measurement.timestamp, "dd 'de' MMM., HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {confirmDeleteId === measurement.id ? (
                              <div className="flex items-center gap-1 bg-red-500/10 rounded-xl p-1 border border-red-500/20 animate-in fade-in zoom-in-95">
                                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest px-2">Excluir?</span>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (measurement.id) {
                                      onDelete(measurement.id);
                                    } else {
                                      alert("Erro: ID da medição não encontrado.");
                                    }
                                    setConfirmDeleteId(null);
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (measurement.id) setConfirmDeleteId(measurement.id);
                                }}
                                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                title="Excluir medição"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-end justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white tracking-tighter">{measurement.systolic}</span>
                            <span className="text-2xl text-zinc-800 font-light">/</span>
                            <span className="text-4xl font-black text-white tracking-tighter">{measurement.diastolic}</span>
                            <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest ml-2">mmHg</span>
                          </div>
                          
                          {measurement.pulse && (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Pulso</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xl font-black text-zinc-300 tracking-tight">{measurement.pulse}</span>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">bpm</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className={cn(
                          "mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit border",
                          classification.level === 'normal' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          classification.level === 'elevated' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                          classification.level === 'stage1' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                          classification.level === 'stage2' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-red-600 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        )}>
                          {classification.level === 'emergency' || classification.level === 'stage2' ? (
                            <Activity className="w-3 h-3 animate-[pulse_0.5s_ease-in-out_infinite]" />
                          ) : null}
                          <span>{classification.label} • {classification.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
