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
    labels: sortedMeasurements.map(m => format(m.timestamp, "dd/MM HH:mm", { locale: ptBR })),
    datasets: [
      {
        label: 'Sistólica',
        data: sortedMeasurements.map(m => m.systolic),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#18181b',
        pointBorderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Diastólica',
        data: sortedMeasurements.map(m => m.diastolic),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#18181b',
        pointBorderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
          maxTicksLimit: 6,
          font: {
            size: 10,
          }
        },
      },
      y: {
        grid: {
          color: '#3f3f46',
          drawBorder: false,
        },
        ticks: {
          color: '#a1a1aa',
          font: {
            size: 10,
          }
        },
      },
    },
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Evolução</h2>
      <div className="h-64 w-full">
        <Line options={options} data={data} />
      </div>
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-zinc-400">Sistólica</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-zinc-400">Diastólica</span>
        </div>
      </div>
    </div>
  );
}
