import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import React from "react";

// Cidades com nomes duplicados/ambíguos que NÃO devem preencher estado automaticamente
const AMBIGUOUS_CITIES = [
  'Manaíra', 'Santa Cruz', 'Santa Rita', 'Boa Vista', 'Conceição', 
  'Santana', 'São João', 'São José', 'São Miguel', 'Lagoa', 'Palmeira',
  'Nova Olinda', 'Esperança', 'Diamante', 'Campo Grande', 'Santa Maria'
];

export function useCityStateAutocomplete() {
  // Buscar todas as cidades do banco
  const { data: allCities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list('name', 6000),
    staleTime: 60000,
  });

  // Estados ordenados por região
  const availableStates = React.useMemo(() => {
    const states = new Set(allCities.map(c => c.state));
    const statesArray = Array.from(states);
    
    const regionalOrder = ['PB', 'PE', 'RN', 'AL', 'CE', 'SE', 'BA', 'PI', 'MA'];
    const orderedStates = [];
    
    regionalOrder.forEach(state => {
      if (statesArray.includes(state)) {
        orderedStates.push(state);
      }
    });
    
    statesArray.filter(s => !regionalOrder.includes(s)).sort().forEach(state => {
      orderedStates.push(state);
    });
    
    return orderedStates;
  }, [allCities]);

  // Cidades disponíveis baseadas no estado selecionado
  const getCitiesForState = React.useCallback((state) => {
    if (!state) {
      return allCities.map(c => c.name).sort();
    }
    return allCities.filter(c => c.state === state).map(c => c.name).sort();
  }, [allCities]);

  // Auto-completar estado baseado na cidade
  const getStateFromCity = React.useCallback((cityName) => {
    if (!cityName || AMBIGUOUS_CITIES.includes(cityName)) {
      return null; // Não preencher para cidades ambíguas
    }
    
    const citiesWithName = allCities.filter(c => c.name === cityName);
    
    // Se há apenas 1 cidade com esse nome, retornar o estado
    if (citiesWithName.length === 1) {
      return citiesWithName[0].state;
    }
    
    // Se há múltiplas, não preencher (ambíguo)
    return null;
  }, [allCities]);

  return {
    allCities,
    availableStates,
    getCitiesForState,
    getStateFromCity
  };
}