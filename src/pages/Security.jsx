import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Security() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-green-600 to-green-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Política de Segurança</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="rounded-2xl">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                Compromisso com a Segurança
              </h2>
              <p className="text-slate-600 leading-relaxed">
                A segurança dos seus dados é nossa prioridade máxima. Implementamos as melhores práticas e tecnologias para proteger suas informações pessoais e profissionais.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Proteção de Dados
              </h2>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Criptografia SSL/TLS em todas as comunicações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Armazenamento seguro em servidores protegidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Backups automáticos e redundantes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Controle de acesso restrito aos dados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Monitoramento constante de atividades suspeitas</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                Autenticação e Acesso
              </h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                Utilizamos sistemas de autenticação seguros através do Base44 e Google OAuth para garantir que apenas você tenha acesso à sua conta.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>• Autenticação via Google (OAuth 2.0)</li>
                <li>• Sessões seguras e tokens criptografados</li>
                <li>• Logout automático por inatividade</li>
                <li>• Verificação em duas etapas (opcional)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Boas Práticas para Usuários</h2>
              <ul className="space-y-2 text-slate-600">
                <li>• Nunca compartilhe suas credenciais de acesso</li>
                <li>• Use senhas fortes e únicas</li>
                <li>• Mantenha seu dispositivo atualizado</li>
                <li>• Faça logout ao usar dispositivos compartilhados</li>
                <li>• Desconfie de e-mails ou mensagens suspeitas</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Reporte Incidentes de Segurança
              </h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                Se você identificar alguma vulnerabilidade ou atividade suspeita, entre em contato imediatamente:
              </p>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-700 font-medium">E-mail: rhvagasabertasparaiba@gmail.com</p>
                <p className="text-slate-700 font-medium">WhatsApp: (83) 99197-1320</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Conformidade Legal</h2>
              <p className="text-slate-600 leading-relaxed">
                Estamos em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e outras regulamentações aplicáveis de proteção de dados.
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