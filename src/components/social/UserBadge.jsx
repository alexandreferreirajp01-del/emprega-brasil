import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Briefcase, Star } from "lucide-react";

export default function UserBadge({ user, size = "sm" }) {
  if (!user) return null;
  
  const isAdmin = user.role === 'admin' || user.subscription_type === 'admin';
  const isRecruiter = user.subscription_type === 'recruiter';
  const isPremium = user.subscription_type === 'premium';
  
  const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  const badgeClass = size === 'lg' ? 'text-xs px-2 py-1' : 'text-[10px] px-1.5 py-0.5';
  
  if (isAdmin) {
    return (
      <Badge className={`bg-purple-100 text-purple-700 ${badgeClass}`}>
        <Shield className={`${iconSize} mr-1`} />
        Admin
      </Badge>
    );
  }
  
  if (isRecruiter) {
    return (
      <Badge className={`bg-blue-100 text-blue-700 ${badgeClass}`}>
        <Briefcase className={`${iconSize} mr-1`} />
        Recrutador
      </Badge>
    );
  }
  
  if (isPremium) {
    return (
      <Badge className={`bg-amber-100 text-amber-700 ${badgeClass}`}>
        <Crown className={`${iconSize} mr-1`} />
        Premium
      </Badge>
    );
  }
  
  return (
    <Badge className={`bg-slate-100 text-slate-600 ${badgeClass}`}>
      <Star className={`${iconSize} mr-1`} />
      Básico
    </Badge>
  );
}