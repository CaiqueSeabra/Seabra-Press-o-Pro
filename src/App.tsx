import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { MeasurementForm } from './components/MeasurementForm';
import { HistoryList } from './components/HistoryList';
import { DashboardChart } from './components/DashboardChart';
import { InstallPWA } from './components/InstallPWA';
import { ReportModal } from './components/ReportModal';
import { Measurement, Period } from './types';
import { db, auth } from './firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Activity, LogOut, FileDown, AlertTriangle, AlertOctagon, Share2, Eye, EyeOff, Plus, History, TrendingUp, Info } from 'lucide-react';

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
import { isToday } from 'date-fns';
import { analyzeRisk } from './lib/bloodPressure';
import { cn } from './lib/utils';

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

function Dashboard() {
  const { user, logout } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

  const riskAlert = analyzeRisk(measurements);

  const todaysMeasurements = measurements.filter(m => isToday(m.timestamp));
  const hasToday = todaysMeasurements.length > 0;
  const avgSysToday = hasToday ? Math.round(todaysMeasurements.reduce((acc, m) => acc + m.systolic, 0) / todaysMeasurements.length) : 0;
  const avgDiaToday = hasToday ? Math.round(todaysMeasurements.reduce((acc, m) => acc + m.diastolic, 0) / todaysMeasurements.length) : 0;
  
  const hasMeasurements = measurements.length > 0;
  const avgSysTotal = hasMeasurements ? Math.round(measurements.reduce((acc, m) => acc + m.systolic, 0) / measurements.length) : 0;
  const avgDiaTotal = hasMeasurements ? Math.round(measurements.reduce((acc, m) => acc + m.diastolic, 0) / measurements.length) : 0;
  
  const latestMeasurement = hasMeasurements ? measurements[0] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="icon.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/heart/200/200';
              }}
            />
          </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white leading-tight">Seabra Pressão Pro</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-500">Controle Inteligente da Pressão Arterial</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {measurements.length > 0 && (
              <>
                <button 
                  onClick={handleDownloadPDF}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
                  title="Baixar PDF"
                >
                  <FileDown className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSharePDF}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                  title="Compartilhar"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button 
              onClick={logout}
              className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {riskAlert && (
          <div className={cn(
            "rounded-2xl p-5 flex items-start gap-4 border transition-all",
            riskAlert.level === 'critical' && "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
            riskAlert.level === 'danger' && "bg-orange-500/10 border-orange-500/30",
            riskAlert.level === 'warning' && "bg-yellow-500/10 border-yellow-500/30"
          )}>
            <div className={cn(
              "p-2 rounded-xl shrink-0",
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
            <div>
              <h3 className={cn(
                "font-bold text-lg",
                riskAlert.level === 'critical' && "text-red-500",
                riskAlert.level === 'danger' && "text-orange-400",
                riskAlert.level === 'warning' && "text-yellow-400"
              )}>{riskAlert.title}</h3>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                {riskAlert.message}
              </p>
            </div>
          </div>
        )}

        {hasMeasurements && (
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 group hover:border-zinc-700 transition-all">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Última Medição</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tighter">{latestMeasurement?.systolic}</span>
                <span className="text-xl text-zinc-700 font-light">/</span>
                <span className="text-3xl font-bold text-white tracking-tighter">{latestMeasurement?.diastolic}</span>
                <span className="text-xs text-zinc-500 ml-1 font-medium">mmHg</span>
              </div>
            </div>
            <div className="glass-card p-5 group hover:border-zinc-700 transition-all">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Média Diária</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tighter">{avgSysToday || '--'}</span>
                <span className="text-xl text-zinc-700 font-light">/</span>
                <span className="text-3xl font-bold text-white tracking-tighter">{avgDiaToday || '--'}</span>
                <span className="text-xs text-zinc-500 ml-1 font-medium">mmHg</span>
              </div>
            </div>
            <div className="glass-card p-5 group hover:border-zinc-700 transition-all">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Média Geral</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tighter">{avgSysTotal}</span>
                <span className="text-xl text-zinc-700 font-light">/</span>
                <span className="text-3xl font-bold text-white tracking-tighter">{avgDiaTotal}</span>
                <span className="text-xs text-zinc-500 ml-1 font-medium">mmHg</span>
              </div>
            </div>
            <div className="glass-card p-5 group hover:border-zinc-700 transition-all">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Status Atual</h3>
              <div className="h-[44px] flex items-center">
                <span className={cn(
                  "text-lg font-bold tracking-tight",
                  riskAlert?.level === 'critical' ? 'text-red-500' :
                  riskAlert?.level === 'danger' ? 'text-orange-500' :
                  riskAlert?.level === 'warning' ? 'text-yellow-500' : 'text-green-500'
                )}>
                  {riskAlert ? riskAlert.title : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="glass-card p-6 bg-zinc-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Como medir corretamente?</h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Dicas para uma aferição precisa</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Fique sentado em silêncio por 5 minutos antes.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Mantenha o braço na altura do coração.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Pés apoiados no chão e costas encostadas.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Não fume ou tome café 30 min antes.</span>
            </div>
          </div>
        </div>

        <MeasurementForm onSubmit={handleAddMeasurement} loading={saving} />
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <DashboardChart measurements={measurements} />
            <HistoryList measurements={measurements} onDelete={handleDeleteMeasurement} />
          </div>
        )}

        <ReportModal 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
          measurements={measurements}
        />
      </main>
    </div>
  );
}

function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-6">
          <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(59,130,246,0.1)] rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
            <img 
              src="icon.png" 
              alt="Seabra Pressão Pro Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/heart/200/200';
              }}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">Seabra Pressão Pro</h1>
            <p className="text-zinc-500 font-medium tracking-wide">
              Controle Inteligente da Pressão Arterial
            </p>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {resetMessage}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Senha</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  required
                  minLength={6}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-4"
            >
              {loading ? 'Processando...' : (isRegistering ? 'Criar Minha Conta' : 'Entrar no Aplicativo')}
            </button>
          </form>

          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setResetMessage('');
            }}
            className="w-full text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors text-center"
          >
            {isRegistering ? 'Já tem uma conta? Login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {user ? <Dashboard /> : <LoginScreen />}
      <InstallPWA />
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
