import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Scale, UserCheck, FileText, Trash2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LGPD() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">LGPD - Direitos do Usuário</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="rounded-2xl">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Lei Geral de Proteção de Dados</h2>
              <p className="text-slate-600 leading-relaxed">
                Em conformidade com a Lei nº 13.709/2018 (LGPD), você possui direitos sobre seus dados pessoais. Estamos comprometidos em garantir a transparência e o controle total sobre suas informações.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Seus Direitos</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <UserCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-1">Confirmação e Acesso</h3>
                    <p className="text-slate-600">Direito de confirmar se tratamos seus dados e acessá-los a qualquer momento.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-1">Correção de Dados</h3>
                    <p className="text-slate-600">Direito de corrigir dados incompletos, inexatos ou desatualizados.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-1">Eliminação de Dados</h3>
                    <p className="text-slate-600">Direito de solicitar a exclusão de dados tratados com seu consentimento.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Download className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-1">Portabilidade</h3>
                    <p className="text-slate-600">Direito de solicitar a portabilidade dos dados para outro fornecedor.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Outros Direitos Garantidos</h2>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>Anonimização, bloqueio ou eliminação de dados desnecessários</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>Informação sobre compartilhamento de dados com terceiros</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>Revogação do consentimento a qualquer momento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>Oposição ao tratamento de dados</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Como Exercer Seus Direitos</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Para exercer qualquer um dos seus direitos previstos na LGPD, entre em contato conosco através dos seguintes canais:
              </p>
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                <p className="text-slate-700"><strong>E-mail:</strong> rhvagasabertasparaiba@gmail.com</p>
                <p className="text-slate-700"><strong>WhatsApp:</strong> (83) 99197-1320</p>
                <p className="text-slate-700"><strong>Prazo de resposta:</strong> Até 15 dias úteis</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Dados Coletados</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                Coletamos e tratamos os seguintes dados pessoais:
              </p>
              <ul className="space-y-1 text-slate-600">
                <li>• Nome completo e foto de perfil</li>
                <li>• E-mail e telefone</li>
                <li>• Informações profissionais (currículo, experiências)</li>
                <li>• Histórico de navegação e interações no aplicativo</li>
                <li>• Dados de localização (cidade/estado)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Base Legal</h2>
              <p className="text-slate-600 leading-relaxed">
                O tratamento dos seus dados é realizado com base em: consentimento, execução de contrato, cumprimento de obrigação legal, exercício regular de direitos e legítimo interesse.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Autoridade Nacional</h2>
              <p className="text-slate-600 leading-relaxed">
                Em caso de dúvidas ou insatisfação, você pode entrar em contato com a Autoridade Nacional de Proteção de Dados (ANPD) através do site <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.gov.br/anpd</a>.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-slate-500">Última atualização: Janeiro de 2025</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}