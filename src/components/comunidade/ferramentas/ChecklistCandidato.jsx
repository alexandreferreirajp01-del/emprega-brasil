import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CHECKLIST_ITEMS = [
  { id: 'curriculo', label: 'Currículo atualizado e revisado' },
  { id: 'pesquisa_empresa', label: 'Pesquisei sobre a empresa' },
  { id: 'rota', label: 'Verifiquei a rota até o local' },
  { id: 'roupa', label: 'Separei roupa adequada' },
  { id: 'documentos', label: 'Documentos organizados' },
  { id: 'perguntas', label: 'Preparei perguntas para fazer' },
  { id: 'portfolio', label: 'Portfólio organizado (se aplicável)' },
  { id: 'linkedin', label: 'LinkedIn atualizado' },
  { id: 'referencias', label: 'Referências profissionais prontas' },
  { id: 'horario', label: 'Alarme definido para chegar cedo' },
  { id: 'celular', label: 'Celular carregado e no silencioso' },
  { id: 'agua', label: 'Garrafa de água (para nervosismo)' },
  { id: 'respostas', label: 'Pratiquei respostas para perguntas comuns' },
  { id: 'postura', label: 'Revisei postura e linguagem corporal' },
  { id: 'contato', label: 'Salvei contato do recrutador' }
];

export default function ChecklistCandidato({ user }) {
  const [completos, setCompletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklistId, setChecklistId] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await base44.entities.ChecklistCandidato.filter({ user_email: user.email });
        if (lista?.length > 0) {
          setChecklistId(lista[0].id);
          setCompletos(lista[0].items_completos || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) carregar();
  }, [user]);

  const toggleItem = async (itemId) => {
    let novosCompletos;
    if (completos.includes(itemId)) {
      novosCompletos = completos.filter(id => id !== itemId);
    } else {
      novosCompletos = [...completos, itemId];
    }
    setCompletos(novosCompletos);

    try {
      if (checklistId) {
        await base44.entities.ChecklistCandidato.update(checklistId, { items_completos: novosCompletos });
      } else {
        const novo = await base44.entities.ChecklistCandidato.create({
          user_email: user.email,
          items_completos: novosCompletos
        });
        setChecklistId(novo.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const progresso = Math.round((completos.length / CHECKLIST_ITEMS.length) * 100);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="bg-teal-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-teal-700">
          <CheckSquare className="w-5 h-5" />
          Checklist do Candidato
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Progresso</span>
            <span className="font-semibold text-teal-700">{progresso}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">{completos.length} de {CHECKLIST_ITEMS.length} itens concluídos</p>
        </div>

        {/* Lista de Items */}
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <div 
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                completos.includes(item.id) ? 'bg-teal-50' : 'bg-slate-50 hover:bg-slate-100'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <Checkbox 
                checked={completos.includes(item.id)} 
                onCheckedChange={() => toggleItem(item.id)}
              />
              <span className={`flex-1 ${completos.includes(item.id) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}