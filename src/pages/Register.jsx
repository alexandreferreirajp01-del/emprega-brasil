import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Mail, Lock, User, Phone, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import PasswordInput from "@/components/common/PasswordInput";

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    state: 'PB',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Verificar se o e-mail já existe
      const existingUsers = await base44.entities.User.filter({ email: formData.email });
      if (existingUsers.length > 0) {
        setErrors({ email: 'Este e-mail já está cadastrado' });
        setLoading(false);
        return;
      }

      // Enviar e-mail de boas-vindas
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: 'Bem-vindo ao Vagas Abertas Paraíba!',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0056ff 0%, #0044cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Vagas Abertas Paraíba</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Olá, ${formData.full_name}!</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Seja muito bem-vindo à maior plataforma de empregos da Paraíba! 🎉
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0056ff;">
                <h3 style="color: #0056ff; margin-top: 0;">Seus Dados de Cadastro:</h3>
                <p style="margin: 5px 0;"><strong>Nome:</strong> ${formData.full_name}</p>
                <p style="margin: 5px 0;"><strong>E-mail:</strong> ${formData.email}</p>
                <p style="margin: 5px 0;"><strong>Telefone:</strong> ${formData.phone}</p>
                <p style="margin: 5px 0;"><strong>Cidade:</strong> ${formData.city} - ${formData.state}</p>
              </div>
              
              <p style="color: #555; line-height: 1.6;">
                Para acessar o aplicativo, faça login com sua conta Google usando o mesmo e-mail cadastrado.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vagas-abertas-paraiba-2af288b2.base44.app" 
                   style="background: #0056ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Acessar Agora
                </a>
              </div>
              
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
        base44.auth.redirectToLogin(createPageUrl('Home'));
      }, 3000);

    } catch (error) {
      setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Conta Criada!</h2>
            <p className="text-slate-600 mb-4">
              Enviamos um e-mail de confirmação para <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Redirecionando para o login...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-start pt-8 px-4 pb-8">
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
          <h1 className="text-2xl font-bold text-white mb-1">Criar Conta</h1>
          <p className="text-white/80 text-sm">Preencha seus dados para começar</p>
        </div>

        <Card className="rounded-2xl shadow-2xl border-0">
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome Completo */}
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Nome completo *"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className={`pl-11 h-12 rounded-xl text-base ${errors.full_name ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.full_name}</p>
                )}
              </div>

              {/* E-mail */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="E-mail *"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value.toLowerCase())}
                    className={`pl-11 h-12 rounded-xl text-base ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="Telefone (83) 99999-9999 *"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`pl-11 h-12 rounded-xl text-base ${errors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>
                )}
              </div>

              {/* Cidade/Estado */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Cidade *"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={`pl-11 h-12 rounded-xl text-base ${errors.city ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="UF"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                    maxLength={2}
                    className="h-12 rounded-xl text-base text-center"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <PasswordInput
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Criar senha (mínimo 6 caracteres) *"
                    className={`pl-11 h-12 rounded-xl text-base ${errors.password ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <PasswordInput
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Confirmar senha *"
                    className={`pl-11 h-12 rounded-xl text-base ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Erro Geral */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Botão Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Confirmar Cadastro'
                )}
              </Button>

              {/* Info */}
              <p className="text-center text-xs text-slate-400 pt-2">
                * Campos obrigatórios
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/50 text-xs mt-4">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link to={createPageUrl('Terms')} className="text-white hover:underline">
            Termos de Uso
          </Link>
        </p>
      </div>
    </div>
  );
}