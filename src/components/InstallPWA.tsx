import React, { useEffect, useState } from 'react';
import { Download, Share, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA() {
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (navigator as any).standalone === true;

    setIsIos(ios);
    if (standalone) {
      setIsInstalled(true);
    } else {
      // Show after a short delay to not annoy immediately
      setTimeout(() => setIsVisible(true), 3000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptInstall(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstallClick = async () => {
    if (!promptInstall) return;
    await promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-4 right-4 z-50 pointer-events-none"
      >
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">Seabra Pressão Pro</h4>
              <p className="text-[10px] text-zinc-400 font-medium leading-tight">
                {isIos ? 'Toque no ícone de compartilhar e "Adicionar à Tela de Início"' : 'Acesse como um aplicativo real'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {promptInstall && (
                <button
                  onClick={onInstallClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  INSTALAR
                </button>
              )}
              <button 
                onClick={() => setIsVisible(false)}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
