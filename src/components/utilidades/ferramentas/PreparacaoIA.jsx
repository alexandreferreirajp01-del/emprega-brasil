import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2, Lightbulb, MessageSquare, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PreparacaoIA({ user }) {
  const [vaga, setVaga] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [preparacao, setPreparacao] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const gerar = async () => {
    if (!vaga) return;
    setCarregando(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Prepare uma análise para entrevista de "${vaga}"${empresa ? ` na "${empresa}"` : ''}.
Inclua: 5 perguntas prováveis com dicas, o que pesquisar, como se vestir, erros a evitar, perguntas para fazer.`,
        response_json_schema: {
          type: "object",
          properties: {
            perguntas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pergunta: { type: "string" },
                  dica: { type: "string" }
                }
              }
            },
            pesquisar: { type: "string" },
            vestimenta: { type: "string" },
            erros_evitar: { type: "string" },
            perguntas_fazer: { type: "string" }
          }
        }
      });
      setPreparacao(response);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="bg-pink-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-pink-700">
          <Brain className="w-5 h-5" />
          Preparação com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vaga *</Label>
            <Input value={vaga} onChange={(e) => setVaga(e.target.value)} placeholder="Ex: Vendedor" className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>Empresa (opcional)</Label>
            <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ex: Americanas" className="rounded-lg" />
          </div>
        </div>

        <Button onClick={gerar} disabled={!vaga || carregando} className="bg-pink-600 hover:bg-pink-700 rounded-xl">
          {carregando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
          {carregando ? 'Preparando...' : 'Gerar Preparação'}
        </Button>

        {preparacao && (
          <div className="space-y-4 pt-4 border-t">
            <div className="p-4 bg-purple-50 rounded-xl">
              <h4 className="font-semibold text-purple-700 flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" />
                Perguntas Prováveis
              </h4>
              <div className="space-y-3">
                {preparacao.perguntas?.map((p, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg">
                    <p className="font-medium text-slate-800">{i+1}. {p.pergunta}</p>
                    <p className="text-sm text-slate-600 mt-1">{p.dica}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" />
                O que Pesquisar
              </h4>
              <p className="text-slate-700">{preparacao.pesquisar}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-green-700 mb-2">Como se Vestir</h4>
              <p className="text-slate-700">{preparacao.vestimenta}</p>
            </div>

            <div className="p-4 bg-red-50 rounded-xl">
              <h4 className="font-semibold text-red-700 mb-2">Erros a Evitar</h4>
              <p className="text-slate-700">{preparacao.erros_evitar}</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-xl">
              <h4 className="font-semibold text-yellow-700 flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" />
                Perguntas para Fazer
              </h4>
              <p className="text-slate-700">{preparacao.perguntas_fazer}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}