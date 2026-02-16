import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, FileText, Download, X, BarChart3, CreditCard, ArrowLeft } from 'lucide-react';
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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState({ entry_date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: 'receita', category: 'receita_extra' });
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

  const handleAdd = () => {
    if (!newEntry.description || newEntry.amount <= 0) {
      alert('Preencha todos os campos corretamente');
      return;
    }
    addMutation.mutate();
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Extrato Financeiro</h1>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Baixar Extrato
            </Button>
            <Button onClick={() => setAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Receita Total</p>
            <p className="text-2xl font-bold text-green-600">R$ {totals.total > 0 ? totals.total.toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Receita Mensal</p>
            <p className="text-2xl font-bold text-blue-600">R$ {totals.monthRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Despesas Mensais</p>
            <p className="text-2xl font-bold text-red-600">R$ {totals.monthExpense.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Saldo do Mês</p>
            <p className={`text-2xl font-bold ${totals.monthBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {totals.monthBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabela de lançamentos */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-6 text-slate-500">
                    Nenhum lançamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                allEntries.map((entry) => (
                  <TableRow key={`${entry.source}-${entry.id}`}>
                    <TableCell className="text-sm">{new Date(entry.displayDate).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-sm">{entry.description || entry.notes}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${entry.displayAmount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {entry.displayAmount > 0 ? 'Receita' : 'Despesa'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{entry.category || 'N/A'}</TableCell>
                    <TableCell className={`text-right font-semibold ${entry.displayAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {Math.abs(entry.displayAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs">{entry.source === 'manual' ? 'Manual' : 'Assinatura'}</TableCell>
                    <TableCell>
                      {entry.source === 'manual' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de novo lançamento */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento Manual</DialogTitle>
            <DialogClose />
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Data</label>
              <Input
                type="date"
                value={newEntry.entry_date}
                onChange={(e) => setNewEntry({ ...newEntry, entry_date: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Descrição/Histórico</label>
              <Input
                type="text"
                placeholder="Ex: Pagamento de servidor"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Valor (R$)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={newEntry.amount}
                onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Tipo</label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Categoria</label>
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="receita_extra">Receita Extra</option>
                <option value="despesa_operacional">Despesa Operacional</option>
                <option value="despesa_marketing">Despesa Marketing</option>
                <option value="despesa_infraestrutura">Despesa Infraestrutura</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}