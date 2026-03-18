import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '@/lib/NavigationProvider';

export default function BackButton({ className = '' }) {
  const { canGoBack, goBack } = useNavigation();

  if (!canGoBack) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={goBack}
      className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${className}`}
      title="Voltar"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}