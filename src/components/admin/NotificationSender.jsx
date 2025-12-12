import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, Loader2, Upload, Briefcase, Newspaper, Gift, Sparkles, Mail, Crown, Star, Zap, Heart, TrendingUp, Award, Target, Rocket, Clock, DollarSign, Building, GraduationCap, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_ICONS = [
  { value: 'briefcase', label: 'Vaga', icon: Briefcase, emoji: '📁' },
  { value: 'newspaper', label: 'Notícia', icon: Newspaper, emoji: '📰' },
  { value: 'chat', label: 'Chat/Comunidade', icon: Bell, emoji: '💬' },
  { value: 'gift', label: 'Promoção', icon: Gift, emoji: '🎁' },
  { value: 'sparkles', label: 'Destaque', icon: Sparkles, emoji: '✨' },
  { value: 'crown', label: 'Premium', icon: Crown, emoji: '👑' },
];

// Templates para vagas normais
const JOB_TEMPLATES = [
  { title: "🔥 VAGA IMPERDÍVEL!", message: "Corre! Nova oportunidade acabou de chegar! Não deixe essa chance escapar! 🚀" },
  { title: "💼 CONTRATANDO AGORA!", message: "Empresa está contratando! Candidate-se antes que as vagas acabem! ⚡" },
  { title: "🌟 OPORTUNIDADE DE OURO!", message: "Vaga exclusiva disponível! Seu próximo emprego pode estar aqui! 💫" },
  { title: "🚨 URGENTE: Nova Vaga!", message: "Acabou de abrir uma vaga incrível! Não perca tempo! 🎯" },
  { title: "✨ NOVA CHANCE!", message: "O emprego dos seus sonhos chegou! Confira agora mesmo! 🌈" },
  { title: "🎯 VAGA PERFEITA PRA VOCÊ!", message: "Encontramos uma oportunidade que combina com seu perfil! 💪" },
  { title: "⚡ ACABOU DE SAIR!", message: "Vaga fresquinha! Seja um dos primeiros a se candidatar! 🏃" },
  { title: "💰 SALÁRIO ATRATIVO!", message: "Nova vaga com ótima remuneração! Confira os detalhes! 💵" },
  { title: "🏢 EMPRESA TOP!", message: "Grande empresa está contratando! Oportunidade única! 🌟" },
  { title: "📈 CRESÇA NA CARREIRA!", message: "Vaga com plano de carreira! Invista no seu futuro! 🚀" },
];

// Templates Home Office
const HOME_OFFICE_TEMPLATES = [
  { title: "🏠 VAGAS HOME OFFICE!", message: "Trabalhe de casa! Novas vagas remotas acabaram de chegar! 💻" },
  { title: "💻 TRABALHO REMOTO!", message: "Oportunidades para trabalhar de qualquer lugar! Confira agora! 🌍" },
  { title: "🏡 HOME OFFICE LIBERADO!", message: "Vagas para trabalhar no conforto da sua casa! Candidate-se já! 🚀" },
  { title: "🌐 VAGAS 100% REMOTAS!", message: "Empresas contratando para home office! Não perca! ⚡" },
  { title: "🖥️ TRABALHE DE CASA!", message: "Novas oportunidades remotas disponíveis! Aproveite! 🎯" },
  { title: "☕ TRABALHE DE PIJAMA!", message: "Vagas remotas que permitem flexibilidade total! 🛋️" },
  { title: "🌴 TRABALHE DE ONDE QUISER!", message: "Liberdade total! Vagas 100% remotas esperando por você! ✈️" },
  { title: "⏰ HORÁRIO FLEXÍVEL!", message: "Home office com flexibilidade de horários! Confira! 🕐" },
];

// Templates para notícias
const NEWS_TEMPLATES = [
  { title: "📰 NOTÍCIA IMPORTANTE!", message: "Confira a nova notícia que acabou de sair! Fique por dentro! 📢" },
  { title: "🗞️ ÚLTIMAS NOTÍCIAS!", message: "Novidades fresquinhas para você! Não perca essa informação! 📋" },
  { title: "📣 ATENÇÃO!", message: "Nova notícia publicada! Confira agora mesmo! 🔔" },
  { title: "💡 NOVIDADE!", message: "Informação importante para sua carreira! Leia agora! 📖" },
  { title: "🔥 NOTÍCIA QUENTE!", message: "Acabou de sair! Notícia imperdível para você! 🚀" },
  { title: "📊 MERCADO DE TRABALHO!", message: "Novas tendências e informações do mercado! Confira! 📈" },
  { title: "🎓 DICAS DE CARREIRA!", message: "Conteúdo especial para alavancar sua carreira! 💪" },
  { title: "💼 ATUALIZAÇÃO IMPORTANTE!", message: "Notícia que pode mudar sua busca por emprego! 🎯" },
];

// Templates para comunidade/social
const SOCIAL_TEMPLATES = [
  { title: "👥 NOVA POSTAGEM!", message: "Confira o que há de novo na comunidade! Participe! 💬" },
  { title: "💬 COMUNIDADE ATIVA!", message: "Nova publicação interessante! Venha conferir e interagir! 🌟" },
  { title: "🗣️ NOVIDADE NA REDE!", message: "Post novo na comunidade! Não fique de fora! 📱" },
  { title: "✨ POST ESPECIAL!", message: "Conteúdo exclusivo na comunidade! Confira agora! 🎯" },
  { title: "📲 ATUALIZE-SE!", message: "Novidades na rede social! Participe da conversa! 💭" },
  { title: "🤝 NETWORKING!", message: "Conecte-se com outros profissionais da comunidade! 👔" },
  { title: "💡 DICA DA COMUNIDADE!", message: "Membro compartilhou algo valioso! Confira! 🌟" },
  { title: "🎉 COMPARTILHE EXPERIÊNCIAS!", message: "A comunidade está movimentada! Participe! 🗨️" },
];

// Templates EXCLUSIVOS Premium
const PREMIUM_TEMPLATES = [
  { title: "👑 EXCLUSIVO PREMIUM!", message: "Vaga especial só para assinantes! Confira agora! ⭐", premium: true },
  { title: "💎 OPORTUNIDADE VIP!", message: "Vaga exclusiva para membros Premium! Aproveite! 🏆", premium: true },
  { title: "🌟 VAGA PREMIUM!", message: "Acesso antecipado a vagas selecionadas! Só para você! 👑", premium: true },
  { title: "🔒 ACESSO EXCLUSIVO!", message: "Vaga restrita para assinantes Premium! Candidate-se! 💫", premium: true },
  { title: "⭐ BENEFÍCIO PREMIUM!", message: "Como assinante, você tem prioridade nesta vaga! 🎯", premium: true },
  { title: "🏆 TOP VAGA PREMIUM!", message: "As melhores vagas primeiro para você, Premium! 🚀", premium: true },
  { title: "💰 SALÁRIO ALTO - PREMIUM!", message: "Vaga com remuneração diferenciada! Exclusivo Premium! 💵", premium: true },
  { title: "🎁 PRESENTE PREMIUM!", message: "Benefício especial para nossos assinantes! Confira! 🎀", premium: true },
  { title: "✨ VIP: NOVA OPORTUNIDADE!", message: "Vaga em primeira mão para assinantes Premium! 👑", premium: true },
  { title: "🔥 URGENTE - SÓ PREMIUM!", message: "Vaga exclusiva que fecha em breve! Corra! ⚡", premium: true },
];

// Templates de promoção/marketing
const PROMO_TEMPLATES = [
  { title: "🎁 PROMOÇÃO ESPECIAL!", message: "Oferta imperdível para você! Confira os detalhes! 🎉" },
  { title: "⚡ OFERTA RELÂMPAGO!", message: "Promoção por tempo limitado! Aproveite agora! ⏰" },
  { title: "🎊 NOVIDADE EXCLUSIVA!", message: "Algo especial preparamos para você! Confira! 🌟" },
  { title: "💫 SURPRESA!", message: "Temos algo incrível para você! Não perca! 🎁" },
  { title: "🏷️ DESCONTO ESPECIAL!", message: "Oferta exclusiva disponível! Aproveite! 💰" },
];

export default function NotificationSender({ showToast, job, news, socialPost, chatReply, notificationType = 'job', isHomeOffice = false, onClose }) {
  const getDefaultIcon = () => {
    if (notificationType === 'news') return 'newspaper';
    if (notificationType === 'chat' || notificationType === 'community' || notificationType === 'social') return 'chat';
    if (notificationType === 'promo') return 'gift';
    return 'briefcase';
  };
  
  const [templateCategory, setTemplateCategory] = useState(
    isHomeOffice ? 'homeoffice' : 
    notificationType === 'news' ? 'news' : 
    notificationType === 'social' ? 'social' : 'jobs'
  );
  
  const getTemplatesByCategory = () => {
    switch (templateCategory) {
      case 'homeoffice': return HOME_OFFICE_TEMPLATES;
      case 'news': return NEWS_TEMPLATES;
      case 'social': return SOCIAL_TEMPLATES;
      case 'premium': return PREMIUM_TEMPLATES;
      case 'promo': return PROMO_TEMPLATES;
      default: return JOB_TEMPLATES;
    }
  };
  
  const templates = getTemplatesByCategory();
  
  const [title, setTitle] = useState(templates[0].title);
  const [message, setMessage] = useState(templates[0].message);
  const [iconType, setIconType] = useState(getDefaultIcon());
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const queryClient = useQueryClient();

  const handleCategoryChange = (category) => {
    setTemplateCategory(category);
    const newTemplates = category === 'homeoffice' ? HOME_OFFICE_TEMPLATES :
                        category === 'news' ? NEWS_TEMPLATES :
                        category === 'social' ? SOCIAL_TEMPLATES :
                        category === 'premium' ? PREMIUM_TEMPLATES :
                        category === 'promo' ? PROMO_TEMPLATES : JOB_TEMPLATES;
    setTitle(newTemplates[0].title);
    setMessage(newTemplates[0].message);
    
    // Auto-marcar premium se for categoria premium
    if (category === 'premium') {
      setPremiumOnly(true);
      setIconType('crown');
    }
  };

  const sendNotificationMutation = useMutation({
    mutationFn: async (data) => {
      const users = await base44.entities.User.list('-created_date', 1000);
      
      // Filtrar usuários baseado em premiumOnly
      const targetUsers = data.premiumOnly 
        ? users.filter(u => u.subscription_type === 'premium' || u.subscription_type === 'admin' || u.role === 'admin')
        : users;
      
      const notifications = targetUsers.map(user => ({
        title: data.title,
        message: data.message,
        icon_url: data.iconUrl,
        type: notificationType === 'news' ? 'news' : notificationType === 'social' ? 'system' : 'job',
        job_id: job?.id || '',
        user_email: user.email,
        is_read: false,
        sent_to_all: !data.premiumOnly
      }));

      const batchSize = 50;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await base44.entities.Notification.bulkCreate(batch);
      }

      if (data.sendEmail) {
        const eligibleUsers = targetUsers.filter(u => 
          u.subscription_type === 'basic' ||
          u.subscription_type === 'premium' || 
          u.subscription_type === 'admin' || 
          u.role === 'admin'
        );
        
        const emailBatchSize = 10;
        for (let i = 0; i < eligibleUsers.length; i += emailBatchSize) {
          const emailBatch = eligibleUsers.slice(i, i + emailBatchSize);
          await Promise.all(emailBatch.map(user => 
            base44.integrations.Core.SendEmail({
              to: user.email,
              subject: `${data.title} - Vagas Abertas PB`,
              body: `
Olá ${user.full_name || 'Usuário'}!

${data.title}

${data.message}

---
Acesse o app para ver mais detalhes.
Vagas Abertas Paraíba
              `.trim()
            }).catch(e => console.log('Erro ao enviar email para', user.email))
          ));
        }
      }

      // Enviar para grupos do WhatsApp se marcado
      if (data.sendWhatsApp) {
        try {
          const whatsappResult = await base44.functions.invoke('sendWhatsAppNotification', {
            title: data.title,
            message: data.message,
            icon: data.iconType
          });
          console.log('WhatsApp notification sent:', whatsappResult.data);
        } catch (error) {
          console.error('Erro ao enviar WhatsApp:', error);
        }
      }

      return { count: targetUsers.length };
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
    if (template.premium) {
      setPremiumOnly(true);
    }
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
      iconUrl: customIconUrl || '',
      iconType,
      sendEmail,
      sendWhatsApp,
      premiumOnly
    });
  };

  return (
    <Card className="rounded-xl border-2 border-[#0056ff]/20 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#0056ff]" />
          Enviar Notificação para {premiumOnly ? 'Premium' : 'Todos'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categorias de Templates */}
        <div>
          <Label className="text-sm text-slate-600 mb-2 block">Categoria de Templates</Label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'jobs', label: 'Vagas', icon: '💼' },
              { id: 'homeoffice', label: 'Home Office', icon: '🏠' },
              { id: 'news', label: 'Notícias', icon: '📰' },
              { id: 'social', label: 'Comunidade', icon: '👥' },
              { id: 'promo', label: 'Promoção', icon: '🎁' },
              { id: 'premium', label: 'Premium', icon: '👑' },
            ].map(cat => (
              <Button
                key={cat.id}
                variant={templateCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(cat.id)}
                className={`rounded-lg text-xs ${
                  templateCategory === cat.id 
                    ? cat.id === 'premium' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#0056ff]' 
                    : cat.id === 'premium' ? 'border-yellow-400 text-yellow-600 hover:bg-yellow-50' : ''
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div>
          <Label className="text-sm text-slate-600 mb-2 block">
            Templates Prontos 
            {templateCategory === 'premium' && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-700 text-xs">Exclusivo Premium</Badge>
            )}
          </Label>
          <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1">
            {templates.map((template, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleSelectTemplate(template)}
                className={`rounded-lg text-xs justify-start h-auto py-1.5 px-2 ${
                  title === template.title ? 'border-[#0056ff] bg-blue-50' : ''
                } ${template.premium ? 'border-yellow-300 hover:bg-yellow-50' : 'hover:bg-blue-50'}`}
              >
                <span className="truncate">{template.title.slice(0, 20)}...</span>
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

        {/* Ícones */}
        <div>
          <Label className="text-sm text-slate-600 mb-2 block">Ícone da Notificação</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {NOTIFICATION_ICONS.map((icon) => (
              <Button
                key={icon.value}
                variant={iconType === icon.value ? "default" : "outline"}
                size="sm"
                onClick={() => setIconType(icon.value)}
                className={`rounded-lg text-xs ${iconType === icon.value ? 'bg-[#0056ff]' : ''}`}
              >
                <span className="mr-1">{icon.emoji}</span>
                {icon.label}
              </Button>
            ))}
          </div>
          
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
                className="rounded-lg pointer-events-none text-xs"
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

        {/* Opções */}
        <div className="space-y-3">
          {/* Premium Only */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <div>
                <span className="text-sm font-medium">Apenas Premium</span>
                <p className="text-xs text-slate-500">Enviar só para assinantes Premium</p>
              </div>
            </div>
            <Switch checked={premiumOnly} onCheckedChange={setPremiumOnly} />
          </div>

          {/* Enviar Email */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-sm font-medium">Enviar Email</span>
                <p className="text-xs text-slate-500">Envia email junto com a notificação</p>
              </div>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>

          {/* Enviar WhatsApp */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <span className="text-sm font-medium">WhatsApp</span>
                <p className="text-xs text-slate-500">Envia para grupos do WhatsApp</p>
              </div>
            </div>
            <Switch checked={sendWhatsApp} onCheckedChange={setSendWhatsApp} />
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-white rounded-xl border shadow-sm">
          <Label className="text-xs text-slate-400 mb-2 block">Preview da Notificação</Label>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${premiumOnly ? 'bg-yellow-500' : 'bg-[#0056ff]'}`}>
              {customIconUrl ? (
                <img src={customIconUrl} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-lg">{NOTIFICATION_ICONS.find(i => i.value === iconType)?.emoji || '📁'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 text-sm">{title || 'Título da notificação'}</p>
                {premiumOnly && <Badge className="bg-yellow-100 text-yellow-700 text-xs">Premium</Badge>}
              </div>
              <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">{message || 'Mensagem da notificação'}</p>
              {job && (
                <p className="text-blue-600 text-xs mt-1">📁 {job.title}{job.city ? ` - ${job.city}` : ''}</p>
              )}
              {news && (
                <p className="text-green-600 text-xs mt-1">📰 {news.title}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botão Enviar */}
        <Button
          onClick={handleSend}
          disabled={sendNotificationMutation.isPending || !title || !message}
          className={`w-full rounded-xl h-12 ${premiumOnly ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#0056ff] hover:bg-[#0044cc]'}`}
        >
          {sendNotificationMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar para {premiumOnly ? 'Usuários Premium' : 'Todos os Usuários'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}