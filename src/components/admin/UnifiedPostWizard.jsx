import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronRight, ChevronLeft, Crown, Star, Bell, Send, 
  Calendar, Check, Loader2, Clock, Zap, Mail,
  Briefcase, FileText, UserCheck, GraduationCap, Clock3, Code
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const NOTIFICATION_TEMPLATES = [
  { id: 'urgente', emoji: '🚨', title: 'URGENTE: Nova vaga!', msg: 'Vaga urgente! Processo seletivo relâmpago!' },
  { id: 'oportunidade', emoji: '⭐', title: 'OPORTUNIDADE DE OURO!', msg: 'Nova vaga incrível acabou de ser publicada!' },
  { id: 'chance', emoji: '✨', title: 'NOVA CHANCE!', msg: 'Sua próxima oportunidade está aqui!' },
  { id: 'perfeita', emoji: '🎯', title: 'VAGA PERFEITA!', msg: 'Essa vaga combina com você!' },
  { id: 'salario', emoji: '💰', title: 'SALÁRIO ATRATIVO!', msg: 'Vaga com ótima remuneração!' },
  { id: 'empresa', emoji: '🏢', title: 'EMPRESA TOP!', msg: 'Grande empresa está contratando!' },
  { id: 'exclusiva', emoji: '👑', title: 'VAGA EXCLUSIVA!', msg: 'Oportunidade única no mercado!' },
  { id: 'homeoffice', emoji: '🏠', title: 'HOME OFFICE!', msg: 'Trabalhe de onde quiser!' },
  { id: 'beneficios', emoji: '🎁', title: 'ÓTIMOS BENEFÍCIOS!', msg: 'Pacote de benefícios atrativo!' },
  { id: 'crescimento', emoji: '📈', title: 'OPORTUNIDADE DE CRESCIMENTO!', msg: 'Desenvolva sua carreira conosco!' },
  { id: 'imediato', emoji: '⚡', title: 'CONTRATAÇÃO IMEDIATA!', msg: 'Processo seletivo rápido!' },
  { id: 'junior', emoji: '🌱', title: 'PRIMEIRA OPORTUNIDADE!', msg: 'Vaga para iniciar carreira!' },
  { id: 'senior', emoji: '💼', title: 'VAGA SÊNIOR!', msg: 'Oportunidade para profissionais experientes!' },
  { id: 'destaque', emoji: '🌟', title: 'EM DESTAQUE!', msg: 'Não perca essa chance!' },
];

function getBrasiliaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

export default function UnifiedPostWizard({ 
  jobsData = [],
  onEditJob,
  onPublish,
  onSchedule,
  isLoading = false,
  toolType = 'job'
}) {
  const [step, setStep] = useState(1);
  
  // Etapa 1 - Revisão + Tipos de Contratação + Premium Individual
  const [selectedContractTypes, setSelectedContractTypes] = useState([]);
  const [individualPremiumFlags, setIndividualPremiumFlags] = useState({});
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Etapa 2 - Notificações
  const [sendNotification, setSendNotification] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('urgente');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notifChannels, setNotifChannels] = useState({
    email: false,
    push: false,
    bell: true
  });
  const [notificationConfigured, setNotificationConfigured] = useState(false);
  
  // Etapa 3 - Publicação
  const [publishMode, setPublishMode] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const template = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate);
  const jobCount = jobsData.length;

  const toggleContractType = (type) => {
    setSelectedContractTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const getMinDateTime = () => {
    const brasilia = getBrasiliaTime();
    brasilia.setMinutes(brasilia.getMinutes() + 5);
    return {
      date: brasilia.toISOString().split('T')[0],
      time: brasilia.toTimeString().slice(0, 5)
    };
  };

  const handleSaveNotificationConfig = () => {
    setNotificationConfigured(true);
    setShowNotifDialog(false);
    setStep(4);
  };

  const handlePublish = async () => {
    const brasiliaTime = getBrasiliaTime().toISOString();

    const notificationData = sendNotification && notificationConfigured ? {
      title: customTitle || `${template.emoji} ${template.title}`,
      message: customMessage || template.msg,
      channels: notifChannels
    } : null;

    const scheduleData = publishMode === 'schedule' ? {
      date: scheduleDate,
      time: scheduleTime,
      timezone: 'America/Sao_Paulo'
    } : null;

    // Preparar jobs em lote para acelerar
    const jobsToPublish = jobsData.map((j, idx) => ({
      ...j,
      contract_types: selectedContractTypes,
      is_premium: individualPremiumFlags[idx] || false,
      is_featured: isFeatured,
      published_at: brasiliaTime
    }));

    const finalData = {
      jobs: jobsToPublish,
      notification: notificationData,
      schedule: scheduleData
    };

    if (publishMode === 'schedule') {
      await onSchedule?.(finalData);
    } else {
      await onPublish?.(finalData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Progresso */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600">Progresso</span>
          <span className="text-xs text-slate-500">Etapa {step} de 3</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full transition-all ${
              step >= s ? 'bg-[#0A66C2]' : 'bg-slate-200'
            }`} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-400">
          <span>Revisão</span>
          <span>Notificação</span>
          <span>Publicar</span>
        </div>
      </div>

      {/* ETAPA 1 - Revisão + Tipos de Contratação + Premium Individual */}
      {step === 1 && (
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#0A66C2]/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Tipos de Contratação</h3>
                <p className="text-xs text-slate-500">Selecione pelo menos um tipo</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CONTRACT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedContractTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleContractType(type.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-[#0A66C2] bg-[#0A66C2]/5' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0A66C2]' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {type.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#0A66C2] ml-auto" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedContractTypes.length > 0 && (
              <div className="p-3 bg-[#0A66C2]/5 rounded-lg">
                <p className="text-xs font-semibold text-slate-900 mb-2">Selecionados:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedContractTypes.map(type => (
                    <Badge key={type} className="bg-[#0A66C2] text-white text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700">Vagas para Publicar:</p>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">Destaque</span>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} className="scale-75" />
                </div>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {jobsData.map((job, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-800 truncate">{job.title || 'Sem título'}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.company && <Badge variant="outline" className="text-xs">🏢 {job.company}</Badge>}
                          {job.city && <Badge variant="outline" className="text-xs">📍 {job.city}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-200">
                          <Crown className="w-3.5 h-3.5 text-purple-600" />
                          <Switch
                            checked={individualPremiumFlags[i] || false}
                            onCheckedChange={(checked) => {
                              setIndividualPremiumFlags(prev => ({ ...prev, [i]: checked }));
                            }}
                            className="scale-75"
                          />
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">#{i + 1}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={selectedContractTypes.length === 0}
              className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
            >
              Configurar Notificações
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2 - Notificações */}
      {step === 2 && (
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#0A66C2]/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Configurar Notificações</h3>
                <p className="text-xs text-slate-500">Avisar usuários sobre as novas vagas</p>
              </div>
            </div>

            {/* Toggle Sim/Não */}
            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <p className="text-sm font-semibold text-slate-800 mb-3">Enviar notificações?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSendNotification(false)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    sendNotification === false ? 'border-slate-600 bg-slate-100' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-sm">Não</p>
                </button>
                <button
                  onClick={() => setSendNotification(true)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    sendNotification === true ? 'border-green-600 bg-green-50' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium text-sm">Sim</p>
                </button>
              </div>
            </div>

            {sendNotification === true && (
              <div className="space-y-4">
                {/* Canais de Notificação (SEM WhatsApp) */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 block">Enviar para:</Label>
                  
                  <div className="flex items-center justify-between p-2.5 bg-[#0A66C2]/5 rounded-lg border border-[#0A66C2]/20">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0A66C2]" />
                      <span className="text-xs font-medium">Email</span>
                    </div>
                    <Checkbox 
                      checked={notifChannels.email} 
                      onCheckedChange={(c) => setNotifChannels(prev => ({ ...prev, email: c }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium">Push App</span>
                    </div>
                    <Checkbox 
                      checked={notifChannels.push} 
                      onCheckedChange={(c) => setNotifChannels(prev => ({ ...prev, push: c }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium">Sininho Interno</span>
                    </div>
                    <Checkbox 
                      checked={notifChannels.bell} 
                      onCheckedChange={(c) => setNotifChannels(prev => ({ ...prev, bell: c }))}
                    />
                  </div>
                </div>

                {/* Template */}
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-2 block">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.emoji} {t.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">✍️ Personalizar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate === 'custom' && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Título</Label>
                      <Input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Ex: 🔥 VAGA IMPERDÍVEL!"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Mensagem</Label>
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Ex: Nova oportunidade incrível!"
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Preview:</p>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{template.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {customTitle || `${template.emoji} ${template.title}`}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {customMessage || template.msg}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-11 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => {
                  setNotificationConfigured(true);
                  setStep(3);
                }}
                disabled={sendNotification === null}
                className="flex-1 h-11 bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
              >
                Publicar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3 - Publicação */}
      {step === 3 && (
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Publicação</h3>
                <p className="text-xs text-slate-500">Publicar agora ou agendar</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setPublishMode('now')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  publishMode === 'now' ? 'border-green-600 bg-green-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Publicar Imediatamente</p>
                    <p className="text-xs text-slate-500">Vaga fica disponível agora</p>
                  </div>
                  {publishMode === 'now' && <Check className="w-5 h-5 text-green-600" />}
                </div>
              </button>

              <button
                onClick={() => setPublishMode('schedule')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  publishMode === 'schedule' ? 'border-[#0A66C2] bg-[#0A66C2]/5' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#0A66C2]" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Agendar Publicação</p>
                    <p className="text-xs text-slate-500">Escolher data e hora</p>
                  </div>
                  {publishMode === 'schedule' && <Check className="w-5 h-5 text-[#0A66C2]" />}
                </div>
              </button>
            </div>

            {publishMode === 'schedule' && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Data</Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={getMinDateTime().date}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Hora (Brasília)</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
                {scheduleDate && scheduleTime && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>
                      Publicação: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('pt-BR', { 
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Resumo Final */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-700 mb-2">📋 Resumo</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p>• {jobCount} vaga{jobCount > 1 ? 's' : ''}</p>
                <p>• Tipos: {selectedContractTypes.join(', ')}</p>
                <p>• Premium: {Object.values(individualPremiumFlags).filter(Boolean).length} de {jobCount}</p>
                {isFeatured && <p>• ⭐ Em destaque</p>}
                <p>• Notificações: {sendNotification && notificationConfigured ? '✅ Configuradas' : '❌ Desativadas'}</p>
                <p>• Modo: {publishMode === 'now' ? '⚡ Imediato' : '🕐 Agendado'}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isLoading || (publishMode === 'schedule' && (!scheduleDate || !scheduleTime))}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Publicando...</>
                ) : publishMode === 'schedule' ? (
                  <><Calendar className="w-5 h-5 mr-2" />AGENDAR</>
                ) : (
                  <><Zap className="w-5 h-5 mr-2" />PUBLICAR</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}