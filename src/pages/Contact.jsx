import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageCircle, MapPin, Phone, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Contato</h1>
          </div>
          <p className="text-white/80 mt-2">Estamos aqui para ajudar você!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="https://wa.me/5583991971320" target="_blank" rel="noopener noreferrer">
            <Card className="rounded-2xl h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">WhatsApp</h3>
                <p className="text-slate-600 mb-3">Fale conosco pelo WhatsApp para respostas rápidas</p>
                <p className="text-[#0056ff] font-medium">(83) 99197-1320</p>
              </CardContent>
            </Card>
          </a>

          <a href="mailto:rhvagasabertasparaiba@gmail.com">
            <Card className="rounded-2xl h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">E-mail</h3>
                <p className="text-slate-600 mb-3">Envie-nos um e-mail para dúvidas e suporte</p>
                <p className="text-[#0056ff] font-medium break-all">rhvagasabertasparaiba@gmail.com</p>
              </CardContent>
            </Card>
          </a>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Informações da Empresa</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-slate-700">Localização</p>
                  <p className="text-slate-600">Paraíba, Brasil</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-slate-700">Telefone</p>
                  <p className="text-slate-600">(83) 99197-1320</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-slate-700">E-mail</p>
                  <p className="text-slate-600">rhvagasabertasparaiba@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-slate-700">Horário de Atendimento</p>
                  <p className="text-slate-600">Segunda a Sexta: 8h - 18h</p>
                  <p className="text-slate-600">Sábado: 8h - 12h</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-slate-500 mb-1"><strong>Razão Social:</strong> Alexandre Ferreira</p>
              <p className="text-sm text-slate-500"><strong>CNPJ:</strong> 62.874.724/0001-11</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white">
          <CardContent className="p-6 md:p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-xl font-bold mb-2">Precisa de ajuda?</h2>
            <p className="text-white/90 mb-6">
              Nossa equipe está pronta para atendê-lo. Respondemos em até 24 horas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/5583991971320" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-[#0056ff] hover:bg-white/90">
                  Abrir WhatsApp
                </Button>
              </a>
              <a href="mailto:rhvagasabertasparaiba@gmail.com">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  Enviar E-mail
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}