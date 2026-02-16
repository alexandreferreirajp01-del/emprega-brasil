import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, Search, AlertCircle, Briefcase, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuporteAdminPage() {
  const [user, setUser] = useState(null);
  const [selectedConversa, setSelectedConversa] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin' && currentUser?.subscription_type !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = '/';
      }
    };
    checkAuth();
  }, []);

  const { data: mensagens = [] } = useQuery({
    queryKey: ['admin-mensagens'],
    queryFn: async () => {
      return await base44.entities.MensagemDireta.list('-created_date', 1000);
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      return await base44.entities.Report.list('-created_date', 100);
    },
    enabled: !!user
  });

  // Agrupar mensagens por conversa
  const conversas = React.useMemo(() => {
    const conversasMap = new Map();

    mensagens.forEach(msg => {
      const conversaId = msg.conversa_id;
      
      if (!conversasMap.has(conversaId)) {
        const isAdmin = msg.remetente_email === user?.email || 
                        msg.destinatario_email === user?.email;
        
        const outroParticipante = {
          email: msg.remetente_email !== user?.email ? msg.remetente_email : msg.destinatario_email,
          nome: msg.remetente_email !== user?.email ? msg.remetente_nome : msg.destinatario_nome,
          foto: msg.remetente_email !== user?.email ? msg.remetente_foto : msg.destinatario_foto
        };

        conversasMap.set(conversaId, {
          conversa_id: conversaId,
          outroParticipante,
          mensagens: [],
          ultimaMensagem: msg,
          naoLidas: 0,
          message_type: msg.message_type
        });
      }

      const conversa = conversasMap.get(conversaId);
      conversa.mensagens.push(msg);
      
      if (msg.destinatario_email === user?.email && !msg.lida) {
        conversa.naoLidas++;
      }
    });

    return Array.from(conversasMap.values())
      .sort((a, b) => new Date(b.ultimaMensagem.created_date) - new Date(a.ultimaMensagem.created_date));
  }, [mensagens, user]);

  // Filtrar conversas
  const conversasFiltradas = conversas.filter(c => {
    const matchSearch = c.outroParticipante.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.outroParticipante.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'unread') return c.naoLidas > 0;
    if (filterType === 'reports') return c.message_type?.includes('report');
    return true;
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.functions.invoke('sendMessage', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-mensagens']);
      setMessageText('');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (mensagemId) => {
      await base44.entities.MensagemDireta.update(mensagemId, { lida: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-mensagens']);
    }
  });

  useEffect(() => {
    if (selectedConversa && user) {
      const conversaData = conversas.find(c => c.conversa_id === selectedConversa);
      if (conversaData) {
        conversaData.mensagens
          .filter(msg => msg.destinatario_email === user.email && !msg.lida)
          .forEach(msg => markAsReadMutation.mutate(msg.id));
      }
    }
  }, [selectedConversa, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversa, mensagens]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversa) return;

    const conversa = conversas.find(c => c.conversa_id === selectedConversa);
    if (!conversa) return;

    sendMessageMutation.mutate({
      destinatario_email: conversa.outroParticipante.email,
      conteudo: messageText,
      message_type: 'admin_to_user'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageTypeIcon = (type) => {
    if (type?.includes('report_job')) return <Briefcase className="w-3 h-3" />;
    if (type?.includes('report')) return <AlertCircle className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  const totalUnread = conversas.reduce((acc, c) => acc + c.naoLidas, 0);
  const reportConversas = conversas.filter(c => c.message_type?.includes('report')).length;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const conversaSelecionada = conversas.find(c => c.conversa_id === selectedConversa);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Central de Suporte
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie todas as conversas e relatórios
          </p>

          <div className="flex gap-4 mt-4">
            <Card className="flex-1 dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{conversas.length}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Conversas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUnread}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Não Lidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportConversas}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Relatórios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-350px)]">
          <Card className="lg:col-span-1 flex flex-col dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 flex flex-col h-full">
              <Tabs value={filterType} onValueChange={setFilterType} className="mb-4">
                <TabsList className="grid w-full grid-cols-3 dark:bg-slate-700">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="unread">
                    Não Lidas {totalUnread > 0 && `(${totalUnread})`}
                  </TabsTrigger>
                  <TabsTrigger value="reports">Relatórios</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {conversasFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma conversa</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversasFiltradas.map((conversa) => (
                      <button
                        key={conversa.conversa_id}
                        onClick={() => setSelectedConversa(conversa.conversa_id)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          selectedConversa === conversa.conversa_id
                            ? 'bg-blue-50 dark:bg-slate-700 border-2 border-blue-500'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-12 h-12 bg-slate-200 dark:bg-slate-600">
                              {conversa.outroParticipante.foto ? (
                                <img src={conversa.outroParticipante.foto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold">
                                  {conversa.outroParticipante.nome?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </Avatar>
                            {conversa.naoLidas > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {conversa.naoLidas}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {conversa.outroParticipante.nome}
                              </p>
                              {conversa.message_type?.includes('report') && (
                                <Badge variant="destructive" className="text-xs">
                                  {getMessageTypeIcon(conversa.message_type)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {conversa.ultimaMensagem.conteudo}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {formatTime(conversa.ultimaMensagem.created_date)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 flex flex-col dark:bg-slate-800 dark:border-slate-700">
            {selectedConversa && conversaSelecionada ? (
              <>
                <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-slate-200 dark:bg-slate-600">
                      {conversaSelecionada.outroParticipante.foto ? (
                        <img src={conversaSelecionada.outroParticipante.foto} alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold">
                          {conversaSelecionada.outroParticipante.nome?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {conversaSelecionada.outroParticipante.nome}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {conversaSelecionada.outroParticipante.email}
                      </p>
                    </div>
                    {conversaSelecionada.message_type?.includes('report') && (
                      <Badge variant="destructive">Relatório</Badge>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {conversaSelecionada.mensagens
                      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                      .map((msg) => {
                        const isMe = msg.remetente_email === user.email;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isMe 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}>
                              <p className="text-sm">{msg.conteudo}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                {formatTime(msg.created_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua resposta..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma conversa para responder</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}