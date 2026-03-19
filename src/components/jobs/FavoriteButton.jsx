import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function FavoriteButton({ job, user, size = "default" }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (user && job) {
      checkFavorite();
    }
  }, [user, job]);
  
  const checkFavorite = async () => {
    try {
      const favorites = await base44.entities.FavoriteJob.filter({
        job_id: job.id,
        user_email: user.email
      });
      if (favorites.length > 0) {
        setIsFavorite(true);
        setFavoriteId(favorites[0].id);
      }
    } catch (e) {
      console.log('Erro ao verificar favorito');
    }
  };
  
  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (isFavorite && favoriteId) {
        await base44.entities.FavoriteJob.delete(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const created = await base44.entities.FavoriteJob.create({
          job_id: job.id,
          user_email: user.email,
          job_title: job.title,
          job_company: job.company || ''
        });
        setIsFavorite(true);
        setFavoriteId(created.id);
      }
    } catch (e) {
      console.error('Erro ao favoritar:', e);
    }
    
    setLoading(false);
  };
  
  if (!user) return null;
  
  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorite ? 'Remover das vagas salvas' : 'Salvar vaga'}
      className={`${sizeClasses} rounded-full ${isFavorite ? 'text-[#1E6FB6] hover:text-[#0B2F5B]' : 'text-slate-400 hover:text-[#1E6FB6]'}`}
    >
      <Bookmark className={`${iconSize} ${isFavorite ? 'fill-current' : ''}`} />
    </Button>
  );
}