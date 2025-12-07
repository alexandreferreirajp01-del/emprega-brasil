import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Digite seu e-mail');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('E-mail inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar se o e-mail existe
      const users = await base44.entities.User.filter({ email: email });
      
      if (users.length === 0) {
        setError('E-mail não encontrado');
        setLoading(false);
        return;
      }

      const user = users[0];
      
      // Gerar código temporário (6 dígitos)
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Salvar código no usuário (expira em 1 hora)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await base44.entities.User.update(user.id, {
        reset_password_code: resetCode,
        reset_password_expires: expiresAt
      });

      // Enviar e-mail com código
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Redefinir Senha - Vagas Abertas Paraíba',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0056ff 0%, #0044cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Vagas Abertas Paraíba</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Redefinir Senha</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Olá, <strong>${user.full_name || 'usuário'}</strong>!
              </p>
              
              <p style="color: #555; line-height: 1.6;">
                Você solicitou a redefinição de senha. Use o código abaixo para criar uma nova senha:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #0056ff;">
                <h1 style="color: #0056ff; margin: 0; font-size: 36px; letter-spacing: 5px;">
                  ${resetCode}
                </h1>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6;">
                Este código expira em <strong>1 hora</strong>.<br>
                Se você não solicitou esta alteração, ignore este e-mail.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center;">
                Equipe Vagas Abertas PB<br>
                CNPJ: 62.874.724/0001-11<br>
                rhvagasabertasparaiba@gmail.com
              </p>
            </div>
          </div>
        `
      });

      setSuccess(true);

    } catch (error) {
      setError('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">E-mail Enviado!</h2>
            <p className="text-slate-600 mb-6">
              Enviamos um código de redefinição para <strong>{email}</strong>
            </p>
            <Link to={createPageUrl('ResetPassword') + `?email=${encodeURIComponent(email)}`}>
              <Button className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12">
                Inserir Código
              </Button>
            </Link>
            <Link to={createPageUrl('Splash')}>
              <Button variant="ghost" className="w-full mt-3">
                Voltar ao Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to={createPageUrl('Splash')}>
          <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />Voltar
          </Button>
        </Link>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg" 
              alt="Logo" 
              className="w-12 h-12 object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Esqueci minha senha</h1>
          <p className="text-white/80 text-sm">Digite seu e-mail para redefinir</p>
        </div>

        <Card className="rounded-2xl shadow-2xl border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Seu e-mail cadastrado"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.toLowerCase());
                      setError('');
                    }}
                    className="pl-11 h-12 rounded-xl text-base"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Enviar Código'
                )}
              </Button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Você receberá um código de 6 dígitos por e-mail
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}