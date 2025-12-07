import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import PasswordInput from "@/components/common/PasswordInput";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        navigate(createPageUrl('Splash'));
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      setError('Digite sua senha atual');
      return;
    }

    if (!newPassword) {
      setError('Digite uma nova senha');
      return;
    }

    if (newPassword.length < 6) {
      setError('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Chamar função backend
      const response = await base44.functions.invoke('changePassword', {
        currentPassword: currentPassword,
        newPassword: newPassword
      });

      if (!response.data.success) {
        setError(response.data.error);
        setSaving(false);
        return;
      }

      setSuccess(true);

      // Voltar ao perfil após 2 segundos
      setTimeout(() => {
        navigate(createPageUrl('Profile'));
      }, 2000);

    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Erro ao alterar senha. Tente novamente.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Senha Alterada!</h2>
            <p className="text-slate-600">Sua senha foi atualizada com sucesso</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-md mx-auto">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Alterar Senha</h1>
          <p className="text-white/70 text-sm">Mantenha sua conta segura</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <Card className="rounded-2xl shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Senha Atual */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Senha Atual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Digite sua senha atual"
                    className="pl-11 h-12 rounded-xl"
                  />
                </div>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-11 h-12 rounded-xl"
                  />
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Digite novamente"
                    className="pl-11 h-12 rounded-xl"
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
                disabled={saving}
                className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-base font-semibold"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Atualizar Senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}