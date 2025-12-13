import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from "@/api/base44Client";

export default function ActivityTracker({ user }) {
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const trackActivity = async () => {
      try {
        const pageName = location.pathname.split('/').pop() || 'Home';
        
        await base44.asServiceRole.entities.UserActivity.create({
          user_email: user.email,
          user_name: user.custom_full_name || user.username || user.full_name,
          activity_type: 'page_view',
          page_name: pageName,
          activity_details: {
            page_name: pageName,
            path: location.pathname
          }
        });
      } catch (err) {
        console.error('Erro ao rastrear atividade:', err);
      }
    };

    trackActivity();
  }, [location.pathname, user]);

  return null;
}

// Funções auxiliares para rastrear atividades específicas
export const trackJobView = async (user, job) => {
  if (!user) return;
  try {
    await base44.asServiceRole.entities.UserActivity.create({
      user_email: user.email,
      user_name: user.custom_full_name || user.username || user.full_name,
      activity_type: 'job_view',
      reference_id: job.id,
      reference_title: job.title,
      activity_details: {
        job_id: job.id,
        job_title: job.title,
        company: job.company
      }
    });
  } catch (err) {
    console.error('Erro ao rastrear visualização de vaga:', err);
  }
};

export const trackJobApply = async (user, job) => {
  if (!user) return;
  try {
    await base44.asServiceRole.entities.UserActivity.create({
      user_email: user.email,
      user_name: user.custom_full_name || user.username || user.full_name,
      activity_type: 'job_apply',
      reference_id: job.id,
      reference_title: job.title,
      activity_details: {
        job_id: job.id,
        job_title: job.title,
        company: job.company
      }
    });
  } catch (err) {
    console.error('Erro ao rastrear candidatura:', err);
  }
};

export const trackJobFavorite = async (user, job) => {
  if (!user) return;
  try {
    await base44.asServiceRole.entities.UserActivity.create({
      user_email: user.email,
      user_name: user.custom_full_name || user.username || user.full_name,
      activity_type: 'job_favorite',
      reference_id: job.id,
      reference_title: job.title,
      activity_details: {
        job_id: job.id,
        job_title: job.title
      }
    });
  } catch (err) {
    console.error('Erro ao rastrear favorito:', err);
  }
};

export const trackSearch = async (user, query) => {
  if (!user) return;
  try {
    await base44.asServiceRole.entities.UserActivity.create({
      user_email: user.email,
      user_name: user.custom_full_name || user.username || user.full_name,
      activity_type: 'search',
      activity_details: {
        query: query
      }
    });
  } catch (err) {
    console.error('Erro ao rastrear busca:', err);
  }
};