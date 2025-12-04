import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, Download, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GeradorCurriculo({ user }) {
  const [form, setForm] = useState({
    nome_completo: user?.full_name || '',
    telefone: user?.phone || '',
    email_contato: user?.email || '',
    cidade: '',
    objetivo: '',
    experiencias: '',
    formacao: '',
    habilidades: '',
    cursos: '',
    informacoes_adicionais: ''
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [curriculoId, setCurriculoId] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await base44.entities.CurriculoUsuario.filter({ user_email: user.email });
        if (lista?.length > 0) {
          const c = lista[0];
          setCurriculoId(c.id);
          setForm({
            nome_completo: c.nome_completo || '',
            telefone: c.telefone || '',
            email_contato: c.email_contato || '',
            cidade: c.cidade || '',
            objetivo: c.objetivo || '',
            experiencias: c.experiencias || '',
            formacao: c.formacao || '',
            habilidades: c.habilidades || '',
            cursos: c.cursos || '',
            informacoes_adicionais: c.informacoes_adicionais || ''
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (user?.email) carregar();
  }, [user]);

  const salvar = async () => {
    setSalvando(true);
    try {
      if (curriculoId) {
        await base44.entities.CurriculoUsuario.update(curriculoId, { ...form, user_email: user.email });
      } else {
        const novo = await base44.entities.CurriculoUsuario.create({ ...form, user_email: user.email });
        setCurriculoId(novo.id);
      }
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  const exportar = () => {
    const conteudo = `CURRÍCULO PROFISSIONAL

${form.nome_completo}
${form.email_contato} | ${form.telefone}
${form.cidade}

OBJETIVO PROFISSIONAL
${form.objetivo}

EXPERIÊNCIA PROFISSIONAL
${form.experiencias}

FORMAÇÃO ACADÊMICA
${form.formacao}

HABILIDADES
${form.habilidades}

CURSOS E CERTIFICAÇÕES
${form.cursos}

INFORMAÇÕES ADICIONAIS
${form.informacoes_adicionais}`;
    
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curriculo_${form.nome_completo.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="bg-blue-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <FileText className="w-5 h-5" />
          Gerador de Currículo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={form.nome_completo} onChange={(e) => setForm({...form, nome_completo: e.target.value})} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => setForm({...form, telefone: e.target.value})} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={form.email_contato} onChange={(e) => setForm({...form, email_contato: e.target.value})} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={(e) => setForm({...form, cidade: e.target.value})} className="rounded-lg" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Objetivo Profissional</Label>
          <Textarea value={form.objetivo} onChange={(e) => setForm({...form, objetivo: e.target.value})} placeholder="Ex: Atuar como vendedor..." className="rounded-lg min-h-[80px]" />
        </div>

        <div className="space-y-2">
          <Label>Experiências Profissionais</Label>
          <Textarea value={form.experiencias} onChange={(e) => setForm({...form, experiencias: e.target.value})} placeholder="Empresa, cargo, período..." className="rounded-lg min-h-[100px]" />
        </div>

        <div className="space-y-2">
          <Label>Formação Acadêmica</Label>
          <Textarea value={form.formacao} onChange={(e) => setForm({...form, formacao: e.target.value})} placeholder="Curso, instituição..." className="rounded-lg min-h-[80px]" />
        </div>

        <div className="space-y-2">
          <Label>Habilidades</Label>
          <Textarea value={form.habilidades} onChange={(e) => setForm({...form, habilidades: e.target.value})} placeholder="Ex: Pacote Office..." className="rounded-lg min-h-[60px]" />
        </div>

        <div className="space-y-2">
          <Label>Cursos e Certificações</Label>
          <Textarea value={form.cursos} onChange={(e) => setForm({...form, cursos: e.target.value})} placeholder="Cursos realizados..." className="rounded-lg min-h-[60px]" />
        </div>

        <div className="space-y-2">
          <Label>Informações Adicionais</Label>
          <Textarea value={form.informacoes_adicionais} onChange={(e) => setForm({...form, informacoes_adicionais: e.target.value})} placeholder="Disponibilidade, CNH..." className="rounded-lg min-h-[60px]" />
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Button onClick={salvar} disabled={salvando} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : salvo ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {salvo ? 'Salvo!' : 'Salvar'}
          </Button>
          <Button onClick={exportar} variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}