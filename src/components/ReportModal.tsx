import React, { useState } from 'react';
import { X, FileText, User, Building2, Stethoscope, Calendar, Loader2, Share2 } from 'lucide-react';
import { Measurement } from '../types';
import { generateProfessionalPDF, shareProfessionalPDF } from '../lib/pdf';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  measurements: Measurement[];
}

export function ReportModal({ isOpen, onClose, measurements }: Props) {
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      generateProfessionalPDF({
        patientName,
        patientAge,
        doctorName,
        hospitalName,
        measurements
      });
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareProfessionalPDF({
        patientName,
        patientAge,
        doctorName,
        hospitalName,
        measurements
      });
      onClose();
    } catch (error) {
      console.error('Error sharing PDF:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Gerar Relatório</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Preencha os dados para o médico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                <User className="w-3 h-3" />
                Nome do Paciente
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Idade
              </label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Ex: 45"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                <Stethoscope className="w-3 h-3" />
                Nome do Médico
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ex: Dr. Ricardo Oliveira"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Hospital / Clínica
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Ex: Hospital Central"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-zinc-800"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isSharing || !patientName}
              className="flex-1 btn-secondary py-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Baixar</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isGenerating || isSharing || !patientName}
              className="flex-1 btn-primary py-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>Compartilhar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
