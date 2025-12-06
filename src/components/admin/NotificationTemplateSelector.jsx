import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, Briefcase, Home, Newspaper, Users, Tag, Crown,
  Sparkles, Zap, TrendingUp, DollarSign, Building2, Target, Loader2
} from "lucide-react";

const TEMPLATE_CATEGORIES = [
  { id: 'job', label: 'Vagas', icon: Briefcase, color: 'blue' },
  { id: 'homeoffice', label: 'Home Office', icon: Home, color: 'green' },
  { id: 'news', label: 'Notícias', icon: Newspaper, color: 'red' },
  { id: 'community', label: 'Comunidade', icon: Users, color: 'purple' },
  { id: 'promo', label: 'Promoção', icon: Tag, color: 'orange' },
  { id: 'premium', label: 'Premium', icon: Crown, color: 'yellow' }
];

const TEMPLATES = {
  job: [
    { id: 'oportunidade', emoji: '⭐', title: 'OPORTUNIDADE DE OURO!', message: 'Nova vaga incrível acabou de ser publicada! Não perca!' },
    { id: 'urgente', emoji: '🚨', title: 'URGENTE: Nova vaga!', message: 'Vaga urgente com processo seletivo relâmpago!' },
    { id: 'chance', emoji: '✨', title: 'NOVA CHANCE!', message: 'Sua próxima oportunidade pode estar aqui!' },
    { id: 'perfeita', emoji: '🎯', title: 'VAGA PERFEITA PRA VOCÊ!', message: 'Essa vaga tem tudo a ver com o seu perfil!' },
    { id: 'acabou', emoji: '⚡', title: 'ACABOU DE SAIR!', message: 'Vaga fresquinha! Seja o primeiro a se candidatar!' },
    { id: 'salario', emoji: '💰', title: 'SALÁRIO ATRATIVO!', message: 'Vaga com ótima remuneração disponível!' },
    { id: 'empresa', emoji: '🏢', title: 'EMPRESA TOP!', message: 'Grande empresa está contratando agora!' },
    { id: 'carreira', emoji: '📈', title: 'CRESÇA NA CARREIRA!', message: 'Oportunidade para dar o próximo passo profissional!' }
  ],
  homeoffice: [
    { id: 'remoto', emoji: '🏠', title: 'Trabalhe de Casa!', message: 'Nova vaga 100% remota disponível!' },
    { id: 'flexivel', emoji: '⏰', title: 'Horário Flexível!', message: 'Vaga home office com total flexibilidade!' }
  ],
  news: [
    { id: 'novidade', emoji: '📰', title: 'Nova Notícia!', message: 'Confira as últimas novidades do mercado!' },
    { id: 'destaque', emoji: '⭐', title: 'Notícia em Destaque!', message: 'Informação importante para sua carreira!' }
  ],
  community: [
    { id: 'comunidade', emoji: '👥', title: 'Novidade na Comunidade!', message: 'Novo post relevante foi publicado!' },
    { id: 'discussao', emoji: '💬', title: 'Discussão Importante!', message: 'Participe da conversa!' }
  ],
  promo: [
    { id: 'oferta', emoji: '🎁', title: 'Oferta Especial!', message: 'Aproveite esta promoção exclusiva!' },
    { id: 'desconto', emoji: '💸', title: 'Desconto Imperdível!', message: 'Não perca esta oportunidade!' }
  ],
  premium: [
    { id: 'exclusivo', emoji: '👑', title: 'Conteúdo Exclusivo!', message: 'Vantagem especial para assinantes Premium!' },
    { id: 'vip', emoji: '⭐', title: 'Acesso VIP!', message: 'Benefício exclusivo para você!' }
  ]
};

const NOTIFICATION_ICONS = [
  { id: 'job', label: 'Vaga', icon: '💼', color: 'bg-blue-100 text-blue-600' },
  { id: 'news', label: 'Notícia', icon: '📰', color: 'bg-red-100 text-red-600' },
  { id: 'chat', label: 'Chat/Comunidade', icon: '💬', color: 'bg-purple-100 text-purple-600' },
  { id: 'promo', label: 'Promoção', icon: '🎁', color: 'bg-orange-100 text-orange-600' },
  { id: 'star', label: 'Destaque', icon: '⭐', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'crown', label: 'Premium', icon: '👑', color: 'bg-purple-100 text-purple-600' },
  { id: 'custom', label: 'Ícone Personalizado', icon: '📌', color: 'bg-slate-100 text-slate-600' }
];

export default function NotificationTemplateSelector({ 
  onNotificationDataChange,
  onSendNotification,
  onSkipNotification,
  jobTitle,
  jobCompany,
  jobCity,
  isLoading = false
}) {
  const [selectedCategory, setSelectedCategory] = useState('job');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('job');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  const applyTemplate = (template) => {
    let finalTitle = template.title;
    let finalMessage = template.message;

    // Substituir variáveis
    if (jobTitle) {
      finalTitle = finalTitle.replace(/{titulo}/g, jobTitle);
      finalMessage = finalMessage.replace(/{titulo}/g, jobTitle);
    }
    if (jobCompany) {
      finalMessage = finalMessage.replace(/{empresa}/g, jobCompany);
    }
    if (jobCity) {
      finalMessage = finalMessage.replace(/{cidade}/g, jobCity);
    }

    setTitle(`${template.emoji} ${finalTitle}`);
    setMessage(finalMessage);

    // Auto-atualizar dados
    updateNotificationData(`${template.emoji} ${finalTitle}`, finalMessage);
  };

  const updateNotificationData = (newTitle = title, newMessage = message) => {
    onNotificationDataChange?.({
      title: newTitle || title,
      message: newMessage || message,
      icon: selectedIcon,
      premiumOnly,
      sendEmail
    });
  };

  React.useEffect(() => {
    updateNotificationData();
  }, [title, message, selectedIcon, premiumOnly, sendEmail]);

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Enviar Notificação para Todos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Categoria de Templates */}
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">Categoria de Templates</Label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedCategory === cat.id
                      ? `border-${cat.color}-500 bg-${cat.color}-50 text-${cat.color}-700`
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Prontos */}
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">Templates Prontos</Label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES[selectedCategory]?.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <span className="text-lg">{template.emoji}</span>
                <span className="text-xs font-medium text-slate-700 leading-tight line-clamp-2">
                  {template.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Título da Notificação */}
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Título da Notificação</Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              updateNotificationData(e.target.value, message);
            }}
            placeholder="Ex: 🔥 VAGA IMPERDÍVEL!"
            className="text-lg font-semibold"
          />
        </div>

        {/* Mensagem */}
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Mensagem</Label>
          <Textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              updateNotificationData(title, e.target.value);
            }}
            placeholder="Ex: Corre! Nova oportunidade acabou de chegar! Não deixe essa chance escapar! 🚀"
            className="min-h-[100px]"
          />
        </div>

        {/* Ícone da Notificação */}
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">Ícone da Notificação</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {NOTIFICATION_ICONS.map((icon) => (
              <button
                key={icon.id}
                onClick={() => {
                  setSelectedIcon(icon.id);
                  updateNotificationData();
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  selectedIcon === icon.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${icon.color} flex items-center justify-center text-xl`}>
                  {icon.icon}
                </div>
                <span className="text-xs text-slate-600 text-center leading-tight">{icon.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Opções */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-slate-800">Apenas Premium</p>
                <p className="text-xs text-slate-500">Enviar só para assinantes Premium</p>
              </div>
            </div>
            <Switch checked={premiumOnly} onCheckedChange={(val) => {
              setPremiumOnly(val);
              updateNotificationData();
            }} />
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-slate-800">Enviar Email</p>
                <p className="text-xs text-slate-500">Envia email junto com a notificação</p>
              </div>
            </div>
            <Switch checked={sendEmail} onCheckedChange={(val) => {
              setSendEmail(val);
              updateNotificationData();
            }} />
          </div>
        </div>

        {/* Preview da Notificação */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">Preview da Notificação</Label>
          <div className="bg-white rounded-lg shadow-md p-4 flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-lg ${NOTIFICATION_ICONS.find(i => i.id === selectedIcon)?.color} flex items-center justify-center text-2xl flex-shrink-0`}>
              {NOTIFICATION_ICONS.find(i => i.id === selectedIcon)?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 mb-1">{title || 'Título da notificação'}</p>
              <p className="text-sm text-slate-600 line-clamp-2">{message || 'Mensagem da notificação'}</p>
              {jobTitle && jobCity && (
                <p className="text-xs text-blue-600 mt-1">
                  💼 {jobTitle} - {jobCity}
                </p>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button
              onClick={onSendNotification}
              disabled={!title || !message || isLoading}
              className={`w-full h-12 rounded-xl font-semibold transition-all ${
                title && message && !isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5 mr-2" />
                  Enviar Notificação
                </>
              )}
            </Button>

            <Button
              onClick={onSkipNotification}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 rounded-xl font-medium border-2 hover:bg-slate-50"
            >
              Não Enviar Notificação
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}