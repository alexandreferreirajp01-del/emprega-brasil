import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit2, Eye, Trash2, MoreVertical, Copy, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function SubscriptionActionsMenu({ subscription, onEdit, onView, onRenew, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView?.(subscription)}>
          <Eye className="w-4 h-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(subscription)}>
          <Edit2 className="w-4 h-4 mr-2" />
          Editar
        </DropdownMenuItem>
        {subscription.status === 'active' && (
          <DropdownMenuItem onClick={() => onRenew?.(subscription)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Renovar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete?.(subscription)} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Deletar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}