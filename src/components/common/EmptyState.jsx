import React from 'react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel,
  className = '' 
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action} className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}