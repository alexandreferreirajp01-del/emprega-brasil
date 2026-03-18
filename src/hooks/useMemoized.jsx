import { useMemo, useCallback } from 'react';

/**
 * Memoized filtered/sorted lists for better performance
 */
export function useFilteredList(items, filterFn) {
  return useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.filter(filterFn);
  }, [items, filterFn]);
}

/**
 * Memoized mapped items
 */
export function useMappedList(items, mapFn) {
  return useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.map(mapFn);
  }, [items, mapFn]);
}

/**
 * Memoized pagination
 */
export function usePaginatedList(items, pageSize = 20, page = 1) {
  return useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      data: items.slice(startIndex, endIndex),
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
      currentPage: page,
    };
  }, [items, pageSize, page]);
}

/**
 * Memoized object equality check
 */
export function useMemoizedCallback(callback, deps) {
  return useCallback(callback, deps);
}