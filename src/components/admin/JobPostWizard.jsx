import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Clock, Bell, Users, Eye, Loader2,
  Globe, Crown, MapPin, Lock, Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Componente para ETAPA 1 - Dados da Vaga
function Step1JobData({ data, onChange, cities, functions }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold">1</span>
          </div>
          Dados da Vaga
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Título da Vaga *</Label>
          <Input
            value={data.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Ex: Vendedor, Auxiliar Administrativo..."
          />
        </div>

        <div>
          <Label>Empresa *</Label>
          <Input
            value={data.company || ''}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Nome da empresa"
          />
        </div>

        <div>
          <Label>Função</Label>
          <Select value={data.job_function || ''} onValueChange={(val) => onChange({ job_function: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent>
              {functions?.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Cidade</Label>
          <Select value={data.city || ''} onValueChange={(val) => onChange({ city: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cidade" />
            </SelectTrigger>
            <SelectContent>
              {cities?.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Descrição *</Label>
          <Textarea
            value={data.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Descrição da vaga, requisitos, benefícios..."
            className="min-h-[120px]"
          />
        </div>

        <div>
          <Label>Salário</Label>
          <Input
            value={data.salary_range || ''}
            onChange={(e) => onChange({ salary_range: e.target.value })}
            placeholder="Ex: R$ 1.500 ou A combinar"
          />
        </div>

        <div>
          <Label>Tipo de Contrato</Label>
          <Select value={data.job_type || ''} onValueChange={(val) => onChange({ job_type: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLT">CLT</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Estágio">Estágio</SelectItem>
              <SelectItem value="Temporário">Temporário</SelectItem>
              <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
              <SelectItem value="Freelancer">Freelancer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Link de Candidatura</Label>
          <Input
            value={data.application_link || ''}
            onChange={(e) => onChange({ application_link: e.target.value })}
            placeholder="https://... ou WhatsApp"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para ETAPA 2 - Visibilidade
function Step2Visibility({ visibility, onChange }) {
  const options = [
    { id: 'all', label: 'Todos os Usuários', icon: Globe, color: 'blue', desc: 'Qualquer pessoa pode ver' },
    { id: 'premium', label: 'Apenas Premium', icon: Crown, color: 'purple', desc: 'Exclusivo para assinantes' },
    { id: 'region', label: 'Apenas Região', icon: MapPin, color: 'green', desc: 'Filtrar por localização' },
    { id: 'private', label: 'Privada', icon: Lock, color: 'red', desc: 'Somente moderadores' }
  ];

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 font-bold">2</span>
          </div>
          Configurações de Visibilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              visibility === opt.id
                ? `border-${opt.color}-600 bg-${opt.color}-50`
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${opt.color}-100 rounded-lg flex items-center justify-center`}>
                <opt.icon className={`w-5 h-5 text-${opt.color}-600`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{opt.label}</p>
                <p className="text-sm text-slate-500">{opt.desc}</p>
              </div>
              {visibility === opt.id && (
                <CheckCircle2 className={`w-5 h-5 text-${opt.color}-600`} />
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

// Componente para ETAPA 3 - Notificação
function Step3Notification({ enabled, template, premiumOnly, sendEmail, onChange }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-bold">3</span>
          </div>
          Configurações de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Habilitar Notificação */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-600" />
            <div>
              <p className="font-medium text-slate-800">Enviar Notificação?</p>
              <p className="text-sm text-slate-500">Push + Sininho no app</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={(val) => onChange({ enabled: val })} />
        </div>

        {enabled && (
          <>
            {/* Template */}
            <div className="space-y-3">
              <Label>Título da Notificação *</Label>
              <Input
                value={template?.title || ''}
                onChange={(e) => onChange({ template: { ...template, title: e.target.value } })}
                placeholder="Ex: Nova vaga disponível!"
              />

              <Label>Mensagem *</Label>
              <Textarea
                value={template?.message || ''}
                onChange={(e) => onChange({ template: { ...template, message: e.target.value } })}
                placeholder="Descreva a notificação..."
                className="min-h-[80px]"
              />
            </div>

            {/* Opções Adicionais */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Apenas Premium</p>
                  <p className="text-xs text-slate-500">Enviar só para assinantes</p>
                </div>
                <Switch checked={premiumOnly} onCheckedChange={(val) => onChange({ premiumOnly: val })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Enviar E-mail</p>
                  <p className="text-xs text-slate-500">Além do push, enviar por email</p>
                </div>
                <Switch checked={sendEmail} onCheckedChange={(val) => onChange({ sendEmail: val })} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para ETAPA 4 - Agendamento
function Step4Scheduling({ enabled, date, time, onChange }) {
  const getMinDate = () => new Date().toISOString().split('T')[0];
  const getMinTime = () => {
    if (date === getMinDate()) {
      return new Date().toTimeString().slice(0, 5);
    }
    return '00:00';
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 font-bold">4</span>
          </div>
          Agendamento (Opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-600" />
            <div>
              <p className="font-medium text-slate-800">Programar Publicação</p>
              <p className="text-sm text-slate-500">Escolha data e hora futura</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={(val) => onChange({ enabled: val })} />
        </div>

        {enabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={date || ''}
                  onChange={(e) => onChange({ date: e.target.value })}
                  min={getMinDate()}
                />
              </div>
              <div>
                <Label>Hora (Brasília)</Label>
                <Input
                  type="time"
                  value={time || ''}
                  onChange={(e) => onChange({ time: e.target.value })}
                  min={getMinTime()}
                />
              </div>
            </div>

            {date && time && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Será publicado em: {new Date(`${date}T${time}`).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente Principal - Wizard Completo
export default function JobPostWizard({ 
  initialData = {}, 
  cities = [], 
  functions = [],
  onPublish,
  isPublishing = false
}) {
  const [jobData, setJobData] = useState(initialData);
  const [visibility, setVisibility] = useState('all');
  const [notification, setNotification] = useState({
    enabled: false,
    template: { title: '', message: '' },
    premiumOnly: false,
    sendEmail: false
  });
  const [notificationChoiceMade, setNotificationChoiceMade] = useState(false);
  const [scheduling, setScheduling] = useState({
    enabled: false,
    date: '',
    time: ''
  });

  const updateJobData = (updates) => {
    setJobData(prev => ({ ...prev, ...updates }));
  };

  const updateNotification = (updates) => {
    setNotification(prev => ({ ...prev, ...updates }));
    if (updates.hasOwnProperty('enabled')) {
      setNotificationChoiceMade(true);
    }
  };

  const updateScheduling = (updates) => {
    setScheduling(prev => ({ ...prev, ...updates }));
  };

  const isValid = () => {
    if (!jobData.title || !jobData.company || !jobData.description) return false;
    if (!notificationChoiceMade) return false;
    if (notification.enabled && (!notification.template?.title || !notification.template?.message)) return false;
    if (scheduling.enabled && (!scheduling.date || !scheduling.time)) return false;
    return true;
  };

  const handlePublish = () => {
    if (!isValid()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const payload = {
      jobData: {
        ...jobData,
        is_premium: visibility === 'premium',
        is_featured: false
      },
      visibility,
      notification: notification.enabled ? notification : null,
      scheduling: scheduling.enabled ? scheduling : null,
      uuid: crypto.randomUUID() // Anti-duplicação
    };

    onPublish(payload);
  };

  return (
    <div className="space-y-6">
      <Step1JobData
        data={jobData}
        onChange={updateJobData}
        cities={cities}
        functions={functions}
      />

      <Step2Visibility
        visibility={visibility}
        onChange={setVisibility}
      />

      <Step3Notification
        enabled={notification.enabled}
        template={notification.template}
        premiumOnly={notification.premiumOnly}
        sendEmail={notification.sendEmail}
        onChange={updateNotification}
      />

      <Step4Scheduling
        enabled={scheduling.enabled}
        date={scheduling.date}
        time={scheduling.time}
        onChange={updateScheduling}
      />

      {/* BOTÃO DE PUBLICAR (DESABILITADO ATÉ ESCOLHER NOTIFICAÇÃO) */}
      <Button
        onClick={handlePublish}
        disabled={!isValid() || isPublishing}
        className="w-full h-14 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPublishing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Publicando...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            PUBLICAR VAGA
          </>
        )}
      </Button>

      {/* ESCOLHA DE NOTIFICAÇÃO - ABAIXO DO BOTÃO */}
      {!notificationChoiceMade && (
        <Card className="rounded-2xl border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Bell className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Enviar Notificação?</h3>
                <p className="text-sm text-slate-600">
                  Escolha se deseja notificar os usuários sobre esta vaga para habilitar a publicação.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setNotification(prev => ({ ...prev, enabled: false }));
                  setNotificationChoiceMade(true);
                }}
                className="h-12 border-2 hover:border-slate-400"
              >
                <X className="w-4 h-4 mr-2" />
                Não Enviar
              </Button>
              <Button
                onClick={() => {
                  setNotification(prev => ({ ...prev, enabled: true }));
                  setNotificationChoiceMade(true);
                }}
                className="h-12 bg-green-600 hover:bg-green-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Sim, Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notificationChoiceMade && (
        <div className="text-center text-sm text-slate-500">
          Notificação: {notification.enabled ? '✅ Será enviada' : '❌ Não será enviada'}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotificationChoiceMade(false)}
            className="ml-2 text-blue-600 hover:text-blue-700"
          >
            Alterar
          </Button>
        </div>
      )}
    </div>
  );
}