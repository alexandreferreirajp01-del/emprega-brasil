import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Calendar, Briefcase, Building2, 
  Lock, Star, X, Eye, Share2, RefreshCw, Loader2, Heart, Clock, AlertCircle, MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PremiumModal from "@/components/subscription/PremiumModal";
import TimeAgo from "@/components/common/TimeAgo";
import NativeBannerAd from "@/components/ads/NativeBannerAd";
import GoogleAdUnit from "@/components/ads/GoogleAdUnit";
import ReportJobModal from "@/components/jobs/ReportJobModal";

async function safeFetch(fetchFn, fallback = []) {
  for (let i = 0; i < 3; i++) {
    try {
      const result = await fetchFn();
      return result || fallback;
    } catch (e) {
      if (i === 2) return fallback;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  return fallback;
}

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState('all');
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [funcOpen, setFuncOpen] = useState(false);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showHomeOfficeOnly, setShowHomeOfficeOnly] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [companySearch, setCompanySearch] = useState('');
  const [companyOpen, setCompanyOpen] = useState(false);
  const [showCompanyLockedModal, setShowCompanyLockedModal] = useState(false);
  
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [views, setViews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareJob, setShareJob] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reportJob, setReportJob] = useState(null);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const searchParam = urlParams.get('search');
    if (typeParam) setSelectedType(typeParam);
    if (searchParam) setSearchTerm(searchParam);
  }, []);

  const { data: filterData } = useQuery({
    queryKey: ['filter-master'],
    queryFn: async () => {
      const response = await base44.functions.invoke('filters');
      return response.data.filters;
    },
    staleTime: 3000,
    refetchOnWindowFocus: true,
  });

  const { data: allCities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      return await safeFetch(() => base44.entities.City.list('name', 6000), []);
    },
    staleTime: 60000,
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['professional-categories'],
    queryFn: async () => {
      const cats = await base44.entities.ProfessionalCategory.list('category_order', 100);
      return cats.filter(c => c.is_active !== false);
    },
    staleTime: 3000,
  });

  useEffect(() => {
    const handleFilterUpdate = (event) => {
      refetchCategories();
      setRefreshKey(k => k + 1);
    };
    
    window.addEventListener('filters-updated', handleFilterUpdate);
    return () => window.removeEventListener('filters-updated', handleFilterUpdate);
  }, [refetchCategories]);

  const availableStates = React.useMemo(() => {
    const states = new Set(allCities.map(c => c.state));
    const statesArray = Array.from(states);
    const regionalOrder = ['PB', 'PE', 'RN', 'AL', 'CE', 'SE', 'BA', 'PI', 'MA'];
    const orderedStates = [];
    
    regionalOrder.forEach(state => {
      if (statesArray.includes(state)) {
        orderedStates.push(state);
      }
    });
    
    statesArray.filter(s => !regionalOrder.includes(s)).sort().forEach(state => {
      orderedStates.push(state);
    });
    
    return orderedStates;
  }, [allCities]);

  const availableCities = React.useMemo(() => {
    if (selectedState === 'all') {
      return allCities.map(c => c.name).sort();
    }
    return allCities.filter(c => c.state === selectedState).map(c => c.name).sort();
  }, [selectedState, allCities]);

  useEffect(() => {
    if (selectedState !== 'all' && selectedCity !== 'all') {
      const cityExists = availableCities.includes(selectedCity);
      if (!cityExists) {
        setSelectedCity('all');
      }
    }
  }, [selectedState, availableCities, selectedCity]);

  const availableFunctions = React.useMemo(() => {
    if (selectedCategory === 'all') {
      const allFuncs = new Set();
      categories.forEach(cat => {
        (cat.job_titles || []).forEach(func => allFuncs.add(func));
      });
      return Array.from(allFuncs).sort();
    } else {
      const category = categories.find(cat => cat.category_name === selectedCategory);
      return (category?.job_titles || []).sort();
    }
  }, [selectedCategory, categories]);

  useEffect(() => {
    window.scrollTo(0, 0);

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
        handleRefresh();
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

  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      
      const [jobsData, viewsData, favoritesData] = await Promise.all([
        safeFetch(() => base44.entities.Job.list('-created_date', 500)),
        safeFetch(() => base44.entities.JobView.list('-created_date', 2000)),
        user ? safeFetch(() => base44.entities.FavoriteJob.list('-created_date', 500)) : Promise.resolve([])
      ]);

      if (mounted) {
        setJobs(jobsData);
        setViews(viewsData);
        setFavorites(favoritesData.filter(f => f.user_email === user?.email));
        setIsLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [user, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const userIsPremium = user?.subscription_type === 'premium' || 
    user?.subscription_type === 'admin' || 
    user?.role === 'admin';

  const canUseCompanyFilter = userIsPremium || user?.subscription_type === 'dono';

  // Lista de empresas únicas
  const availableCompanies = React.useMemo(() => {
    const set = new Set(jobs.map(j => j.company).filter(Boolean));
    return Array.from(set).sort();
  }, [jobs]);

  const filteredCompanies = availableCompanies.filter(c =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  );

  const canViewJob = (job) => {
    if (!job.is_premium) return true;
    return userIsPremium;
  };

  const handleJobClick = (job, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (job.is_premium && !userIsPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    window.location.href = createPageUrl('JobDetail') + `?id=${job.id}`;
  };

  const viewsCountMap = {};
  views.forEach(v => {
    viewsCountMap[v.job_id] = (viewsCountMap[v.job_id] || 0) + 1;
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_function?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = selectedState === 'all' || job.state === selectedState;
    const matchesCity = selectedCity === 'all' || job.city === selectedCity;
    
    const matchesType = selectedType === 'all' || 
      job.job_type === selectedType ||
      (job.contract_types && job.contract_types.includes(selectedType));
    
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesFunction = selectedFunction === 'all' || job.job_function === selectedFunction;
    const matchesPremium = !showPremiumOnly || job.is_premium;
    const matchesFeatured = !showFeaturedOnly || job.is_featured;
    const isRemoteJob = 
      job.is_remote === true ||
      job.work_mode === 'Remoto' ||
      job.job_type === 'Home Office' ||
      (job.contract_types && job.contract_types.includes('Home Office')) ||
      (job.title || '').toLowerCase().includes('home office') ||
      (job.title || '').toLowerCase().includes('remoto');
    const matchesHomeOffice = !showHomeOfficeOnly || isRemoteJob;
    const matchesCompany = selectedCompany === 'all' || job.company === selectedCompany;
    
    return matchesSearch && matchesState && matchesCity && matchesType && matchesCategory && matchesFunction && matchesPremium && matchesFeatured && matchesHomeOffice && matchesCompany;
  });

  const filteredCities = availableCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedFunction('all');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setSelectedCity('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedFunction('all');
    setSelectedCompany('all');
    setCitySearch('');
    setFuncSearch('');
    setCompanySearch('');
  };

  const activeFiltersCount = [selectedState, selectedCity, selectedType, selectedCategory, selectedFunction, selectedCompany].filter(f => f !== 'all').length;
  const hasActiveFilters = searchTerm || activeFiltersCount > 0;

  const handleFavorite = async (job, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const existing = favorites.find(f => f.job_id === job.id);
    try {
      if (existing) {
        await base44.entities.FavoriteJob.delete(existing.id);
        setFavorites(prev => prev.filter(f => f.id !== existing.id));
      } else {
        const newFav = await base44.entities.FavoriteJob.create({
          job_id: job.id,
          user_email: user.email,
          job_title: job.title,
          job_company: job.company
        });
        setFavorites(prev => [...prev, newFav]);
      }
    } catch (e) {
      console.warn('Erro ao favoritar:', e);
    }
  };

  const featuredJobs = filteredJobs.filter(j => j.is_featured).slice(0, 3);
  const regularJobs = filteredJobs.filter(j => !j.is_featured);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header - Estilo G1 */}
      <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] py-3 px-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Vagas</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-white hover:bg-white/20 h-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar - Estilo G1 */}
      <div className="bg-white border-b py-3 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar vagas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10 pr-10 rounded-lg border-slate-200 bg-white"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters - Grid Responsivo */}
      <div className="bg-slate-50 border-b sticky top-[52px] z-10">
        <div className="max-w-6xl mx-auto px-3 py-3 space-y-2">

          {/* Linha 1: PB fixo + Cidade + Tipo */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center justify-center h-9 rounded-lg bg-[#1D4371] text-white text-xs font-semibold px-2">
              📍 Paraíba
            </div>

            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-9 w-full rounded-lg text-xs px-2 truncate ${selectedCity !== 'all' ? 'border-[#1D4371] text-[#1D4371] font-semibold' : ''}`}
                >
                  {selectedCity === 'all' ? 'Cidade' : selectedCity}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar..." value={citySearch} onValueChange={setCitySearch} />
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty>Nada encontrado</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="all" onSelect={() => { setSelectedCity('all'); setCityOpen(false); }}>Todas</CommandItem>
                      {filteredCities.map((city) => (
                        <CommandItem key={city} value={city} onSelect={() => { setSelectedCity(city); setCityOpen(false); }}>{city}</CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className={`h-9 rounded-lg text-xs ${selectedType !== 'all' ? 'border-[#1D4371] text-[#1D4371] font-semibold' : ''}`}>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="CLT">CLT</SelectItem>
                <SelectItem value="PJ">PJ</SelectItem>
                <SelectItem value="Estágio">Estágio</SelectItem>
                <SelectItem value="Home Office">Home Office</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Linha 2: Categoria + Empresa */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className={`h-9 rounded-lg text-xs ${selectedCategory !== 'all' ? 'border-[#1D4371] text-[#1D4371] font-semibold' : ''}`}>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.category_name}>{cat.category_name}</SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>

            {/* Filtro Empresas - Premium */}
            {canUseCompanyFilter ? (
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-9 w-full rounded-lg text-xs px-2 gap-1 truncate ${selectedCompany !== 'all' ? 'border-[#1D4371] text-[#1D4371] font-semibold' : ''}`}
                  >
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{selectedCompany === 'all' ? 'Empresa' : selectedCompany}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar empresa..." value={companySearch} onValueChange={setCompanySearch} />
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>Nenhuma empresa</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="all" onSelect={() => { setSelectedCompany('all'); setCompanyOpen(false); }}>Todas</CommandItem>
                        {filteredCompanies.map((company) => (
                          <CommandItem key={company} value={company} onSelect={() => { setSelectedCompany(company); setCompanyOpen(false); }}>{company}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="outline"
                className="h-9 w-full rounded-lg text-xs gap-1 border-dashed text-slate-500"
                onClick={() => setShowCompanyLockedModal(true)}
              >
                <Lock className="w-3 h-3 text-purple-500 flex-shrink-0" />
                <span>Empresa 🔒</span>
              </Button>
            )}
          </div>

          {/* Linha 3: Toggles centralizados + Limpar */}
          <div className="flex items-center justify-center gap-2">
            {userIsPremium && (
              <>
                <button
                  onClick={() => setShowPremiumOnly(v => !v)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[11px] font-medium transition-all active:scale-95 ${showPremiumOnly ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'}`}
                >
                  <Lock className="w-3 h-3" />
                  Premium
                </button>
                <button
                  onClick={() => setShowFeaturedOnly(v => !v)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[11px] font-medium transition-all active:scale-95 ${showFeaturedOnly ? 'bg-yellow-500 border-yellow-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-yellow-300'}`}
                >
                  <Star className="w-3 h-3" />
                  Destaque
                </button>
              </>
            )}
            <button
              onClick={() => setShowHomeOfficeOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[11px] font-medium transition-all active:scale-95 ${showHomeOfficeOnly ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
            >
              <Briefcase className="w-3 h-3" />
              Home Office
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 text-[11px] font-medium active:scale-95 transition-all"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Featured Jobs - Estilo G1 */}
        {featuredJobs.length > 0 && !searchTerm && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-[#1E6FB6] uppercase tracking-wide mb-3 border-l-4 border-[#1E6FB6] pl-2">
              Destaques
            </h2>
            <div className="space-y-3">
              {featuredJobs.map((job, index) => {
                const canView = canViewJob(job);
                const viewCount = viewsCountMap[job.id] || 0;

                return (
                  <React.Fragment key={job.id}>
                    <div 
                      onClick={(e) => canView ? null : handleJobClick(job, e)}
                      className={`border-b border-slate-100 pb-3 ${!canView ? 'cursor-pointer' : ''}`}
                    >
                      <Link to={canView ? createPageUrl('JobDetail') + `?id=${job.id}` : '#'}>
                        <div className="group flex gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 group-hover:text-[#1E6FB6] transition-colors text-base line-clamp-2 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-sm text-slate-600 mb-2">{job.company}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {job.city && job.state && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {job.city} - {job.state}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <TimeAgo date={job.created_date} />
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {viewCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                    {index === 2 && (
                      <NativeBannerAd pageName="Jobs" location="content" className="py-4" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular Jobs List - Estilo G1 */}
        <div className="space-y-1 divide-y divide-slate-100">
          {isLoading ? (
            <>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse py-4">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </>
          ) : (
            regularJobs.map((job) => {
              const canView = canViewJob(job);
              const isFavorite = favorites.some(f => f.job_id === job.id);
              const viewCount = viewsCountMap[job.id] || 0;

              return (
                <div 
                  key={job.id}
                  onClick={(e) => canView ? null : handleJobClick(job, e)}
                  className={`py-4 hover:bg-slate-50 transition-colors ${!canView ? 'cursor-pointer relative' : ''}`}
                >
                  <Link to={canView ? createPageUrl('JobDetail') + `?id=${job.id}` : '#'} className="block">
                    <div className="group flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {job.is_premium && (
                            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs rounded-sm px-2 py-0.5">
                              Premium
                            </Badge>
                          )}
                          {job.category && (
                            <Badge className="bg-[#1E6FB6]/10 text-[#1E6FB6] border-0 text-xs rounded-sm px-2 py-0.5">
                              {job.category}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">
                            <TimeAgo date={job.created_date} />
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 group-hover:text-[#1E6FB6] transition-colors text-base sm:text-lg line-clamp-2 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2 line-clamp-1">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {job.city && job.state && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.city} - {job.state}
                            </span>
                          )}
                          {job.job_type && (
                            <span>{job.job_type}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {viewCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {user && canView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleFavorite(job, e)}
                            className={`h-8 w-8 rounded-full ${isFavorite ? 'text-red-500' : 'text-slate-400'}`}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </Button>
                        )}
                        {canView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('open_support_chat'));
                            }}
                            className="h-8 w-8 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Suporte"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {canView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReportJob(job);
                            }}
                            className="h-8 w-8 rounded-full text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                            title="Reportar vaga"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {!canView && (
                          <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {filteredJobs.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-600 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-slate-500 text-sm">Tente ajustar os filtros</p>
          </div>
        )}

        {/* Google AdSense - Entre resultados */}
        <div className="my-6">
          <GoogleAdUnit slot="1234567890" format="auto" className="w-full" />
        </div>
      </div>

      {/* Modal bloqueio filtro Empresa */}
      <Dialog open={showCompanyLockedModal} onOpenChange={setShowCompanyLockedModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">Filtro Exclusivo Premium</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            O filtro por <strong>Empresa</strong> é exclusivo para assinantes Premium. Assine agora e filtre vagas pela empresa que você deseja!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-[#1D4371] text-white font-semibold rounded-xl"
            onClick={() => {
              setShowCompanyLockedModal(false);
              window.location.href = createPageUrl('Subscription');
            }}
          >
            <Star className="w-4 h-4 mr-2" />
            Assinar Premium
          </Button>
          <Button variant="ghost" className="w-full mt-1 text-slate-500 text-sm" onClick={() => setShowCompanyLockedModal(false)}>
            Agora não
          </Button>
        </DialogContent>
      </Dialog>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={user}
        onSuccess={() => window.location.reload()}
      />

      <ReportJobModal
        job={reportJob}
        user={user}
        isOpen={!!reportJob}
        onClose={() => setReportJob(null)}
      />
    </div>
  );
}