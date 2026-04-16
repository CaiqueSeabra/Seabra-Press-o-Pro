import React, { useEffect, useState } from 'react';
import { Download, Share, X, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    if (isIos) {
      setShowIosPrompt(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setSupportsPWA(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstallClick = async () => {
    if (!promptInstall) return;
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      setSupportsPWA(false);
    }
  };

  if (isInstalled || isDismissed) return null;

  if (showIosPrompt) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 text-white p-5 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <button 
            onClick={() => setIsDismissed(true)}
            className="absolute top-3 right-3 text-zinc-500 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <PlusSquare className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Instalar no iPhone</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Toque no ícone de <Share className="w-3 h-3 inline mx-0.5" /> <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!supportsPWA) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 text-white p-5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm">Instalar App</span>
              <span className="text-xs text-zinc-400">Acesso rápido e offline</span>
            </div>
          </div>
          <button
            onClick={onInstallClick}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
