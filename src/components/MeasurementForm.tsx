import React, { useState, useRef } from 'react';
import { Period } from '../types';
import { Sun, Sunset, Moon, Activity, Heart, HeartPulse, ImagePlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { extractMeasurementFromImage } from '../lib/gemini';

interface Props {
  onSubmit: (data: { period: Period; systolic: number; diastolic: number; pulse?: number }) => void;
  loading?: boolean;
}

export function MeasurementForm({ onSubmit, loading }: Props) {
  const [period, setPeriod] = useState<Period>('morning');
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setErrorMsg(null);
    try {
      const data = await extractMeasurementFromImage(file);
      if (data.systolic) setSystolic(data.systolic.toString());
      if (data.diastolic) setDiastolic(data.diastolic.toString());
      if (data.pulse) setPulse(data.pulse.toString());
    } catch (error) {
      setErrorMsg("Não foi possível extrair os dados da imagem. Tente novamente ou preencha manualmente.");
    } finally {
      setIsScanning(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic || !diastolic) return;
    
    setErrorMsg(null);
    onSubmit({
      period,
      systolic: parseInt(systolic, 10),
      diastolic: parseInt(diastolic, 10),
      ...(pulse ? { pulse: parseInt(pulse, 10) } : {}),
    });
    
    setSystolic('');
    setDiastolic('');
    setPulse('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">Nova Medição</h2>
        
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={cameraInputRef}
            onChange={handleImageUpload}
          />
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={galleryInputRef}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isScanning || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isScanning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            {isScanning ? 'Analisando...' : 'Câmera'}
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isScanning || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Galeria
          </button>
        </div>
      </div>
      
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errorMsg}
        </div>
      )}
      
      <div className="space-y-6">
        {/* Period Selection */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-3">Período</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPeriod('morning')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95",
                period === 'morning' 
                  ? "bg-white/10 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              )}
            >
              <Sun className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">Manhã</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('afternoon')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95",
                period === 'afternoon' 
                  ? "bg-orange-500/20 border-orange-500 text-orange-400" 
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              )}
            >
              <Sunset className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">Tarde</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('night')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95",
                period === 'night' 
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" 
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              )}
            >
              <Moon className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">Noite</span>
            </button>
          </div>
        </div>

        {/* Measurements */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              Sistólica (SYS)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="120"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-2xl font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                required
                min="50"
                max="250"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">mmHg</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-blue-400" />
              Diastólica (DIA)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="80"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-2xl font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                required
                min="30"
                max="150"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">mmHg</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-green-400" />
            Pulso
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="70 (Opcional)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-2xl font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
              min="30"
              max="200"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">bpm</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Salvando...' : 'Salvar Medição'}
        </button>
      </div>
    </form>
  );
}
