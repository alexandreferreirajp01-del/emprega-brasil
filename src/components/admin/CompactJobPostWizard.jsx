import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, Clock, Send, Crown, Star, Calendar, CheckCircle, Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const NOTIFICATION_TEMPLATES = [
  { id: 'oportunidade', emoji: '⭐', title: 'OPORTUNIDADE DE OURO!', msg: 'Nova vaga incrível acabou de ser publicada!' },
  { id: 'urgente', emoji: '🚨', title: 'URGENTE: Nova vaga!', msg: 'Vaga urgente com processo seletivo relâmpago!' },
  { id: 'chance', emoji: '✨', title: 'NOVA CHANCE!', msg: 'Sua próxima oportunidade pode estar aqui!' },
  { id: 'perfeita', emoji: '🎯', title: 'VAGA PERFEITA!', msg: 'Essa vaga tem tudo a ver com o seu perfil!' },
  { id: 'acabou', emoji: '⚡', title: 'ACABOU DE SAIR!', msg: 'Vaga fresquinha! Seja o primeiro a se candidatar!' },
  { id: 'salario', emoji: '💰', title: 'SALÁRIO ATRATIVO!', msg: 'Vaga com ótima remuneração disponível!' },
  { id: 'empresa', emoji: '🏢', title: 'EMPRESA TOP!', msg: 'Grande empresa está contratando agora!' },
  { id: 'carreira', emoji: '📈', title: 'CRESÇA NA CARREIRA!', msg: 'Oportunidade para dar o próximo passo!' }
];

const NOTIFICATION_ICONS = [
  { id: 'job', label: 'Vaga', emoji: '💼' },
  { id: 'star', label: 'Destaque', emoji: '⭐' },
  { id: 'fire', label: 'Urgente', emoji: '🔥' },
  { id: 'crown', label: 'Premium', emoji: '👑' },
  { id: 'rocket', label: 'Lançamento', emoji: '🚀' }
];

export default function CompactJobPostWizard({ 
  jobData,
  onPublish,
  isLoading = false
}) {
  const [step, setStep] = useState(1);
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sendNotification, setSendNotification] = useState(false);
  const [notificationTemplate, setNotificationTemplate] = useState('oportunidade');
  const [notificationIcon, setNotificationIcon] = useState('job');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const selectedTemplate = NOTIFICATION_TEMPLATES.find(t => t.id === notificationTemplate);
  const selectedIcon = NOTIFICATION_ICONS.find(i => i.id === notificationIcon);

  const handlePublish = async () => {
    const notificationData = sendNotification ? {
      title: `${selectedTemplate.emoji} ${selectedTemplate.title}`,
      message: selectedTemplate.msg,
      icon: notificationIcon,
      premiumOnly,
      sendEmail
    } : null;

    const scheduleData = isScheduled && scheduledDate && scheduledTime ? {
      date: scheduledDate,
      time: scheduledTime
    } : null;

    await onPublish({
      ...jobData,
      is_premium: isPremium,
      is_featured: isFeatured,
      notification: notificationData,
      schedule: scheduleData
    });
  };

  const canPublish = () => {
    if (isScheduled) {
      return scheduledDate && scheduledTime;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Etapa 1: Visibilidade */}
      <Card className="rounded-xl border-2">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            1. Visibilidade da Vaga
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsPremium(!isPremium)}
              className={`p-3 rounded-lg border-2 transition-all ${
                isPremium ? 'border-purple-600 bg-purple-50' : 'border-slate-200'
              }`}
            >
              <Crown className={`w-5 h-5 mx-auto mb-1 ${isPremium ? 'text-purple-600' : 'text-slate-400'}`} />
              <p className="text-xs font-medium">Premium</p>
            </button>
            <button
              onClick={() => setIsFeatured(!isFeatured)}
              className={`p-3 rounded-lg border-2 transition-all ${
                isFeatured ? 'border-yellow-600 bg-yellow-50' : 'border-slate-200'
              }`}
            >
              <Star className={`w-5 h-5 mx-auto mb-1 ${isFeatured ? 'text-yellow-600' : 'text-slate-400'}`} />
              <p className="text-xs font-medium">Destaque</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Etapa 2: Notificação */}
      <Card className="rounded-xl border-2">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              2. Notificação
            </h3>
            <Switch checked={sendNotification} onCheckedChange={setSendNotification} />
          </div>

          {sendNotification && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Template</Label>
                <Select value={notificationTemplate} onValueChange={setNotificationTemplate}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.emoji} {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Ícone</Label>
                <div className="grid grid-cols-5 gap-2">
                  {NOTIFICATION_ICONS.map(icon => (
                    <button
                      key={icon.id}
                      onClick={() => setNotificationIcon(icon.id)}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        notificationIcon === icon.id 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="text-xl">{icon.emoji}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span className="text-xs">Apenas Premium</span>
                </div>
                <Switch checked={premiumOnly} onCheckedChange={setPremiumOnly} />
              </div>

              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs">Enviar Email</span>
                </div>
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              </div>

              {selectedTemplate && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-medium text-slate-700 mb-1">Preview:</p>
                  <p className="text-xs text-slate-600">{selectedTemplate.emoji} {selectedTemplate.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedTemplate.msg}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Etapa 3: Agendamento */}
      <Card className="rounded-xl border-2">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              3. Agendamento
            </h3>
            <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Data</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Hora (Brasília)</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Publicar */}
      <Button
        onClick={handlePublish}
        disabled={isLoading || !canPublish()}
        className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl text-base font-semibold disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Publicando...
          </>
        ) : isScheduled ? (
          <>
            <Calendar className="w-5 h-5 mr-2" />
            Agendar Publicação
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            PUBLICAR VAGA
          </>
        )}
      </Button>
    </div>
  );
}