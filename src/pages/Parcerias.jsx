import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Handshake, Building2, Target, Users, TrendingUp, Award, 
  CheckCircle, ArrowLeft, Send, Mail, Phone, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function Parcerias() {
  const [formData, setFormData] = useState({
    empresa: '',
    responsavel: '',
    email: '',
    telefone: '',
    mensagem: ''
  });
  const [sending, setSending] = useState(false);

  const beneficios = [
    { icon: Target, title: 'Visibilidade Máxima', desc: 'Suas vagas em destaque para milhares de candidatos' },
    { icon: Users, title: 'Acesso Premium', desc: 'Ferramentas exclusivas para recrutamento' },
    { icon: TrendingUp, title: 'Prioridade', desc: 'Suas vagas aparecem primeiro nas buscas' },
    { icon: Award, title: 'Selo Verificado', desc: 'Badge de empresa parceira oficial' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.empresa || !formData.email || !formData.telefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSending(true);

    try {
      const mensagemWhatsApp = `🤝 *NOVA SOLICITAÇÃO DE PARCERIA*\n\n` +
        `🏢 *Empresa:* ${formData.empresa}\n` +
        `👤 *Responsável:* ${formData.responsavel || 'Não informado'}\n` +
        `📧 *Email:* ${formData.email}\n` +
        `📱 *Telefone:* ${formData.telefone}\n` +
        `💬 *Mensagem:* ${formData.mensagem || 'Não informada'}\n\n` +
        `✅ Aguardando contato`;

      const whatsappURL = `https://wa.me/5583991971320?text=${encodeURIComponent(mensagemWhatsApp)}`;
      window.open(whatsappURL, '_blank');

      toast.success('Solicitação enviada! Entraremos em contato em breve.');
      
      setFormData({
        empresa: '',
        responsavel: '',
        email: '',
        telefone: '',
        mensagem: ''
      });
    } catch (error) {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Seja Nosso Parceiro</h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Conecte sua empresa aos melhores talentos da Paraíba e tenha benefícios exclusivos
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Benefícios */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
              Por que ser Parceiro?
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {beneficios.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Solicitar Parceria</h2>
              <Badge className="bg-green-100 text-green-700 border-0">
                <CheckCircle className="w-3 h-3 mr-1" />
                Gratuito
              </Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da Empresa *
                </label>
                <Input
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  placeholder="Ex: Empresa LTDA"
                  className="h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Responsável
                </label>
                <Input
                  value={formData.responsavel}
                  onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                  placeholder="Seu nome"
                  className="h-12"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contato@empresa.com"
                    className="h-12"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone *
                  </label>
                  <Input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(83) 99999-9999"
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mensagem
                </label>
                <Textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                  placeholder="Conte-nos sobre sua empresa e interesse na parceria..."
                  className="h-32"
                />
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
              >
                {sending ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-slate-600 text-center mb-4">
                Ou entre em contato diretamente:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="mailto:rhvagasabertasparaiba@gmail.com" className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <Mail className="w-4 h-4" />
                  rhvagasabertasparaiba@gmail.com
                </a>
                <a href="https://wa.me/5583991971320" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-green-600 hover:text-green-700">
                  <MessageSquare className="w-4 h-4" />
                  (83) 99197-1320
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}