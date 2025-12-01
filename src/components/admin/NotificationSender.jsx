import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Loader2, Upload, Image, Sparkles, Briefcase, Newspaper, Gift, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_ICONS = [
  { value: 'briefcase', label: '📁 Vaga de Emprego', icon: Briefcase, emoji: '📁' },
  { value: 'newspaper', label: '📰 Notícia', icon: Newspaper, emoji: '📰' },
  { value: 'chat', label: '💬 Chat/Comunidade', icon: Bell, emoji: '💬' },
  { value: 'gift', label: '🎁 Promoção', icon: Gift, emoji: '🎁' },
  { value: 'sparkles', label: '✨ Destaque', icon: Sparkles, emoji: '✨' },
];

const CREATIVE_TEMPLATES = [
  {
    title: "🔥 VAGA IMPERDÍVEL!",
    message: "Corre! Nova oportunidade acabou de chegar! Não deixe essa chance escapar! 🚀"
  },
  {
    title: "💼 CONTRATANDO AGORA!",
    message: "Empresa está contratando! Candidate-se antes que as vagas acabem! ⚡"
  },
  {
    title: "🌟 OPORTUNIDADE DE OURO!",
    message: "Vaga exclusiva disponível! Seu próximo emprego pode estar aqui! 💫"
  },
  {
    title: "🚨 URGENTE: Nova Vaga!",
    message: "Acabou de abrir uma vaga incrível! Não perca tempo! 🎯"
  },
  {
    title: "✨ NOVA CHANCE!",
    message: "O emprego dos seus sonhos chegou! Confira agora mesmo! 🌈"
  },
];

const HOME_OFFICE_TEMPLATES = [
  {
    title: "🏠 VAGAS HOME OFFICE!",
    message: "Trabalhe de casa! Novas vagas remotas acabaram de chegar! 💻"
  },
  {
    title: "💻 TRABALHO REMOTO!",
    message: "Oportunidades para trabalhar de qualquer lugar! Confira agora! 🌍"
  },
  {
    title: "🏡 HOME OFFICE LIBERADO!",
    message: "Vagas para trabalhar no conforto da sua casa! Candidate-se já! 🚀"
  },
  {
    title: "🌐 VAGAS 100% REMOTAS!",
    message: "Empresas contratando para home office! Não perca! ⚡"
  },
  {
    title: "🖥️ TRABALHE DE CASA!",
    message: "Novas oportunidades remotas disponíveis! Aproveite! 🎯"
  },
];

const NEWS_TEMPLATES = [
  {
    title: "📰 NOTÍCIA IMPORTANTE!",
    message: "Confira a nova notícia que acabou de sair! Fique por dentro! 📢"
  },
  {
    title: "🗞️ ÚLTIMAS NOTÍCIAS!",
    message: "Novidades fresquinhas para você! Não perca essa informação! 📋"
  },
  {
    title: "📣 ATENÇÃO!",
    message: "Nova notícia publicada! Confira agora mesmo! 🔔"
  },
  {
    title: "💡 NOVIDADE!",
    message: "Informação importante para sua carreira! Leia agora! 📖"
  },
  {
    title: "🔥 NOTÍCIA QUENTE!",
    message: "Acabou de sair! Notícia imperdível para você! 🚀"
  },
];

const SOCIAL_TEMPLATES = [
  {
    title: "👥 NOVA POSTAGEM!",
    message: "Confira o que há de novo na comunidade! Participe! 💬"
  },
  {
    title: "💬 COMUNIDADE ATIVA!",
    message: "Nova publicação interessante! Venha conferir e interagir! 🌟"
  },
  {
    title: "🗣️ NOVIDADE NA REDE!",
    message: "Post novo na comunidade! Não fique de fora! 📱"
  },
  {
    title: "✨ POST ESPECIAL!",
    message: "Conteúdo exclusivo na comunidade! Confira agora! 🎯"
  },
  {
    title: "📲 ATUALIZE-SE!",
    message: "Novidades na rede social! Participe da conversa! 💭"
  },
];

export default function NotificationSender({ showToast, job, news, socialPost, chatReply, notificationType = 'job', isHomeOffice = false, onClose }) {
  // Definir ícone padrão baseado no tipo
  const getDefaultIcon = () => {
    if (notificationType === 'news') return 'newspaper';
    if (notificationType === 'chat' || notificationType === 'community' || notificationType === 'social') return 'chat';
    return 'briefcase';
  };
  
  // Selecionar templates baseado no tipo
  const getTemplates = () => {
    if (isHomeOffice) return HOME_OFFICE_TEMPLATES;
    if (notificationType === 'news') return NEWS_TEMPLATES;
    if (notificationType === 'social') return SOCIAL_TEMPLATES;
    return CREATIVE_TEMPLATES;
  };
  
  const templates = getTemplates();
  
  const [title, setTitle] = useState(templates[0].title);
  const [message, setMessage] = useState(templates[0].message);
  const [iconType, setIconType] = useState(getDefaultIcon());
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const sendNotificationMutation = useMutation({
    mutationFn: async (data) => {
      // Buscar todos os usuários
      const users = await base44.entities.User.list('-created_date', 1000);
      
      // Criar notificação para cada usuário
      const notifications = users.map(user => ({
        title: data.title,
        message: data.message,
        icon_url: data.iconUrl,
        type: 'job',
        job_id: job?.id || '',
        user_email: user.email,
        is_read: false,
        sent_to_all: true
      }));

      // Enviar em lotes
      const batchSize = 50;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await base44.entities.Notification.bulkCreate(batch);
      }

      return { count: users.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast?.(`Notificação enviada para ${data.count} usuários!`);
      onClose?.();
    },
    onError: () => showToast?.('Erro ao enviar notificações', 'error')
  });

  const handleUploadIcon = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) {
        setCustomIconUrl(result.file_url);
        setIconType('custom');
        showToast?.('Ícone carregado!');
      }
    } catch (err) {
      showToast?.('Erro ao carregar ícone', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setTitle(template.title);
    setMessage(template.message);
  };

  const getIconUrl = () => {
    if (iconType === 'custom' && customIconUrl) {
      return customIconUrl;
    }
    // Usar emojis como ícone padrão
    const selectedIcon = NOTIFICATION_ICONS.find(i => i.value === iconType);
    return selectedIcon?.emoji || '🔔';
  };

  const handleSend = () => {
    if (!title || !message) {
      showToast?.('Preencha título e mensagem', 'error');
      return;
    }

    let finalMessage = message;
    
    if (job) {
      finalMessage = `${message}\n\n📁 ${job.title}${job.city ? ` - ${job.city}` : ''}`;
    } else if (news) {
      finalMessage = `${message}\n\n📰 ${news.title}`;
    } else if (socialPost) {
      finalMessage = `${message}\n\n👥 ${socialPost.author_name || 'Novo post'}`;
    } else if (chatReply) {
      finalMessage = `${message}\n\n💬 Nova resposta no chat`;
    }

    sendNotificationMutation.mutate({
      title,
      message: finalMessage,
      iconUrl: customIconUrl || ''
    });
  };

  return (
    <Card className="rounded-xl border-2 border-[#0056ff]/20 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#0056ff]" />
          Enviar Notificação para Todos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Templates Criativos */}
        <div>
          <Label className="text-sm text-slate-600 mb-2 block">
            Templates Prontos {isHomeOffice && <span className="text-green-600">(Home Office)</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleSelectTemplate(template)}
                className={`rounded-lg text-xs ${isHomeOffice ? 'hover:bg-green-50' : 'hover:bg-blue-50'}`}
              >
                {template.title.slice(0, 15)}...
              </Button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <Label className="text-sm text-slate-600 mb-1 block">Título da Notificação</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: 🔥 Nova Vaga Imperdível!"
            className="rounded-lg"
          />
        </div>

        {/* Mensagem */}
        <div>
          <Label className="text-sm text-slate-600 mb-1 block">Mensagem</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva uma mensagem chamativa..."
            className="rounded-lg min-h-[80px]"
          />
        </div>

        {/* Seleção de Ícone */}
        <div>
          <Label className="text-sm text-slate-600 mb-2 block">Ícone da Notificação</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {NOTIFICATION_ICONS.map((icon) => (
              <Button
                key={icon.value}
                variant={iconType === icon.value ? "default" : "outline"}
                size="sm"
                onClick={() => setIconType(icon.value)}
                className={`rounded-lg ${iconType === icon.value ? 'bg-[#0056ff]' : ''}`}
              >
                <span className="mr-1">{icon.emoji}</span>
                {icon.label.split(' ')[1]}
              </Button>
            ))}
          </div>
          
          {/* Upload Ícone Customizado */}
          <div className="flex items-center gap-2 mt-2">
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={handleUploadIcon}
                disabled={uploading}
              />
              <Button 
                type="button" 
                variant="outline"
                size="sm"
                className="rounded-lg pointer-events-none"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                Ícone Personalizado
              </Button>
            </label>
            {customIconUrl && (
              <img src={customIconUrl} alt="Ícone" className="w-8 h-8 rounded-lg object-cover" />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-white rounded-xl border shadow-sm">
          <Label className="text-xs text-slate-400 mb-2 block">Preview da Notificação</Label>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#0056ff] rounded-xl flex items-center justify-center text-white shrink-0">
              {customIconUrl ? (
                <img src={customIconUrl} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-lg">{NOTIFICATION_ICONS.find(i => i.value === iconType)?.emoji || '📁'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">{title || 'Título da notificação'}</p>
              <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">{message || 'Mensagem da notificação'}</p>
              {job && (
                <p className="text-blue-600 text-xs mt-1">📁 {job.title}{job.city ? ` - ${job.city}` : ''}</p>
              )}
              {news && (
                <p className="text-green-600 text-xs mt-1">📰 {news.title}</p>
              )}
              {socialPost && (
                <p className="text-purple-600 text-xs mt-1">👥 {socialPost.author_name || 'Novo post na comunidade'}</p>
              )}
              {chatReply && (
                <p className="text-purple-600 text-xs mt-1">💬 Nova resposta no chat</p>
              )}
            </div>
          </div>
        </div>

        {/* Botão Enviar */}
        <Button
          onClick={handleSend}
          disabled={sendNotificationMutation.isPending || !title || !message}
          className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12"
        >
          {sendNotificationMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar para Todos os Usuários
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}