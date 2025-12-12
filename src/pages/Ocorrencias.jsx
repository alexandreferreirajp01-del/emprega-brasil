import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, Send, Loader2, ChevronLeft, Mail, 
  User, Calendar, Briefcase, CheckCircle, Clock, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Ocorrencias() {
  const [user, setUser] = useState(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState('pending');
  const queryClient = useQueryClient();

  // Verificar autenticação
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin' ||
                       currentUser?.email === 'alexandreferreirajp01@gmail.com';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      }
    };
    checkAuth();
  }, []);

  // Buscar ocorrências
  const { data: occurrences = [], isLoading } = useQuery({
    queryKey: ['occurrences', filter],
    queryFn: async () => {
      const allOccurrences = await base44.entities.Occurrence.list('-created_date');
      if (filter === 'all') return allOccurrences;
      return allOccurrences.filter(occ => occ.status === filter);
    },
    enabled: !!user
  });

  // Mutation para responder
  const respondMutation = useMutation({
    mutationFn: async ({ occurrenceId, responseText }) => {
      const occurrence = occurrences.find(o => o.id === occurrenceId);
      
      // Atualizar ocorrência
      await base44.entities.Occurrence.update(occurrenceId, {
        admin_response: responseText,
        status: 'answered',
        responded_at: new Date().toISOString(),
        responded_by: user.email
      });

      // Notificar usuário
      await base44.entities.Notification.create({
        user_email: occurrence.user_email,
        title: '✅ Resposta da sua Ocorrência',
        message: `Sua ocorrência sobre "${occurrence.job_title}" foi respondida.`,
        type: 'system',
        job_id: occurrence.job_id
      });

      // Enviar e-mail para usuário
      await base44.integrations.Core.SendEmail({
        to: occurrence.user_email,
        subject: '✅ Resposta da Ocorrência - Vagas Abertas PB',
        body: `
          <h2>Resposta da sua Ocorrência</h2>
          <p><strong>Vaga:</strong> ${occurrence.job_title}</p>
          <p><strong>Seu assunto:</strong> ${occurrence.subject}</p>
          <p><strong>Sua mensagem:</strong></p>
          <p>${occurrence.message}</p>
          <br>
          <h3>Resposta da Equipe:</h3>
          <p>${responseText}</p>
          <br>
          <p>Obrigado por usar o Vagas Abertas PB!</p>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      setResponse('');
      setSelectedOccurrence(null);
    }
  });

  const handleRespond = () => {
    if (!response.trim() || !selectedOccurrence) return;
    
    respondMutation.mutate({
      occurrenceId: selectedOccurrence.id,
      responseText: response.trim()
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-0"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'answered':
        return <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle className="w-3 h-3 mr-1" />Respondida</Badge>;
      case 'resolved':
        return <Badge className="bg-blue-100 text-blue-700 border-0"><CheckCircle className="w-3 h-3 mr-1" />Resolvida</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-0">-</Badge>;
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-[#0A66C2] pt-6 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-4 rounded-xl">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Ocorrências</h1>
          <p className="text-sm md:text-base text-white/80">Gerencie reports e problemas reportados pelos usuários</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        {/* Filtros */}
        <Card className="mb-6 rounded-2xl shadow-lg">
          <CardContent className="p-3 md:p-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 rounded-xl h-auto bg-transparent p-0">
                <TabsTrigger 
                  value="pending" 
                  className="rounded-lg text-xs md:text-sm py-2 data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm"
                >
                  Pendentes ({occurrences.filter(o => o.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="answered" 
                  className="rounded-lg text-xs md:text-sm py-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm"
                >
                  Respondidas ({occurrences.filter(o => o.status === 'answered').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="resolved" 
                  className="rounded-lg text-xs md:text-sm py-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm"
                >
                  Resolvidas ({occurrences.filter(o => o.status === 'resolved').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="rounded-lg text-xs md:text-sm py-2 data-[state=active]:bg-slate-200 data-[state=active]:text-slate-800 data-[state=active]:font-semibold data-[state=active]:shadow-sm"
                >
                  Todas ({occurrences.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {occurrences.filter(o => o.status === 'pending').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {occurrences.filter(o => o.status === 'answered').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Respondidas</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {occurrences.filter(o => o.status === 'resolved').length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Resolvidas</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-600">
                {occurrences.length}
              </div>
              <p className="text-xs text-slate-600 mt-1">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Ocorrências */}
        {selectedOccurrence ? (
          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="border-b p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2 text-base md:text-lg">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span className="break-words">{selectedOccurrence.subject}</span>
                  </CardTitle>
                  {getStatusBadge(selectedOccurrence.status)}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOccurrence(null)} className="rounded-lg self-start md:self-center">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Info do Usuário */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Usuário</p>
                    <p className="font-medium text-sm truncate">{selectedOccurrence.user_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-sm truncate">{selectedOccurrence.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Data</p>
                    <p className="font-medium text-sm">{new Date(selectedOccurrence.created_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Vaga */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Vaga Reportada</p>
                </div>
                <p className="text-blue-800">{selectedOccurrence.job_title}</p>
              </div>

              {/* Mensagem do Usuário */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-800 text-sm md:text-base">Mensagem do Usuário</h3>
                </div>
                <div className="p-3 md:p-4 bg-slate-50 rounded-xl">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm md:text-base break-words">{selectedOccurrence.message}</p>
                </div>
              </div>

              {/* Resposta Anterior (se houver) */}
              {selectedOccurrence.admin_response && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-slate-800">Resposta Enviada</h3>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-green-800 whitespace-pre-wrap">{selectedOccurrence.admin_response}</p>
                    <p className="text-xs text-green-600 mt-2">
                      Respondido por {selectedOccurrence.responded_by} em {new Date(selectedOccurrence.responded_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              {/* Formulário de Resposta */}
              {selectedOccurrence.status === 'pending' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="w-4 h-4 text-[#0A66C2] flex-shrink-0" />
                    <h3 className="font-semibold text-slate-800 text-sm md:text-base">Responder Ocorrência</h3>
                  </div>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Digite sua resposta para o usuário..."
                    className="rounded-xl min-h-[120px] md:min-h-[150px] mb-3 text-sm md:text-base"
                    maxLength={2000}
                  />
                  <p className="text-xs text-slate-500 mb-3 md:mb-4">{response.length}/2000 caracteres</p>
                  <Button
                    onClick={handleRespond}
                    disabled={!response.trim() || respondMutation.isPending}
                    className="w-full bg-[#0A66C2] hover:bg-[#004182] rounded-xl h-11 md:h-12 text-sm md:text-base"
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Resposta
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {occurrences.length === 0 ? (
              <Card className="rounded-2xl shadow-lg">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhuma ocorrência encontrada</p>
                </CardContent>
              </Card>
            ) : (
              occurrences.map((occurrence) => (
                <Card 
                  key={occurrence.id} 
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedOccurrence(occurrence)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 mb-1 text-sm md:text-base break-words">{occurrence.subject}</h3>
                        <p className="text-xs md:text-sm text-slate-600 truncate">{occurrence.job_title}</p>
                      </div>
                      <div className="self-start sm:self-center">
                        {getStatusBadge(occurrence.status)}
                      </div>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 mb-3 md:mb-4 line-clamp-2 break-words">{occurrence.message}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
                      <span className="truncate">{occurrence.user_name}</span>
                      <span className="flex-shrink-0">{new Date(occurrence.created_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}