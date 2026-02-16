import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, TrendingUp, Users, Clock, AlertCircle,
  Plus, Edit2, Eye, Download, Filter, Search,
  DollarSign, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import SubscriptionActionsMenu from "@/components/financeiro/SubscriptionActionsMenu";

export default function ControleFinanceiro() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [migrating, setMigrating] = useState(false);

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 1000),
  });

  // Fetch financial history
  const { data: history = [] } = useQuery({
    queryKey: ['financialHistory'],
    queryFn: () => base44.entities.FinancialHistory.list('-timestamp', 500),
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin' && currentUser.subscription_type !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const calculateMetrics = () => {
    const metrics = {
      totalRevenue: 0,
      monthlyRevenue: 0,
      activeCount: 0,
      pendingCount: 0,
      blockedCount: 0,
      renewalRate: 0,
    };

    subscriptions.forEach(sub => {
      metrics.totalRevenue += sub.amount || 0;
      
      const paymentDate = new Date(sub.payment_date);
      const now = new Date();
      if (paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()) {
        metrics.monthlyRevenue += sub.amount || 0;
      }

      if (sub.status === 'active') metrics.activeCount++;
      if (sub.status === 'pending') metrics.pendingCount++;
      if (sub.status === 'blocked') metrics.blockedCount++;
    });

    const renewals = history.filter(h => h.event_type === 'renewal').length;
    metrics.renewalRate = subscriptions.length > 0 ? Math.round((renewals / subscriptions.length) * 100) : 0;

    return metrics;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      active: 'bg-green-50 text-green-700 border-green-200',
      blocked: 'bg-red-50 text-red-700 border-red-200',
      renewing: 'bg-blue-50 text-blue-700 border-blue-200',
      canceled: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      active: <CheckCircle className="w-4 h-4" />,
      blocked: <XCircle className="w-4 h-4" />,
      renewing: <AlertTriangle className="w-4 h-4" />,
      canceled: <XCircle className="w-4 h-4" />
    };
    return icons[status];
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchSearch = !searchTerm || 
      sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchType = filterType === 'all' || sub.account_type === filterType;
    
    return matchSearch && matchStatus && matchType;
  });

  const metrics = calculateMetrics();

  if (loading || subsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Controle Financeiro</h1>
          <p className="text-white/70">Gerenciar assinaturas, cobranças e receitas</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receita Total</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receita Mensal</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    R$ {metrics.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Assinaturas Ativas</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.activeCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Taxa de Renovação</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.renewalRate}%</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles e Filtros */}
        <Card className="dark:bg-slate-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                disabled={migrating}
                onClick={async () => {
                  if (!confirm('Migrar todos os usuários premium/recrutador do Gerenciador para o Controle Financeiro?')) return;
                  setMigrating(true);
                  try {
                    const res = await base44.functions.invoke('migrateUsersToFinancial');
                    alert(res.data.message);
                    window.location.reload();
                  } catch (e) {
                    alert('Erro: ' + e.message);
                  } finally {
                    setMigrating(false);
                  }
                }}
              >
                {migrating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                {migrating ? 'Migrando...' : 'Migrar Usuários'}
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Assinatura
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                  <option value="renewing">Em Renovação</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Conta
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="premium">Premium</option>
                  <option value="recruiter">Recrutador</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Assinaturas */}
        <Card className="dark:bg-slate-800 overflow-hidden">
          <CardHeader>
            <CardTitle>Assinaturas ({filteredSubscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Usuário</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Tipo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Valor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Vencimento</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Dias</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                        Nenhuma assinatura encontrada
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{sub.user_name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{sub.user_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {sub.account_type === 'premium' ? '👑 Premium' : '💼 Recrutador'}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(sub.status)}`}>
                            {getStatusIcon(sub.status)}
                            {sub.status === 'pending' && 'Pendente'}
                            {sub.status === 'active' && 'Ativo'}
                            {sub.status === 'blocked' && 'Bloqueado'}
                            {sub.status === 'renewing' && 'Renovando'}
                            {sub.status === 'canceled' && 'Cancelado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                          R$ {sub.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(sub.expiration_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${
                            sub.days_remaining > 7 ? 'text-green-600' :
                            sub.days_remaining > 0 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {sub.days_remaining > 0 ? `${sub.days_remaining}d` : 'Expirado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <SubscriptionActionsMenu
                            subscription={sub}
                            onView={(s) => alert(`Detalhes de ${s.user_name}`)}
                            onEdit={(s) => alert(`Editar ${s.user_name}`)}
                            onRenew={(s) => alert(`Renovar ${s.user_name}`)}
                            onDelete={(s) => alert(`Deletar ${s.user_name}`)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Pendentes */}
        {(metrics.pendingCount > 0 || metrics.blockedCount > 0) && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">⚠️ Alertas Importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-amber-700 dark:text-amber-300 text-sm">
              {metrics.pendingCount > 0 && (
                <p>• {metrics.pendingCount} assinatura(s) aguardando confirmação de pagamento</p>
              )}
              {metrics.blockedCount > 0 && (
                <p>• {metrics.blockedCount} assinatura(s) bloqueada(s) por vencimento</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}