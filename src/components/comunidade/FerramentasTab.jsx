import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, Mail, MessageSquare, Briefcase, CheckSquare, 
  Brain, UserCheck, ArrowLeft
} from "lucide-react";

import GeradorCurriculo from "./ferramentas/GeradorCurriculo";
import GeradorCarta from "./ferramentas/GeradorCarta";
import SimuladorEntrevista from "./ferramentas/SimuladorEntrevista";
import CriadorPortfolio from "./ferramentas/CriadorPortfolio";
import ChecklistCandidato from "./ferramentas/ChecklistCandidato";
import PreparacaoEntrevista from "./ferramentas/PreparacaoEntrevista";
import TestePerfilComportamental from "./ferramentas/TestePerfilComportamental";

const FERRAMENTAS = [
  { id: 'curriculo', nome: 'Gerador de Currículo', desc: 'Crie currículos profissionais', icon: FileText, cor: 'bg-blue-500' },
  { id: 'carta', nome: 'Gerador de Carta', desc: 'Cartas de apresentação com IA', icon: Mail, cor: 'bg-green-500' },
  { id: 'simulador', nome: 'Simulador de Entrevista', desc: 'Pratique com perguntas reais', icon: MessageSquare, cor: 'bg-purple-500' },
  { id: 'portfolio', nome: 'Criador de Portfólio', desc: 'Monte seu portfólio online', icon: Briefcase, cor: 'bg-orange-500' },
  { id: 'checklist', nome: 'Checklist do Candidato', desc: 'Preparação para entrevista', icon: CheckSquare, cor: 'bg-teal-500' },
  { id: 'preparacao', nome: 'Preparação com IA', desc: 'Dicas personalizadas de IA', icon: Brain, cor: 'bg-pink-500' },
  { id: 'perfil', nome: 'Teste Comportamental', desc: 'Descubra seu perfil', icon: UserCheck, cor: 'bg-indigo-500' }
];

export default function FerramentasTab({ user }) {
  const [ferramentaAtiva, setFerramentaAtiva] = useState(null);

  const renderFerramenta = () => {
    switch (ferramentaAtiva) {
      case 'curriculo': return <GeradorCurriculo user={user} />;
      case 'carta': return <GeradorCarta user={user} />;
      case 'simulador': return <SimuladorEntrevista user={user} />;
      case 'portfolio': return <CriadorPortfolio user={user} />;
      case 'checklist': return <ChecklistCandidato user={user} />;
      case 'preparacao': return <PreparacaoEntrevista user={user} />;
      case 'perfil': return <TestePerfilComportamental user={user} />;
      default: return null;
    }
  };

  if (ferramentaAtiva) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setFerramentaAtiva(null)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar às Ferramentas
        </Button>
        {renderFerramenta()}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FERRAMENTAS.map((ferramenta) => {
        const Icon = ferramenta.icon;
        return (
          <Card 
            key={ferramenta.id} 
            className="rounded-xl hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300"
            onClick={() => setFerramentaAtiva(ferramenta.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${ferramenta.cor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 mb-1">{ferramenta.nome}</h3>
                  <p className="text-sm text-slate-500">{ferramenta.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}