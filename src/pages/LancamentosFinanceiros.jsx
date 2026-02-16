import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit2, Trash2, RefreshCw, Loader2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

export default function LancamentosFinanceiros() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'receita',
    agent: 'clientes',
    category: 'receita_extra',
    notes: ''
  });

  // Fetch manual entries
  const { data: entries = [], isLoading: entriesLoading, refetch } = useQuery({
    queryKey: ['lancamentos'],
    queryFn: () => base44.entities.ManualEntry.list('-entry_date', 500),
  });

  React.useEffect(() => {
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ManualEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ManualEntry.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ManualEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    },
  });

  const resetForm = () => {
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'receita',
      agent: 'clientes',
      category: 'receita_extra',
      notes: ''
    });
    setEditingId(null);
  };

  const openModal = (entry = null) => {
    if (entry) {
      setFormData({
        entry_date: entry.entry_date?.split('T')[0] || '',
        description: entry.description || '',
        amount: entry.amount || '',
        type: entry.type || 'receita',
        agent: entry.agent || 'clientes',
        category: entry.category || 'receita_extra',
        notes: entry.notes || ''
      });
      setEditingId(entry.id);
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      alert('Preencha descrição e valor');
      return;
    }

    const data = {
      entry_date: new Date(formData.entry_date).toISOString(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      agent: formData.agent,
      category: formData.category,
      notes: formData.notes
    };

    if (editingId) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este lançamento?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredEntries = entries.filter(entry => {
    const matchSearch = !searchTerm || 
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || entry.type === filterType;
    return matchSearch && matchType;
  });

  const totals = useMemo(() => {
    return {
      totalEntrada: filteredEntries.filter(e => e.type === 'receita').reduce((sum, e) => sum + (e.amount || 0), 0),
      totalSaida: filteredEntries.filter(e => e.type === 'despesa').reduce((sum, e) => sum + (e.amount || 0), 0),
    };
  }, [filteredEntries]);

  if (loading || entriesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Lançamentos Financeiros</h1>
          <p className="text-white/80">Registre entradas e saídas de forma dinâmica</p>
        </div>
      </div>

      {/* Navegação */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-2 flex-wrap">
          <Link to={createPageUrl('ControleFinanceiro')}>
            <Button variant="outline" size="sm">Controle</Button>
          </Link>
          <Link to={createPageUrl('Extrato')}>
            <Button variant="outline" size="sm">Extrato</Button>
          </Link>
          <Link to={createPageUrl('DashboardFinanceiro')}>
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total de Entradas</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totals.totalEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total de Saídas</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {totals.totalSaida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
                  <p className={`text-2xl font-bold ${totals.totalEntrada - totals.totalSaida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {(totals.totalEntrada - totals.totalSaida).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card className="dark:bg-slate-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 dark:bg-slate-700 dark:border-slate-600"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white min-w-32"
              >
                <option value="all">Todos</option>
                <option value="receita">Entradas</option>
                <option value="despesa">Saídas</option>
              </select>
              <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="dark:bg-slate-800 overflow-hidden">
          <CardHeader>
            <CardTitle>Lançamentos ({filteredEntries.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Data</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Descrição</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Agente</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Categoria</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Entrada</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Saída</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                        Nenhum lançamento encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                          {entry.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                            {entry.agent === 'clientes' ? '👤 Clientes' : '🏢 Fornecedores'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {entry.category === 'receita_extra' && 'Receita Extra'}
                          {entry.category === 'despesa_operacional' && 'Despesa Op.'}
                          {entry.category === 'despesa_marketing' && 'Marketing'}
                          {entry.category === 'despesa_infraestrutura' && 'Infraestrutura'}
                          {entry.category === 'outros' && 'Outros'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                          {entry.type === 'receita' ? `R$ ${entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                          {entry.type === 'despesa' ? `R$ ${entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal(entry)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
            <DialogClose />
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <Input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  className="dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="receita">Entrada</option>
                  <option value="despesa">Saída</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Pagamento de cliente, Aluguel..."
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Agente</label>
                <select
                  value={formData.agent}
                  onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="clientes">Clientes</option>
                  <option value="fornecedores">Fornecedores</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value="receita_extra">Receita Extra</option>
                  <option value="despesa_operacional">Despesa Operacional</option>
                  <option value="despesa_marketing">Marketing</option>
                  <option value="despesa_infraestrutura">Infraestrutura</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalhes adicionais..."
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModalOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}