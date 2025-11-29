import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, Loader2, Save, X, Crown, Sparkles, Camera, CheckCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const JOB_FUNCTIONS = [
  "Assistente administrativo", "Auxiliar administrativo", "Secretária executiva", "Recepcionista",
  "Atendente de escritório", "Office boy / Office girl", "Analista administrativo", "Contador",
  "Auxiliar contábil", "Analista financeiro", "Vendedor interno", "Vendedor externo",
  "Consultor comercial", "Promotor de vendas", "Gerente de vendas", "Social media",
  "Designer gráfico", "Copywriter", "Editor de vídeo", "Fotógrafo", "Programador front-end",
  "Programador back-end", "Desenvolvedor mobile", "Suporte técnico", "Técnico de informática",
  "Enfermeiro", "Técnico de enfermagem", "Farmacêutico", "Nutricionista", "Fisioterapeuta",
  "Psicólogo", "Cuidador de idosos", "Pedreiro", "Eletricista", "Pintor", "Motorista de aplicativo",
  "Motoboy", "Entregador", "Estoquista", "Auxiliar de serviços gerais", "Porteiro", "Segurança",
  "Cozinheiro", "Auxiliar de cozinha", "Garçom", "Atendente de lanchonete", "Professor",
  "Cabeleireiro", "Barbeiro", "Manicure", "Personal trainer", "Advogado", "Recrutador",
  "Analista de RH", "Operador de máquinas", "Soldador", "Agricultor", "Veterinário",
  "Assistente virtual", "Freelancer de design", "Mecânico", "Corretor de imóveis", "Outros"
];

const JOB_TYPES = ["CLT", "Home Office", "Estágio", "Jovem Aprendiz", "Temporário", "Freelancer", "PJ"];

const initialFormState = {
  title: '',
  company: '',
  city: '',
  salary_range: '',
  job_type: 'CLT',
  job_function: '',
  category: '',
  description: '',
  additional_info: '',
  application_link: '',
  image_url: '',
  is_premium: false,
  is_featured: false
};

export default function JobPostForm({ 
  cities = [], 
  editingJob = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  showToast = () => {}
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [funcFilter, setFuncFilter] = useState('');

  useEffect(() => {
    if (editingJob && editingJob.id) {
      setFormData({
        title: editingJob.title || '',
        company: editingJob.company || '',
        city: editingJob.city || '',
        salary_range: editingJob.salary_range || '',
        job_type: editingJob.job_type || 'CLT',
        job_function: editingJob.job_function || '',
        category: editingJob.category || '',
        description: editingJob.description || '',
        additional_info: editingJob.additional_info || '',
        application_link: editingJob.application_link || '',
        image_url: editingJob.image_url || '',
        is_premium: Boolean(editingJob.is_premium),
        is_featured: Boolean(editingJob.is_featured)
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingJob]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageExtract = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setProgress('Enviando imagem...');

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult?.file_url;

      if (!fileUrl) {
        showToast('Erro no upload', 'error');
        setUploading(false);
        setProgress('');
        return;
      }

      updateField('image_url', fileUrl);
      setProgress('Analisando com IA...');
      setExtracting(true);

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise esta imagem de vaga de emprego e extraia as informações.
          
Retorne os dados encontrados:
- title: cargo/título da vaga
- company: nome da empresa
- city: cidade (João Pessoa, Campina Grande, Cabedelo, etc)
- salary_range: salário mencionado
- job_type: tipo (CLT, Estágio, Home Office, Jovem Aprendiz, Temporário, Freelancer, PJ)
- description: descrição completa, requisitos, benefícios, contato

Se não encontrar algum campo, retorne string vazia.`,
          file_urls: [fileUrl],
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              city: { type: "string" },
              salary_range: { type: "string" },
              job_type: { type: "string" },
              description: { type: "string" }
            }
          }
        });

        if (result && typeof result === 'object') {
          const typeMap = {
            'clt': 'CLT', 'carteira': 'CLT', 'efetivo': 'CLT',
            'estágio': 'Estágio', 'estagio': 'Estágio',
            'home office': 'Home Office', 'remoto': 'Home Office',
            'jovem aprendiz': 'Jovem Aprendiz', 'aprendiz': 'Jovem Aprendiz',
            'temporário': 'Temporário', 'temporario': 'Temporário',
            'freelancer': 'Freelancer', 'freela': 'Freelancer',
            'pj': 'PJ', 'pessoa jurídica': 'PJ'
          };

          let mappedType = result.job_type || '';
          const lower = mappedType.toLowerCase();
          for (const [key, val] of Object.entries(typeMap)) {
            if (lower.includes(key)) {
              mappedType = val;
              break;
            }
          }

          const foundCity = cities.find(c => 
            c.name?.toLowerCase() === (result.city || '').toLowerCase()
          );

          setFormData(prev => ({
            ...prev,
            title: result.title || prev.title,
            company: result.company || prev.company,
            city: foundCity?.name || prev.city,
            salary_range: result.salary_range || prev.salary_range,
            job_type: JOB_TYPES.includes(mappedType) ? mappedType : prev.job_type,
            description: result.description || prev.description,
            image_url: fileUrl
          }));

          setProgress('Dados extraídos!');
          showToast('Dados extraídos! Revise as informações.');
        } else {
          showToast('Imagem carregada. Preencha manualmente.');
        }
      } catch (err) {
        console.error('Erro extração:', err);
        showToast('Imagem carregada. Preencha manualmente.');
      }
    } catch (err) {
      console.error('Erro upload:', err);
      showToast('Erro ao enviar imagem', 'error');
    } finally {
      setUploading(false);
      setExtracting(false);
      setTimeout(() => setProgress(''), 3000);
    }
  };

  const handleSimpleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) {
        updateField('image_url', result.file_url);
        showToast('Imagem carregada!');
      }
    } catch (err) {
      showToast('Erro ao carregar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        data[key] = value;
      }
    });

    onSubmit(data);
  };

  const filteredCities = cities.filter(c => 
    c.name?.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const filteredFuncs = JOB_FUNCTIONS.filter(f => 
    f.toLowerCase().includes(funcFilter.toLowerCase())
  );

  return (
    <Card className="shadow-lg rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>{editingJob ? 'Editar Vaga' : 'Nova Vaga'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* AI Extraction */}
        <div className="mb-6 p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">Extração com IA</h3>
            <p className="text-xs text-slate-500 mb-3">
              Carregue uma imagem e a IA preenche automaticamente
            </p>
            
            <label className="cursor-pointer inline-block">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleImageExtract}
                disabled={uploading || extracting}
              />
              <Button 
                type="button" 
                className="bg-blue-600 hover:bg-blue-700 rounded-lg text-sm pointer-events-none"
                disabled={uploading || extracting}
              >
                {uploading || extracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {progress || 'Processando...'}
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Carregar e Extrair
                  </>
                )}
              </Button>
            </label>
            
            {progress && progress.includes('extraídos') && (
              <div className="mt-2 flex items-center justify-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>{progress}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Título da Vaga *</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Ex: Vendedor"
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Empresa</Label>
              <Input
                value={formData.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Nome da empresa"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Cidade</Label>
              <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Buscar..."
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <ScrollArea className="h-48">
                    {filteredCities.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Faixa Salarial</Label>
              <Input
                value={formData.salary_range}
                onChange={(e) => updateField('salary_range', e.target.value)}
                placeholder="R$ 1.500 - R$ 2.000"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Tipo de Contrato</Label>
              <Select value={formData.job_type} onValueChange={(v) => updateField('job_type', v)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Função</Label>
              <Select value={formData.job_function} onValueChange={(v) => updateField('job_function', v)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Buscar..."
                      value={funcFilter}
                      onChange={(e) => setFuncFilter(e.target.value)}
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <ScrollArea className="h-48">
                    {filteredFuncs.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Requisitos, benefícios, horário, contato..."
              className="rounded-lg min-h-[150px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Link para Candidatura</Label>
            <Input
              value={formData.application_link}
              onChange={(e) => updateField('application_link', e.target.value)}
              placeholder="https://... ou instruções"
              className="rounded-lg"
            />
          </div>

          {/* Image */}
          <div className="space-y-1">
            <Label className="text-sm">Imagem</Label>
            <div className="flex gap-2">
              <Input
                value={formData.image_url}
                onChange={(e) => updateField('image_url', e.target.value)}
                placeholder="URL da imagem"
                className="rounded-lg flex-1"
              />
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={handleSimpleUpload}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" disabled={uploading} className="rounded-lg pointer-events-none">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </label>
            </div>
            {formData.image_url && (
              <div className="relative inline-block mt-2">
                <img src={formData.image_url} alt="" className="w-32 h-24 object-cover rounded-lg border" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                  onClick={() => updateField('image_url', '')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_premium}
                onCheckedChange={(v) => updateField('is_premium', v)}
              />
              <Label className="text-sm flex items-center gap-1 cursor-pointer">
                <Crown className="w-4 h-4 text-purple-600" />
                Premium
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(v) => updateField('is_featured', v)}
              />
              <Label className="text-sm cursor-pointer">Destaque</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
              disabled={isSubmitting || !formData.title}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingJob ? 'Atualizar' : 'Publicar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-lg">
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}