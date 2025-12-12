import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <p className="font-medium text-slate-800">WhatsApp</p>
                <p className="text-xs text-slate-500">Envia para grupos do WhatsApp</p>
              </div>
            </div>
            <Switch checked={false} disabled />
          </div>
        </div>


      </CardContent>
    </Card>
  );
}