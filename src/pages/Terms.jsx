import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8 prose prose-slate max-w-none">
            <p className="text-slate-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-slate-600 mb-6">
              Ao acessar e usar o web Vagas, você concorda com estes Termos de Uso. 
              Se não concordar, não use nossos serviços.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Descrição do Serviço</h2>
            <p className="text-slate-600 mb-6">
              O web Vagas é uma plataforma digital de recrutamento e divulgação de vagas de emprego em todo o território nacional brasileiro. Oferecemos acesso gratuito a milhares de vagas públicas, ferramentas de preparação profissional, notícias do mercado de trabalho e planos premium com vagas exclusivas de grandes empresas parceiras. Nossa plataforma conecta candidatos qualificados a recrutadores verificados através de tecnologia avançada de matching e inteligência artificial.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Você deve fornecer informações verdadeiras no cadastro</li>
              <li>É responsável por manter a segurança da sua conta</li>
              <li>Deve ter pelo menos 18 anos ou autorização dos responsáveis</li>
              <li>Uma conta por pessoa</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Uso Aceitável</h2>
            <p className="text-slate-600 mb-4">Você concorda em NÃO:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Publicar conteúdo falso, ofensivo ou ilegal</li>
              <li>Usar bots ou scripts automatizados</li>
              <li>Tentar acessar áreas restritas</li>
              <li>Copiar ou distribuir nosso conteúdo sem autorização</li>
              <li>Prejudicar outros usuários</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Plano Premium</h2>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>O plano premium é vitalício após pagamento único</li>
              <li>Garantia de reembolso de 7 dias</li>
              <li>Acesso a todas as vagas, incluindo exclusivas</li>
              <li>Não transferível para outra pessoa</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Vagas de Emprego</h2>
            <p className="text-slate-600 mb-6">
              O web Vagas atua como intermediário na divulgação de vagas de emprego. Realizamos moderação de conteúdo, mas não garantimos a veracidade absoluta de todas as vagas publicadas por terceiros. O web Vagas não é empregador nem responsável por relações de trabalho estabelecidas entre usuários e empresas anunciantes. Recomendamos fortemente que os candidatos verifiquem a legitimidade das ofertas, pesquisem sobre as empresas e nunca paguem taxas para participar de processos seletivos. Em caso de suspeita de fraude, disponibilizamos canal direto de denúncia.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">7. Propriedade Intelectual</h2>
            <p className="text-slate-600 mb-6">
              Todo o conteúdo da plataforma, incluindo mas não limitado a design, interface, logotipos, marcas, textos, imagens, código-fonte, estrutura de dados e funcionalidades, é de propriedade exclusiva do web Vagas (Alexandre Ferreira - CNPJ 62.874.724/0001-11) ou licenciado por terceiros autorizados. É proibida a reprodução, distribuição, modificação ou uso comercial sem autorização expressa por escrito.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">8. Publicidade</h2>
            <p className="text-slate-600 mb-6">
              O serviço pode exibir anúncios de terceiros. Não nos responsabilizamos pelo 
              conteúdo dos anúncios exibidos pelo Google AdSense ou outros parceiros.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">9. Limitação de Responsabilidade</h2>
            <p className="text-slate-600 mb-6">
              O serviço é fornecido "como está". Não garantimos disponibilidade ininterrupta 
              ou ausência de erros. Nossa responsabilidade é limitada ao valor pago pelo plano premium.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">10. Alterações</h2>
            <p className="text-slate-600 mb-6">
              Podemos alterar estes termos a qualquer momento. Alterações significativas 
              serão comunicadas por e-mail ou notificação no app.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">11. Lei Aplicável</h2>
            <p className="text-slate-600 mb-6">
              Estes termos são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro da comarca de João Pessoa, Paraíba, Brasil.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">12. Contato</h2>
            <p className="text-slate-600">
              <strong>Razão Social:</strong> Alexandre Ferreira<br />
              <strong>CNPJ:</strong> 62.874.724/0001-11<br />
              <strong>WhatsApp:</strong> (83) 99197-1320<br />
              <strong>E-mail:</strong> contato@webvagas.com.br<br />
              <strong>Endereço:</strong> Paraíba, Brasil
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}