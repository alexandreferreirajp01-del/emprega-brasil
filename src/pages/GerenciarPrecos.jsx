import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Loader2, DollarSign, Plus, Edit, Trash2, Save, 
  AlertCircle, Crown, Sparkles, Briefcase, Users, Star, Tag, BookOpen, Palette, Timer, ExternalLink
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import PlanosManual from "@/components/admin/PlanosManual";
import ColorPickerModal from "@/components/admin/ColorPickerModal";
import PromoCard from "@/components/subscription/PromoCard";

const ICON_OPTIONS = [
  { value: 'Crown', label: 'Coroa', component: Crown },
  { value: 'Sparkles', label: 'Estrelas', component: Sparkles },
  { value: 'Briefcase', label: 'Maleta', component: Briefcase },
  { value: 'Users', label: 'Usuários', component: Users }
];

export default function GerenciarPrecos() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({});
  const [showManual, setShowManual] = useState(false);
  const [colorPickerMode, setColorPickerMode] = useState(null);
  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
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

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.list('order', 100),
    enabled: !loading,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Plan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showToast('Plano criado com sucesso!');
      setEditDialog(false);
      setEditingPlan(null);
      setFormData({});
    },
    onError: () => showToast('Erro ao criar plano', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Plan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showToast('Plano atualizado com sucesso!');
      setEditDialog(false);
      setEditingPlan(null);
      setFormData({});
    },
    onError: () => showToast('Erro ao atualizar plano', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Plan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showToast('Plano excluído!');
    },
    onError: () => showToast('Erro ao excluir plano', 'error')
  });

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      ...plan,
      features: plan.features?.join('\n') || '',
      custom_gradient_start: plan.custom_gradient_start || '#2563eb',
      custom_gradient_end: plan.custom_gradient_end || '#1d4ed8',
      custom_badge_bg: plan.custom_badge_bg || '#fbbf24',
      custom_badge_text: plan.custom_badge_text || '#78350f'
    });
    setEditDialog(true);
  };

  const handleNew = () => {
    setEditingPlan(null);
    setFormData({
      plan_id: '',
      name: '',
      description: '',
      price: 0,
      billing_cycle: 'monthly',
      features: '',
      icon: 'Crown',
      color: 'from-blue-600 to-blue-700',
      custom_gradient_start: '#2563eb',
      custom_gradient_end: '#1d4ed8',
      custom_badge_bg: '#fbbf24',
      custom_badge_text: '#78350f',
      whatsapp_message: '',
      is_active: true,
      is_featured: false,
      order: plans.length,
      badge_text: '',
      badge_color: 'bg-yellow-400 text-yellow-900'
    });
    setEditDialog(true);
  };

  const handleColorSave = (colors) => {
    if (colorPickerMode === 'gradient') {
      setFormData({
        ...formData,
        custom_gradient_start: colors.gradientStart,
        custom_gradient_end: colors.gradientEnd
      });
    } else if (colorPickerMode === 'badge') {
      setFormData({
        ...formData,
        custom_badge_bg: colors.badgeBg,
        custom_badge_text: colors.badgeText
      });
    }
    setColorPickerMode(null);
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      features: formData.features?.split('\n').filter(f => f.trim()) || [],
      price: parseFloat(formData.price) || 0
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleDelete = (plan) => {
    if (confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
      deleteMutation.mutate(plan.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  const getIcon = (iconName) => {
    const icon = ICON_OPTIONS.find(i => i.value === iconName);
    return icon ? icon.component : Crown;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white text-sm flex items-center gap-2`}>
          <AlertCircle className="w-4 h-4" />
          {toast.message}
        </div>
      )}

      <div className="bg-gradient-to-r from-green-600 to-emerald-600 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Gerenciar Planos
              </h1>
              <p className="text-white/70 text-sm">Configure e gerencie todos os planos de assinatura</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowManual(!showManual)}
                variant="outline"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 rounded-xl"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                {showManual ? 'Ocultar' : 'Ver'} Manual
              </Button>
              <Button
                onClick={handleNew}
                className="bg-white text-green-600 hover:bg-white/90 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Plano
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Manual */}
        {showManual && (
          <PlanosManual />
        )}

        {loadingPlans ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0A66C2]" />
          </div>
        ) : plans.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">Nenhum plano cadastrado</p>
              <Button onClick={handleNew} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => {
            const Icon = getIcon(plan.icon);
            const hasCustomGradient = plan.custom_gradient_start && plan.custom_gradient_end;
            const hasCustomBadge = plan.custom_badge_bg && plan.custom_badge_text;
            
            return (
              <Card key={plan.id} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${!hasCustomGradient ? `bg-gradient-to-br ${plan.color}` : ''}`}
                      style={hasCustomGradient ? {
                        background: `linear-gradient(to bottom right, ${plan.custom_gradient_start}, ${plan.custom_gradient_end})`
                      } : {}}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                            {!plan.is_active && (
                              <Badge variant="outline" className="text-red-600">Inativo</Badge>
                            )}
                            {plan.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-700">
                                <Star className="w-3 h-3 mr-1" />
                                Destaque
                              </Badge>
                            )}
                            {plan.badge_text && (
                              <Badge 
                                className={!hasCustomBadge ? plan.badge_color : ''}
                                style={hasCustomBadge ? {
                                  backgroundColor: plan.custom_badge_bg,
                                  color: plan.custom_badge_text,
                                  border: 'none'
                                } : {}}
                              >
                                {plan.badge_text}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(plan)}
                            className="rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(plan)}
                            className="rounded-lg text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Preço</p>
                          <p className="text-xl font-bold text-green-600">R$ {plan.price.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">
                            {plan.billing_cycle === 'monthly' ? 'por mês' : 
                             plan.billing_cycle === 'quarterly' ? 'a cada 3 meses' :
                             plan.billing_cycle === 'semiannual' ? 'a cada 6 meses' :
                             plan.billing_cycle === 'lifetime' ? 'pagamento único' : 'grátis'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Ciclo</p>
                          <Badge variant="outline">
                            {plan.billing_cycle === 'monthly' ? 'Mensal' : 
                             plan.billing_cycle === 'quarterly' ? 'Trimestral' :
                             plan.billing_cycle === 'semiannual' ? 'Semestral' :
                             plan.billing_cycle === 'lifetime' ? 'Vitalício' : 'Gratuito'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Características</p>
                          <p className="text-sm text-slate-700">{plan.features?.length || 0} itens</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog de Edição/Criação */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">ID do Plano</label>
                <Input
                  value={formData.plan_id || ''}
                  onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                  placeholder="ex: premium_monthly"
                  disabled={!!editingPlan}
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nome</label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Premium Mensal"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição curta do plano"
                className="rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Preço (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ciclo de Cobrança</label>
                <Select
                  value={formData.billing_cycle || 'monthly'}
                  onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semiannual">Semestral</SelectItem>
                    <SelectItem value="lifetime">Vitalício</SelectItem>
                    <SelectItem value="free">Gratuito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ícone</label>
                <Select
                  value={formData.icon || 'Crown'}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cor do Plano (Gradiente)</label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => setColorPickerMode('gradient')}
                    className="w-full h-20 rounded-xl text-white font-semibold shadow-lg hover:scale-105 transition-transform"
                    style={{
                      background: `linear-gradient(to right, ${formData.custom_gradient_start || '#2563eb'}, ${formData.custom_gradient_end || '#1d4ed8'})`
                    }}
                  >
                    <Palette className="w-5 h-5 mr-2" />
                    Escolher Cores do Gradiente
                  </Button>
                  <div className="flex gap-2 text-xs">
                    <div className="flex-1 bg-slate-50 rounded p-2">
                      <p className="text-slate-500 mb-1">Início</p>
                      <p className="font-mono font-semibold text-slate-700">{formData.custom_gradient_start || '#2563eb'}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded p-2">
                      <p className="text-slate-500 mb-1">Fim</p>
                      <p className="font-mono font-semibold text-slate-700">{formData.custom_gradient_end || '#1d4ed8'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Características (uma por linha)</label>
              <Textarea
                value={formData.features || ''}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Acesso a vagas exclusivas&#10;Suporte prioritário&#10;Sem anúncios"
                rows={5}
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem WhatsApp</label>
              <Textarea
                value={formData.whatsapp_message || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_message: e.target.value })}
                placeholder="Olá! Quero assinar o plano..."
                rows={3}
                className="rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1">Use {'{'}nome{'}'} e {'{'}preco{'}'} para substituir dinamicamente</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Texto do Badge</label>
                <Input
                  value={formData.badge_text || ''}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  placeholder="ex: Popular"
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cor do Badge</label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => setColorPickerMode('badge')}
                    className="w-full h-16 rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: formData.custom_badge_bg || '#fbbf24',
                      color: formData.custom_badge_text || '#78350f'
                    }}
                  >
                    <Tag className="w-5 h-5" />
                    Escolher Cores do Badge
                  </Button>
                  <div className="flex gap-2 text-xs">
                    <div className="flex-1 bg-slate-50 rounded p-2">
                      <p className="text-slate-500 mb-1">Fundo</p>
                      <p className="font-mono font-semibold text-slate-700">{formData.custom_badge_bg || '#fbbf24'}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded p-2">
                      <p className="text-slate-500 mb-1">Texto</p>
                      <p className="font-mono font-semibold text-slate-700">{formData.custom_badge_text || '#78350f'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Plano Ativo</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured || false}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Em Destaque</label>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ordem</label>
                <Input
                  type="number"
                  value={formData.order || 0}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerMode !== null}
        onClose={() => setColorPickerMode(null)}
        mode={colorPickerMode}
        onSave={handleColorSave}
        initialColors={{
          gradientStart: formData.custom_gradient_start,
          gradientEnd: formData.custom_gradient_end,
          badgeBg: formData.custom_badge_bg,
          badgeText: formData.custom_badge_text
        }}
      />
    </div>
  );
}