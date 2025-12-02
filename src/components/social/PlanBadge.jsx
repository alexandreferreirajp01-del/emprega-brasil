import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Star, Briefcase } from "lucide-react";

export default function PlanBadge({ user, size = "sm" }) {
  if (!user) return null;

  const isAdmin = user.role === 'admin' || user.subscription_type === 'admin' || user.email === 'alexandreferreirajp01@gmail.com';
  const isRecruiter = user.subscription_type === 'recruiter';
  const isPremium = user.subscription_type === 'premium';
  const isBasic = !isAdmin && !isRecruiter && !isPremium;

  if (isAdmin) {
    return (
      <Badge className={`bg-gradient-to-r from-purple-500 to-purple-700 text-white border-0 ${size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2'}`}>
        <Shield className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
        Admin
      </Badge>
    );
  }

  if (isRecruiter) {
    return (
      <Badge className={`bg-gradient-to-r from-purple-400 to-purple-600 text-white border-0 ${size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2'}`}>
        <Briefcase className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
        Recrutador
      </Badge>
    );
  }

  if (isPremium) {
    return (
      <Badge className={`bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 ${size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2'}`}>
        <Crown className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
        Premium
      </Badge>
    );
  }

  return (
    <Badge className={`bg-slate-200 text-slate-600 border-0 ${size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2'}`}>
      <Star className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
      Básico
    </Badge>
  );
}