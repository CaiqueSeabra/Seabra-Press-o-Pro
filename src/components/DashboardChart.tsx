import React from 'react';
import { Measurement } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  measurements: Measurement[];
}

export function DashboardChart({ measurements }: Props) {
  if (measurements.length === 0) return null;

  const sortedMeasurements = [...measurements].reverse();
  
  const data = {
    labels: sortedMeasurements.map(m => format(m.timestamp, "dd/MM", { locale: ptBR })),
    datasets: [
      {
        label: 'Sistólica',
        data: sortedMeasurements.map(m => m.systolic),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        borderWidth: 4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ef4444',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Diastólica',
        data: sortedMeasurements.map(m => m.diastolic),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        borderWidth: 4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#09090b',
        titleColor: '#fff',
        titleFont: {
          family: 'Inter',
          weight: 'bold' as const,
          size: 12,
        },
        bodyColor: '#a1a1aa',
        bodyFont: {
          family: 'Inter',
          size: 12,
        },
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        cornerRadius: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#52525b',
          maxTicksLimit: 7,
          font: {
            family: 'JetBrains Mono',
            size: 10,
            weight: 'bold' as const,
          }
        },
      },
      y: {
        grid: {
          color: '#18181b',
          drawBorder: false,
        },
        ticks: {
          color: '#52525b',
          font: {
            family: 'JetBrains Mono',
            size: 10,
            weight: 'bold' as const,
          }
        },
      },
    },
  };

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Evolução</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Acompanhamento gráfico das suas aferições</p>
        </div>
        
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sistólica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Diastólica</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
