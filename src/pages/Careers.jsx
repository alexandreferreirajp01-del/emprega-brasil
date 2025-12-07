import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Briefcase, Heart, Rocket, Users, Code, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const openPositions = [
  {
    title: "Desenvolvedor Full Stack",
    type: "Remoto",
    description: "Procuramos desenvolvedor React/Node.js para melhorar e expandir a plataforma.",
    icon: Code,
    color: "blue"
  },
  {
    title: "Designer UI/UX",
    type: "Remoto",
    description: "Criar experiências incríveis para nossos usuários e melhorar o design do app.",
    icon: Rocket,
    color: "purple"
  },
  {
    title: "Especialista em Marketing Digital",
    type: "Híbrido",
    description: "Aumentar nossa presença digital e alcançar mais profissionais na Paraíba.",
    icon: Megaphone,
    color: "orange"
  }
];

const values = [
  {
    icon: Heart,
    title: "Impacto Social",
    description: "Ajudamos milhares de pessoas a encontrar emprego"
  },
  {
    icon: Rocket,
    title: "Inovação",
    description: "Usamos tecnologia para resolver problemas reais"
  },
  {
    icon: Users,
    title: "Colaboração",
    description: "Trabalhamos juntos para crescer e evoluir"
  }
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="text-center">
            <Briefcase className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-3">Trabalhe Conosco</h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Junte-se à nossa missão de conectar pessoas e oportunidades na Paraíba
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Sobre Nós</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              O Vagas Abertas Paraíba é a maior plataforma de empregos do estado, conectando milhares de profissionais com suas oportunidades ideais. Estamos em constante crescimento e buscamos pessoas apaixonadas por tecnologia e impacto social.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Aqui você terá a oportunidade de trabalhar em um ambiente inovador, colaborativo e com propósito real: ajudar pessoas a transformarem suas carreiras.
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 px-2">Nossos Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {values.map((value, index) => (
              <Card key={index} className="rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <value.icon className="w-6 h-6 text-[#0056ff]" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">{value.title}</h3>
                  <p className="text-sm text-slate-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 px-2">Vagas Abertas</h2>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-${position.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <position.icon className={`w-6 h-6 text-${position.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-800">{position.title}</h3>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">{position.type}</span>
                      </div>
                      <p className="text-slate-600 mb-3">{position.description}</p>
                      <a href="https://wa.me/5583991971320?text=Olá! Tenho interesse na vaga de..." target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-[#0056ff] hover:bg-[#0044cc]">
                          Candidatar-se
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-3">Não encontrou a vaga ideal?</h2>
            <p className="text-white/80 mb-6">
              Estamos sempre em busca de talentos! Envie seu currículo e conte um pouco sobre você. Entraremos em contato quando surgir uma oportunidade que combine com seu perfil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://wa.me/5583991971320?text=Olá! Gostaria de trabalhar no Vagas Abertas" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-slate-800 hover:bg-white/90 w-full sm:w-auto">
                  WhatsApp: (83) 99197-1320
                </Button>
              </a>
              <a href="mailto:rhvagasabertasparaiba@gmail.com?subject=Candidatura Espontânea">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  rhvagasabertasparaiba@gmail.com
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}