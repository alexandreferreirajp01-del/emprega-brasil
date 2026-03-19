import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SavedJobsModal from "@/components/jobs/SavedJobsModal";

export default function SavedJobsButton({ user }) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors mb-3"
      >
        <Save className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">Vagas Salvas</span>
      </button>

      <SavedJobsModal open={open} onClose={() => setOpen(false)} user={user} />
    </>
  );
}