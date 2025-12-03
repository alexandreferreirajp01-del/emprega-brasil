import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function SocialAdminPanel() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">A área Social agora é gerenciada diretamente na aba Social do app.</p>
        <p className="text-sm text-slate-400 mt-2">Todas as funcionalidades estão disponíveis para todos os usuários.</p>
      </CardContent>
    </Card>
  );
}