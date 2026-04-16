import React from 'react';
import { motion } from 'motion/react';
import { Activity, Camera, TrendingUp, ShieldCheck, Heart, ArrowRight, Share2, FileDown, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: Props) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">PRESSÃO PRO</span>
          </div>
          <button 
            onClick={onGetStarted}
            className="hidden sm:flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/5 active:scale-95"
          >
            Acessar Agora
          </button>
        </div>
      </nav>

      {/* Hero Section - ATTENTION */}
      <header className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20">
              A Nova Era do Controle Arterial
            </span>
            <h1 className="mt-6 text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] text-white">
              Sua Saúde Sob Controle <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Com Apenas uma Foto.</span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Esqueça as anotações em papel. O Seabra Pressão Pro usa a inteligência do Google para ler seu aparelho de pressão instantaneamente e organizar sua vida.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-3xl font-black text-lg hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/30 group"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => {
                const features = document.getElementById('features');
                features?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 text-white border border-white/10 px-10 py-5 rounded-3xl font-black text-lg hover:bg-white/10 transition-all"
            >
              Ver Funcionalidades
            </button>
          </motion.div>
        </div>
      </header>

      {/* Features - INTEREST */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Recursos Inteligentes</h2>
            <p className="text-zinc-500 font-medium max-w-xl mx-auto">Tecnologia avançada para quem não tem tempo a perder e valoriza a precisão.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Camera,
                title: "Scan por Foto",
                desc: "Aponte a câmera para o visor do seu aparelho e o Gemini extrai os dados automaticamente. Sem erros de digitação.",
                color: "blue"
              },
              {
                icon: TrendingUp,
                title: "Análise de Tendência",
                desc: "Gráficos intuitivos que mostram exatamente como sua pressão se comporta ao longo do dia, mês e ano.",
                color: "green"
              },
              {
                icon: ShieldCheck,
                title: "Alertas Clínicos",
                desc: "Classificação instantânea baseada nas diretrizes médicas. Saiba na hora se sua pressão está no nível ideal.",
                color: "red"
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 group hover:border-blue-500/50 transition-all"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 shadow-lg shadow-black/20",
                  f.color === "blue" && "bg-blue-600/10 text-blue-500",
                  f.color === "green" && "bg-green-600/10 text-green-500",
                  f.color === "red" && "bg-red-600/10 text-red-500"
                )}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black mb-3">{f.title}</h3>
                <p className="text-zinc-500 leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose - DESIRE */}
      <section className="py-24 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight">
              A tranquilidade que você e sua família merecem.
            </h2>
            <div className="space-y-6">
              {[
                "Relatórios em PDF prontos para enviar via WhatsApp ao seu médico.",
                "Sincronização em nuvem: Acesse seus dados em qualquer celular ou tablet.",
                "Modo offline: Funciona mesmo quando a internet te deixa na mão.",
                "Privacidade Total: Seus dados de saúde são criptografados e protegidos."
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-zinc-300 font-medium leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
            <div className="pt-6">
              <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20">
                <p className="text-blue-400 italic font-medium">"Mudou a forma como cuido da minha mãe. Agora sei exatamente como ela está, mesmo à distância."</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border-2 border-blue-500/30">
                    <img 
                      src="/foto-carlos.jpg.png" 
                      alt="Carlos Seabra" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src.endsWith('.jpg.png')) {
                          img.src = "/foto-carlos.jpg";
                        } else if (img.src.endsWith('.jpg')) {
                          img.src = "/foto-carlos.png";
                        } else {
                          img.src = "https://ui-avatars.com/api/?name=Carlos+Seabra&background=0D8ABC&color=fff";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Carlos Seabra</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Idealizador do Projeto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-600/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="glass-card p-4 aspect-[4/5] relative overflow-hidden bg-zinc-900 shadow-2xl rotate-2">
              <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Heart className="w-20 h-20 text-red-500 animate-pulse mx-auto opacity-50" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-zinc-800 rounded-full mx-auto" />
                    <div className="h-4 w-32 bg-zinc-900 rounded-full mx-auto" />
                  </div>
                </div>
              </div>
              <div className="absolute top-10 left-10 p-4 glass-panel rounded-2xl animate-bounce">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black">120/80</span>
                  <span className="text-[8px] font-black p-1 bg-green-500/20 text-green-500 rounded uppercase">Ideal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - ACTION */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto glass-card p-12 text-center space-y-8 bg-gradient-to-b from-zinc-900 to-black border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
            <Activity className="w-64 h-64" />
          </div>
          
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
            Pare de apenas medir. <br /> Comece a gerenciar.
          </h2>
          <p className="text-xl text-zinc-500 font-medium">Junte-se a centenas de pessoas que já transformaram o cuidado com o coração em um hábito simples e digital.</p>
          
          <div className="pt-8">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-white text-black px-12 py-6 rounded-3xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
            >
              CRIAR MINHA CONTA GRÁTIS
            </button>
            <p className="mt-6 text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black">Zero custo. 100% Saúde.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-black tracking-tighter">SEABRA PRESSÃO PRO</span>
          </div>
          <p className="text-xs font-bold text-center sm:text-left">© 2026 Seabra Health Tech. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Share2 className="w-4 h-4" />
            <FileDown className="w-4 h-4" />
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
