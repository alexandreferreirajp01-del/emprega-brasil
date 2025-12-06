import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2, CheckCircle, Repeat, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdvancedScheduler({ 
  jobData, 
  notificationData,
  postType = 'job',
  onScheduled,
  onPublishNow,
  showToast
}) {
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  
  // Repetição
  const [enableRepeat, setEnableRepeat] = useState(false);
  const [repeatType, setRepeatType] = useState('daily'); // daily, weekly, monthly, custom
  const [repeatDays, setRepeatDays] = useState([]); // Para semanal: [1,3,5] = seg, qua, sex
  const [repeatCount, setRepeatCount] = useState(5); // Quantas repetições
  const [customDays, setCustomDays] = useState(1); // Para personalizado

  const WEEKDAYS = [
    { id: 1, label: 'Seg', short: 'S' },
    { id: 2, label: 'Ter', short: 'T' },
    { id: 3, label: 'Qua', short: 'Q' },
    { id: 4, label: 'Qui', short: 'Q' },
    { id: 5, label: 'Sex', short: 'S' },
    { id: 6, label: 'Sáb', short: 'S' },
    { id: 0, label: 'Dom', short: 'D' }
  ];

  const toggleWeekday = (dayId) => {
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter(d => d !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId]);
    }
  };

  const calculateScheduleDates = () => {
    if (!scheduledDate || !scheduledTime) return [];
    
    const baseDate = new Date(`${scheduledDate}T${scheduledTime}`);
    const dates = [baseDate];

    if (!enableRepeat || repeatCount <= 1) return dates;

    for (let i = 1; i < repeatCount; i++) {
      const newDate = new Date(baseDate);
      
      if (repeatType === 'daily') {
        newDate.setDate(newDate.getDate() + i);
      } else if (repeatType === 'weekly') {
        newDate.setDate(newDate.getDate() + (i * 7));
      } else if (repeatType === 'monthly') {
        newDate.setMonth(newDate.getMonth() + i);
      } else if (repeatType === 'custom') {
        newDate.setDate(newDate.getDate() + (i * customDays));
      }
      
      dates.push(newDate);
    }

    return dates;
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      showToast?.('Selecione data e hora', 'error');
      return;
    }

    setScheduling(true);

    try {
      const scheduleDates = calculateScheduleDates();
      
      if (scheduleDates[0] <= new Date()) {
        showToast?.('Data/hora deve ser futura', 'error');
        setScheduling(false);
        return;
      }

      // Criar múltiplos agendamentos
      const promises = scheduleDates.map(date => 
        base44.entities.ScheduledPost.create({
          post_type: postType,
          scheduled_date: date.toISOString(),
          job_data: jobData,
          notification_data: notificationData || {},
          status: 'pending'
        })
      );

      await Promise.all(promises);

      showToast?.(`${scheduleDates.length} agendamento(s) criado(s) com sucesso!`);
      onScheduled?.();
    } catch (error) {
      console.error('Erro ao agendar:', error);
      showToast?.('Erro ao agendar postagem', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getMinTime = () => {
    if (scheduledDate === getMinDate()) {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    }
    return '00:00';
  };

  const scheduleDates = calculateScheduleDates();

  return (
    <Card className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Agendamento Profissional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Agendar */}
        <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-slate-800">Agendar Publicação</p>
              <p className="text-xs text-slate-600">Publicar em data e hora específicas</p>
            </div>
          </div>
          <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
        </div>

        {/* Campos de Data/Hora */}
        {isScheduled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-slate-600">Data</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={getMinDate()}
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-600">Hora</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={scheduledDate === getMinDate() ? getMinTime() : '00:00'}
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Repetição */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-slate-800">Repetir Agendamento</p>
                    <p className="text-xs text-slate-600">Criar múltiplas postagens automáticas</p>
                  </div>
                </div>
                <Switch checked={enableRepeat} onCheckedChange={setEnableRepeat} />
              </div>

              {enableRepeat && (
                <div className="space-y-3">
                  {/* Tipo de Repetição */}
                  <div>
                    <Label className="text-xs text-slate-600 mb-2 block">Frequência</Label>
                    <Select value={repeatType} onValueChange={setRepeatType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Todos os Dias</SelectItem>
                        <SelectItem value="weekly">Toda Semana</SelectItem>
                        <SelectItem value="monthly">Todo Mês</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dias da semana (se semanal) */}
                  {repeatType === 'weekly' && (
                    <div>
                      <Label className="text-xs text-slate-600 mb-2 block">Dias da Semana</Label>
                      <div className="flex gap-2">
                        {WEEKDAYS.map(day => (
                          <button
                            key={day.id}
                            onClick={() => toggleWeekday(day.id)}
                            className={`w-10 h-10 rounded-lg border-2 font-medium text-sm transition-all ${
                              repeatDays.includes(day.id)
                                ? 'border-purple-500 bg-purple-500 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'
                            }`}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intervalo personalizado */}
                  {repeatType === 'custom' && (
                    <div>
                      <Label className="text-xs text-slate-600 mb-2 block">A cada quantos dias?</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={customDays}
                        onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                        className="rounded-lg"
                      />
                    </div>
                  )}

                  {/* Quantidade de repetições */}
                  <div>
                    <Label className="text-xs text-slate-600 mb-2 block">Quantas repetições?</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(parseInt(e.target.value) || 1)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview dos agendamentos */}
            {scheduledDate && scheduledTime && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  {enableRepeat ? `${scheduleDates.length} agendamentos serão criados:` : 'Será publicado em:'}
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {scheduleDates.slice(0, 10).map((date, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                      <span>{date.toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                  ))}
                  {scheduleDates.length > 10 && (
                    <p className="text-xs text-slate-400 italic">+ {scheduleDates.length - 10} mais...</p>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleSchedule}
              disabled={scheduling || !scheduledDate || !scheduledTime}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {scheduling ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Confirmar Agendamento{enableRepeat && ` (${scheduleDates.length}x)`}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Publicar Agora */}
        {!isScheduled && (
          <Button
            onClick={onPublishNow}
            className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Publicar Agora
          </Button>
        )}
      </CardContent>
    </Card>
  );
}