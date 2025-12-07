/**
 * Sistema de Sincronização Global de Filtros
 * Conecta o Gerenciador de Filtros com todos os consumidores do app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Context para compartilhar filtros globalmente
const FilterContext = createContext(null);

/**
 * Provider para sincronização de filtros em todo o app
 */
export function FilterSyncProvider({ children }) {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Buscar categorias profissionais
  const { data: categories = [], refetch } = useQuery({
    queryKey: ['professional-categories', lastUpdate],
    queryFn: async () => {
      const cats = await base44.entities.ProfessionalCategory.list('category_order', 100);
      return cats.filter(c => c.is_active !== false);
    },
    staleTime: 10000, // 10 segundos
  });

  // Extrair filtros estruturados
  const filters = React.useMemo(() => {
    const categoryNames = [...new Set(
      categories
        .filter(c => c.category_name)
        .map(c => c.category_name)
    )].sort();

    const jobFunctions = [...new Set(
      categories
        .flatMap(c => c.job_titles || [])
        .filter(Boolean)
    )].sort();

    return {
      categories: categoryNames,
      jobFunctions: jobFunctions,
      jobTypes: ['CLT', 'PJ', 'Autônomo', 'Estágio', 'Jovem Aprendiz', 'Temporário', 'Freelancer', 'Trainee', 'Banco de Talentos'],
      cities: ['João Pessoa', 'Campina Grande', 'Bayeux', 'Cabedelo', 'Santa Rita', 'Patos', 'Guarabira', 'Cajazeiras', 'Sousa', 'Pombal', 'Conde'],
      workModels: ['Presencial', 'Híbrido', 'Home Office', 'Remoto'],
      seniority: ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista'],
    };
  }, [categories]);

  // Função para forçar atualização (chamada pelo Gerenciador)
  const syncFilters = async () => {
    await queryClient.invalidateQueries({ queryKey: ['professional-categories'] });
    await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    setLastUpdate(Date.now());
    await refetch();
  };

  return (
    <FilterContext.Provider value={{ filters, categories, syncFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * Hook para consumir filtros em qualquer componente
 */
export function useGlobalFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useGlobalFilters deve ser usado dentro de FilterSyncProvider');
  }
  return context;
}