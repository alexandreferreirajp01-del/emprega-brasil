import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Sparkles, Save, Download, Loader2, Copy, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GeradorCarta({ user }) {
  const [vaga, setVaga] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [carta, setCarta] = useState('');
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const gerarCarta = async () => {
    if (!vaga || !empresa) return;
    setGerando(true);
    try {
      const prompt = `Gere uma carta de apresentação profissional em português brasileiro para a vaga de "${vaga}" na empresa "${empresa}". 
${experiencia ? `Experiência do candidato: ${experiencia}` : ''}
A carta deve ser formal, objetiva, com 3-4 parágrafos. Não inclua placeholders.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: { carta: { type: "string" } }
        }
      });
      setCarta(response.carta || '');
    } catch (e) {
      console.error(e);
    } finally {
      setGerando(false);
    }
  };

  const salvarCarta = async () => {
    if (!carta) return;
    setSalvando(true);
    try {
      await base44.entities.CartaUsuario.create({
        user_email: user.email,
        titulo: `Carta - ${vaga} - ${empresa}`,
        conteudo: carta,
        vaga_alvo: vaga,
        empresa_alvo: empresa
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  const copiar = () => {
    navigator.clipboard.writeText(carta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const baixar = () => {
    const blob = new Blob([carta], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carta_${vaga.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="bg-green-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Mail className="w-5 h-5" />
          Gerador de Carta de Apresentação
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vaga Desejada *</Label>
            <Input value={vaga} onChange={(e) => setVaga(e.target.value)} placeholder="Ex: Vendedor" className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ex: Magazine Luiza" className="rounded-lg" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sua Experiência (opcional)</Label>
          <Textarea value={experiencia} onChange={(e) => setExperiencia(e.target.value)} placeholder="Descreva sua experiência..." className="rounded-lg min-h-[80px]" />
        </div>

        <Button onClick={gerarCarta} disabled={gerando || !vaga || !empresa} className="bg-green-600 hover:bg-green-700 rounded-xl">
          {gerando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {gerando ? 'Gerando...' : 'Gerar com IA'}
        </Button>

        {carta && (
          <div className="space-y-3 pt-4 border-t">
            <Label>Sua Carta:</Label>
            <Textarea value={carta} onChange={(e) => setCarta(e.target.value)} className="rounded-lg min-h-[200px]" />
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={copiar} variant="outline" className="rounded-lg">
                {copiado ? <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiado ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button onClick={baixar} variant="outline" className="rounded-lg">
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
              <Button onClick={salvarCarta} disabled={salvando} className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}