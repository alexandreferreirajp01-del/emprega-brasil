import { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

export default function VisitorRedirect({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isVisitor, setIsVisitor] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('Subscription');
          return;
        }
        setIsVisitor(false);
      } catch (e) {
        window.location.href = createPageUrl('Subscription');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, []);

  if (isChecking || isVisitor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return children;
}