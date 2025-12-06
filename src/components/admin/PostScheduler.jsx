import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PostScheduler({ 
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

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      showToast?.('Selecione data e hora', 'error');
      return;
    }

    setScheduling(true);

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      if (scheduledDateTime <= new Date()) {
        showToast?.('Data/hora deve ser futura', 'error');
        setScheduling(false);
        return;
      }

      await base44.entities.ScheduledPost.create({
        post_type: postType,
        scheduled_date: scheduledDateTime.toISOString(),
        job_data: jobData,
        notification_data: notificationData || {},
        status: 'pending'
      });

      showToast?.('Postagem agendada com sucesso!');
      onScheduled?.();
    } catch (error) {
      console.error('Erro ao agendar:', error);
      showToast?.('Erro ao agendar postagem', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handlePublishNow = () => {
    onPublishNow?.();
  };

  // Data mínima: agora
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Hora mínima: se data é hoje, hora atual, senão 00:00
  const getMinTime = () => {
    if (scheduledDate === getMinDate()) {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    }
    return '00:00';
  };

  return (
    <Card className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Agendamento de Publicação
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
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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

            {scheduledDate && scheduledTime && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-blue-600" />
                  Será publicado em: <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('pt-BR')}</strong>
                </p>
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
                  Confirmar Agendamento
                </>
              )}
            </Button>
          </div>
        )}

        {/* Publicar Agora */}
        {!isScheduled && (
          <Button
            onClick={handlePublishNow}
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