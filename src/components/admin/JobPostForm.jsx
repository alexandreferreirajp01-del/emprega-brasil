import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Image, Upload, Loader2, Save, X, Crown, Sparkles, Camera, FileText, CheckCircle
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

export default function JobPostForm({ 
  cities = [], 
  editingJob = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  showToast
}) {
  const [jobForm, setJobForm] = useState({
    title: editingJob?.title || '',
    company: editingJob?.company || '',
    city: editingJob?.city || '',
    salary_range: editingJob?.salary_range || '',
    job_type: editingJob?.job_type || 'CLT',
    job_function: editingJob?.job_function || '',
    category: editingJob?.category || '',
    description: editingJob?.description || '',
    additional_info: editingJob?.additional_info || '',
    application_link: editingJob?.application_link || '',
    image_url: editingJob?.image_url || '',
    is_premium: editingJob?.is_premium || false,
    is_featured: editingJob?.is_featured || false
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [extractingData, setExtractingData] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [functionSearch, setFunctionSearch] = useState('');

  const filteredCities = cities.filter(city =>
    city.name?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredFunctions = JOB_FUNCTIONS.filter(func =>
    func.toLowerCase().includes(functionSearch.toLowerCase())
  );

  // Upload e extração de dados da imagem com IA
  const handleImageUploadAndExtract = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingImage(true);
    setExtractionProgress('Fazendo upload da imagem...');

    try {
      // Upload da imagem
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult?.file_url;

      if (!fileUrl) {
        showToast?.('Erro no upload da imagem', 'error');
        return;
      }

      setJobForm(prev => ({ ...prev, image_url: fileUrl }));
      setExtractionProgress('Analisando imagem com IA...');
      setExtractingData(true);

      // Extrair dados usando IA
      try {
        const extractedData = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em extrair informações de imagens de vagas de emprego no Brasil.

TAREFA: Analise cuidadosamente esta imagem e extraia TODAS as informações visíveis sobre a vaga de emprego.

IMPORTANTE - EXTRAIA COM PRECISÃO:

1. TÍTULO/CARGO: O nome exato da vaga (ex: Vendedor, Auxiliar Administrativo, Operador de Caixa)

2. EMPRESA: Nome da empresa contratante (se visível na imagem)

3. CIDADE: Identifique a cidade. Se mencionar apenas bairro, identifique a cidade:
   - Mangabeira, Manaíra, Tambaú, Bancários, Cristo, Centro, Torre, Miramar = João Pessoa
   - Intermares, Camboinha, Poço = Cabedelo
   - Catolé, Bodocongó, Liberdade = Campina Grande
   - Se não identificar, deixe vazio

4. SALÁRIO: Valor exato ou faixa salarial mencionada (ex: R$ 1.500,00 ou R$ 1.500 a R$ 2.000)

5. TIPO DE CONTRATO: Identifique o tipo:
   - CLT (carteira assinada, efetivo)
   - Estágio
   - Home Office (remoto, trabalho de casa)
   - Jovem Aprendiz (menor aprendiz)
   - Temporário
   - Freelancer
   - PJ

6. DESCRIÇÃO COMPLETA: Transcreva TUDO que está escrito na imagem:
   - Requisitos obrigatórios
   - Requisitos desejáveis
   - Benefícios oferecidos
   - Horário de trabalho
   - Informações de contato (WhatsApp, email, telefone)
   - Endereço se houver
   - Qualquer outra informação

REGRAS:
- Extraia EXATAMENTE o que está escrito
- Se não conseguir identificar um campo, retorne string vazia ""
- Números de telefone devem incluir DDD
- Preserve quebras de linha na descrição usando \\n`,
          file_urls: [fileUrl],
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título/cargo da vaga" },
              company: { type: "string", description: "Nome da empresa" },
              city: { type: "string", description: "Cidade da vaga" },
              salary_range: { type: "string", description: "Faixa salarial" },
              job_type: { type: "string", description: "Tipo: CLT, Estágio, Home Office, Jovem Aprendiz, Temporário, Freelancer, PJ" },
              description: { type: "string", description: "Descrição completa com todos os detalhes" }
            }
          }
        });

        console.log('Dados extraídos:', extractedData);

        if (extractedData && typeof extractedData === 'object') {
          // Mapear job_type extraído para valores válidos
          let mappedJobType = extractedData.job_type || '';
          const jobTypeMap = {
            'clt': 'CLT',
            'carteira assinada': 'CLT',
            'efetivo': 'CLT',
            'estágio': 'Estágio',
            'estagio': 'Estágio',
            'home office': 'Home Office',
            'remoto': 'Home Office',
            'jovem aprendiz': 'Jovem Aprendiz',
            'menor aprendiz': 'Jovem Aprendiz',
            'temporário': 'Temporário',
            'temporario': 'Temporário',
            'freelancer': 'Freelancer',
            'freela': 'Freelancer',
            'pj': 'PJ',
            'pessoa jurídica': 'PJ'
          };
          
          const lowerType = mappedJobType.toLowerCase();
          for (const [key, value] of Object.entries(jobTypeMap)) {
            if (lowerType.includes(key)) {
              mappedJobType = value;
              break;
            }
          }

          // Verificar se a cidade extraída está na lista
          let cityToUse = '';
          if (extractedData.city) {
            const foundCity = cities.find(c => 
              c.name?.toLowerCase() === extractedData.city.toLowerCase()
            );
            cityToUse = foundCity ? foundCity.name : '';
          }

          setJobForm(prev => ({
            ...prev,
            title: extractedData.title || prev.title,
            company: extractedData.company || prev.company,
            city: cityToUse || prev.city,
            salary_range: extractedData.salary_range || prev.salary_range,
            job_type: ['CLT', 'Estágio', 'Home Office', 'Jovem Aprendiz', 'Temporário', 'Freelancer', 'PJ'].includes(mappedJobType) 
              ? mappedJobType 
              : prev.job_type,
            description: extractedData.description || prev.description,
            image_url: fileUrl
          }));

          setExtractionProgress('Dados extraídos com sucesso!');
          showToast?.('Dados extraídos automaticamente! Revise e complete as informações.');
          
          setTimeout(() => setExtractionProgress(''), 3000);
        } else {
          setExtractionProgress('');
          showToast?.('Imagem carregada! Preencha os dados manualmente.');
        }
      } catch (extractError) {
        console.error('Erro na extração:', extractError);
        setExtractionProgress('');
        showToast?.('Imagem carregada! Preencha os dados manualmente.');
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      showToast?.('Erro no upload da imagem', 'error');
    } finally {
      setUploadingImage(false);
      setExtractingData(false);
    }
  };

  // Upload simples de imagem (sem extração)
  const handleSimpleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) {
        setJobForm(prev => ({ ...prev, image_url: result.file_url }));
        showToast?.('Imagem carregada!');
      }
    } catch (err) {
      console.error('Erro upload:', err);
      showToast?.('Erro ao carregar imagem', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Preparar dados - remover campos vazios
    const jobData = {};
    Object.entries(jobForm).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        jobData[key] = value;
      }
    });

    onSubmit(jobData);
  };

  return (
    <div className="animate-fade-in">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{editingJob ? 'Editar Vaga' : 'Nova Vaga'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* AI Image Extraction Section */}
          <div className="mb-6 p-5 border-2 border-dashed border-[#0056ff]/30 rounded-2xl bg-gradient-to-br from-[#0056ff]/5 to-transparent">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0056ff]/10 rounded-2xl mb-3">
                <Sparkles className="w-8 h-8 text-[#0056ff]" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Extração Inteligente com IA</h3>
              <p className="text-sm text-slate-600 mb-4">
                Carregue uma imagem de vaga e a IA preencherá os campos automaticamente
              </p>
              
              <label className="cursor-pointer inline-block">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={handleImageUploadAndExtract}
                  disabled={uploadingImage}
                />
                <Button 
                  type="button" 
                  className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl pointer-events-none"
                  disabled={uploadingImage}
                >
                  {uploadingImage || extractingData ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {extractionProgress || 'Processando...'}
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Carregar Imagem e Extrair Dados
                    </>
                  )}
                </Button>
              </label>
              
              {extractionProgress && extractionProgress.includes('sucesso') && (
                <div className="mt-3 flex items-center justify-center gap-2 text-green-600 animate-fade-in">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{extractionProgress}</span>
                </div>
              )}
              
              <p className="text-xs text-slate-400 mt-3">
                Suporta JPG, PNG, GIF, WEBP • Tire uma foto ou escolha da galeria
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título da Vaga *</Label>
                <Input
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  placeholder="Ex: Vendedor"
                  className="rounded-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input
                  value={jobForm.company}
                  onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                  placeholder="Nome da empresa (opcional)"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={jobForm.city} onValueChange={(v) => setJobForm({...jobForm, city: v})}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <div className="p-2 sticky top-0 bg-white z-10 border-b">
                      <Input
                        type="text"
                        placeholder="Pesquisar..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <ScrollArea className="h-64">
                      {filteredCities.map(city => (
                        <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Faixa Salarial</Label>
                <Input
                  value={jobForm.salary_range}
                  onChange={(e) => setJobForm({...jobForm, salary_range: e.target.value})}
                  placeholder="Ex: R$ 1.500 - R$ 2.000"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select value={jobForm.job_type} onValueChange={(v) => setJobForm({...jobForm, job_type: v})}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="Home Office">Home Office</SelectItem>
                    <SelectItem value="Estágio">Estágio</SelectItem>
                    <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
                    <SelectItem value="Temporário">Temporário</SelectItem>
                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={jobForm.job_function} onValueChange={(v) => setJobForm({...jobForm, job_function: v})}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <div className="p-2 sticky top-0 bg-white z-10 border-b">
                      <Input
                        type="text"
                        placeholder="Pesquisar..."
                        value={functionSearch}
                        onChange={(e) => setFunctionSearch(e.target.value)}
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <ScrollArea className="h-64">
                      {filteredFunctions.map(func => (
                        <SelectItem key={func} value={func}>{func}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição da Vaga</Label>
              <Textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                placeholder="Descreva a vaga: requisitos, benefícios, horário, contato..."
                className="rounded-lg min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Informações Adicionais</Label>
              <Textarea
                value={jobForm.additional_info}
                onChange={(e) => setJobForm({...jobForm, additional_info: e.target.value})}
                placeholder="Contato, benefícios extras, horários, etc..."
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Link/Instrução para Candidatura</Label>
              <Input
                value={jobForm.application_link}
                onChange={(e) => setJobForm({...jobForm, application_link: e.target.value})}
                placeholder="https://... ou instruções de como se candidatar"
                className="rounded-lg"
              />
            </div>

            {/* Image Preview and Upload */}
            <div className="space-y-2">
              <Label>Imagem da Vaga</Label>
              <div className="flex gap-2">
                <Input
                  value={jobForm.image_url}
                  onChange={(e) => setJobForm({...jobForm, image_url: e.target.value})}
                  placeholder="URL da imagem"
                  className="rounded-lg flex-1"
                />
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    className="hidden" 
                    onChange={handleSimpleImageUpload}
                    disabled={uploadingImage}
                  />
                  <Button type="button" variant="outline" disabled={uploadingImage} className="rounded-lg pointer-events-none">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </label>
              </div>
              {jobForm.image_url && (
                <div className="relative inline-block">
                  <img src={jobForm.image_url} alt="Preview" className="w-40 h-32 object-cover rounded-lg mt-2 border" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setJobForm(prev => ({ ...prev, image_url: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-6 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={jobForm.is_premium}
                  onCheckedChange={(v) => setJobForm({...jobForm, is_premium: v})}
                />
                <Label className="cursor-pointer flex items-center gap-1">
                  <Crown className="w-4 h-4 text-purple-600" />
                  Apenas para Membros Premium
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  checked={jobForm.is_featured}
                  onCheckedChange={(v) => setJobForm({...jobForm, is_featured: v})}
                />
                <Label className="cursor-pointer">
                  Vaga em Destaque
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                disabled={isSubmitting || !jobForm.title}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                {editingJob ? 'Atualizar Vaga' : 'Publicar Vaga'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}