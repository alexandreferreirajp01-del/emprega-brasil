import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, Plus, Calendar, Users, Mail, MessageCircle, 
  Edit, Trash2, Clock, CheckCircle, XCircle, Loader2,
  Copy, Eye, Search, Filter
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const DEFAULT_TEMPLATES = [
  {
    name: "Boas-vindas Novo Usuário",
    category: "boas_vindas",
    subject: "🎉 Bem-vindo ao Vagas Abertas PB!",
    message: "Olá {nome}! 👋\n\nQue alegria ter você conosco! O Vagas Abertas PB é a maior plataforma de empregos da Paraíba.\n\n✨ Você já pode:\n• Acessar milhares de vagas\n• Favoritar oportunidades\n• Receber notificações\n\nBoa sorte na sua busca! 🚀",
    channel: "both"
  },
  {
    name: "Promoção Plano Premium",
    category: "planos",
    subject: "⭐ 50% OFF no Premium - Só Hoje!",
    message: "Oi {nome}! 🎁\n\nOferta EXCLUSIVA para você:\n\n🔥 PREMIUM por apenas R$ 12,90/mês\n(50% de desconto!)\n\n✅ Acesso ilimitado a vagas\n✅ Sem anúncios\n✅ Notificações prioritárias\n✅ Suporte VIP\n\n⏰ Válido só hoje!\nAproveite: vagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Black Friday Premium",
    category: "urgencia",
    subject: "🔥 BLACK FRIDAY: 70% OFF Premium!",
    message: "BLACK FRIDAY {nome}! 🛍️\n\n💎 PREMIUM ANUAL\nDe R$ 399,00 por R$ 119,70\n(70% OFF!)\n\n🎯 Benefícios:\n• 12 meses de acesso total\n• Ferramentas de carreira\n• Suporte prioritário\n• Biblioteca exclusiva\n\n⏰ Últimas horas!\nGaranta: vagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Plano Trimestral",
    category: "planos",
    subject: "📊 Plano Trimestral - 40% OFF",
    message: "Olá {nome}!\n\n💰 PLANO TRIMESTRAL em promoção:\n\n3 meses por R$ 38,70\n(economize R$ 25,80!)\n\n✨ Ideal para quem busca emprego a médio prazo.\n\nAproveite: vagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Upgrade para Premium",
    category: "planos",
    subject: "⬆️ Faça Upgrade para Premium",
    message: "E aí {nome}! 👋\n\nVocê está aproveitando bem o app?\n\n🚀 Que tal dar um UP?\n\nCom o Premium você tem:\n• Acesso total a vagas exclusivas\n• Ferramentas de carreira\n• Prioridade nas notificações\n\n💡 Teste 7 dias GRÁTIS!\nClique: vagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Reativação de Conta",
    category: "reativacao",
    subject: "😢 Sentimos sua falta!",
    message: "Oi {nome}!\n\nPercebemos que você não acessa há um tempo...\n\n🎁 Que tal voltar com um PRESENTE?\n\n✨ 1 MÊS GRÁTIS de Premium!\n\nSuas vagas favoritas te esperam 💼\n\nVolte agora: vagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Novidade: Feed Social",
    category: "novidades",
    subject: "🆕 Novo: Feed Social de Empregos!",
    message: "Olá {nome}! 📢\n\nLançamento INÉDITO:\n\n🌟 FEED SOCIAL\n• Compartilhe experiências\n• Conecte-se com profissionais\n• Receba dicas de carreira\n\nVenha conhecer!\nvagasabertaspb.com.br/feed",
    channel: "both"
  },
  {
    name: "Natal Promoção",
    category: "feriados",
    subject: "🎄 Presente de Natal: Premium com 60% OFF!",
    message: "Feliz Natal {nome}! 🎅\n\n🎁 Nosso presente para você:\n\nPREMIUM com 60% OFF\nR$ 25,90 → R$ 10,36/mês\n\n✨ O melhor presente é um emprego novo!\n\nAproveite: vagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Ano Novo Metas",
    category: "feriados",
    subject: "🎆 2026: Ano do seu novo emprego!",
    message: "Feliz Ano Novo {nome}! 🎉\n\n2026 chegou e com ele novas oportunidades!\n\n💪 Meta: CONQUISTAR SEU EMPREGO DOS SONHOS\n\n🎯 Te ajudamos com:\n• +1000 vagas atualizadas\n• Ferramentas de carreira\n• Comunidade ativa\n\nVamos juntos!\nvagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Aviso: Conta Inativa",
    category: "reativacao",
    subject: "⚠️ Sua conta será desativada",
    message: "Oi {nome},\n\nSua conta está inativa há 90 dias.\n\n❗ Em 7 dias ela será removida.\n\nQuer continuar?\nAcesse agora: vagasabertaspb.com.br\n\nQualquer dúvida, estamos aqui! 😊",
    channel: "email"
  },
  {
    name: "Dica: Currículo Perfeito",
    category: "engajamento",
    subject: "📝 Dica: Como fazer um currículo MATADOR",
    message: "Oi {nome}! 💡\n\nDica de ouro:\n\n✅ Use nosso Gerador de Currículo IA\n• Templates profissionais\n• Otimizado para RH\n• Exporta em PDF\n\nExperimente GRÁTIS:\nvagasabertaspb.com.br/utilidades",
    channel: "both"
  },
  {
    name: "Webinar Gratuito",
    category: "engajamento",
    subject: "🎓 Webinar: Como se destacar em entrevistas",
    message: "Olá {nome}! 📚\n\nWebinar GRATUITO:\n\n🎯 Tema: \"Como Conquistar o RH\"\n📅 Amanhã, 19h\n\n🎁 Bônus: Guia de Entrevistas\n\nInscreva-se:\nvagasabertaspb.com.br/webinar",
    channel: "both"
  },
  {
    name: "Pesquisa Satisfação",
    category: "engajamento",
    subject: "❓ Sua opinião é importante!",
    message: "Oi {nome}! 🙋\n\nComo está sendo sua experiência?\n\n📊 Responda nossa pesquisa rápida (2 min)\n\n🎁 BÔNUS: Concorra a 1 mês Premium grátis!\n\nParticipe: vagasabertaspb.com.br/pesquisa",
    channel: "email"
  },
  {
    name: "Urgente: Vagas Relâmpago",
    category: "urgencia",
    subject: "⚡ URGENTE: 50 vagas fecham hoje!",
    message: "ATENÇÃO {nome}! ⚡\n\n🔥 50 VAGAS RELÂMPAGO\nCandidaturas encerram HOJE às 18h!\n\n• CLT\n• Salários até R$ 5.000\n• João Pessoa e região\n\nVeja agora:\nvagasabertaspb.com.br/vagas",
    channel: "whatsapp"
  },
  {
    name: "Feature: Biblioteca Digital",
    category: "features",
    subject: "📚 Nova: Biblioteca Digital Gratuita!",
    message: "Novidade {nome}! 📖\n\nBIBLIOTECA DIGITAL 100% GRÁTIS:\n\n📄 E-books\n📝 Guias de entrevista\n💼 Modelos de currículo\n📊 Planilhas carreira\n\nAcesse agora:\nvagasabertaspb.com.br/biblioteca",
    channel: "both"
  },
  {
    name: "Aniversário App 1 Ano",
    category: "novidades",
    subject: "🎂 1 Ano de Vagas Abertas PB!",
    message: "É aniversário {nome}! 🎉\n\n1 ANO ajudando paraibanos:\n\n📊 +10.000 usuários\n💼 +5.000 vagas publicadas\n✅ Centenas de contratações\n\nOBRIGADO por fazer parte! ❤️\n\nvagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Combo Premium + Recruiter",
    category: "planos",
    subject: "💼 Para Empresas: Plano Recruiter",
    message: "Olá {nome}!\n\nSua empresa contrata?\n\n🏢 PLANO RECRUITER:\n• Publique vagas ilimitadas\n• Destaque em home\n• Banco de currículos\n• Analytics completo\n\n📞 Fale conosco:\nWhatsApp (83) 99197-1320",
    channel: "email"
  },
  {
    name: "Cupom Desconto Amigo",
    category: "planos",
    subject: "🎁 CUPOM: Indique e Ganhe!",
    message: "Ei {nome}! 🤝\n\nINDIQUE um amigo e GANHE:\n\n🎟️ Cupom: AMIGO30\n💰 30% OFF no Premium\n\nSeu amigo também ganha!\n\nCompartilhe:\nvagasabertaspb.com.br?ref={email}",
    channel: "both"
  },
  {
    name: "Dica Semanal LinkedIn",
    category: "engajamento",
    subject: "💼 Dica: Otimize seu LinkedIn",
    message: "Dica da semana {nome}! 📌\n\n🔵 LINKEDIN:\n\n✅ Foto profissional\n✅ Título atrativo\n✅ Resumo completo\n✅ Palavras-chave\n\n💡 Saiba mais:\nvagasabertaspb.com.br/dicas",
    channel: "both"
  },
  {
    name: "Vagas Especiais PcD",
    category: "novidades",
    subject: "♿ Vagas Exclusivas PcD",
    message: "Olá {nome}!\n\n♿ INCLUSÃO:\n\nNovas vagas PcD toda semana!\n\n• Empresas comprometidas\n• Acessibilidade garantida\n• Direitos respeitados\n\nVeja:\nvagasabertaspb.com.br/vagas?tipo=PCD",
    channel: "both"
  },
  {
    name: "Home Office Esta Semana",
    category: "novidades",
    subject: "🏠 50+ Vagas Home Office Agora!",
    message: "Trabalhe de casa {nome}! 🏠\n\n🌟 50+ VAGAS REMOTAS:\n\n• Atendimento\n• TI\n• Marketing\n• Vendas\n\nConfira:\nvagasabertaspb.com.br/homeoffice",
    channel: "both"
  },
  {
    name: "Alerta: Nova Vaga Match",
    category: "engajamento",
    subject: "🎯 Nova vaga PERFEITA para você!",
    message: "Boa notícia {nome}! 🎉\n\nVAGA com seu PERFIL:\n\n• Combina com suas skills\n• Salário compatível\n• Localização ideal\n\n⏰ Candidate-se primeiro!\nvagasabertaspb.com.br/vagas",
    channel: "whatsapp"
  },
  {
    name: "Feature: Simulador Entrevista",
    category: "features",
    subject: "🎤 Novo: Simulador de Entrevista IA",
    message: "Novidade {nome}! 🤖\n\nSIMULADOR DE ENTREVISTA com IA:\n\n✅ Perguntas reais\n✅ Feedback instantâneo\n✅ Melhore suas respostas\n\nTreine agora:\nvagasabertaspb.com.br/utilidades",
    channel: "both"
  },
  {
    name: "Lembrete: Vagas Salvos",
    category: "engajamento",
    subject: "⭐ Você tem 5 vagas salvas!",
    message: "Ei {nome}! 📋\n\nVocê salvou 5 vagas mas não se candidatou!\n\n⏰ Não perca tempo:\n• As vagas expiram rápido\n• Quanto antes, melhor\n\nCandidatar-se:\nvagasabertaspb.com.br/favoritos",
    channel: "both"
  },
  {
    name: "Parabéns: Contratação",
    category: "engajamento",
    subject: "🎉 PARABÉNS pela conquista!",
    message: "PARABÉNS {nome}! 🎊\n\nSoubemos que você conseguiu!\n\n💼 Desejamos muito sucesso na nova jornada!\n\n🌟 Continue no app para acompanhar sua carreira!\n\nvagasabertaspb.com.br",
    channel: "both"
  },
  {
    name: "Comunidade: Grupo WhatsApp",
    category: "engajamento",
    subject: "👥 Entre no Grupo de Empregos PB",
    message: "Olá {nome}! 💬\n\nGRUPO WHATSAPP:\n\n✅ Vagas diárias\n✅ Dicas de carreira\n✅ Networking\n✅ +500 membros ativos\n\nEntre agora:\nvagasabertaspb.com.br/grupos",
    channel: "whatsapp"
  },
  {
    name: "Últimas Horas Promo",
    category: "urgencia",
    subject: "⏰ ÚLTIMAS 3 HORAS - Premium 50% OFF",
    message: "URGENTE {nome}! ⏰\n\n🔥 ACABA EM 3 HORAS:\n\nPremium R$ 12,90/mês\n(50% desconto)\n\n⚡ NÃO PERCA!\n\nAtive agora:\nvagasabertaspb.com.br/premium",
    channel: "both"
  },
  {
    name: "Feature: Teste DISC",
    category: "features",
    subject: "🧠 Descubra seu Perfil Profissional",
    message: "Conheça-se {nome}! 🎯\n\nTESTE DISC GRATUITO:\n\n🧠 Descubra seu perfil\n💼 Melhores carreiras para você\n📊 Relatório completo\n\nFaça agora:\nvagasabertaspb.com.br/utilidades",
    channel: "both"
  },
  {
    name: "Dicas: Negociação Salário",
    category: "engajamento",
    subject: "💰 Dica: Como negociar seu salário",
    message: "Aprenda {nome}! 💡\n\nNEGOCIAÇÃO SALARIAL:\n\n✅ Pesquise o mercado\n✅ Destaque seu valor\n✅ Seja flexível\n✅ Peça no momento certo\n\nGuia completo:\nvagasabertaspb.com.br/blog",
    channel: "both"
  },
  {
    name: "Feedback: App Review",
    category: "engajamento",
    subject: "⭐ Avalie o app - 30 segundos",
    message: "Olá {nome}! 🙏\n\nEstá gostando do app?\n\n⭐ Deixe sua avaliação!\n\n🎁 Cada review nos motiva a melhorar mais!\n\nAvaliar:\nPlay Store / App Store\n\nObrigado! ❤️",
    channel: "email"
  }
];

export default function CentralPromocoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Estados
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '', category: 'boas_vindas', subject: '', message: '', channel: 'both'
  });
  
  const [sendForm, setSendForm] = useState({
    target_audience: 'all',
    custom_emails: '',
    channel: 'both',
    scheduled_date: '',
    send_now: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin' && currentUser?.subscription_type !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Queries
  const { data: templates = [] } = useQuery({
    queryKey: ['promoTemplates'],
    queryFn: () => base44.entities.PromoTemplate.list(),
    enabled: !!user
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['promoSchedules'],
    queryFn: () => base44.entities.PromoSchedule.list('-scheduled_date'),
    enabled: !!user
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.PromoTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promoTemplates']);
      setShowTemplateModal(false);
      setTemplateForm({ name: '', category: 'boas_vindas', subject: '', message: '', channel: 'both' });
      alert('✅ Template criado!');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PromoTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promoTemplates']);
      setShowTemplateModal(false);
      setEditingTemplate(null);
      alert('✅ Template atualizado!');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['promoTemplates']);
      alert('✅ Template deletado!');
    }
  });

  const sendPromoMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendPromoNow', data),
    onSuccess: (response) => {
      const result = response.data;
      alert(`✅ Enviado!\n\n📧 Enviados: ${result.sent}\n❌ Falhas: ${result.failed}`);
      setShowSendModal(false);
      queryClient.invalidateQueries(['promoSchedules']);
    }
  });

  const schedulePromoMutation = useMutation({
    mutationFn: (data) => base44.entities.PromoSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promoSchedules']);
      alert('✅ Envio agendado!');
      setShowSendModal(false);
    }
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoSchedule.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['promoSchedules']);
      alert('✅ Agendamento cancelado!');
    }
  });

  // Criar templates padrão
  const handleCreateDefaults = async () => {
    if (!confirm('Criar 30 templates padrão?')) return;
    
    try {
      for (const template of DEFAULT_TEMPLATES) {
        await base44.entities.PromoTemplate.create(template);
      }
      queryClient.invalidateQueries(['promoTemplates']);
      alert('✅ 30 templates criados com sucesso!');
    } catch (error) {
      alert('❌ Erro: ' + error.message);
    }
  };

  // Handlers
  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.message) {
      alert('Preencha nome e mensagem!');
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleSendPromo = () => {
    if (!selectedTemplate) {
      alert('Selecione um template!');
      return;
    }

    const payload = {
      template_id: selectedTemplate.id,
      target_audience: sendForm.target_audience,
      custom_emails: sendForm.custom_emails ? sendForm.custom_emails.split(',').map(e => e.trim()) : [],
      channel: sendForm.channel
    };

    if (sendForm.send_now) {
      if (!confirm('Enviar agora para todos os usuários selecionados?')) return;
      sendPromoMutation.mutate(payload);
    } else {
      if (!sendForm.scheduled_date) {
        alert('Defina a data de agendamento!');
        return;
      }
      schedulePromoMutation.mutate({
        ...payload,
        template_name: selectedTemplate.name,
        scheduled_date: sendForm.scheduled_date
      });
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Promoções</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie campanhas de email e WhatsApp</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button onClick={handleCreateDefaults} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar 30 Templates Padrão
            </Button>
          )}
          <Button onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', category: 'boas_vindas', subject: '', message: '', channel: 'both' }); setShowTemplateModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Agendados</p>
                <p className="text-2xl font-bold">{schedules.filter(s => s.status === 'pending').length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Enviados</p>
                <p className="text-2xl font-bold">{schedules.filter(s => s.status === 'sent').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Enviados</p>
                <p className="text-2xl font-bold">{schedules.reduce((sum, s) => sum + (s.sent_count || 0), 0)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
                    <SelectItem value="planos">Planos</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="engajamento">Engajamento</SelectItem>
                    <SelectItem value="reativacao">Reativação</SelectItem>
                    <SelectItem value="urgencia">Urgência</SelectItem>
                    <SelectItem value="feriados">Feriados</SelectItem>
                    <SelectItem value="novidades">Novidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge className="mt-2">{template.category}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingTemplate(template); setTemplateForm(template); setShowTemplateModal(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm('Deletar template?')) deleteTemplateMutation.mutate(template.id); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.subject && (
                    <p className="text-sm font-medium mb-2">📧 {template.subject}</p>
                  )}
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">{template.message}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => { setSelectedTemplate(template); setShowSendModal(true); }}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(template.message); alert('Copiado!'); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600">Nenhum template encontrado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{schedule.template_name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                      <span>📅 {new Date(schedule.scheduled_date).toLocaleString('pt-BR')}</span>
                      <span>👥 {schedule.target_audience}</span>
                      <span>📧 {schedule.channel}</span>
                    </div>
                    {schedule.status === 'sent' && (
                      <div className="mt-2 text-sm">
                        <span className="text-green-600">✅ Enviados: {schedule.sent_count}</span>
                        {schedule.failed_count > 0 && <span className="text-red-600 ml-4">❌ Falhas: {schedule.failed_count}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {schedule.status === 'pending' && <Badge className="bg-amber-500">Pendente</Badge>}
                    {schedule.status === 'sent' && <Badge className="bg-green-500">Enviado</Badge>}
                    {schedule.status === 'failed' && <Badge className="bg-red-500">Falhou</Badge>}
                    {schedule.status === 'cancelled' && <Badge variant="outline">Cancelado</Badge>}
                    {schedule.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => { if (confirm('Cancelar?')) cancelScheduleMutation.mutate(schedule.id); }}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {schedules.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600">Nenhum envio agendado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Template */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({...templateForm, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
                  <SelectItem value="planos">Planos</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                  <SelectItem value="engajamento">Engajamento</SelectItem>
                  <SelectItem value="reativacao">Reativação</SelectItem>
                  <SelectItem value="urgencia">Urgência</SelectItem>
                  <SelectItem value="feriados">Feriados</SelectItem>
                  <SelectItem value="novidades">Novidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Assunto (para email)</label>
              <Input value={templateForm.subject} onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea rows={8} value={templateForm.message} onChange={(e) => setTemplateForm({...templateForm, message: e.target.value})} placeholder="Use {nome} e {email} para personalizar" />
            </div>
            <div>
              <label className="text-sm font-medium">Canal</label>
              <Select value={templateForm.channel} onValueChange={(v) => setTemplateForm({...templateForm, channel: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveTemplate}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Envio */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Público-Alvo</label>
              <Select value={sendForm.target_audience} onValueChange={(v) => setSendForm({...sendForm, target_audience: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                  <SelectItem value="basic">Plano Basic</SelectItem>
                  <SelectItem value="premium">Plano Premium</SelectItem>
                  <SelectItem value="recruiter">Plano Recruiter</SelectItem>
                  <SelectItem value="inactive">Usuários Inativos</SelectItem>
                  <SelectItem value="custom">Emails Específicos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sendForm.target_audience === 'custom' && (
              <div>
                <label className="text-sm font-medium">Emails (separados por vírgula)</label>
                <Textarea rows={3} value={sendForm.custom_emails} onChange={(e) => setSendForm({...sendForm, custom_emails: e.target.value})} placeholder="email1@exemplo.com, email2@exemplo.com" />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Canal</label>
              <Select value={sendForm.channel} onValueChange={(v) => setSendForm({...sendForm, channel: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sendForm.send_now} onChange={(e) => setSendForm({...sendForm, send_now: e.target.checked})} />
                <span className="text-sm">Enviar agora</span>
              </label>
            </div>

            {!sendForm.send_now && (
              <div>
                <label className="text-sm font-medium">Agendar para</label>
                <Input type="datetime-local" value={sendForm.scheduled_date} onChange={(e) => setSendForm({...sendForm, scheduled_date: e.target.value})} />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSendModal(false)}>Cancelar</Button>
              <Button onClick={handleSendPromo} disabled={sendPromoMutation.isPending || schedulePromoMutation.isPending}>
                {(sendPromoMutation.isPending || schedulePromoMutation.isPending) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />{sendForm.send_now ? 'Enviar Agora' : 'Agendar'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}