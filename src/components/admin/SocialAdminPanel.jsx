import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function SocialAdminPanel() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-8 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2">Painel Social</h3>
        <p className="text-slate-500">A área social agora é gerenciada diretamente na aba Social do aplicativo.</p>
      </CardContent>
    </Card>
  );
}