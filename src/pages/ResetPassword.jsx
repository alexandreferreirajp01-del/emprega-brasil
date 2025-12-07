import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Lock, CheckCircle, AlertCircle, Key } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import PasswordInput from "@/components/common/PasswordInput";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim() || code.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    if (!newPassword) {
      setError('Digite uma nova senha');
      return;
    }

    if (newPassword.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buscar usuário
      const users = await base44.entities.User.filter({ email: email });
      
      if (users.length === 0) {
        setError('Usuário não encontrado');
        setLoading(false);
        return;
      }

      const user = users[0];

      // Verificar código
      if (user.reset_password_code !== code) {
        setError('Código inválido');
        setLoading(false);
        return;
      }

      // Verificar expiração
      const now = new Date();
      const expires = new Date(user.reset_password_expires);
      if (now > expires) {
        setError('Código expirado. Solicite um novo');
        setLoading(false);
        return;
      }

      // Atualizar senha e limpar código
      await base44.entities.User.update(user.id, {
        password: newPassword,
        reset_password_code: null,
        reset_password_expires: null,
        password_updated_at: new Date().toISOString()
      });

      // Enviar e-mail de confirmação
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Senha Alterada - Vagas Abertas Paraíba',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Vagas Abertas Paraíba</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Senha Alterada com Sucesso!</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Olá, <strong>${user.full_name || 'usuário'}</strong>!
              </p>
              
              <p style="color: #555; line-height: 1.6;">
                Sua senha foi alterada com sucesso em ${new Date().toLocaleString('pt-BR')}.
              </p>
              
              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46;">
                  ✓ Agora você pode fazer login com sua nova senha
                </p>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6;">
                Se você não fez esta alteração, entre em contato conosco imediatamente.
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

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate(createPageUrl('Splash'));
      }, 3000);

    } catch (error) {
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Senha Alterada!</h2>
            <p className="text-slate-600 mb-4">
              Sua senha foi redefinida com sucesso
            </p>
            <p className="text-sm text-slate-500">
              Redirecionando para o login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to={createPageUrl('ForgotPassword')}>
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
          <h1 className="text-2xl font-bold text-white mb-1">Nova Senha</h1>
          <p className="text-white/80 text-sm">Digite o código e crie uma nova senha</p>
        </div>

        <Card className="rounded-2xl shadow-2xl border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Código */}
              <div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Código de 6 dígitos"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(value);
                      setError('');
                    }}
                    className="pl-11 h-12 rounded-xl text-base text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Nova Senha */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    className="pl-11 h-12 rounded-xl text-base"
                  />
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirmar nova senha"
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
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}