import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function ActivateBasic() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const activateBasic = async () => {
      try {
        // Check if user is authenticated
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (!isAuthenticated) {
          // Redirect to splash if not authenticated
          window.location.href = createPageUrl('Splash');
          return;
        }

        // Get current user
        const user = await base44.auth.me();
        
        // Update subscription to basic if not already premium/admin
        if (!user.subscription_type || user.subscription_type === '' || user.subscription_type === 'pending') {
          await base44.auth.updateMe({ subscription_type: 'basic' });
        }

        // Clear pending subscription
        localStorage.removeItem('pending_subscription');
        
        setStatus('success');
        
        // Redirect to home after 1.5 seconds
        setTimeout(() => {
          window.location.href = createPageUrl('Home');
        }, 1500);
        
      } catch (e) {
        console.error('Error activating basic:', e);
        window.location.href = createPageUrl('Home');
      }
    };

    activateBasic();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-[#0056ff] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ativando sua conta...</h2>
            <p className="text-slate-500">Aguarde um momento</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Conta Ativada!</h2>
            <p className="text-slate-500">Você agora é um membro básico</p>
          </>
        )}
      </div>
    </div>
  );
}