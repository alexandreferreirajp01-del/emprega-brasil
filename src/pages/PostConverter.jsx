import React, { useEffect, useState } from 'react';
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import PostConverterComponent from "@/components/admin/PostConverter";

export default function PostConverter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAllowed = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                         currentUser?.role === 'admin' || 
                         currentUser?.subscription_type === 'admin' ||
                         currentUser?.subscription_type === 'recruiter';
        
        if (!isAllowed) {
          window.location.href = createPageUrl('Home');
          return;
        }
        
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0A66C2] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-8 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <button className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">POST Converter</h1>
          <p className="text-white/80 text-sm sm:text-base mt-2">Converta e crie posts para Instagram</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <PostConverterComponent />
      </div>
    </div>
  );
}