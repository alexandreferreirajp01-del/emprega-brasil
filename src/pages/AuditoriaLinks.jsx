import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Search, CheckCircle, AlertTriangle, Wrench, ExternalLink, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AuditoriaLinks() {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState(null);
  const [fixApplied, setFixApplied] = useState(false);

  const runAudit = async (fix = false) => {
    fix ? setFixing(true) : setLoading(true);
    try {
      const response = await base44.functions.invoke('auditJobLinks', { fix, limit: 1000 });
      setReport(response.data.report);
      if (fix) setFixApplied(true);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2 h-9">← Voltar</Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Auditoria de Links</h1>
              <p className="text-white/70 text-sm">Verificar e corrigir links quebrados nas vagas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Ações */}
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-600">
              Esta ferramenta analisa todas as vagas ativas e verifica se os links de candidatura (WhatsApp, formulários, sites) estão corretamente formatados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => runAudit(false)}
                disabled={loading || fixing}
                variant="outline"
                className="flex-1"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando...</> : <><Search className="w-4 h-4 mr-2" />Analisar (sem corrigir)</>}
              </Button>
              <Button
                onClick={() => runAudit(true)}
                disabled={loading || fixing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {fixing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Corrigindo...</> : <><Wrench className="w-4 h-4 mr-2" />Analisar e Corrigir</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Relatório */}
        {report && (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="rounded-xl">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-slate-800">{report.total_checked}</p>
                  <p className="text-xs text-slate-500 mt-1">Vagas analisadas</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{report.ok_links}</p>
                  <p className="text-xs text-slate-500 mt-1">Links OK</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{report.wa_normalized?.length || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">WhatsApp {fixApplied ? 'corrigidos' : 'a corrigir'}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{report.broken_links?.length || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Links quebrados</p>
                </CardContent>
              </Card>
            </div>

            {fixApplied && report.wa_normalized?.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">
                  {report.wa_normalized.length} link(s) de WhatsApp foram corrigidos automaticamente!
                </p>
              </div>
            )}

            {/* WhatsApp a corrigir */}
            {report.wa_normalized?.length > 0 && (
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    WhatsApp {fixApplied ? 'Corrigidos' : 'com Problema'} ({report.wa_normalized.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {report.wa_normalized.slice(0, 30).map((item, i) => (
                      <div key={i} className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500 mb-1">{item.company}</p>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-red-500 font-mono truncate">❌ {item.original}</p>
                          <p className="text-xs text-emerald-600 font-mono truncate">✅ {item.fixed}</p>
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">{item.issue}</Badge>
                      </div>
                    ))}
                    {report.wa_normalized.length > 30 && (
                      <p className="px-4 py-3 text-sm text-slate-500">...e mais {report.wa_normalized.length - 30}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Links quebrados */}
            {report.broken_links?.length > 0 && (
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Links Quebrados (sem correção automática) ({report.broken_links.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {report.broken_links.slice(0, 30).map((item, i) => (
                      <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.company}</p>
                          <p className="text-xs text-red-500 font-mono truncate">{item.link}</p>
                          <Badge variant="outline" className="text-xs mt-1">{item.issue}</Badge>
                        </div>
                        <a
                          href={`/GerenciarVagas?id=${item.id}`}
                          className="flex-shrink-0 text-blue-600 hover:text-blue-800"
                          title="Editar vaga"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                    {report.broken_links.length > 30 && (
                      <p className="px-4 py-3 text-sm text-slate-500">...e mais {report.broken_links.length - 30}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {report.broken_links?.length === 0 && report.wa_normalized?.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-emerald-700 font-medium">Todos os links estão OK!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}