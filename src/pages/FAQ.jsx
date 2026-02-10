import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const faqs = [
  {
    category: "Geral",
    questions: [
      {
        q: "O que é o web Vagas?",
        a: "É a maior plataforma de empregos do Brasil, conectando candidatos e empresas através de vagas, networking e ferramentas profissionais."
      },
      {
        q: "O aplicativo é gratuito?",
        a: "Sim! Oferecemos uma versão básica 100% gratuita. Também temos planos Premium e Recruiter com recursos adicionais."
      },
      {
        q: "Como faço para criar uma conta?",
        a: "Clique em 'Entrar' na tela inicial e escolha entre login por e-mail ou Google. O cadastro é rápido e simples."
      }
    ]
  },
  {
    category: "Vagas",
    questions: [
      {
        q: "Como buscar vagas?",
        a: "Acesse a seção 'Vagas' e use os filtros por cidade, categoria, tipo de contrato e salário para encontrar oportunidades."
      },
      {
        q: "Como me candidatar a uma vaga?",
        a: "Clique na vaga desejada e depois em 'Candidatar-se'. Você será direcionado para o WhatsApp, e-mail ou site da empresa."
      },
      {
        q: "Posso salvar vagas para depois?",
        a: "Sim! Clique no ícone de coração para adicionar vagas aos favoritos e acessá-las depois na seção 'Favoritas'."
      }
    ]
  },
  {
    category: "Planos",
    questions: [
      {
        q: "Qual a diferença entre os planos?",
        a: "Básico: acesso gratuito às vagas públicas. Premium: vagas exclusivas + ferramentas de IA. Recruiter: publicação de vagas e gerenciamento."
      },
      {
        q: "Como faço upgrade para Premium?",
        a: "Acesse 'Perfil' > 'Assinar Premium'. O pagamento único de R$ 29,90 garante acesso vitalício."
      },
      {
        q: "O que é o plano Recruiter?",
        a: "Plano para empresas e recrutadores publicarem vagas, gerenciarem candidatos e acessarem currículos. Entre em contato para contratar."
      }
    ]
  },
  {
    category: "Ferramentas",
    questions: [
      {
        q: "O que são as Utilidades?",
        a: "Ferramentas profissionais como gerador de currículo, carta de apresentação, preparação para entrevistas e muito mais."
      },
      {
        q: "Como criar um currículo?",
        a: "Acesse 'Utilidades' > 'Gerador de Currículo' e preencha seus dados. O sistema gera um PDF profissional automaticamente."
      },
      {
        q: "Posso usar a IA para me preparar?",
        a: "Sim! Temos ferramentas de IA para simulação de entrevistas, análise de currículo e sugestões personalizadas."
      }
    ]
  },
  {
    category: "Privacidade e Segurança",
    questions: [
      {
        q: "Meus dados estão seguros?",
        a: "Sim! Utilizamos criptografia SSL/TLS e seguimos rigorosamente a LGPD. Seus dados são protegidos e jamais compartilhados sem consentimento."
      },
      {
        q: "Como faço para excluir minha conta?",
        a: "Entre em contato conosco via e-mail ou WhatsApp solicitando a exclusão. Seus dados serão removidos em até 15 dias úteis."
      },
      {
        q: "Vocês vendem meus dados?",
        a: "Não! Seus dados são usados exclusivamente para melhorar sua experiência no aplicativo. Não vendemos ou compartilhamos com terceiros."
      }
    ]
  },
  {
    category: "Suporte",
    questions: [
      {
        q: "Como entrar em contato com o suporte?",
        a: "WhatsApp: (83) 99197-1320 ou E-mail: contato@webvagas.com.br. Respondemos em até 24 horas."
      },
      {
        q: "Encontrei um erro no aplicativo. O que fazer?",
        a: "Reporte imediatamente via WhatsApp ou e-mail descrevendo o problema. Nossa equipe irá corrigir o mais rápido possível."
      },
      {
        q: "Posso sugerir novas funcionalidades?",
        a: "Com certeza! Adoramos ouvir nossos usuários. Envie suas sugestões pelo WhatsApp ou e-mail."
      }
    ]
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Perguntas Frequentes</h1>
          </div>
          <p className="text-white/80 mt-2">Tire suas dúvidas sobre o web Vagas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {faqs.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">{category.category}</h2>
              <div className="space-y-3">
                {category.questions.map((item, questionIndex) => {
                  const isOpen = openIndex === `${categoryIndex}-${questionIndex}`;
                  return (
                    <div key={questionIndex} className="border-b last:border-b-0 pb-3 last:pb-0">
                      <button
                        onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                        className="w-full flex items-center justify-between gap-3 text-left py-2 hover:text-[#1E6FB6] transition-colors"
                      >
                        <span className="font-medium text-slate-700">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <p className="text-slate-600 mt-2 leading-relaxed">{item.a}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="rounded-2xl bg-[#1E6FB6] text-white">
          <CardContent className="p-6 text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-xl font-bold mb-2">Não encontrou sua resposta?</h3>
            <p className="text-white/80 mb-4">Entre em contato conosco. Estamos aqui para ajudar!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/5583991971320" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-[#1E6FB6] hover:bg-white/90">
                  WhatsApp
                </Button>
              </a>
              <a href="mailto:contato@webvagas.com.br">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  E-mail
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}