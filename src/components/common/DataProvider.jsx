import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";

// Cache global para dados
const globalCache = {
  jobs: { data: [], lastFetch: 0, loading: false },
  socialPosts: { data: [], lastFetch: 0, loading: false },
  follows: { data: [], lastFetch: 0, loading: false },
  users: { data: [], lastFetch: 0, loading: false },
};

// Tempo de vida do cache (30 segundos)
const CACHE_TTL = 30000;

// Número máximo de retries
const MAX_RETRIES = 5;

// Delay entre retries (exponencial)
const getRetryDelay = (attempt) => Math.min(300 * Math.pow(2, attempt), 5000);

const DataContext = createContext(null);

// Função de fetch com retry robusto
async function fetchWithRetry(fetchFn, maxRetries = MAX_RETRIES) {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fetchFn();
      if (result && Array.isArray(result)) {
        return result;
      }
      // Se retornou vazio, tenta novamente
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, getRetryDelay(attempt)));
        continue;
      }
      return result || [];
    } catch (error) {
      lastError = error;
      console.warn(`Tentativa ${attempt + 1}/${maxRetries} falhou:`, error.message);
      
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, getRetryDelay(attempt)));
      }
    }
  }
  
  console.error('Todas as tentativas falharam:', lastError);
  return [];
}

export function DataProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [follows, setFollows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState({
    jobs: false,
    socialPosts: false,
    follows: false,
    users: false,
  });
  const [errors, setErrors] = useState({});

  // Função para buscar jobs
  const fetchJobs = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Verificar cache
    if (!forceRefresh && globalCache.jobs.data.length > 0 && (now - globalCache.jobs.lastFetch) < CACHE_TTL) {
      setJobs(globalCache.jobs.data);
      return globalCache.jobs.data;
    }
    
    // Evitar múltiplas requisições simultâneas
    if (globalCache.jobs.loading) {
      return globalCache.jobs.data;
    }
    
    globalCache.jobs.loading = true;
    setLoading(prev => ({ ...prev, jobs: true }));
    
    try {
      const result = await fetchWithRetry(() => 
        base44.entities.Job.list('-created_date', 1000)
      );
      
      globalCache.jobs.data = result;
      globalCache.jobs.lastFetch = Date.now();
      setJobs(result);
      setErrors(prev => ({ ...prev, jobs: null }));
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar jobs:', error);
      setErrors(prev => ({ ...prev, jobs: error.message }));
      return globalCache.jobs.data || [];
    } finally {
      globalCache.jobs.loading = false;
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  }, []);

  // Função para buscar um job específico pelo ID
  const getJobById = useCallback(async (jobId) => {
    if (!jobId) return null;
    
    // Primeiro, verificar no cache local
    let found = jobs.find(j => j.id === jobId);
    if (found) return found;
    
    // Buscar do cache global
    found = globalCache.jobs.data.find(j => j.id === jobId);
    if (found) return found;
    
    // Se não encontrou, forçar atualização e buscar novamente
    const freshJobs = await fetchJobs(true);
    return freshJobs.find(j => j.id === jobId) || null;
  }, [jobs, fetchJobs]);

  // Função para buscar posts sociais
  const fetchSocialPosts = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    if (!forceRefresh && globalCache.socialPosts.data.length > 0 && (now - globalCache.socialPosts.lastFetch) < CACHE_TTL) {
      setSocialPosts(globalCache.socialPosts.data);
      return globalCache.socialPosts.data;
    }
    
    if (globalCache.socialPosts.loading) {
      return globalCache.socialPosts.data;
    }
    
    globalCache.socialPosts.loading = true;
    setLoading(prev => ({ ...prev, socialPosts: true }));
    
    try {
      const result = await fetchWithRetry(() => 
        base44.entities.SocialPost.list('-created_date', 200)
      );
      
      // Filtrar apenas posts ativos
      const activePosts = result.filter(p => p.status === 'active' || !p.status);
      
      globalCache.socialPosts.data = activePosts;
      globalCache.socialPosts.lastFetch = Date.now();
      setSocialPosts(activePosts);
      
      return activePosts;
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return globalCache.socialPosts.data || [];
    } finally {
      globalCache.socialPosts.loading = false;
      setLoading(prev => ({ ...prev, socialPosts: false }));
    }
  }, []);

  // Função para buscar follows
  const fetchFollows = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    if (!forceRefresh && globalCache.follows.data.length > 0 && (now - globalCache.follows.lastFetch) < CACHE_TTL) {
      setFollows(globalCache.follows.data);
      return globalCache.follows.data;
    }
    
    if (globalCache.follows.loading) {
      return globalCache.follows.data;
    }
    
    globalCache.follows.loading = true;
    setLoading(prev => ({ ...prev, follows: true }));
    
    try {
      const result = await fetchWithRetry(() => 
        base44.entities.Follow.list('-created_date', 1000)
      );
      
      globalCache.follows.data = result;
      globalCache.follows.lastFetch = Date.now();
      setFollows(result);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar follows:', error);
      return globalCache.follows.data || [];
    } finally {
      globalCache.follows.loading = false;
      setLoading(prev => ({ ...prev, follows: false }));
    }
  }, []);

  // Função para buscar usuários
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    if (!forceRefresh && globalCache.users.data.length > 0 && (now - globalCache.users.lastFetch) < CACHE_TTL) {
      setUsers(globalCache.users.data);
      return globalCache.users.data;
    }
    
    if (globalCache.users.loading) {
      return globalCache.users.data;
    }
    
    globalCache.users.loading = true;
    setLoading(prev => ({ ...prev, users: true }));
    
    try {
      const result = await fetchWithRetry(() => 
        base44.entities.User.list('-created_date', 500)
      );
      
      globalCache.users.data = result;
      globalCache.users.lastFetch = Date.now();
      setUsers(result);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return globalCache.users.data || [];
    } finally {
      globalCache.users.loading = false;
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  // Obter seguidores de um usuário
  const getFollowers = useCallback((userEmail) => {
    return follows.filter(f => 
      f.following_email === userEmail && (f.status === 'accepted' || f.status === 'pending')
    );
  }, [follows]);

  // Obter quem o usuário segue
  const getFollowing = useCallback((userEmail) => {
    return follows.filter(f => 
      f.follower_email === userEmail && (f.status === 'accepted' || f.status === 'pending')
    );
  }, [follows]);

  // Invalidar cache
  const invalidateCache = useCallback((entity) => {
    if (entity === 'jobs' || entity === 'all') {
      globalCache.jobs.lastFetch = 0;
    }
    if (entity === 'socialPosts' || entity === 'all') {
      globalCache.socialPosts.lastFetch = 0;
    }
    if (entity === 'follows' || entity === 'all') {
      globalCache.follows.lastFetch = 0;
    }
    if (entity === 'users' || entity === 'all') {
      globalCache.users.lastFetch = 0;
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    invalidateCache('all');
    await Promise.all([
      fetchJobs(true),
      fetchSocialPosts(true),
      fetchFollows(true),
      fetchUsers(true),
    ]);
  }, [invalidateCache, fetchJobs, fetchSocialPosts, fetchFollows, fetchUsers]);

  const value = {
    // Data
    jobs,
    socialPosts,
    follows,
    users,
    
    // Loading states
    loading,
    errors,
    
    // Fetch functions
    fetchJobs,
    fetchSocialPosts,
    fetchFollows,
    fetchUsers,
    
    // Helper functions
    getJobById,
    getFollowers,
    getFollowing,
    
    // Cache management
    invalidateCache,
    refreshAll,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Hook simplificado para jobs
export function useJobs() {
  const { jobs, loading, fetchJobs, getJobById } = useData();
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  return { jobs, isLoading: loading.jobs, refetch: () => fetchJobs(true), getJobById };
}

// Hook simplificado para posts sociais
export function useSocialPosts() {
  const { socialPosts, loading, fetchSocialPosts } = useData();
  
  useEffect(() => {
    fetchSocialPosts();
  }, [fetchSocialPosts]);
  
  return { posts: socialPosts, isLoading: loading.socialPosts, refetch: () => fetchSocialPosts(true) };
}

// Hook simplificado para follows
export function useFollows(userEmail) {
  const { follows, loading, fetchFollows, getFollowers, getFollowing } = useData();
  
  useEffect(() => {
    if (userEmail) {
      fetchFollows();
    }
  }, [userEmail, fetchFollows]);
  
  return { 
    followers: getFollowers(userEmail),
    following: getFollowing(userEmail),
    allFollows: follows,
    isLoading: loading.follows, 
    refetch: () => fetchFollows(true) 
  };
}