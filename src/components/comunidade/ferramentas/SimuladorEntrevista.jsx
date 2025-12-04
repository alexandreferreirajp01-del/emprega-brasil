import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Play, Send, Loader2, RotateCcw, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SimuladorEntrevista({ user }) {
  const [vaga, setVaga] = useState('');
  const [iniciado, setIniciado] = useState(false);
  const [perguntaAtual, setPerguntaAtual] = useState('');
  const [resposta, setResposta] = useState('');
  const [historico, setHistorico] = useState([]);
  const [avaliacao, setAvaliacao] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [perguntaIndex, setPerguntaIndex] = useState(0);

  const iniciar = async () => {
    if (!vaga) return;
    setCarregando(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere a primeira pergunta de uma entrevista de emprego para a vaga de "${vaga}". Apenas a pergunta, sem introdução.`,
        response_json_schema: {
          type: "object",
          properties: { pergunta: { type: "string" } }
        }
      });
      setPerguntaAtual(response.pergunta);
      setIniciado(true);
      setPerguntaIndex(1);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  const enviarResposta = async () => {
    if (!resposta.trim()) return;
    setCarregando(true);
    
    const novoHistorico = [...historico, { pergunta: perguntaAtual, resposta }];
    setHistorico(novoHistorico);
    setResposta('');

    if (perguntaIndex >= 5) {
      // Gerar avaliação final
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Avalie as respostas desta entrevista para a vaga de "${vaga}":
${novoHistorico.map((h, i) => `Pergunta ${i+1}: ${h.pergunta}\nResposta: ${h.resposta}`).join('\n\n')}

Dê uma nota de 1 a 10, pontos fortes, pontos a melhorar e dicas.`,
          response_json_schema: {
            type: "object",
            properties: {
              nota: { type: "number" },
              pontos_fortes: { type: "string" },
              pontos_melhorar: { type: "string" },
              dicas: { type: "string" }
            }
          }
        });
        setAvaliacao(response);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Próxima pergunta
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Considerando a entrevista para "${vaga}" e a resposta anterior "${resposta}", gere a próxima pergunta. Apenas a pergunta.`,
          response_json_schema: {
            type: "object",
            properties: { pergunta: { type: "string" } }
          }
        });
        setPerguntaAtual(response.pergunta);
        setPerguntaIndex(perguntaIndex + 1);
      } catch (e) {
        console.error(e);
      }
    }
    setCarregando(false);
  };

  const reiniciar = () => {
    setIniciado(false);
    setPerguntaAtual('');
    setResposta('');
    setHistorico([]);
    setAvaliacao(null);
    setPerguntaIndex(0);
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="bg-purple-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <MessageSquare className="w-5 h-5" />
          Simulador de Entrevista
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {!iniciado ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Para qual vaga você quer simular a entrevista?</Label>
              <Input value={vaga} onChange={(e) => setVaga(e.target.value)} placeholder="Ex: Atendente, Vendedor, etc." className="rounded-lg" />
            </div>
            <Button onClick={iniciar} disabled={!vaga || carregando} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
              {carregando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Iniciar Simulação
            </Button>
          </div>
        ) : avaliacao ? (
          <div className="space-y-4">
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-8 h-8 text-yellow-500 fill-current" />
                <span className="text-4xl font-bold text-purple-700">{avaliacao.nota}/10</span>
              </div>
              <p className="text-slate-600">Sua pontuação</p>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="font-semibold text-green-700 mb-1">✅ Pontos Fortes</p>
                <p className="text-slate-700">{avaliacao.pontos_fortes}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="font-semibold text-orange-700 mb-1">⚠️ Pontos a Melhorar</p>
                <p className="text-slate-700">{avaliacao.pontos_melhorar}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="font-semibold text-blue-700 mb-1">💡 Dicas</p>
                <p className="text-slate-700">{avaliacao.dicas}</p>
              </div>
            </div>

            <Button onClick={reiniciar} className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" />
              Nova Simulação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-500">Pergunta {perguntaIndex} de 5</div>
            
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-purple-800 font-medium">{perguntaAtual}</p>
            </div>

            <Textarea 
              value={resposta} 
              onChange={(e) => setResposta(e.target.value)} 
              placeholder="Digite sua resposta..." 
              className="rounded-lg min-h-[100px]" 
            />

            <Button onClick={enviarResposta} disabled={!resposta.trim() || carregando} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
              {carregando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {perguntaIndex >= 5 ? 'Finalizar e Ver Avaliação' : 'Enviar Resposta'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}