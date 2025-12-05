import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, Send, Loader2, Image, Link as LinkIcon, 
  Users, Crown, Briefcase, Shield, UserX, CheckCircle,
  Trash2, Upload
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const USER_TYPES = [
  { id: 'all', label: 'Todos', icon: Users, color: 'bg-green-100 text-green-700' },
  { id: 'visitor', label: 'Visitantes', icon: UserX, color: 'bg-gray-100 text-gray-600' },
  { id: 'basic', label: 'Básico', icon: Users, color: 'bg-slate-100 text-slate-600' },
  { id: 'premium', label: 'Premium', icon: Crown, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'recruiter', label: 'Recrutador', icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
  { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-700' },
];

export default function PushNotificationSender({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['all']);
  const [specificEmails, setSpecificEmails] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Buscar inscrições para mostrar contagem
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['push-subscriptions-count'],
    queryFn: () => base44.entities.PushSubscription.list('-created_date', 5000),
  });

  // Contar por tipo
  const typeCounts = USER_TYPES.reduce((acc, type) => {
    if (type.id === 'all') {
      acc[type.id] = subscriptions.filter(s => s.is_active !== false).length;
    } else {
      acc[type.id] = subscriptions.filter(s => s.user_type === type.id && s.is_active !== false).length;
    }
    return acc;
  }, {});

  const handleTypeToggle = (typeId) => {
    if (typeId === 'all') {
      setSelectedTypes(['all']);
    } else {
      const newTypes = selectedTypes.includes(typeId)
        ? selectedTypes.filter(t => t !== typeId)
        : [...selectedTypes.filter(t => t !== 'all'), typeId];
      
      setSelectedTypes(newTypes.length > 0 ? newTypes : ['all']);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Digite um título');
      return;
    }
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      // Preparar emails específicos se fornecidos
      const targetEmails = specificEmails
        .split(/[\n,;]/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@'));

      const response = await base44.functions.invoke('sendPushNotification', {
        title: title.trim(),
        message: message.trim(),
        image: imageUrl || null,
        url: linkUrl || '/',
        targetGroups: selectedTypes.includes('all') ? ['all'] : selectedTypes,
        targetEmails: targetEmails.length > 0 ? targetEmails : null
      });

      if (response.data.success) {
        setLastResult(response.data);
        toast.success(`Push enviado para ${response.data.sent} dispositivos!`);
        
        // Limpar formulário
        setTitle('');
        setMessage('');
        setImageUrl('');
        setLinkUrl('');
        setSpecificEmails('');
        
        onSuccess?.();
      } else {
        toast.error(response.data.error || 'Erro ao enviar');
      }
    } catch (error) {
      console.error('Send push error:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setSending(false);
    }
  };

  const getEstimatedRecipients = () => {
    if (specificEmails.trim()) {
      return specificEmails.split(/[\n,;]/).filter(e => e.trim() && e.includes('@')).length;
    }
    if (selectedTypes.includes('all')) {
      return typeCounts['all'];
    }
    return selectedTypes.reduce((sum, type) => sum + (typeCounts[type] || 0), 0);
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#0056ff]" />
          Enviar Notificação Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Público */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Selecionar Público
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {USER_TYPES.map(type => (
              <label
                key={type.id}
                className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTypes.includes(type.id)
                    ? 'border-[#0056ff] bg-[#0056ff]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Checkbox
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => handleTypeToggle(type.id)}
                />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${type.color}`}>
                  <type.icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-xs text-slate-500 ml-1">({typeCounts[type.id]})</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Emails Específicos */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Usuários Específicos (opcional)
          </label>
          <Textarea
            placeholder="Digite emails específicos (um por linha ou separados por vírgula)"
            value={specificEmails}
            onChange={(e) => setSpecificEmails(e.target.value)}
            rows={2}
            className="text-sm"
          />
          {specificEmails.trim() && (
            <p className="text-xs text-slate-500 mt-1">
              {specificEmails.split(/[\n,;]/).filter(e => e.trim() && e.includes('@')).length} emails
            </p>
          )}
        </div>

        {/* Título */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Título da Notificação *
          </label>
          <Input
            placeholder="Ex: Nova vaga disponível!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
          />
          <p className="text-xs text-slate-400 mt-1">{title.length}/50</p>
        </div>

        {/* Mensagem */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Mensagem *
          </label>
          <Textarea
            placeholder="Digite a mensagem da notificação..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-slate-400 mt-1">{message.length}/200</p>
        </div>

        {/* Imagem */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Imagem (opcional)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-[#0056ff] transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0056ff]" />
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="max-h-20 mx-auto rounded" />
                ) : (
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Enviar imagem</span>
                  </div>
                )}
              </div>
            </label>
            {imageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageUrl('')}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            <LinkIcon className="w-4 h-4 inline mr-1" />
            Link ao Clicar (opcional)
          </label>
          <Input
            placeholder="https://... ou /pagina"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>

        {/* Resumo */}
        <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-slate-600">Destinatários estimados:</span>
          <Badge className="bg-[#0056ff] text-white text-lg px-3 py-1">
            ~{getEstimatedRecipients()}
          </Badge>
        </div>

        {/* Resultado do último envio */}
        {lastResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Enviado com sucesso!</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm text-green-600">
              <div>✓ Enviados: {lastResult.sent}</div>
              <div>✗ Falhas: {lastResult.failed}</div>
              <div>🗑 Removidos: {lastResult.removed}</div>
            </div>
          </div>
        )}

        {/* Botão Enviar */}
        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] text-base rounded-xl"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar Notificação Push
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}