import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Calendar, Briefcase, Building2, 
  Lock, Star, X, Eye, Share2, RefreshCw, Loader2, Heart
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

const CIDADES_PB = [
  "João Pessoa", "Campina Grande", "Bayeux", "Cabedelo", "Santa Rita",
  "Água Branca", "Aguiar", "Alagoa Grande", "Alagoa Nova", "Alagoinha", "Alcantil",
  "Algodão de Jandaíra", "Alhandra", "Amparo", "Aparecida", "Araçagi", "Arara",
  "Araruna", "Areia", "Areia de Baraúnas", "Areial", "Aroeiras", "Assunção",
  "Baía da Traição", "Bananeiras", "Baraúna", "Barra de Santa Rosa", "Barra de Santana",
  "Barra de São Miguel", "Belém", "Belém do Brejo do Cruz", "Bernardino Batista",
  "Boa Ventura", "Boa Vista", "Bom Jesus", "Bom Sucesso", "Bonito de Santa Fé",
  "Boqueirão", "Borborema", "Brejo do Cruz", "Brejo dos Santos", "Caaporã",
  "Cabaceiras", "Cachoeira dos Índios", "Cacimba de Areia", "Cacimba de Dentro",
  "Cacimbas", "Caiçara", "Caldas Brandão", "Camalaú", "Capim", "Caraúbas",
  "Carrapateira", "Casserengue", "Catingueira", "Catolé do Rocha", "Caturité",
  "Conceição", "Condado", "Conde", "Congo", "Coremas", "Coxixola",
  "Cruz do Espírito Santo", "Cubati", "Cuité", "Cuité de Mamanguape", "Cuitegi",
  "Curral de Cima", "Curral Velho", "Damião", "Desterro", "Diamante", "Dona Inês",
  "Duas Estradas", "Emas", "Esperança", "Fagundes", "Frei Martinho", "Gado Bravo",
  "Guarabira", "Gurinhém", "Gurjão", "Ibiara", "Igaracy", "Imaculada", "Ingá",
  "Itabaiana", "Itaporanga", "Itapororoca", "Itatuba", "Jacaraú", "Jericó",
  "Joca Claudino", "Juarez Távora", "Juazeirinho", "Junco do Seridó", "Juripiranga",
  "Juru", "Lagoa", "Lagoa de Dentro", "Lagoa Seca", "Lastro", "Livramento",
  "Logradouro", "Lucena", "Mãe d'Água", "Malta", "Mamanguape", "Manaíra",
  "Marcação", "Mari", "Marizópolis", "Massaranduba", "Mataraca", "Matinhas",
  "Mato Grosso", "Maturéia", "Mogeiro", "Montadas", "Monte Horebe", "Monteiro",
  "Mulungu", "Natuba", "Nazarezinho", "Nova Floresta", "Nova Olinda", "Nova Palmeira",
  "Olho d'Água", "Olivedos", "Ouro Velho", "Parari", "Passagem", "Patos", "Paulista",
  "Pedra Branca", "Pedra Lavrada", "Pedras de Fogo", "Pedro Régis", "Piancó", "Picuí",
  "Pilar", "Pilões", "Pilõezinhos", "Pirpirituba", "Pitimbu", "Pocinhos",
  "Poço Dantas", "Poço de José de Moura", "Pombal", "Prata", "Princesa Isabel",
  "Puxinanã", "Queimadas", "Quixaba", "Remígio", "Riachão", "Riachão do Bacamarte",
  "Riachão do Poço", "Riacho de Santo Antônio", "Riacho dos Cavalos", "Rio Tinto",
  "Salgadinho", "Salgado de São Félix", "Santa Cecília", "Santa Cruz", "Santa Helena",
  "Santa Inês", "Santa Luzia", "Santa Teresinha", "Santana de Mangueira",
  "Santana dos Garrotes", "Santarém", "Santo André", "São Bentinho", "São Bento",
  "São Domingos", "São Domingos do Cariri", "São Francisco", "São João do Cariri",
  "São João do Rio do Peixe", "São João do Tigre", "São José da Lagoa Tapada",
  "São José de Caiana", "São José de Espinharas", "São José de Piranhas",
  "São José de Princesa", "São José do Bonfim", "São José do Brejo do Cruz",
  "São José do Sabugi", "São José dos Cordeiros", "São José dos Ramos", "São Mamede",
  "São Miguel de Taipu", "São Sebastião de Lagoa de Roça", "São Sebastião do Umbuzeiro",
  "Sapé", "Serra Branca", "Serra da Raiz", "Serra Grande", "Serra Redonda", "Serraria",
  "Sertãozinho", "Sobrado", "Solânea", "Soledade", "Sossego", "Sousa", "Sumé",
  "Tacima", "Taperoá", "Tavares", "Teixeira", "Tenório", "Triunfo", "Uiraúna",
  "Umbuzeiro", "Várzea", "Vieirópolis", "Vista Serrana", "Zabelê"
];

const JOB_FUNCTIONS = [
  "Auxiliar de cozinha", "ASG", "Auxiliar administrativo", "Analista administrativo",
  "Analista de compras", "Analista de logística", "Analista de marketing",
  "Analista de recursos humanos", "Analista de sistemas", "Atendente de balcão",
  "Atendente de call center", "Auxiliar de limpeza", "Auxiliar de manutenção",
  "Auxiliar de mecânico", "Auxiliar de produção", "Bibliotecário", "Biomédico",
  "Bombeiro", "Cabeleireiro", "Caixa de supermercado", "Carpinteiro",
  "Consultor de vendas", "Coordenador administrativo", "Coordenador de produção",
  "Coordenador de recursos humanos", "Cozinheiro", "Designer gráfico",
  "Desenvolvedor de software", "Digitador", "Eletricista", "Engenheiro civil",
  "Engenheiro de produção", "Engenheiro eletricista", "Engenheiro mecânico",
  "Farmacêutico", "Fisioterapeuta", "Garçom", "Jardineiro", "Jornalista",
  "Motorista", "Nutricionista", "Operador de caixa", "Operador de máquinas",
  "Pedreiro", "Pintor", "Professor", "Psicólogo", "Porteiro", "Recepcionista",
  "Técnico de enfermagem", "Técnico em informática", "Técnico em manutenção",
  "Vendedor", "Zelador", "Mecânico", "Balconista", "Copeiro", "Babá",
  "Lavador de Carros", "Faturista", "Departamento Pessoal", "Repositor",
  "Manobrista", "Tec Enfermagem", "Enfermeira", "Médica", "Gestor Comercial",
  "Gerente", "Coordenador", "Assistente Fiscal", "Assistente contábil",
  "Tec Segurança do trabalho", "Controladoria", "Compras", "Promotor de vendas",
  "Carregador", "Estoquista", "Logística", "Panfletista", "Outros"
];

// Função de fetch robusta
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

// Formatar tempo
function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState('all');
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [funcOpen, setFuncOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [views, setViews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareJob, setShareJob] = useState(null);

  // URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const searchParam = urlParams.get('search');
    if (typeParam) setSelectedType(typeParam);
    if (searchParam) setSearchTerm(searchParam);
  }, []);

  // Buscar filtros do FilterMaster com sincronização automática
  const { data: filterData } = useQuery({
    queryKey: ['filter-master'],
    queryFn: async () => {
      const response = await base44.functions.invoke('filters');
      return response.data.filters;
    },
    staleTime: 3000,
    refetchOnWindowFocus: true,
  });

  // Buscar categorias profissionais
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['professional-categories'],
    queryFn: async () => {
      const cats = await base44.entities.ProfessionalCategory.list('category_order', 100);
      return cats.filter(c => c.is_active !== false);
    },
    staleTime: 3000,
  });

  // Auto-reload ao detectar mudanças no Gerenciador (sincronização em tempo real)
  useEffect(() => {
    const handleFilterUpdate = (event) => {
      console.log('🔄 Filtros atualizados detectado, recarregando...', event.detail);
      refetchCategories();
      setRefreshKey(k => k + 1);
    };
    
    window.addEventListener('filters-updated', handleFilterUpdate);
    return () => window.removeEventListener('filters-updated', handleFilterUpdate);
  }, [refetchCategories]);

  // Extrair funções únicas baseadas na categoria selecionada
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
  }, []);

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

  // Load data
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

  // Premium check
  const userIsPremium = user?.subscription_type === 'premium' || 
    user?.subscription_type === 'admin' || 
    user?.role === 'admin';

  const canViewJob = (job) => {
    if (!job.is_premium) return true;
    return userIsPremium;
  };

  // Views count map
  const viewsCountMap = {};
  views.forEach(v => {
    viewsCountMap[v.job_id] = (viewsCountMap[v.job_id] || 0) + 1;
  });

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_function?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || job.city === selectedCity;
    
    const matchesType = selectedType === 'all' || 
      job.job_type === selectedType ||
      (job.contract_types && job.contract_types.includes(selectedType));
    
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesFunction = selectedFunction === 'all' || job.job_function === selectedFunction;
    
    return matchesSearch && matchesCity && matchesType && matchesCategory && matchesFunction;
  });

  const filteredCities = CIDADES_PB.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedFunction('all');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedFunction('all');
    setCitySearch('');
    setFuncSearch('');
  };

  const activeFiltersCount = [selectedCity, selectedType, selectedCategory, selectedFunction].filter(f => f !== 'all').length;
  const hasActiveFilters = searchTerm || activeFiltersCount > 0;

  // Handle favorite
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Vagas de Emprego</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-white hover:bg-white/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Search */}
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Pesquisar por cargo, empresa, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-4 rounded-lg border-0 bg-slate-50 text-base w-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 -mt-4 mb-6">
        <Card className="shadow-lg rounded-xl border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Filtrar:</span>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters} 
                  className="text-slate-600 hover:text-slate-800 h-8"
                >
                  <X className="w-4 h-4 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* City filter */}
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] h-10 rounded-lg justify-start">
                    <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="truncate">
                      {selectedCity === 'all' ? 'Cidade' : selectedCity}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar cidade..." 
                      value={citySearch}
                      onValueChange={setCitySearch}
                    />
                    <CommandList className="max-h-[180px]">
                      <CommandEmpty>Nenhuma cidade encontrada</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedCity('all');
                            setCityOpen(false);
                            setCitySearch('');
                          }}
                        >
                          Todas as cidades
                        </CommandItem>
                        {filteredCities.map((city) => (
                          <CommandItem
                            key={city}
                            value={city}
                            onSelect={() => {
                              setSelectedCity(city);
                              setCityOpen(false);
                              setCitySearch('');
                            }}
                          >
                            {city}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Type filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-11 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Todos" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Autônomo">Autônomo</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="Trainee">Trainee</SelectItem>
                  <SelectItem value="Banco de Talentos">Banco de Talentos</SelectItem>
                  <SelectItem value="Home Office">Home Office</SelectItem>
                  <SelectItem value="PCD">PCD</SelectItem>
                </SelectContent>
              </Select>

              {/* Category filter */}
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[250px]">
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.category_name}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              {/* Function filter */}
              <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 sticky top-0 bg-white border-b">
                    <Input
                      placeholder="Buscar função..."
                      value={funcSearch}
                      onChange={(e) => setFuncSearch(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    <SelectItem value="all">Todas funções</SelectItem>
                    {availableFunctions.filter(f => 
                      f.toLowerCase().includes(funcSearch.toLowerCase())
                    ).map((func) => (
                      <SelectItem key={func} value={func}>{func}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            
            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {selectedCity !== 'all' && (
                  <Badge variant="secondary" className="rounded-full">
                    <MapPin className="w-3 h-3 mr-1" />
                    {selectedCity}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCity('all')} />
                  </Badge>
                )}
                {selectedType !== 'all' && (
                  <Badge variant="secondary" className="rounded-full">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {selectedType}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedType('all')} />
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="rounded-full">
                    {selectedCategory}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                  </Badge>
                )}
                {selectedFunction !== 'all' && (
                  <Badge variant="secondary" className="rounded-full">
                    {selectedFunction}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedFunction('all')} />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-sm text-slate-500 mb-4">
          {filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} encontrada{filteredJobs.length !== 1 ? 's' : ''}
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const canView = canViewJob(job);
              const isFavorite = favorites.some(f => f.job_id === job.id);
              const viewCount = viewsCountMap[job.id] || 0;

              if (!canView) {
                return (
                  <Card key={job.id} className="overflow-hidden relative">
                    <CardContent className="p-6">
                      <JobCardContent job={job} viewCount={viewCount} />
                    </CardContent>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-md text-xs">
                      <Lock className="w-3 h-3" />
                    </div>
                    <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Vaga Premium
                    </div>
                    <Link to={createPageUrl('Subscription')} className="absolute inset-0 z-10" />
                  </Card>
                );
              }

              return (
                <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-[#0056ff]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <Link to={createPageUrl('JobDetail') + `?id=${job.id}`} className="flex-1">
                        <JobCardContent job={job} viewCount={viewCount} />
                      </Link>
                      <div className="flex flex-col gap-1 ml-3">
                        {user && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleFavorite(job, e)}
                            className={`h-8 w-8 rounded-full ${isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            setShareJob(job);
                          }}
                          className="h-8 w-8 rounded-full text-slate-400 hover:text-[#0056ff]"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredJobs.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-slate-500 mb-4">Não encontramos vagas com os filtros selecionados</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                <X className="w-4 h-4 mr-2" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <ShareDialog job={shareJob} open={!!shareJob} onClose={() => setShareJob(null)} />
    </div>
  );
}

function JobCardContent({ job, viewCount }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
            {job.title || 'Vaga não informada'}
          </h3>
          {job.is_featured && (
            <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
              <Star className="w-3 h-3 mr-1" /> Destaque
            </Badge>
          )}
          {job.is_premium && (
            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
              Premium
            </Badge>
          )}
        </div>
        
        <p className="text-slate-500 flex items-center gap-1 mb-3">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{job.company || 'Empresa confidencial'}</span>
        </p>
        
        <div className="flex flex-wrap gap-2">
          {job.city && (
            <Badge variant="secondary" className="rounded-full text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {job.city}
            </Badge>
          )}
          {job.contract_types && job.contract_types.length > 0 ? (
            job.contract_types.map((type, i) => (
              <Badge key={i} variant="secondary" className="rounded-full text-xs">
                {type}
              </Badge>
            ))
          ) : job.job_type ? (
            <Badge variant="secondary" className="rounded-full text-xs">
              {job.job_type}
            </Badge>
          ) : null}
          {job.job_function && (
            <Badge variant="outline" className="rounded-full text-xs">
              {job.job_function}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 text-right">
        <p className="text-sm text-slate-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {getTimeAgo(job.created_date)}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {viewCount} views
        </p>
        {job.salary_range && (
          <p className="font-semibold text-green-600 text-sm">{job.salary_range}</p>
        )}
      </div>
    </div>
  );
}

function ShareDialog({ job, open, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const shareUrl = `${window.location.origin}${createPageUrl('JobDetail')}?id=${job.id}`;
  const shareText = `Vaga: ${job.title} - ${job.company}\n${shareUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Vaga</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{job.title} - {job.company}</p>
          <div className="flex gap-2">
            <Button onClick={handleWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
              WhatsApp
            </Button>
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}