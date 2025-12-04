import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2, RotateCcw, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PERGUNTAS = [
  { id: 1, texto: "Eu prefiro trabalhar:", opcoes: [
    { valor: 'D', texto: 'Liderando e tomando decisões' },
    { valor: 'I', texto: 'Interagindo e motivando pessoas' },
    { valor: 'S', texto: 'Em ambiente estável e organizado' },
    { valor: 'C', texto: 'Analisando dados e detalhes' }
  ]},
  { id: 2, texto: "Em um conflito:", opcoes: [
    { valor: 'D', texto: 'Enfrento e resolvo' },
    { valor: 'I', texto: 'Busco harmonizar' },
    { valor: 'S', texto: 'Evito confronto' },
    { valor: 'C', texto: 'Analiso antes de agir' }
  ]},
  { id: 3, texto: "Me descrevem como:", opcoes: [
    { valor: 'D', texto: 'Determinado e direto' },
    { valor: 'I', texto: 'Entusiasmado e comunicativo' },
    { valor: 'S', texto: 'Calmo e confiável' },
    { valor: 'C', texto: 'Detalhista e organizado' }
  ]},
  { id: 4, texto: "Ao tomar decisões:", opcoes: [
    { valor: 'D', texto: 'Decido rápido' },
    { valor: 'I', texto: 'Consulto pessoas' },
    { valor: 'S', texto: 'Penso com calma' },
    { valor: 'C', texto: 'Analiso tudo disponível' }
  ]},
  { id: 5, texto: "Me motiva no trabalho:", opcoes: [
    { valor: 'D', texto: 'Desafios e resultados' },
    { valor: 'I', texto: 'Reconhecimento e interação' },
    { valor: 'S', texto: 'Segurança e estabilidade' },
    { valor: 'C', texto: 'Qualidade e precisão' }
  ]}
];

const PERFIS = {
  D: { nome: 'Dominante', cor: 'bg-red-100 text-red-700', desc: 'Decidido, competitivo e focado em resultados.' },
  I: { nome: 'Influente', cor: 'bg-yellow-100 text-yellow-700', desc: 'Comunicativo, entusiasta e motivador.' },
  S: { nome: 'Estável', cor: 'bg-green-100 text-green-700', desc: 'Paciente, leal e confiável.' },
  C: { nome: 'Conforme', cor: 'bg-blue-100 text-blue-700', desc: 'Analítico, preciso e organizado.' }
};

export default function TestePerfilDISC({ user }) {
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await base44.entities.PerfilDISC.filter({ user_email: user.email });
        if (lista?.length > 0 && lista[0].perfil_dominante) {
          setResultado({
            perfil: lista[0].perfil_dominante,
            pontuacoes: lista[0].pontuacoes
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) carregar();
  }, [user]);

  const responder = (valor) => {
    const novasRespostas = { ...respostas, [perguntaAtual]: valor };
    setRespostas(novasRespostas);

    if (perguntaAtual < PERGUNTAS.length - 1) {
      setPerguntaAtual(perguntaAtual + 1);
    } else {
      calcularResultado(novasRespostas);
    }
  };

  const calcularResultado = async (resps) => {
    setSalvando(true);
    const pontuacoes = { D: 0, I: 0, S: 0, C: 0 };
    Object.values(resps).forEach(v => { pontuacoes[v]++; });
    
    const perfilDominante = Object.entries(pontuacoes).sort((a, b) => b[1] - a[1])[0][0];
    
    try {
      await base44.entities.PerfilDISC.create({
        user_email: user.email,
        respostas: resps,
        perfil_dominante: perfilDominante,
        pontuacoes
      });
    } catch (e) {
      console.error(e);
    }

    setResultado({ perfil: perfilDominante, pontuacoes });
    setSalvando(false);
  };

  const reiniciar = () => {
    setPerguntaAtual(0);
    setRespostas({});
    setResultado(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="bg-indigo-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-indigo-700">
          <UserCheck className="w-5 h-5" />
          Teste de Perfil DISC
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {salvando ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-slate-600">Analisando...</p>
          </div>
        ) : resultado ? (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl text-center ${PERFIS[resultado.perfil].cor}`}>
              <h3 className="text-2xl font-bold mb-2">Seu Perfil: {PERFIS[resultado.perfil].nome}</h3>
              <p className="text-lg">{PERFIS[resultado.perfil].desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(resultado.pontuacoes).map(([p, v]) => (
                <div key={p} className={`p-4 rounded-xl ${PERFIS[p].cor}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{PERFIS[p].nome}</span>
                    <span className="text-xl font-bold">{v}</span>
                  </div>
                  <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full bg-current opacity-50" style={{ width: `${(v / PERGUNTAS.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={reiniciar} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" />
              Refazer Teste
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-sm text-slate-500">Pergunta {perguntaAtual + 1} de {PERGUNTAS.length}</span>
              <div className="h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((perguntaAtual + 1) / PERGUNTAS.length) * 100}%` }} />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-center text-slate-800">{PERGUNTAS[perguntaAtual].texto}</h3>

            <div className="space-y-2">
              {PERGUNTAS[perguntaAtual].opcoes.map((opcao) => (
                <Button
                  key={opcao.valor}
                  onClick={() => responder(opcao.valor)}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-4 rounded-xl hover:bg-indigo-50"
                >
                  <span className="flex-1">{opcao.texto}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}