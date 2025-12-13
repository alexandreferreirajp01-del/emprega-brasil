import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Check, X, Clock, DollarSign, Search, RefreshCw, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function PaymentsManager({ showToast }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      try {
        return await base44.entities.Payment.list('-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar pagamentos:', e);
        return [];
      }
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status, userEmail }) => {
      await base44.entities.Payment.update(id, { status });
      
      // Se aprovado, atualizar usuário para premium
      if (status === 'approved' && userEmail) {
        const users = await base44.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          await base44.entities.User.update(users[0].id, {
            subscription_type: 'premium',
            premium_activated_at: new Date().toISOString()
          });
          
          // Enviar email de confirmação
          await base44.integrations.Core.SendEmail({
            to: userEmail,
            subject: '🎉 Bem-vindo ao Vagas Abertas Premium!',
            body: `Olá!

Seu pagamento foi confirmado e sua conta agora é Premium!

Você tem acesso a:
✅ Todas as vagas exclusivas
✅ Alertas de novas vagas
✅ Suporte prioritário

Acesse agora: ${window.location.origin}

Obrigado por fazer parte do Vagas Abertas Paraíba!

Atenciosamente,
Equipe Vagas Abertas Paraíba`
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast?.('Pagamento atualizado!');
    },
    onError: () => showToast?.('Erro ao atualizar pagamento', 'error')
  });

  const filteredPayments = payments.filter(p => {
    const matchesSearch = !search || 
      p.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      p.external_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const approvedPayments = payments.filter(p => p.status === 'approved');
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    refunded: 'bg-purple-100 text-purple-700'
  };

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    refunded: 'Reembolsado'
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100">Pagamentos Pendentes</p>
                <p className="text-3xl font-bold mt-1">{pendingPayments.length}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Pagamentos Aprovados</p>
                <p className="text-3xl font-bold mt-1">{approvedPayments.length}</p>
              </div>
              <Check className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Receita Total</p>
                <p className="text-3xl font-bold mt-1">R$ {totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
                <SelectItem value="refunded">Reembolsados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pagamentos */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0056ff]" />
            Pagamentos ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      payment.status === 'approved' ? 'bg-green-100' :
                      payment.status === 'pending' ? 'bg-amber-100' :
                      payment.status === 'rejected' ? 'bg-red-100' :
                      'bg-purple-100'
                    }`}>
                      <CreditCard className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        payment.status === 'approved' ? 'text-green-600' :
                        payment.status === 'pending' ? 'text-amber-600' :
                        payment.status === 'rejected' ? 'text-red-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base text-slate-800 break-all">{payment.user_email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={`${statusColors[payment.status]} text-xs`}>
                          {statusLabels[payment.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{payment.payment_method || 'N/A'}</Badge>
                        <span className="text-xs sm:text-sm text-slate-500">
                          R$ {(payment.amount || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 break-words">
                        {new Date(payment.created_date).toLocaleString('pt-BR')}
                        {payment.notes && ` • ${payment.notes}`}
                      </p>
                    </div>
                  </div>
                  
                  {payment.status === 'pending' && (
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => updatePaymentMutation.mutate({ 
                          id: payment.id, 
                          status: 'approved',
                          userEmail: payment.user_email
                        })}
                        disabled={updatePaymentMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 rounded-lg flex-1 sm:flex-initial"
                      >
                        {updatePaymentMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePaymentMutation.mutate({ 
                          id: payment.id, 
                          status: 'rejected',
                          userEmail: payment.user_email
                        })}
                        disabled={updatePaymentMutation.isPending}
                        className="text-red-600 hover:bg-red-50 rounded-lg flex-1 sm:flex-initial"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {filteredPayments.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum pagamento encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}