import React, { useState, useRef, useEffect } from 'react';
import { Period } from '../types';
import { Sun, Sunset, Moon, Activity, Heart, HeartPulse, Camera, Image, Loader2 } from 'lucide-react';
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

  // Automate period selection based on current time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setPeriod('morning');
    } else if (hour >= 12 && hour < 18) {
      setPeriod('afternoon');
    } else {
      setPeriod('night');
    }
  }, []);

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
    } catch (error: any) {
      console.error("Extraction error:", error);
      setErrorMsg(`Erro: ${error.message || "Não foi possível extrair os dados da imagem. Tente novamente."}`);
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
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">Nova Medição</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Registre seus dados manualmente ou por foto</p>
        </div>
        
        <div className="flex gap-3">
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 border border-zinc-700"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Câmera
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isScanning || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 border border-zinc-700"
          >
            <Image className="w-4 h-4" />
            Galeria
          </button>
        </div>
      </div>
      
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {errorMsg}
        </div>
      )}
      
      <div className="space-y-8">
        {/* Period Selection */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Período</label>
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setPeriod('morning')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95",
                period === 'morning' 
                  ? "bg-zinc-900 border-zinc-100 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              )}
            >
              <Sun className={cn("w-6 h-6 mb-2", period === 'morning' ? "text-white" : "text-zinc-600")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Manhã</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('afternoon')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95",
                period === 'afternoon' 
                  ? "bg-zinc-900 border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              )}
            >
              <Sunset className={cn("w-6 h-6 mb-2", period === 'afternoon' ? "text-yellow-500" : "text-zinc-600")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Tarde</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('night')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95",
                period === 'night' 
                  ? "bg-zinc-900 border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              )}
            >
              <Moon className={cn("w-6 h-6 mb-2", period === 'night' ? "text-cyan-400" : "text-zinc-600")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Noite</span>
            </button>
          </div>
        </div>

        {/* Measurements */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
              <Activity className="w-3 h-3 text-red-500" />
              Sistólica (SYS)
            </label>
            <div className="relative group">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="120"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-5 text-3xl font-black text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800"
                required
                min="50"
                max="250"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 font-bold uppercase tracking-widest">mmHg</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
              <Heart className="w-3 h-3 text-blue-500" />
              Diastólica (DIA)
            </label>
            <div className="relative group">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="80"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-5 text-3xl font-black text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800"
                required
                min="30"
                max="150"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 font-bold uppercase tracking-widest">mmHg</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
            <HeartPulse className="w-3 h-3 text-green-500" />
            Pulso
          </label>
          <div className="relative group">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="70 (Opcional)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-5 text-3xl font-black text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-zinc-800"
              min="30"
              max="200"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 font-bold uppercase tracking-widest">bpm</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isScanning}
          className="w-full btn-primary py-5 text-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Salvando...</span>
            </div>
          ) : 'Salvar Medição'}
        </button>
      </div>
    </form>
  );
}
