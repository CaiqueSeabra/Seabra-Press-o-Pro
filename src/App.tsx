import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { MeasurementForm } from './components/MeasurementForm';
import { HistoryList } from './components/HistoryList';
import { DashboardChart } from './components/DashboardChart';
import { ReportModal } from './components/ReportModal';
import { LandingPage } from './components/LandingPage';
import { Measurement, Period } from './types';
import { supabase } from './supabaseClient';
import { Activity, LogOut, FileDown, AlertTriangle, AlertOctagon, Share2, Eye, EyeOff, Plus, History, TrendingUp, Info, ArrowLeft } from 'lucide-react';
import { isToday, subDays, isAfter } from 'date-fns';
import { analyzeRisk } from './lib/bloodPressure';
import { cn } from './lib/utils';
import { Filter, Calendar, Sun, Sunset, Moon } from 'lucide-react';

function Dashboard({ isInstallable, onInstall, isWebView }: { isInstallable: boolean, onInstall: () => void, isWebView: boolean }) {
  const { user, logout } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'chart'>('dashboard');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const [rangeFilter, setRangeFilter] = useState<'all' | '7days' | '30days'>('all');
  
  const vibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  useEffect(() => {
    if (!user) return;

    const fetchMeasurements = async () => {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('userId', user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        if (error.code === '42501' || error.message?.includes('403') || error.message?.includes('RLS') || error.message?.includes('violates row-level security')) {
          console.error("ERRO DE PERMISSÃO SUPABASE: Você precisa configurar as permissões (RLS) da tabela 'measurements' no seu banco de dados Supabase.");
          alert("Ocorreu um erro de permissão (403) no banco de dados. Por favor, acesse seu painel do Supabase, vá em 'SQL Editor' e rode o código que está no arquivo 'supabase-setup.sql' do projeto para habilitar as políticas de segurança (RLS).");
        }
        console.error("Supabase SELECT error:", error);
      } else if (data) {
        setMeasurements(data.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
        setLoading(false);
      }
    };

    fetchMeasurements();

    const subscription = supabase
      .channel('measurements_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'measurements', filter: `userId=eq.${user.id}` }, 
        () => {
          fetchMeasurements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleAddMeasurement = async (data: { period: Period; systolic: number; diastolic: number; pulse?: number }) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('measurements').insert({
        userId: user.id,
        ...data,
      });
      if (error) throw error;
    } catch (error: any) {
      if (error?.code === '42501' || error?.message?.includes('403') || error?.message?.includes('RLS')) {
        alert("Erro de Permissão (403) ao salvar! Você precisa rodar o script SQL 'supabase-setup.sql' no SQL Editor do Supabase.");
      }
      console.error("Supabase INSERT error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('measurements').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      if (error?.code === '42501' || error?.message?.includes('403') || error?.message?.includes('RLS')) {
        alert("Erro de Permissão (403) ao deletar! Você precisa rodar o script SQL 'supabase-setup.sql' no SQL Editor do Supabase.");
      }
      console.error("Supabase DELETE error:", error);
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-32">
      <header className="fixed top-0 inset-x-0 bg-zinc-900 border-b border-white/5 z-40">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Activity className="w-3 h-3 text-blue-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-500/80">Premium Access</span>
            </div>
            <h1 className="font-black text-xl tracking-tighter text-white">Seabra Pressão Pro</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {isInstallable && (
              <button 
                onClick={onInstall}
                className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse hover:animate-none active:scale-95 transition-all"
              >
                <Plus className="w-3 h-3" />
                Instalar
              </button>
            )}
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

        <div className="space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {riskAlert && (
                <div className={cn(
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
                </div>
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
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="space-y-6">
              <DashboardChart measurements={filteredMeasurements} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white tracking-tight">Histórico</h3>
                <div className="flex gap-2">
                  <button onClick={() => { vibrate(); handleDownloadPDF(); }} className="p-3 bg-white/5 rounded-2xl text-zinc-400"><FileDown className="w-5 h-5" /></button>
                  <button onClick={() => { vibrate(); handleSharePDF(); }} className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Share2 className="w-5 h-5" /></button>
                </div>
              </div>
              <HistoryList measurements={filteredMeasurements} onDelete={(id) => { vibrate([10, 5, 10]); handleDeleteMeasurement(id); }} />
            </div>
          )}
        </div>

        <ReportModal 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
          measurements={measurements}
        />
      </main>

      {/* Installation FAB */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 items-end z-30">
        {(isInstallable || isWebView) && (
          <button
            onClick={onInstall}
            className={cn(
              "p-4 rounded-full shadow-2xl flex items-center gap-2 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest",
              isWebView 
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-500 backdrop-blur-md"
                : "bg-blue-600/10 border border-blue-500/30 text-blue-500 backdrop-blur-md animate-pulse hover:animate-none"
            )}
          >
            {isWebView ? (
              <>
                <Info className="w-4 h-4" />
                <span>Instalar? (Abrir no Chrome)</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Instalar APP</span>
              </>
            )}
          </button>
        )}
      </div>

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

function LoginScreen({ onBack, isInstallable, onInstall, isWebView }: { onBack: () => void, isInstallable: boolean, onInstall: () => void, isWebView: boolean }) {
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
    
    const cleanEmail = email.trim();
    
    try {
      const authPromise = isRegistering 
        ? signUpWithEmail(cleanEmail, password)
        : signInWithEmail(cleanEmail, password);
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );

      await Promise.race([authPromise, timeoutPromise]);

      if (isRegistering) {
        setResetMessage('Sua conta foi criada! Verifique seu app se precisa confirmar o email, ou faça seu primeiro login.');
        setIsRegistering(false); // Volta para login para facilitar o fluxo
        setPassword('');
      } else {
        // SignIn bem-sucedido, AuthContext irá redirecionar
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let errorMsg = err.message || 'Ocorreu um erro ao fazer login/cadastro.';
      
      if (errorMsg === 'TIMEOUT') {
        errorMsg = 'O servidor demorou muito para responder. Verifique a internet e tente novamente.';
      } else if (errorMsg === 'Invalid login credentials') {
        errorMsg = 'Email/senha incorretos, ou e-mail ainda não confirmado. Verifique suas credenciais ou crie uma conta.';
      } else if (errorMsg === 'Email not confirmed') {
        errorMsg = 'Por favor, confirme seu email no link que enviamos.';
      } else if (errorMsg === 'User already registered' || errorMsg.includes('already registered')) {
        errorMsg = 'Este email já está cadastrado. Tente entrar em "Já tenho conta" ao invés de cadastrar.';
      } else if (errorMsg.includes('Password should be')) {
        errorMsg = 'A senha deve ter pelo menos 6 caracteres.';
      }
      
      setError(errorMsg);
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
      setError(`Erro Google: ${err.message || 'Falha na conexão.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    vibrate(5);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Digite seu email no campo acima para redefinir a senha.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setResetMessage('');
      await resetPassword(cleanEmail);
      setResetMessage('Email de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao enviar email. Verifique se o email está correto.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {isInstallable && (
        <button 
          onClick={onInstall}
          className="absolute top-8 right-8 px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 z-50 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Instalar App
        </button>
      )}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md space-y-12 z-10">
        <button 
          onClick={() => { vibrate(5); onBack(); }}
          className="p-3 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center space-y-8">
          <div className="relative inline-block">
            {/* Background Glow */}
            <div 
              className="absolute inset-0 bg-blue-600/30 blur-[60px] rounded-full opacity-30"
            />
            
            <div 
              className="relative w-48 h-48 rounded-[3.5rem] bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto shadow-2xl overflow-hidden group"
            >
              <img 
                src={logoUrl} 
                alt="Logo Seabra Pressão Pro" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                onError={handleLogoError}
              />
            </div>
          </div>
          
          <div className="space-y-3 relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-500/50" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-500">Sistema Premium</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-500/50" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Seabra Pressão Pro</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-[0.25em] text-[10px]">
              Controle Clínico Personalizado
            </p>
          </div>
        </div>

        <div className="glass-card p-8 space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center">
              {resetMessage}
            </div>
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
              <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400">Ou use o método rápido</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid grid-cols-1 w-full gap-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-zinc-300 font-black py-4 px-8 rounded-2xl active:scale-[0.97] transition-all"
              >
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  className="w-4 h-4 opacity-50"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs">Google Account</span>
              </button>
            </div>

            <button
              onClick={() => { vibrate(5); setIsRegistering(!isRegistering); }}
              className="text-[10px] uppercase tracking-[0.25em] font-black text-zinc-400 hover:text-white transition-colors py-2"
            >
              {isRegistering ? 'Voltar para o Login' : 'Não tem conta? Cadastre-se com E-mail'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">Erro de Interface</h1>
          <p className="text-zinc-500 mb-8 max-w-sm font-medium">Ocorreu um erro ao carregar os componentes visuais. Tente recarregar o aplicativo.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-zinc-100 text-black font-black rounded-2xl active:scale-95 transition-all"
          >
            RECARREGAR APP
          </button>
          <p className="mt-8 text-[10px] text-zinc-700 font-mono break-all">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator as any).standalone || 
                              document.referrer.includes('android-app://');
      setIsStandalone(!!isStandaloneMode);
    };

    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);
    
    if ((window as any).isWebView && (window as any).isWebView()) {
      setIsWebView(true);
    }
  }, []);

  useEffect(() => {
    // Sync with auth loading
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    // Global safety: if loading for more than 8 seconds, force show content or error
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Safety Timeout: Auth seems stuck");
        setLoading(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Listener pwa-installable removido
  
  const handleManualInstall = () => {
    // Desabilitado no modo Sketchware
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500/20 border-t-blue-500"></div>
          <div className="space-y-3">
            <span className="block text-[10px] uppercase tracking-[0.3em] font-black text-blue-500">Iniciando Sistema</span>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-loose">
              Se a tela demorar a carregar ou ficar branca, verifique sua conexão e use o link direto do app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard isInstallable={isInstallable} onInstall={handleManualInstall} isWebView={isWebView} />;
  }

  return (
    <>
      {showLogin ? (
        <LoginScreen onBack={() => setShowLogin(false)} isInstallable={isInstallable} onInstall={handleManualInstall} isWebView={isWebView} />
      ) : (
        <LandingPage onGetStarted={() => setShowLogin(true)} isInstallable={isInstallable} onInstall={handleManualInstall} isWebView={isWebView} />
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
