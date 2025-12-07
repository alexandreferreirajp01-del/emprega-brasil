import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ManualPremiumActivation() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const queryClient = useQueryClient();

  const activatePremiumMutation = useMutation({
    mutationFn: async (userEmail) => {
      // Buscar usuário pelo email
      const users = await base44.entities.User.filter({ email: userEmail });
      
      if (!users || users.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const user = users[0];

      // Atualizar para Premium
      await base44.entities.User.update(user.id, {
        subscription_type: 'premium',
        premium_since: new Date().toISOString(),
        premium_expires: null
      });

      // Criar registro de pagamento manual
      await base44.entities.Payment.create({
        user_email: userEmail,
        amount: 29.90,
        status: 'approved',
        payment_method: 'manual',
        notes: 'Ativação manual pelo administrador'
      });

      return user;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: `Premium ativado para ${user.email}!` });
      setEmail('');
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message || 'Erro ao ativar Premium' });
    }
  });

  const handleActivate = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Digite um e-mail válido' });
      return;
    }
    activatePremiumMutation.mutate(email.trim());
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Ativação Manual de Premium</h3>
            <p className="text-sm text-slate-500">Ative o plano Premium para qualquer usuário</p>
          </div>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail do Usuário</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              className="rounded-xl h-11"
              disabled={activatePremiumMutation.isPending}
            />
          </div>

          {message && (
            <div className={`p-3 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={activatePremiumMutation.isPending}
            className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
          >
            {activatePremiumMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Ativando...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Ativar Premium
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-xs text-slate-600">
            <strong>Nota:</strong> Esta ação ativará imediatamente o plano Premium vitalício para o usuário.
            Um registro de pagamento manual será criado no histórico.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}