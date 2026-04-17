import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { MeasurementForm } from './components/MeasurementForm';
import { HistoryList } from './components/HistoryList';
import { DashboardChart } from './components/DashboardChart';
import { ReportModal } from './components/ReportModal';
import { LandingPage } from './components/LandingPage';
import { Measurement, Period } from './types';
import { db, auth } from './firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Activity, LogOut, FileDown, AlertTriangle, AlertOctagon, Share2, Eye, EyeOff, Plus, History, TrendingUp, Info, ArrowLeft } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { isToday, subDays, isAfter } from 'date-fns';
import { analyzeRisk } from './lib/bloodPressure';
import { cn } from './lib/utils';
import { Filter, Calendar, Sun, Sunset, Moon } from 'lucide-react';

class ErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null };

  constructor(props: {children: ReactNode}) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Ocorreu um erro inesperado.";
      try {
        const errData = JSON.parse(this.state.error?.message || "{}");
        if (errData.error) {
          displayMessage = `Erro de Banco de Dados: ${errData.error} (${errData.operationType})`;
        } else {
          displayMessage = this.state.error?.message || displayMessage;
        }
      } catch {
        displayMessage = this.state.error?.message || displayMessage;
      }

      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
          <p className="text-zinc-400 mb-6 max-w-md">{displayMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { motion, AnimatePresence } from 'motion/react';

function Dashboard() {
  const { user, logout } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'chart'>('dashboard');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const [rangeFilter, setRangeFilter] = useState<'all' | '7days' | '30days'>('all');
  
  // Native PWA Install Prompt Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const vibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'measurements'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Measurement[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        if (docData.timestamp) {
          data.push({
            id: doc.id,
            userId: docData.userId,
            period: docData.period,
            systolic: docData.systolic,
            diastolic: docData.diastolic,
            pulse: docData.pulse,
            timestamp: (docData.timestamp as Timestamp).toDate(),
          });
        }
      });
      setMeasurements(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/measurements`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddMeasurement = async (data: { period: Period; systolic: number; diastolic: number; pulse?: number }) => {
    if (!user) return;
    setSaving(true);
    try {
      const path = `users/${user.uid}/measurements`;
      await addDoc(collection(db, path), {
        userId: user.uid,
        ...data,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/measurements`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!user) return;
    try {
      const path = `users/${user.uid}/measurements/${id}`;
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/measurements/${id}`);
    }
  };

  const handleSharePDF = () => {
    setIsReportModalOpen(true);
  };

  const handleDownloadPDF = () => {
    setIsReportModalOpen(true);
  };

  const filteredMeasurements = measurements.filter(m => {
    // Range filter
    if (rangeFilter !== 'all') {
      const days = rangeFilter === '7days' ? 7 : 30;
      if (!isAfter(m.timestamp, subDays(new Date(), days))) return false;
    }
    // Period filter
    if (periodFilter !== 'all') {
      if (m.period !== periodFilter) return false;
    }
    return true;
  });

  const riskAlert = analyzeRisk(filteredMeasurements);

  const todaysMeasurements = measurements.filter(m => isToday(m.timestamp));
  const hasToday = todaysMeasurements.length > 0;
  const avgSysToday = hasToday ? Math.round(todaysMeasurements.reduce((acc, m) => acc + m.systolic, 0) / todaysMeasurements.length) : 0;
  const avgDiaToday = hasToday ? Math.round(todaysMeasurements.reduce((acc, m) => acc + m.diastolic, 0) / todaysMeasurements.length) : 0;
  
  const hasMeasurements = filteredMeasurements.length > 0;
  const avgSysTotal = hasMeasurements ? Math.round(filteredMeasurements.reduce((acc, m) => acc + m.systolic, 0) / filteredMeasurements.length) : 0;
  const avgDiaTotal = hasMeasurements ? Math.round(filteredMeasurements.reduce((acc, m) => acc + m.diastolic, 0) / filteredMeasurements.length) : 0;
  
  const latestMeasurement = hasMeasurements ? filteredMeasurements[0] : null;

  return (
    <div className="min-h-screen bg-black text-zinc-100 pb-32 bg-mesh">
      <header className="fixed top-0 inset-x-0 bg-transparent backdrop-blur-3xl z-40">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5"
            >
              <div className="w-5 h-5 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Activity className="w-3 h-3 text-blue-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-500/80">Premium Access</span>
            </motion.div>
            <h1 className="font-black text-xl tracking-tighter text-white">Seabra Pressão Pro</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { vibrate(); logout(); }}
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-24 space-y-8">
        {(activeTab === 'history' || activeTab === 'chart') && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <div className="flex bg-zinc-900 shadow-inner rounded-xl p-1 shrink-0">
                {[
                  { id: 'all', label: 'Todos', icon: Filter },
                  { id: 'morning', label: 'Manhã', icon: Sun },
                  { id: 'afternoon', label: 'Tarde', icon: Sunset },
                  { id: 'night', label: 'Noite', icon: Moon }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { vibrate(5); setPeriodFilter(p.id as any); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all",
                      periodFilter === p.id 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <p.icon className="w-3 h-3" />
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex bg-zinc-900 shadow-inner rounded-xl p-1 shrink-0">
                {[
                  { id: 'all', label: 'Tudo', icon: Calendar },
                  { id: '7days', label: '7 Dias', icon: Calendar },
                  { id: '30days', label: '30 Dias', icon: Calendar }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { vibrate(5); setRangeFilter(r.id as any); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all",
                      rangeFilter === r.id 
                        ? "bg-zinc-100 text-black shadow-lg" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              {isInstallable && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { vibrate(20); handleInstallClick(); }}
                  className="w-full relative overflow-hidden group rounded-[2.5rem] p-6 flex items-center justify-between bg-blue-600 shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] border border-blue-400/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-white text-lg tracking-tight">Instalar Aplicativo Pro</h3>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-blue-100 font-bold">Nativo • Offline • Executável</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Gloss Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>
              )}

              {riskAlert && (
                <motion.div 
                  key={`risk-alert-${riskAlert.level}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-[2.5rem] p-6 flex flex-col gap-4 border transition-all",
                    riskAlert.level === 'critical' && "bg-red-600/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]",
                    riskAlert.level === 'danger' && "bg-orange-600/10 border-orange-500/30",
                    riskAlert.level === 'warning' && "bg-yellow-600/10 border-yellow-500/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-2xl shrink-0",
                      riskAlert.level === 'critical' && "bg-red-500/20 text-red-500",
                      riskAlert.level === 'danger' && "bg-orange-500/20 text-orange-400",
                      riskAlert.level === 'warning' && "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {riskAlert.level === 'critical' ? (
                        <AlertOctagon className="w-6 h-6" />
                      ) : (
                        <AlertTriangle className="w-6 h-6" />
                      )}
                    </div>
                    <h3 className={cn(
                      "font-black text-lg tracking-tight",
                      riskAlert.level === 'critical' && "text-red-500",
                      riskAlert.level === 'danger' && "text-orange-400",
                      riskAlert.level === 'warning' && "text-yellow-400"
                    )}>{riskAlert.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    {riskAlert.message}
                  </p>
                </motion.div>
              )}

              {hasMeasurements ? (
                <div key="stats-grid" className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-6 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Última</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{latestMeasurement?.systolic}</span>
                      <span className="text-xl text-zinc-700 font-light">/</span>
                      <span className="text-3xl font-black text-white">{latestMeasurement?.diastolic}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-bold mt-1">mmHg</span>
                  </div>
                  <div className="glass-card p-6 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Média Hoje</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{avgSysToday || '--'}</span>
                      <span className="text-xl text-zinc-700 font-light">/</span>
                      <span className="text-3xl font-black text-white">{avgDiaToday || '--'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-bold mt-1">mmHg</span>
                  </div>
                  <div className="glass-card p-6 flex flex-col col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Média Geral</span>
                      <TrendingUp className="w-4 h-4 text-blue-500/50" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{avgSysTotal}</span>
                        <span className="text-2xl text-zinc-700 font-light">/</span>
                        <span className="text-4xl font-black text-white">{avgDiaTotal}</span>
                        <span className="text-sm text-zinc-500 ml-2 font-bold uppercase tracking-widest">mmHg</span>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        riskAlert?.level === 'critical' ? 'bg-red-500/10 text-red-400' :
                        riskAlert?.level === 'danger' ? 'bg-orange-500/10 text-orange-400' :
                        riskAlert?.level === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                      )}>
                        {riskAlert ? riskAlert.title : 'Ideal'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nenhuma Medição</h3>
                    <p className="text-zinc-500 text-sm mt-1">Comece adicionando sua primeira aferição abaixo.</p>
                  </div>
                </div>
              )}

              <div className="glass-card p-6 bg-zinc-900/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3">
                  <Info className="w-4 h-4 text-white/10" />
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-white">Dicas de Saúde</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500/60 font-black">Como aferir corretamente</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    "Repouse por 5 min antes da medição.",
                    "Pés no chão e costas apoiadas.",
                    "Braço relaxado na altura do coração.",
                    "Evite cafeína 30 min antes."
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                      <span className="text-sm text-zinc-400 font-medium">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <MeasurementForm 
                onSubmit={(data) => { vibrate(20); handleAddMeasurement(data); }} 
                loading={saving} 
              />
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div 
              key="chart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <DashboardChart measurements={filteredMeasurements} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white tracking-tight">Histórico</h3>
                <div className="flex gap-2">
                  <button onClick={() => { vibrate(); handleDownloadPDF(); }} className="p-3 bg-white/5 rounded-2xl text-zinc-400"><FileDown className="w-5 h-5" /></button>
                  <button onClick={() => { vibrate(); handleSharePDF(); }} className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Share2 className="w-5 h-5" /></button>
                </div>
              </div>
              <HistoryList measurements={filteredMeasurements} onDelete={(id) => { vibrate([10, 5, 10]); handleDeleteMeasurement(id); }} />
            </motion.div>
          )}
        </AnimatePresence>

        <ReportModal 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
          measurements={measurements}
        />
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 glass-panel pb-safe z-40">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-around">
          {[
            { id: 'dashboard', icon: Activity, label: 'Hoje' },
            { id: 'chart', icon: TrendingUp, label: 'Gráfico' },
            { id: 'history', icon: History, label: 'Logs' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { vibrate(5); setActiveTab(item.id as any); }}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300 px-6 py-2 rounded-2xl",
                activeTab === item.id ? "text-blue-500" : "text-zinc-500"
              )}
            >
              <item.icon className={cn("w-6 h-6", activeTab === item.id && "drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]")} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function LoginScreen({ onBack }: { onBack: () => void }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/icon.png');

  const vibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  const handleLogoError = () => {
    if (logoUrl !== "https://i.postimg.cc/9MZYCDPN/Seabra.jpg") {
      setLogoUrl("https://i.postimg.cc/9MZYCDPN/Seabra.jpg");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    vibrate(20);
    setError('');
    setResetMessage('');
    setLoading(true);
    try {
      if (isRegistering) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O formato do email é inválido.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Login por email e senha não está habilitado no Firebase.');
      } else {
        setError(`Erro: ${err.message || 'Ocorreu um erro ao fazer login.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    vibrate(10);
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError('O popup foi bloqueado pelo navegador. Por favor, habilite popups para este site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado antes de ser concluído.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore this one as it usually means another popup was opened
      } else {
        setError(`Erro ao entrar com Google: ${err.message || 'Tente novamente.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    vibrate(5);
    if (!email) {
      setError('Digite seu email no campo acima para redefinir a senha.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setResetMessage('');
      await resetPassword(email);
      setResetMessage('Email de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Este email não está cadastrado.');
      } else {
        setError('Erro ao enviar email. Verifique se o email está correto.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 bg-mesh overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-12 z-10"
      >
        <button 
          onClick={() => { vibrate(5); onBack(); }}
          className="absolute top-8 left-8 p-3 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center space-y-8">
          <div className="relative inline-block">
            {/* Background Glow */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.4, scale: 1.2 }}
              transition={{ delay: 0.2, duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 bg-blue-600/30 blur-[60px] rounded-full"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.7, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 20,
                delay: 0.3 
              }}
              className="relative w-48 h-48 rounded-[3.5rem] bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden group"
            >
              <img 
                src={logoUrl} 
                alt="Logo Seabra Pressão Pro" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                onError={handleLogoError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.div>
          </div>
          
          <div className="space-y-3 relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 mb-1"
            >
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-500/50" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-500">Sistema Premium</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-500/50" />
            </motion.div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none drop-shadow-sm">Seabra Pressão Pro</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-[0.25em] text-[10px]">
              Controle Clínico Personalizado
            </p>
          </div>
        </div>

        <div className="glass-card p-8 space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}

          {resetMessage && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center"
            >
              {resetMessage}
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-blue-500/90 ml-1">Email Profissional</label>
              <input
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/5 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all font-medium placeholder:text-zinc-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-blue-500/90">Sua Senha</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] uppercase tracking-widest font-black text-blue-500"
                  >
                    Recuperar
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all font-medium placeholder:text-zinc-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => { vibrate(5); setShowPassword(!showPassword); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-zinc-400 p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Entrando...' : (isRegistering ? 'Criar Minha Conta' : 'Acessar Consultório')}
            </button>
          </form>

          <div className="flex flex-col gap-6 items-center">
            <div className="flex items-center gap-4 w-full">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400">ou continue com</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid grid-cols-1 w-full gap-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-white text-black font-black py-4 px-8 rounded-2xl active:scale-[0.97] transition-all shadow-xl shadow-white/5"
              >
                <Share2 className="w-5 h-5" />
                Google Account
              </button>
            </div>

            <button
              onClick={() => { vibrate(5); setIsRegistering(!isRegistering); }}
              className="text-[10px] uppercase tracking-[0.25em] font-black text-zinc-400 hover:text-white transition-colors py-2"
            >
              {isRegistering ? 'Já cliquei em login' : 'Quero me cadastrar'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <Dashboard />
      </>
    );
  }

  return (
    <>
      {showLogin ? (
        <LoginScreen onBack={() => setShowLogin(false)} />
      ) : (
        <LandingPage onGetStarted={() => setShowLogin(true)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
