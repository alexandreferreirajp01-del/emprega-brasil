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
                          ? 'border-[#0A66C2] bg-[#0A66C2]/5' 
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

              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-xs">WhatsApp</span>
                </div>
                <Switch checked={false} disabled />
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