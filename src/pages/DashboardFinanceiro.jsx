import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, CreditCard, ArrowLeft, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function DashboardFinanceiro() {
  const [filterType, setFilterType] = useState('mensal');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Buscar dados
  const { data: manualEntries = [] } = useQuery({
    queryKey: ['manualEntries'],
    queryFn: () => base44.entities.ManualEntry.list(),
  });

  const { data: financialHistory = [] } = useQuery({
    queryKey: ['financialHistory'],
    queryFn: () => base44.entities.FinancialHistory.list(),
  });

  // Combinar lançamentos
  const allEntries = useMemo(() => {
    return [
      ...manualEntries.map(e => ({
        date: new Date(e.entry_date),
        amount: e.type === 'receita' ? e.amount : -e.amount,
        type: e.type,
        description: e.description,
      })),
      ...financialHistory.map(e => ({
        date: new Date(e.timestamp),
        amount: e.event_type === 'payment' || e.event_type === 'renewal' ? e.amount : -e.amount,
        type: e.event_type === 'payment' || e.event_type === 'renewal' ? 'receita' : 'despesa',
        description: `${e.event_type} - ${e.user_name}`,
      })),
    ];
  }, [manualEntries, financialHistory]);

  // Processar dados para gráficos
  const chartData = useMemo(() => {
    let filteredEntries = [...allEntries];

    // Aplicar filtro de data se período for selecionado
    if (filterType === 'periodo' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredEntries = filteredEntries.filter(e => e.date >= start && e.date <= end);
    }

    // Agrupar por período
    const grouped = {};

    filteredEntries.forEach(entry => {
      let key;
      if (filterType === 'diario') {
        key = entry.date.toLocaleDateString('pt-BR');
      } else if (filterType === 'semanal') {
        const week = Math.ceil((entry.date.getDate() - entry.date.getDay() + 1) / 7);
        const month = entry.date.getMonth() + 1;
        key = `Sem ${week}/${month}`;
      } else if (filterType === 'mensal') {
        key = entry.date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      } else {
        key = entry.date.toLocaleDateString('pt-BR');
      }

      if (!grouped[key]) {
        grouped[key] = { name: key, receita: 0, despesa: 0 };
      }

      if (entry.amount > 0) {
        grouped[key].receita += entry.amount;
      } else {
        grouped[key].despesa += Math.abs(entry.amount);
      }
    });

    return Object.values(grouped).sort((a, b) => {
      if (filterType === 'diario') {
        return new Date(a.name) - new Date(b.name);
      }
      return 0;
    });
  }, [allEntries, filterType, startDate, endDate]);

  // Calcular totais
  const totals = useMemo(() => {
    const filtered = chartData.reduce((acc, item) => {
      acc.receita += item.receita;
      acc.despesa += item.despesa;
      return acc;
    }, { receita: 0, despesa: 0 });

    return {
      receita: filtered.receita,
      despesa: filtered.despesa,
      saldo: filtered.receita - filtered.despesa,
    };
  }, [chartData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Barra de Navegação */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6 flex items-center gap-2">
          <Link to={createPageUrl('ControleFinanceiro')}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Controle de Assinaturas
            </Button>
          </Link>
          <Link to={createPageUrl('Extrato')}>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Extrato
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Dashboard Financeiro</h1>

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Período</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
                <option value="periodo">Por Período</option>
              </select>
            </div>

            {filterType === 'periodo' && (
              <>
                <div>
                  <label className="text-sm font-medium block mb-2">Data Inicial</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Data Final</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Receita</p>
            <p className="text-3xl font-bold text-green-600">R$ {totals.receita.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Despesas</p>
            <p className="text-3xl font-bold text-red-600">R$ {totals.despesa.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Saldo</p>
            <p className={`text-3xl font-bold ${totals.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {totals.saldo.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Linhas */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Evolução de Receita e Despesas</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="#10b981" name="Receita" />
                <Line type="monotone" dataKey="despesa" stroke="#ef4444" name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Barras */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Comparativo Receita vs Despesas</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="receita" fill="#10b981" name="Receita" />
                <Bar dataKey="despesa" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detalhes */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow mt-8">
          <h2 className="text-lg font-semibold mb-4">Detalhes por Período</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="text-left py-3 px-4">Período</th>
                  <th className="text-right py-3 px-4">Receita</th>
                  <th className="text-right py-3 px-4">Despesas</th>
                  <th className="text-right py-3 px-4">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {chartData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-slate-500">
                      Nenhum dado para o período selecionado
                    </td>
                  </tr>
                ) : (
                  chartData.map((item, idx) => (
                    <tr key={idx} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">R$ {item.receita.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">R$ {item.despesa.toFixed(2)}</td>
                      <td className={`text-right py-3 px-4 font-semibold ${item.receita - item.despesa >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        R$ {(item.receita - item.despesa).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}