import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, Edit, Trash2, DollarSign, Calendar, 
  AlertTriangle, CheckCircle, XCircle, Crown, Users,
  Briefcase, Sparkles, Clock, Bell, Filter, Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

export default function GerenciarPlanos() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = '/info/Splash';
          return;
        }
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin' && currentUser.subscription_type !== 'admin') {
          window.location.href = '/info/Home';
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = '/info/Splash';
      }
    };
    checkAuth();
  }, []);

  // Buscar assinaturas
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 1000),
    enabled: !!user,
  });

  // Criar assinatura
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Assinatura criada com sucesso');
      setShowAddDialog(false);
    },
    onError: () => {
      toast.error('Erro ao criar assinatura');
    },
  });

  // Atualizar assinatura
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Assinatura atualizada com sucesso');
      setShowEditDialog(false);
      setEditingSubscription(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar assinatura');
    },
  });

  // Deletar assinatura
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Subscription.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Assinatura removida');
    },
    onError: () => {
      toast.error('Erro ao remover assinatura');
    },
  });

  // Filtrar assinaturas
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlan = filterPlan === 'all' || sub.plan_type === filterPlan;
    const matchStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  // Assinaturas próximas do vencimento (7 dias)
  const upcomingBilling = subscriptions.filter(sub => {
    if (sub.billing_cycle === 'lifetime' || !sub.next_billing_date) return false;
    const daysUntilBilling = Math.ceil((new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilBilling <= 7 && daysUntilBilling >= 0 && sub.status === 'active';
  });

  // Assinaturas vencidas
  const overdueSubscriptions = subscriptions.filter(sub => {
    if (sub.billing_cycle === 'lifetime') return false;
    return sub.status === 'overdue' || (sub.next_billing_date && new Date(sub.next_billing_date) < new Date());
  });

  // Stats
  const stats = [
    {
      label: 'Total Assinaturas',
      value: subscriptions.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Assinaturas Ativas',
      value: subscriptions.filter(s => s.status === 'active').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Cobranças Próximas',
      value: upcomingBilling.length,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Vencidas',
      value: overdueSubscriptions.length,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'premium': return <Crown className="w-4 h-4" />;
      case 'premium_black': return <Sparkles className="w-4 h-4" />;
      case 'recruiter': return <Briefcase className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getPlanLabel = (plan) => {
    switch (plan) {
      case 'premium': return 'Premium';
      case 'premium_black': return 'Premium Black';
      case 'recruiter': return 'Recrutador';
      default: return 'Básico';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Ativo</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 text-slate-700">Cancelado</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Expirado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700">Vencido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gerenciar Planos</h1>
          <p className="text-slate-500">Controle de assinaturas, cobranças e avisos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Avisos de Cobrança */}
        {upcomingBilling.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Bell className="w-5 h-5" />
                Cobranças Próximas (Próximos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingBilling.map(sub => (
                  <div key={sub.id} className="flex items-start justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-1">{getPlanIcon(sub.plan_type)}</div>
                        <span className="font-medium text-slate-700">{sub.user_email}</span>
                      </div>
                      <Badge variant="outline">{getPlanLabel(sub.plan_type)}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">
                        Próxima cobrança: {format(new Date(sub.next_billing_date), 'dd/MM/yyyy')}
                      </span>
                      <span className="font-semibold text-green-600">R$ {sub.amount?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vencidas */}
        {overdueSubscriptions.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Assinaturas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueSubscriptions.map(sub => (
                  <div key={sub.id} className="flex items-start justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-1">{getPlanIcon(sub.plan_type)}</div>
                        <span className="font-medium text-slate-700">{sub.user_email}</span>
                      </div>
                      <Badge variant="outline">{getPlanLabel(sub.plan_type)}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-red-600">
                        Vencida em: {format(new Date(sub.next_billing_date), 'dd/MM/yyyy')}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingSubscription(sub);
                          setShowEditDialog(true);
                        }}
                      >
                        Regularizar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros e Pesquisa */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar por email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="premium_black">Premium Black</SelectItem>
                  <SelectItem value="recruiter">Recrutador</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Assinatura
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Assinaturas */}
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas ({filteredSubscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Carregando...</p>
            ) : filteredSubscriptions.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Nenhuma assinatura encontrada</p>
            ) : (
              <div className="space-y-3">
                {filteredSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="mt-1">{getPlanIcon(sub.plan_type)}</div>
                        <div>
                          <p className="font-medium text-slate-800">{sub.user_email}</p>
                          <p className="text-sm text-slate-500">{getPlanLabel(sub.plan_type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 ml-auto">
                        {getStatusBadge(sub.status)}
                        {sub.amount && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">R$ {sub.amount.toFixed(2)}</span>
                          </div>
                        )}
                        {sub.next_billing_date && sub.billing_cycle !== 'lifetime' && (
                          <div className="flex items-center gap-1 text-slate-500 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(sub.next_billing_date), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                        {sub.billing_cycle === 'lifetime' && (
                          <Badge className="bg-purple-100 text-purple-700">Vitalício</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSubscription(sub);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover esta assinatura?')) {
                            deleteMutation.mutate(sub.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Editar/Adicionar (simplificado para exemplo) */}
      <Dialog open={showEditDialog || showAddDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEditDialog(false);
          setShowAddDialog(false);
          setEditingSubscription(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Funcionalidade completa de edição será implementada aqui
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setShowAddDialog(false);
              setEditingSubscription(null);
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}