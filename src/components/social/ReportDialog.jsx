import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou conteúdo repetitivo' },
  { value: 'offensive', label: 'Linguagem ofensiva ou abusiva' },
  { value: 'fake', label: 'Informação falsa ou enganosa' },
  { value: 'harassment', label: 'Assédio ou bullying' },
  { value: 'inappropriate', label: 'Conteúdo impróprio' },
  { value: 'other', label: 'Outro motivo' }
];

export default function ReportDialog({ open, onOpenChange, contentType, contentId, user }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [success, setSuccess] = useState(false);

  const reportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Report.create({
        reporter_email: user.email,
        content_type: contentType,
        content_id: contentId,
        reason: `${reason}: ${details}`
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setReason('');
        setDetails('');
      }, 2000);
    },
  });

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">Denúncia enviada</h3>
            <p className="text-slate-500 mt-2">Obrigado por ajudar a manter a comunidade segura</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Denunciar Conteúdo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-3 block">Motivo da denúncia</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Detalhes adicionais (opcional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Descreva mais detalhes sobre o problema..."
              className="mt-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => reportMutation.mutate()}
              disabled={!reason || reportMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              {reportMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Enviar Denúncia'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}