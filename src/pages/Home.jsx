import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Briefcase, MessageCircle, Newspaper, Crown, ArrowRight, 
  MapPin, Calendar, Users, Star, TrendingUp, Building2, Eye,
  ChevronRight, Zap, Shield, CheckCircle, Clock, Heart, Handshake, Sparkles, Moon, Sun
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import TimeAgo from "@/components/common/TimeAgo";
import VisitTracker from "@/components/common/VisitTracker";
import PremiumModal from "@/components/subscription/PremiumModal";
import PlansBanner from "@/components/common/PlansBanner";
import FeaturedJobsCarousel from "@/components/jobs/FeaturedJobsCarousel";


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
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [allViews, setAllViews] = useState([]);
  const [news, setNews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [isPulling, setIsPulling] = useState(false);

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

    // Pull to refresh
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      touchEndY = e.touches[0].clientY;
      if (window.scrollY === 0 && touchEndY - touchStartY > 100) {
        setIsPulling(true);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && window.scrollY === 0) {
        window.location.reload();
      }
      setIsPulling(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling]);

  // Carregar dados com retry robusto
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Carregar jobs em paralelo com views para otimizar
      const [jobsResult, viewsResult] = await Promise.all([
        fetchWithRetry(() => base44.entities.Job.list('-created_date', 10000)),
        fetchWithRetry(() => base44.entities.JobView.list('-created_date', 5000))
      ]);
      
      if (isMounted) {
        setJobs(jobsResult);
        setAllViews(viewsResult);
      }

      // Carregar notícias e posts em paralelo (menos crítico)
      const [newsResult, postsResult] = await Promise.all([
        fetchWithRetry(() => base44.entities.News.list('-created_date', 50)),
        fetchWithRetry(() => base44.entities.FeedPost.list('-created_date', 50))
      ]);

      if (isMounted) {
        const publishedNews = newsResult.filter(n => n.status === 'published' || !n.status);
        setNews(publishedNews);
        setPosts(postsResult);
      }
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







  const quickActions = [
    { label: 'Vagas na PB', icon: Search, page: 'Jobs', color: 'bg-white', iconColor: 'text-[#1D4371]', desc: 'Encontre oportunidades' },
    { label: 'Feed', icon: MessageCircle, page: 'Feed', color: 'bg-[#2B5A8F]', desc: 'Conecte-se' },
    { label: 'Notícias', icon: Newspaper, page: 'News', color: 'bg-[#057642]', desc: 'Fique informado' },
    { label: 'Grupos', icon: Users, page: 'Groups', color: 'bg-[#4A5568]', desc: 'WhatsApp' },
  ];

  const tabs = [
    { id: 'jobs', label: 'Vagas', icon: Briefcase },
    { id: 'news', label: 'Notícias', icon: Newspaper },
    { id: 'feed', label: 'Feed', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#F3F2EF] dark:bg-slate-900">
      <VisitTracker pageName="Home" user={user} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1D4371] via-[#0F2744] to-[#2B5A8F] dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 pt-6 sm:pt-8 pb-24 sm:pb-20 px-3 sm:px-4 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white dark:bg-slate-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white dark:bg-slate-600 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-6 sm:mb-8 px-2">
                  <Badge className="bg-white/20 text-white border-0 mb-3 sm:mb-4 px-3 sm:px-4 py-1 text-xs sm:text-sm">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {jobs.length > 0 ? `+${jobs.length}` : '200+'} {jobs.length === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                    Sua próxima oportunidade está aqui
                  </h1>
                  <p className="text-white/80 text-sm sm:text-lg max-w-2xl mx-auto mb-5 sm:mb-8 px-2">
                    Vagas atualizadas diariamente em João Pessoa, Campina Grande e toda a Paraíba
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                    <Link to={createPageUrl('Jobs')}>
                      <Button className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-white text-[#1D4371] hover:bg-white/90 rounded-xl shadow-lg w-full sm:w-auto">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Buscar Vagas na PB
                      </Button>
                    </Link>
                    {!user && (
                      <Button 
                        onClick={() => {
                          sessionStorage.setItem('needs_login', 'true');
                          window.location.href = createPageUrl('Splash');
                        }}
                        className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-[#2B5A8F] text-white hover:bg-[#1D4371] rounded-xl w-full sm:w-auto font-bold shadow-lg"
                      >
                        Entrar / Cadastrar
                      </Button>
                    )}
                  </div>
                </div>


                </div>
              </div>

              {/* Quick Actions */}
              <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-12 mb-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {quickActions.map((action, i) => (
                    <Link key={i} to={createPageUrl(action.page)}>
                      <Card className="bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-xl sm:rounded-2xl border-0 overflow-hidden h-full">
                        <CardContent className="p-3 sm:p-5">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform ${action.color === 'bg-white' ? 'border-2 border-[#1D4371] dark:border-blue-400' : ''}`}>
                            <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.iconColor || 'text-white'}`} />
                          </div>
                          <h3 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base leading-tight transition-colors">{action.label}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-tight mt-0.5 transition-colors">{action.desc}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Featured Jobs Carousel */}
            {featuredJobs.length > 0 && (
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 sm:p-6 shadow-lg">
                <FeaturedJobsCarousel jobs={featuredJobs} viewCounts={viewsCountMap} />
              </div>
            )}

            {featuredJobs.length === 0 && (
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Star className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nenhuma vaga em destaque no momento
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Confira todas as vagas disponíveis
                  </p>
                  <Link to={createPageUrl('Jobs')}>
                    <Button className="mt-4 bg-[#0A66C2] hover:bg-[#004182]">
                      Ver Todas as Vagas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Banner Planos Premium - Dinâmico */}
            <PlansBanner />

            {/* Banner Parcerias */}
            <Card 
              className="rounded-2xl border-0 shadow-lg bg-gradient-to-r from-[#1D4371] to-[#2B5A8F] cursor-pointer hover:shadow-xl transition-all"
              onClick={() => window.location.href = createPageUrl('Parcerias')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Handshake className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Seja Parceiro</h3>
                    <p className="text-white/80 text-xs">Empresas têm benefícios exclusivos</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white" />
              </CardContent>
            </Card>

            {/* Premium CTA - apenas para não-premium */}
            {user && user?.subscription_type !== 'premium' && user?.subscription_type !== 'admin' && user?.role !== 'admin' && (
              <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-[#1D4371] to-[#2B5A8F] text-white overflow-hidden">
                <CardContent className="p-6 text-center relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Seja Premium</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Acesso vitalício a todas as vagas exclusivas
                  </p>
                  <div className="text-3xl font-bold mb-4">
                    R$ 29,90
                    <span className="text-sm font-normal text-white/70 block">pagamento único</span>
                  </div>
                  <Button 
                    onClick={() => setShowPremiumModal(true)}
                    className="w-full bg-white text-[#1D4371] hover:bg-white/90 rounded-xl"
                  >
                    Assinar Agora
                  </Button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-white/70 text-xs">
                    <Shield className="w-4 h-4" />
                    <span>Garantia de 7 dias</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Join Community */}
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-[#057642]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-[#057642]" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Grupos do WhatsApp</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Entre nos nossos grupos e receba vagas em primeira mão
                </p>
                <Link to={createPageUrl('Groups')}>
                  <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] rounded-xl">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Entrar nos Grupos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
  );
}