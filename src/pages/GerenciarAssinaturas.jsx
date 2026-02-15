import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, Search, Calendar, DollarSign, TrendingUp, Users, 
  Clock, AlertCircle, CheckCircle, XCircle, Edit, Trash2, Plus,
  BarChart3, Download, Filter, RefreshCw
} from "lucide-react";
import { format, differenceInDays, addMonths, addDays } from "date-fns";
import { toast } from "sonner";

export default function GerenciarAssinaturas() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [users, setUsers] = useState([]);

  // Estados do formulário
  const [formData, setFormData] = useState({
    user_email: '',
    user_name: '',
    subscription_type: 'premium',
    plan_duration: 'mensal',
    start_date: new Date().toISOString().split('T')[0],
    payment_amount: 0,
    payment_status: 'pending',
    payment_method: 'pix',
    auto_renew: false,
    notes: ''
  });

  // Carregar assinaturas e usuários
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsData, usersData] = await Promise.all([
        base44.entities.Subscription.list('-created_date'),
        base44.entities.User.list()
      ]);
      setSubscriptions(subsData);
      setFilteredSubs(subsData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar assinaturas
  useEffect(() => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(sub => sub.subscription_type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    setFilteredSubs(filtered);
  }, [searchTerm, filterType, filterStatus, subscriptions]);

  // Calcular data de vencimento
  const calculateEndDate = (startDate, duration) => {
    const start = new Date(startDate);
    switch(duration) {
      case 'mensal': return addMonths(start, 1);
      case 'trimestral': return addMonths(start, 3);
      case 'semestral': return addMonths(start, 6);
      case 'anual': return addMonths(start, 12);
      default: return addMonths(start, 1);
    }
  };

  // Adicionar nova assinatura
  const handleAddSubscription = async () => {
    try {
      const endDate = calculateEndDate(formData.start_date, formData.plan_duration);
      
      await base44.entities.Subscription.create({
        ...formData,
        end_date: endDate.toISOString(),
        status: 'active'
      });

      // Atualizar subscription_type do usuário
      const user = users.find(u => u.email === formData.user_email);
      if (user) {
        await base44.entities.User.update(user.id, {
          subscription_type: formData.subscription_type
        });
      }

      toast.success('Assinatura criada com sucesso!');
      setShowAddDialog(false);
      loadData();
      resetForm();
    } catch (error) {
      toast.error('Erro ao criar assinatura');
    }
  };

  // Editar assinatura
  const handleEditSubscription = async () => {
    try {
      const endDate = calculateEndDate(selectedSub.start_date, selectedSub.plan_duration);
      
      await base44.entities.Subscription.update(selectedSub.id, {
        ...selectedSub,
        end_date: endDate.toISOString()
      });

      toast.success('Assinatura atualizada!');
      setShowEditDialog(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar assinatura');
    }
  };

  // Deletar assinatura
  const handleDeleteSubscription = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta assinatura?')) return;
    
    try {
      await base44.entities.Subscription.delete(id);
      toast.success('Assinatura deletada!');
      loadData();
    } catch (error) {
      toast.error('Erro ao deletar assinatura');
    }
  };

  // Renovar assinatura
  const handleRenewSubscription = async (sub) => {
    try {
      const newStartDate = new Date(sub.end_date);
      const newEndDate = calculateEndDate(newStartDate, sub.plan_duration);
      
      await base44.entities.Subscription.update(sub.id, {
        start_date: newStartDate.toISOString(),
        end_date: newEndDate.toISOString(),
        status: 'active',
        payment_status: 'pending'
      });

      toast.success('Assinatura renovada!');
      loadData();
    } catch (error) {
      toast.error('Erro ao renovar assinatura');
    }
  };

  // Sincronizar usuários existentes
  const handleSyncExistingUsers = async () => {
    if (!confirm('Sincronizar todos os usuários Premium e Recrutador que ainda não têm assinatura registrada?')) return;
    
    try {
      setLoading(true);
      
      // Filtrar usuários Premium e Recrutador
      const premiumUsers = users.filter(u => 
        (u.subscription_type === 'premium' || u.subscription_type === 'recruiter') &&
        !subscriptions.some(s => s.user_email === u.email && s.status === 'active')
      );

      if (premiumUsers.length === 0) {
        toast.success('Todos os usuários já estão sincronizados!');
        return;
      }

      let created = 0;
      for (const user of premiumUsers) {
        const startDate = new Date();
        const endDate = calculateEndDate(startDate, 'mensal');
        
        await base44.entities.Subscription.create({
          user_email: user.email,
          user_name: user.full_name || user.email,
          subscription_type: user.subscription_type,
          plan_duration: 'mensal',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_status: 'pending',
          status: 'active',
          notes: 'Sincronização automática de usuário existente'
        });
        created++;
      }

      toast.success(`${created} assinaturas criadas!`);
      loadData();
    } catch (error) {
      toast.error('Erro ao sincronizar usuários');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_email: '',
      user_name: '',
      subscription_type: 'premium',
      plan_duration: 'mensal',
      start_date: new Date().toISOString().split('T')[0],
      payment_amount: 0,
      payment_status: 'pending',
      payment_method: 'pix',
      auto_renew: false,
      notes: ''
    });
  };

  // Calcular dias restantes
  const getDaysRemaining = (endDate) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  // Status badge
  const getStatusBadge = (status) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', text: 'Ativa' },
      expired: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', text: 'Expirada' },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', text: 'Cancelada' }
    };
    const config = configs[status] || configs.active;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  // Payment status badge
  const getPaymentBadge = (status) => {
    const configs = {
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', text: 'Pago', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', text: 'Pendente', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', text: 'Vencido', icon: AlertCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', text: 'Cancelado', icon: XCircle }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  // Calcular estatísticas
  const stats = {
    total: filteredSubs.length,
    active: filteredSubs.filter(s => s.status === 'active').length,
    revenue: filteredSubs.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + (s.payment_amount || 0), 0),
    pending: filteredSubs.filter(s => s.payment_status === 'pending').length,
    expiringSoon: filteredSubs.filter(s => {
      const days = getDaysRemaining(s.end_date);
      return days >= 0 && days <= 7 && s.status === 'active';
    }).length
  };

  // Relatório mensal
  const MonthlyReport = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyData = filteredSubs.filter(sub => {
      const startDate = new Date(sub.start_date);
      return startDate.getMonth() === currentMonth && 
             startDate.getFullYear() === currentYear &&
             sub.payment_status === 'paid';
    });

    const monthlyRevenue = monthlyData.reduce((sum, s) => sum + (s.payment_amount || 0), 0);

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Relatório Mensal - {format(now, 'MMMM yyyy')}</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Novas Assinaturas</div>
              <div className="text-2xl font-bold">{monthlyData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Receita Total</div>
              <div className="text-2xl font-bold text-green-600">R$ {monthlyRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Detalhamento por Plano:</h4>
          {['mensal', 'trimestral', 'semestral', 'anual'].map(plan => {
            const planData = monthlyData.filter(s => s.plan_duration === plan);
            const planRevenue = planData.reduce((sum, s) => sum + (s.payment_amount || 0), 0);
            
            return (
              <div key={plan} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="capitalize">{plan}</span>
                <span className="font-semibold">{planData.length} assinaturas - R$ {planRevenue.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Carregando assinaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-8 h-8" />
              Gerenciar Assinaturas
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Controle financeiro de Premium e Recrutadores</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowReportDialog(true)} variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatório
            </Button>
            <Button onClick={handleSyncExistingUsers} variant="outline" disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar
            </Button>
            <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Assinatura
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Receita</p>
                  <p className="text-2xl font-bold text-green-600">R$ {stats.revenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Vencendo</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="recruiter">Recrutador</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Assinaturas */}
        <div className="space-y-3">
          {filteredSubs.map((sub) => {
            const daysRemaining = getDaysRemaining(sub.end_date);
            const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;
            
            return (
              <Card key={sub.id} className={isExpiringSoon ? 'border-orange-500 dark:border-orange-600' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-lg">{sub.user_name || sub.user_email}</span>
                        <Badge variant="outline" className="capitalize">
                          {sub.subscription_type}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {sub.plan_duration}
                        </Badge>
                        {getStatusBadge(sub.status)}
                        {getPaymentBadge(sub.payment_status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Início: {format(new Date(sub.start_date), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Vencimento: {format(new Date(sub.end_date), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {daysRemaining >= 0 ? (
                            <span className={isExpiringSoon ? 'text-orange-600 font-semibold' : ''}>
                              {daysRemaining} dias restantes
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Vencida há {Math.abs(daysRemaining)} dias
                            </span>
                          )}
                        </div>
                      </div>

                      {sub.payment_amount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            R$ {sub.payment_amount.toFixed(2)}
                          </span>
                          {sub.payment_method && (
                            <span className="text-slate-600 dark:text-slate-400">
                              ({sub.payment_method})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSub(sub);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRenewSubscription(sub)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteSubscription(sub.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {sub.notes && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                      <strong>Observações:</strong> {sub.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {filteredSubs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-slate-600 dark:text-slate-400">
                Nenhuma assinatura encontrada
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialog - Adicionar Assinatura */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Assinatura</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Usuário</label>
                  <Select 
                    value={formData.user_email} 
                    onValueChange={(value) => {
                      const user = users.find(u => u.email === value);
                      setFormData({
                        ...formData,
                        user_email: value,
                        user_name: user?.full_name || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo</label>
                  <Select value={formData.subscription_type} onValueChange={(value) => setFormData({...formData, subscription_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Plano</label>
                  <Select value={formData.plan_duration} onValueChange={(value) => setFormData({...formData, plan_duration: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.payment_amount}
                    onChange={(e) => setFormData({...formData, payment_amount: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Método Pagamento</label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status Pagamento</label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData({...formData, payment_status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Observações</label>
                <Textarea
                  placeholder="Notas adicionais..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button onClick={handleAddSubscription} className="bg-blue-600 hover:bg-blue-700">
                Criar Assinatura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Editar Assinatura */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Assinatura</DialogTitle>
            </DialogHeader>

            {selectedSub && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo</label>
                    <Select value={selectedSub.subscription_type} onValueChange={(value) => setSelectedSub({...selectedSub, subscription_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="recruiter">Recrutador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Plano</label>
                    <Select value={selectedSub.plan_duration} onValueChange={(value) => setSelectedSub({...selectedSub, plan_duration: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Início</label>
                    <Input
                      type="date"
                      value={selectedSub.start_date?.split('T')[0]}
                      onChange={(e) => setSelectedSub({...selectedSub, start_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Valor</label>
                    <Input
                      type="number"
                      value={selectedSub.payment_amount || 0}
                      onChange={(e) => setSelectedSub({...selectedSub, payment_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status Pagamento</label>
                    <Select value={selectedSub.payment_status} onValueChange={(value) => setSelectedSub({...selectedSub, payment_status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="overdue">Vencido</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status Assinatura</label>
                    <Select value={selectedSub.status} onValueChange={(value) => setSelectedSub({...selectedSub, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="expired">Expirada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Método Pagamento</label>
                  <Select value={selectedSub.payment_method} onValueChange={(value) => setSelectedSub({...selectedSub, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Observações</label>
                  <Textarea
                    value={selectedSub.notes || ''}
                    onChange={(e) => setSelectedSub({...selectedSub, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
              <Button onClick={handleEditSubscription} className="bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Relatório */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Relatório Financeiro
              </DialogTitle>
            </DialogHeader>

            <MonthlyReport />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}