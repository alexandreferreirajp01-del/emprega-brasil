import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ArrowLeft, RefreshCw, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Extrato() {
  const queryClient = useQueryClient();

  // Buscar lançamentos manuais
  const { data: manualEntries = [] } = useQuery({
    queryKey: ['manualEntries'],
    queryFn: () => base44.entities.ManualEntry.list(),
  });

  // Buscar histórico financeiro
  const { data: financialHistory = [] } = useQuery({
    queryKey: ['financialHistory'],
    queryFn: () => base44.entities.FinancialHistory.list(),
  });

  // Combinar e ordenar lançamentos
  const allEntries = useMemo(() => {
    const combined = [
      ...manualEntries.map(e => ({
        ...e,
        source: 'manual',
        displayDate: e.entry_date,
        displayAmount: e.type === 'receita' ? e.amount : -e.amount,
      })),
      ...financialHistory.map(e => ({
        ...e,
        source: 'subscription',
        displayDate: e.timestamp,
        displayAmount: e.event_type === 'payment' || e.event_type === 'renewal' ? e.amount : -e.amount,
      })),
    ];
    return combined.sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));
  }, [manualEntries, financialHistory]);

  // Calcular totais
  const totals = useMemo(() => {
    const total = allEntries.reduce((sum, e) => sum + e.displayAmount, 0);
    const monthEntries = allEntries.filter(e => {
      const date = new Date(e.displayDate);
      const today = new Date();
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    });
    const monthRevenue = monthEntries.filter(e => e.displayAmount > 0).reduce((sum, e) => sum + e.displayAmount, 0);
    const monthExpense = monthEntries.filter(e => e.displayAmount < 0).reduce((sum, e) => sum + Math.abs(e.displayAmount), 0);
    const monthBalance = monthRevenue - monthExpense;

    return { total, monthRevenue, monthExpense, monthBalance };
  }, [allEntries]);

  // Adicionar/Editar lançamento manual
  const saveMutation = useMutation({
    mutationFn: () => {
      if (editingId) {
        return base44.entities.ManualEntry.update(editingId, newEntry);
      }
      return base44.entities.ManualEntry.create(newEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualEntries'] });
      setAddModalOpen(false);
      setEditingId(null);
      setNewEntry({ entry_date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: 'receita', category: 'receita_extra' });
    },
  });

  // Deletar lançamento manual
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ManualEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualEntries'] });
    },
  });

  const handleSave = () => {
    if (!newEntry.description || newEntry.amount <= 0) {
      alert('Preencha todos os campos corretamente');
      return;
    }
    saveMutation.mutate();
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setNewEntry({
      entry_date: entry.entry_date.split('T')[0],
      description: entry.description,
      amount: entry.amount,
      type: entry.type,
      category: entry.category || 'receita_extra',
    });
    setAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setAddModalOpen(false);
    setEditingId(null);
    setNewEntry({ entry_date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: 'receita', category: 'receita_extra' });
  };

  const handleExportPDF = () => {
    const now = new Date();
    let html = `
      <html>
        <head><meta charset="utf-8"><title>Extrato</title></head>
        <body style="font-family: Arial; margin: 20px;">
          <h1>Extrato Financeiro</h1>
          <p>Emitido em: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}</p>
          <hr/>
          
          <h2>Resumo do Mês Atual</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td><strong>Receita Total Mensal:</strong></td><td style="text-align: right;">R$ ${totals.monthRevenue.toFixed(2)}</td></tr>
            <tr><td><strong>Despesas Mensais:</strong></td><td style="text-align: right;">R$ ${totals.monthExpense.toFixed(2)}</td></tr>
            <tr style="background: #f0f0f0;"><td><strong>Saldo do Mês:</strong></td><td style="text-align: right;"><strong>R$ ${totals.monthBalance.toFixed(2)}</strong></td></tr>
          </table>
          
          <hr/>
          <h2>Lançamentos</h2>
          <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px;">Data</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Descrição</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Tipo</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Valor</th>
            </tr>
            ${allEntries.map(e => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(e.displayDate).toLocaleDateString('pt-BR')}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${e.description || e.notes}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${e.displayAmount > 0 ? 'Receita' : 'Despesa'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${e.displayAmount > 0 ? 'green' : 'red'};">R$ ${Math.abs(e.displayAmount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato_${now.getTime()}.html`;
    a.click();
  };

  const handleRefresh = async () => {
    queryClient.invalidateQueries({ queryKey: ['manualEntries', 'financialHistory'] });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Extrato Financeiro</h1>
          <p className="text-white/80">Consolidação de todos os movimentos financeiros</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Barra de Navegação */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 mb-6 rounded-t-lg flex items-center gap-2 flex-wrap sticky top-16 z-40">
          <Link to={createPageUrl('LancamentosFinanceiros')}>
            <Button variant="outline" size="sm">Lançamentos</Button>
          </Link>
          <Link to={createPageUrl('ControleFinanceiro')}>
            <Button variant="outline" size="sm">Controle</Button>
          </Link>
          <Link to={createPageUrl('DashboardFinanceiro')}>
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registros de Movimentação</h2>
          <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Saldo Total</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Entradas Mês</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totals.monthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Saídas Mês</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {totals.monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Saldo Mês</p>
                  <p className={`text-2xl font-bold ${totals.monthBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {totals.monthBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de lançamentos - SOMENTE LEITURA */}
        <Card className="dark:bg-slate-800 overflow-hidden">
          <CardHeader>
            <CardTitle>Histórico de Movimentações (Somente Leitura)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Data</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Histórico/Descrição</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Agente</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Entrada</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Saída</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {allEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        Nenhum movimento encontrado
                      </td>
                    </tr>
                  ) : (
                    allEntries.map((entry, idx) => {
                      const cumulativeSaldo = allEntries.slice(0, idx + 1).reduce((sum, e) => sum + e.displayAmount, 0);
                      return (
                        <tr key={`${entry.source}-${entry.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {new Date(entry.displayDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                            {entry.description || entry.notes}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                              {entry.source === 'manual' ? (entry.agent === 'clientes' ? '👤 Clientes' : '🏢 Fornecedores') : '📊 Sistema'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                            {entry.displayAmount > 0 ? `R$ ${entry.displayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                            {entry.displayAmount < 0 ? `R$ ${Math.abs(entry.displayAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-bold ${cumulativeSaldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {cumulativeSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aviso: Extrato é somente leitura */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ℹ️ <strong>Extrato é somente leitura.</strong> Para adicionar/editar lançamentos, use a página de <strong>Lançamentos Financeiros</strong> ou <strong>Controle Financeiro</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}