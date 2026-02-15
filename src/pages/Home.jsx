import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Briefcase, MessageCircle, Newspaper, Crown, 
  MapPin, Calendar, Users, Star, Building2, Eye,
  ChevronRight, Shield, Clock, Handshake
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import TimeAgo from "@/components/common/TimeAgo";
import VisitTracker from "@/components/common/VisitTracker";
import PremiumModal from "@/components/subscription/PremiumModal";
import PlansBanner from "@/components/common/PlansBanner";

// Função de fetch com retry robusto
async function fetchWithRetry(fetchFn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fetchFn();
      if (result && result.length >= 0) {
        return result;
      }
    } catch (error) {
      console.warn(`Tentativa ${attempt + 1} falhou:`, error.message);
    }
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }
  return [];
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [allViews, setAllViews] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (e) {
        // Não autenticado - OK, Home é pública
      }
    };
    checkAuth();
  }, []);

  // Carregar dados com retry robusto
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Carregar vagas
      const jobsResult = await fetchWithRetry(() => 
        base44.entities.Job.list('-created_date', 10000)
      );
      if (isMounted) setJobs(jobsResult);

      // Carregar views
      const viewsResult = await fetchWithRetry(() => 
        base44.entities.JobView.list('-created_date', 5000)
      );
      if (isMounted) setAllViews(viewsResult);
    };

    loadData();

    return () => { isMounted = false; };
  }, []);

  // Contagem de views por vaga
  const viewsCountMap = {};
  allViews.forEach(v => {
    viewsCountMap[v.job_id] = (viewsCountMap[v.job_id] || 0) + 1;
  });

  // Filtrar apenas vagas em destaque da Paraíba
  const featuredJobs = jobs.filter(job => job.is_featured && job.state === 'PB');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`${createPageUrl('Jobs')}?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate(createPageUrl('Jobs'));
    }
  };

  // Atalhos rápidos modernos
  const quickActions = [
    { label: 'Vagas', icon: Briefcase, page: 'Jobs', color: 'from-blue-500 to-blue-600' },
    { label: 'Feed', icon: MessageCircle, page: 'Feed', color: 'from-purple-500 to-purple-600' },
    { label: 'Notícias', icon: Newspaper, page: 'News', color: 'from-green-500 to-green-600' },
    { label: 'Grupos', icon: Users, page: 'Groups', color: 'from-slate-500 to-slate-600' },
  ];

  return (
    <>
      <title>Vagas Abertas Paraíba - Vagas de Emprego na Paraíba | João Pessoa e Campina Grande</title>
      <meta name="description" content="Encontre vagas de emprego na Paraíba. Oportunidades em João Pessoa, Campina Grande e toda a Paraíba. Atualizamos diariamente com as melhores vagas de trabalho." />
      <meta name="keywords" content="vagas de emprego na Paraíba, vagas em João Pessoa, vagas em Campina Grande, oportunidades de trabalho na Paraíba, empregos Paraíba" />

      <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-slate-900">
        <VisitTracker pageName="Home" user={user} />
        
        {/* Hero Section - Marca e Busca */}
        <section className="bg-gradient-to-br from-[#1D4371] via-[#2B5A8F] to-[#1D4371] dark:from-slate-800 dark:to-slate-950 py-16 md:py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            {/* Logo e Título Principal */}
            <div className="text-center mb-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-3xl shadow-2xl p-4 transform hover:scale-105 transition-transform">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png" 
                  alt="Vagas Abertas Paraíba" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                Vagas Abertas Paraíba
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 font-medium mb-12">
                Sua próxima oportunidade começa aqui
              </p>

              {/* Campo de Busca Principal */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="relative">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar vagas de emprego na Paraíba"
                    className="h-16 pl-14 pr-32 text-lg rounded-2xl border-0 shadow-2xl bg-white dark:bg-slate-800 dark:text-white focus-visible:ring-4 focus-visible:ring-white/30"
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                  <Button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-6 rounded-xl bg-[#1D4371] hover:bg-[#0F2744] text-white font-semibold shadow-lg"
                  >
                    Buscar
                  </Button>
                </div>
              </form>

              {/* Tags de busca populares */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['João Pessoa', 'Campina Grande', 'CLT', 'Home Office', 'Estágio'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchTerm(tag);
                      navigate(`${createPageUrl('Jobs')}?search=${encodeURIComponent(tag)}`);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-all backdrop-blur-sm border border-white/20"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Atalhos Rápidos */}
        <section className="max-w-6xl mx-auto px-4 -mt-8 mb-12 relative z-10">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {quickActions.map((action, i) => (
              <Link key={i} to={createPageUrl(action.page)} className="flex-shrink-0">
                <div className={`bg-gradient-to-br ${action.color} text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3 min-w-[160px]`}>
                  <action.icon className="w-6 h-6" />
                  <span className="font-semibold">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Conteúdo Principal */}
        <main className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal - Vagas em Destaque */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-800">
                <div className="bg-gradient-to-r from-[#1D4371] to-[#2B5A8F] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-xl">Vagas em Destaque</h2>
                      <p className="text-white/80 text-sm">{featuredJobs.length} oportunidades selecionadas</p>
                    </div>
                  </div>
                  <Link to={createPageUrl('Jobs')}>
                    <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
                      Ver Todas <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                <CardContent className="p-5 space-y-4">
                  {featuredJobs.slice(0, 6).map((job) => (
                    <Link key={job.id} to={createPageUrl('JobDetail') + `?id=${job.id}`}>
                      <article className="p-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer group border border-transparent hover:border-[#1D4371]/20 hover:shadow-md">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#1D4371] dark:group-hover:text-blue-400 transition-colors text-lg line-clamp-2 flex-1">
                              {job.title}
                            </h3>
                            <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs shrink-0">
                              <Star className="w-3 h-3 mr-1" /> Destaque
                            </Badge>
                          </div>

                          <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{job.company || 'Empresa'}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            {job.city && (
                              <Badge variant="secondary" className="rounded-full text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {job.city}
                              </Badge>
                            )}
                            {job.job_type && (
                              <Badge variant="outline" className="rounded-full text-xs">
                                {job.job_type}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <TimeAgo date={job.created_date} />
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {viewsCountMap[job.id] || 0}
                              </span>
                            </div>
                            {job.salary_range && (
                              <p className="text-green-600 dark:text-green-400 font-bold text-sm">{job.salary_range}</p>
                            )}
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}

                  {featuredJobs.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Star className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg">Nenhuma vaga em destaque no momento</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Banner Planos Premium */}
              <PlansBanner />

              {/* Premium CTA - apenas para não-premium */}
              {user && user?.subscription_type !== 'premium' && user?.subscription_type !== 'admin' && user?.role !== 'admin' && (
                <Card className="rounded-3xl border-0 shadow-xl bg-gradient-to-br from-[#1D4371] to-[#2B5A8F] text-white overflow-hidden">
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <Crown className="w-14 h-14 text-yellow-300 mx-auto mb-4" />
                    <h3 className="font-bold text-2xl mb-2">Seja Premium</h3>
                    <p className="text-white/90 text-sm mb-4">
                      Acesso vitalício a todas as vagas exclusivas
                    </p>
                    <div className="text-4xl font-bold mb-4">
                      R$ 29,90
                      <span className="text-sm font-normal text-white/80 block mt-1">pagamento único</span>
                    </div>
                    <Button 
                      onClick={() => setShowPremiumModal(true)}
                      className="w-full bg-white text-[#1D4371] hover:bg-white/90 rounded-xl h-12 text-base font-bold shadow-lg"
                    >
                      Assinar Agora
                    </Button>
                    <div className="flex items-center justify-center gap-2 mt-4 text-white/80 text-xs">
                      <Shield className="w-4 h-4" />
                      <span>Garantia de 7 dias</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Banner Parcerias */}
              <Card 
                className="rounded-3xl border-0 shadow-xl bg-gradient-to-br from-[#1D4371] to-[#2B5A8F] cursor-pointer hover:shadow-2xl hover:scale-105 transition-all"
                onClick={() => window.location.href = createPageUrl('Parcerias')}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Handshake className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">Seja Parceiro</h3>
                      <p className="text-white/80 text-xs">Benefícios exclusivos</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white" />
                </CardContent>
              </Card>

              {/* Grupos WhatsApp */}
              <Card className="rounded-3xl border-0 shadow-xl dark:bg-slate-800">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Grupos do WhatsApp</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Receba vagas em primeira mão
                  </p>
                  <Link to={createPageUrl('Groups')}>
                    <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] rounded-xl h-12 text-base font-bold shadow-lg">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Entrar nos Grupos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>

        {/* Premium Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          user={user}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      </div>
    </>
  );
}