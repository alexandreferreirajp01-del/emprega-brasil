import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Save, Loader2, CheckCircle2, Briefcase, FileText, UserCheck, GraduationCap, Clock3, Code, Users, Trash2, MapPin, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CONTRACT_TYPES = [
  { id: 'CLT', label: 'CLT', icon: Briefcase },
  { id: 'PJ', label: 'PJ', icon: FileText },
  { id: 'Autônomo', label: 'Autônomo', icon: UserCheck },
  { id: 'Estágio', label: 'Estágio', icon: GraduationCap },
  { id: 'Jovem Aprendiz', label: 'Jovem Aprendiz', icon: GraduationCap },
  { id: 'Temporário', label: 'Temporário', icon: Clock3 },
  { id: 'Freelancer', label: 'Freelancer', icon: Code },
  { id: 'Trainee', label: 'Trainee', icon: GraduationCap },
  { id: 'Banco de Talentos', label: 'Banco de Talentos', icon: Users },
];

// JOB_FUNCTIONS será carregado dinamicamente do banco de dados

const CIDADES_PB = [
  "João Pessoa", "Campina Grande", "Bayeux", "Cabedelo", "Santa Rita",
  "Patos", "Guarabira", "Cajazeiras", "Sousa", "Pombal", "Conde",
  "Mamanguape", "Monteiro", "Princesa Isabel", "Catolé do Rocha"
];

export default function EditJobModal({ job, isOpen, onClose, onUpdateSuccess }) {
  const [editedJob, setEditedJob] = useState({});
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Buscar categorias profissionais
  const { data: categories = [] } = useQuery({
    queryKey: ['professional-categories'],
    queryFn: () => base44.entities.ProfessionalCategory.list('category_order', 100),
    enabled: isOpen,
  });

  // Buscar cidades do banco de dados
  const { data: allCities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list('name', 6000),
    enabled: isOpen,
  });

  // Extrair todas as funções únicas de todas as categorias
  const allJobFunctions = React.useMemo(() => {
    const functions = new Set();
    categories.forEach(cat => {
      cat.job_titles?.forEach(title => functions.add(title));
    });
    return Array.from(functions).sort();
  }, [categories]);

  // Estados únicos ordenados por região
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

  // Cidades filtradas por estado
  const availableCities = React.useMemo(() => {
    if (!editedJob.state) {
      return allCities.map(c => c.name).sort();
    }
    return allCities.filter(c => c.state === editedJob.state).map(c => c.name).sort();
  }, [editedJob.state, allCities]);

  useEffect(() => {
    if (job) {
      setEditedJob({
        title: job.title || '',
        company: job.company || '',
        state: job.state || '',
        city: job.city || '',
        neighborhood: job.neighborhood || '',
        addressText: job.addressText || '',
        salary_range: job.salary_range || '',
        job_type: job.job_type || '',
        job_function: job.job_function || '',
        category: job.category || '',
        description: job.description || '',
        additional_info: job.additional_info || '',
        application_link: job.application_link || '',
        image_url: job.image_url || '',
        contract_types: job.contract_types || [],
        is_premium: job.is_premium || false,
        is_featured: job.is_featured || false,
        showOnMap: job.showOnMap !== undefined ? job.showOnMap : true,
        locationType: job.locationType || 'CIDADE',
      });
    }
  }, [job]);

  // Resetar cidade ao mudar estado
  useEffect(() => {
    if (editedJob.state && editedJob.city) {
      const cityExists = availableCities.includes(editedJob.city);
      if (!cityExists) {
        setEditedJob(prev => ({ ...prev, city: '' }));
      }
    }
  }, [editedJob.state, availableCities, editedJob.city]);

  const updateJobMutation = useMutation({
    mutationFn: async (updatedJobData) => {
      // Validar dados de localização se showOnMap = true
      if (updatedJobData.showOnMap) {
        if (!updatedJobData.city || !updatedJobData.state) {
          throw new Error('⚠️ Para exibir no mapa, informe Cidade e Estado');
        }
        if (updatedJobData.locationType === 'BAIRRO' && !updatedJobData.neighborhood) {
          throw new Error('⚠️ Para localização por Bairro, informe o bairro');
        }
        if (updatedJobData.locationType === 'EXATA' && !updatedJobData.addressText) {
          throw new Error('⚠️ Para localização Exata, informe o endereço completo');
        }
      }

      // Atualizar vaga
      await base44.entities.Job.update(job.id, updatedJobData);
      
      // Se ativou mapa ou mudou localização, geocodificar sempre
      if (updatedJobData.showOnMap) {
        try {
          console.log('🔄 Geocodificando vaga:', job.id);
          await base44.functions.invoke('geocodeSystem', {
            action: 'single',
            jobId: job.id
          });
          console.log('✅ Vaga geocodificada e aparecerá no mapa');
        } catch (e) {
          console.error('Erro ao geocodificar:', e);
          // Não bloquear salvamento por erro de geocode
          console.warn('⚠️ Vaga salva mas geocode falhou. Pode processar depois via gerenciador.');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onUpdateSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar vaga:", error);
      alert(error.message || 'Erro ao atualizar vaga');
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: () => base44.entities.Job.delete(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      alert('Vaga excluída com sucesso!');
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao excluir vaga:", error);
      alert('Erro ao excluir vaga: ' + error.message);
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedJob(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setEditedJob(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setEditedJob(prev => ({ ...prev, [name]: checked }));
  };

  const toggleContractType = (type) => {
    setEditedJob(prev => {
      const currentTypes = prev.contract_types || [];
      const newTypes = currentTypes.includes(type) 
        ? currentTypes.filter(t => t !== type) 
        : [...currentTypes, type];
      return { ...prev, contract_types: newTypes };
    });
  };

  const handleSave = () => {
    if (!editedJob.title?.trim()) {
      alert('O título da vaga é obrigatório');
      return;
    }
    updateJobMutation.mutate(editedJob);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteJobMutation.mutate();
    setShowDeleteConfirm(false);
  };

  if (!job) return null;

  const filteredCities = availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  const filteredFunctions = allJobFunctions.filter(f => f.toLowerCase().includes(funcSearch.toLowerCase()));
  const filteredCategories = categories.filter(c => c.category_name.toLowerCase().includes(categorySearch.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit className="w-5 h-5 text-[#0A66C2]" />
            Editar Vaga
          </DialogTitle>
          <p className="text-sm text-slate-500">{job.title}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6 py-4">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Informações Básicas
              </h3>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Título da Vaga *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={editedJob.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Desenvolvedor Full Stack"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      name="company"
                      value={editedJob.company}
                      onChange={handleInputChange}
                      placeholder="Nome da empresa"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary_range">Faixa Salarial</Label>
                    <Input
                      id="salary_range"
                      name="salary_range"
                      value={editedJob.salary_range}
                      onChange={handleInputChange}
                      placeholder="Ex: R$ 3.000 - R$ 5.000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Select value={editedJob.state} onValueChange={(val) => {
                      handleSelectChange('state', val);
                      handleSelectChange('city', ''); // Resetar cidade
                    }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[250px]">
                          {availableStates.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Select value={editedJob.city} onValueChange={(val) => handleSelectChange('city', val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 sticky top-0 bg-white border-b">
                          <Input
                            placeholder="Buscar cidade..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <ScrollArea className="h-[200px]">
                          {filteredCities.length > 0 ? (
                            filteredCities.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-sm">
                              {editedJob.state ? 'Nenhuma cidade encontrada' : 'Selecione um estado primeiro'}
                            </div>
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Categoria Profissional</Label>
                  <Select value={editedJob.category} onValueChange={(val) => handleSelectChange('category', val)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-white border-b">
                        <Input
                          placeholder="Buscar categoria..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <ScrollArea className="h-[200px]">
                        {filteredCategories.map(c => (
                          <SelectItem key={c.id} value={c.category_name}>{c.category_name}</SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="job_function">Função/Área</Label>
                  <Select value={editedJob.job_function} onValueChange={(val) => handleSelectChange('job_function', val)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a função" />
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
                        {filteredFunctions.length > 0 ? (
                          filteredFunctions.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-sm">
                            Nenhuma função encontrada
                          </div>
                        )}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tipos de Contratação */}
            <div className="space-y-3">
              <Label>Tipos de Contratação</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CONTRACT_TYPES.map((type) => {
                  const isSelected = editedJob.contract_types?.includes(type.id);
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleContractType(type.id)}
                      className={`justify-start gap-2 h-auto py-2 ${isSelected ? "bg-[#0A66C2] hover:bg-[#004182] text-white" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Vaga</Label>
              <Textarea
                id="description"
                name="description"
                value={editedJob.description}
                onChange={handleInputChange}
                placeholder="Descreva as responsabilidades, requisitos e benefícios..."
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-2">
              <Label htmlFor="additional_info">Informações Adicionais</Label>
              <Textarea
                id="additional_info"
                name="additional_info"
                value={editedJob.additional_info}
                onChange={handleInputChange}
                placeholder="Outras informações relevantes..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Links e Mídia */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Links e Mídia</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="application_link">Link de Candidatura</Label>
                  <Input
                    id="application_link"
                    name="application_link"
                    value={editedJob.application_link}
                    onChange={handleInputChange}
                    placeholder="https://... ou WhatsApp: (83) 99999-9999"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">URL da Imagem</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={editedJob.image_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Localização no Mapa */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                📍 Localização no Mapa
              </h3>
              
              {(!editedJob.city || !editedJob.state) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Atenção: Informe Cidade e Estado</p>
                    <p className="text-xs text-amber-700 mt-1">Para exibir no mapa, preencha os campos acima</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showOnMap" className="font-medium">Exibir no Mapa</Label>
                    <p className="text-xs text-slate-500">Mostrar esta vaga no mapa de oportunidades</p>
                  </div>
                  <Switch
                    id="showOnMap"
                    checked={editedJob.showOnMap}
                    onCheckedChange={(checked) => handleSwitchChange('showOnMap', checked)}
                  />
                </div>

                {editedJob.showOnMap && (
                  <div className="space-y-3 border-t pt-3">
                    <Label>Tipo de Localização</Label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-2 bg-white rounded-lg border cursor-pointer hover:border-blue-300"
                        style={{ borderColor: editedJob.locationType === 'CIDADE' ? '#3b82f6' : '#e2e8f0' }}>
                        <input
                          type="radio"
                          name="locationType"
                          checked={editedJob.locationType === 'CIDADE'}
                          onChange={() => handleSelectChange('locationType', 'CIDADE')}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-sm">🏙️ Geral (Cidade)</div>
                          <div className="text-xs text-slate-500">Pino no centro da cidade</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-2 bg-white rounded-lg border cursor-pointer hover:border-blue-300"
                        style={{ borderColor: editedJob.locationType === 'BAIRRO' ? '#3b82f6' : '#e2e8f0' }}>
                        <input
                          type="radio"
                          name="locationType"
                          checked={editedJob.locationType === 'BAIRRO'}
                          onChange={() => handleSelectChange('locationType', 'BAIRRO')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">📍 Aproximada (Bairro)</div>
                          <div className="text-xs text-slate-500 mb-2">Pino no centro do bairro</div>
                          {editedJob.locationType === 'BAIRRO' && (
                            <Input
                              value={editedJob.neighborhood}
                              onChange={(e) => handleInputChange({ target: { name: 'neighborhood', value: e.target.value }})}
                              placeholder="Nome do bairro"
                              className="h-9 mt-1"
                            />
                          )}
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-2 bg-white rounded-lg border cursor-pointer hover:border-blue-300"
                        style={{ borderColor: editedJob.locationType === 'EXATA' ? '#3b82f6' : '#e2e8f0' }}>
                        <input
                          type="radio"
                          name="locationType"
                          checked={editedJob.locationType === 'EXATA'}
                          onChange={() => handleSelectChange('locationType', 'EXATA')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">🎯 Exata (Endereço completo)</div>
                          <div className="text-xs text-slate-500 mb-2">Pino exato no endereço</div>
                          {editedJob.locationType === 'EXATA' && (
                            <Input
                              value={editedJob.addressText}
                              onChange={(e) => handleInputChange({ target: { name: 'addressText', value: e.target.value }})}
                              placeholder="Rua, número, CEP"
                              className="h-9 mt-1"
                            />
                          )}
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-2 bg-white rounded-lg border cursor-pointer hover:border-blue-300"
                        style={{ borderColor: editedJob.locationType === 'REMOTO' ? '#3b82f6' : '#e2e8f0' }}>
                        <input
                          type="radio"
                          name="locationType"
                          checked={editedJob.locationType === 'REMOTO'}
                          onChange={() => handleSelectChange('locationType', 'REMOTO')}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-sm">💻 Online / Remoto</div>
                          <div className="text-xs text-slate-500">Sem pino no mapa</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configurações de Visibilidade */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Configurações de Visibilidade</h3>
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_premium" className="font-medium">Vaga Premium</Label>
                    <p className="text-xs text-slate-500">Apenas assinantes Premium podem ver</p>
                  </div>
                  <Switch
                    id="is_premium"
                    checked={editedJob.is_premium}
                    onCheckedChange={(checked) => handleSwitchChange('is_premium', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_featured" className="font-medium">Vaga em Destaque</Label>
                    <p className="text-xs text-slate-500">Aparece no topo da lista</p>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={editedJob.is_featured}
                    onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleDelete} 
            disabled={updateJobMutation.isPending || deleteJobMutation.isPending}
            className="rounded-xl text-red-600 hover:bg-red-50 border-red-300 hover:border-red-400 font-medium"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Vaga
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={updateJobMutation.isPending || deleteJobMutation.isPending}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateJobMutation.isPending || deleteJobMutation.isPending}
              className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
            >
              {updateJobMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Atualizar e Salvar
                </>
              )}
            </Button>
          </div>
        </DialogFooter>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-700 mb-2">
                Tem certeza que deseja excluir esta vaga?
              </p>
              <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                <strong>Vaga:</strong> {job?.title}
              </p>
              <p className="text-sm text-red-600 mt-4 font-medium">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteJobMutation.isPending}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDelete}
                disabled={deleteJobMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {deleteJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sim, Excluir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}