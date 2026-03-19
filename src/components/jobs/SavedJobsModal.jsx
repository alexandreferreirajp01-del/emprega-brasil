import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Building2, MapPin, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function SavedJobsModal({ open, onClose, user }) {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['saved-jobs-modal', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.FavoriteJob.filter({ user_email: user.email }, '-created_date', 100) || [];
    },
    enabled: !!user && open,
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteJob.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs-modal'] });
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bookmark className="w-5 h-5 text-[#1E6FB6] fill-current" />
            Vagas Salvas
            {favorites.length > 0 && (
              <span className="text-sm font-normal text-slate-500">({favorites.length})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#1E6FB6]" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-10">
              <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">Nenhuma vaga salva</p>
              <p className="text-slate-400 text-sm">Toque na bandeirinha 🚩 nas vagas para salvá-las aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => { window.location.href = createPageUrl('JobDetail') + `?id=${fav.job_id}`; onClose(); }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-[#1E6FB6]/30 hover:bg-blue-50/40 cursor-pointer transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-[#1E6FB6] text-sm line-clamp-2 transition-colors">
                      {fav.job_title || 'Vaga'}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      {fav.job_company || 'Empresa'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E6FB6]" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMutation.mutate(fav.id); }}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}