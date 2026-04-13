import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { MeasurementForm } from './components/MeasurementForm';
import { HistoryList } from './components/HistoryList';
import { DashboardChart } from './components/DashboardChart';
import { generatePDF, sharePDF } from './lib/pdfGenerator';
import { Measurement, Period } from './types';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Activity, LogOut, FileDown, AlertTriangle, AlertOctagon, Share2, Eye, EyeOff } from 'lucide-react';
import { isToday } from 'date-fns';
import { analyzeRisk } from './lib/bloodPressure';
import { cn } from './lib/utils';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
          <p className="text-zinc-400 mb-4">{this.state.error?.message || "Erro desconhecido"}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 px-6 py-2 rounded-lg font-bold"
          >
            Recarregar
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
      console.error("Error fetching measurements:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddMeasurement = async (data: { period: Period; systolic: number; diastolic: number; pulse?: number }) => {
    if (!user) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'measurements'), {
        userId: user.uid,
        ...data,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding measurement:", error);
      alert("Erro ao salvar medição. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'measurements', id));
    } catch (error) {
      console.error("Error deleting measurement:", error);
    }
  };

  const handleSharePDF = async () => {
    try {
      await sharePDF(measurements, user?.displayName || 'Paciente');
    } catch (error) {
      console.error("Error sharing PDF:", error);
      alert("Erro ao compartilhar PDF. Tente baixar o arquivo.");
    }
  };

  const handleDownloadPDF = () => {
    try {
      generatePDF(measurements, user?.displayName || 'Paciente');
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar PDF. Por favor, tente novamente.");
    }
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
    <div className="min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">Seabra Pressão Pro</h1>
              <p className="text-xs text-zinc-400">Controle Inteligente da Pressão Arterial</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {measurements.length > 0 && (
              <>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-sm font-medium"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Baixar PDF</span>
                </button>
                <button 
                  onClick={handleSharePDF}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </button>
              </>
            )}
            <button 
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {riskAlert && (
          <div className={cn(
            "rounded-2xl p-4 flex items-start gap-3 border transition-all",
            riskAlert.level === 'critical' && "bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse",
            riskAlert.level === 'danger' && "bg-orange-500/10 border-orange-500/30",
            riskAlert.level === 'warning' && "bg-yellow-500/10 border-yellow-500/30"
          )}>
            {riskAlert.level === 'critical' ? (
              <AlertOctagon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            ) : riskAlert.level === 'danger' ? (
              <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={cn(
                "font-semibold",
                riskAlert.level === 'critical' && "text-red-500",
                riskAlert.level === 'danger' && "text-orange-400",
                riskAlert.level === 'warning' && "text-yellow-400"
              )}>{riskAlert.title}</h3>
              <p className={cn(
                "text-sm mt-1",
                riskAlert.level === 'critical' && "text-red-400",
                riskAlert.level === 'danger' && "text-orange-400/80",
                riskAlert.level === 'warning' && "text-yellow-400/80"
              )}>
                {riskAlert.message}
              </p>
            </div>
          </div>
        )}

        {hasMeasurements && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-lg">
              <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">Última Medição</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-zinc-100">{latestMeasurement?.systolic}</span>
                <span className="text-sm text-zinc-500 font-light">/</span>
                <span className="text-xl font-bold text-zinc-100">{latestMeasurement?.diastolic}</span>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-lg">
              <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">Média Diária</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-zinc-100">{avgSysToday || '--'}</span>
                <span className="text-sm text-zinc-500 font-light">/</span>
                <span className="text-xl font-bold text-zinc-100">{avgDiaToday || '--'}</span>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-lg">
              <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">Média Geral</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-zinc-100">{avgSysTotal}</span>
                <span className="text-sm text-zinc-500 font-light">/</span>
                <span className="text-xl font-bold text-zinc-100">{avgDiaTotal}</span>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-lg">
              <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">Status Atual</h3>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-sm font-bold",
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

        <MeasurementForm onSubmit={handleAddMeasurement} loading={saving} />
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <DashboardChart measurements={measurements} />
            <HistoryList measurements={measurements} onDelete={handleDeleteMeasurement} />
          </>
        )}
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
      setResetMessage('Email de redefinição enviado! Verifique sua caixa de entrada (e a pasta de Spam).');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Este email não está cadastrado. Por favor, crie uma conta.');
      } else {
        setError('Erro ao enviar email. Verifique se o email está correto.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 border border-zinc-800 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
          <Activity className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Seabra Pressão Pro</h1>
        <p className="text-zinc-400 mb-8">
          Controle Inteligente da Pressão Arterial
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {resetMessage && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-sm">
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            required
            autoComplete="email"
          />
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                required
                minLength={6}
                autoComplete={isRegistering ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {!isRegistering && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-500 font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
            setResetMessage('');
          }}
          className="text-zinc-400 text-sm hover:text-white transition-colors mb-6"
        >
          {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
        </button>
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

  return user ? <Dashboard /> : <LoginScreen />;
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
