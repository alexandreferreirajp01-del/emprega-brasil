import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Cookies() {
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
            <Cookie className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Política de Cookies</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="rounded-2xl">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">O que são Cookies?</h2>
              <p className="text-slate-600 leading-relaxed">
                Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa nosso aplicativo. Eles nos ajudam a melhorar sua experiência e oferecer funcionalidades personalizadas.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Tipos de Cookies Utilizados</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Cookies Essenciais</h3>
                  <p className="text-slate-600">Necessários para o funcionamento básico do aplicativo, incluindo autenticação e navegação.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Cookies de Desempenho</h3>
                  <p className="text-slate-600">Coletam informações sobre como você usa o aplicativo para melhorar a performance.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Cookies de Funcionalidade</h3>
                  <p className="text-slate-600">Permitem que o aplicativo lembre suas preferências e configurações.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Cookies de Publicidade</h3>
                  <p className="text-slate-600">Utilizados para exibir anúncios relevantes através do Google AdSense.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Gerenciamento de Cookies</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                Você pode gerenciar ou desativar cookies através das configurações do seu navegador. No entanto, isso pode afetar algumas funcionalidades do aplicativo.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Para mais informações sobre como gerenciar cookies, visite a página de ajuda do seu navegador.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Google AdSense</h2>
              <p className="text-slate-600 leading-relaxed">
                Utilizamos o Google AdSense para exibir anúncios. O Google pode usar cookies para personalizar os anúncios de acordo com seus interesses. Para mais informações, consulte a <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[#0056ff] hover:underline">Política de Publicidade do Google</a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Atualizações</h2>
              <p className="text-slate-600 leading-relaxed">
                Esta política pode ser atualizada periodicamente. Recomendamos revisar esta página regularmente.
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