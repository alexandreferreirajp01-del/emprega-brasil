import React, { memo, useMemo } from 'react';
import { usePaginatedList } from '@/hooks/useMemoized';

/**
 * Optimized list renderer with memoization and pagination
 * Prevents unnecessary re-renders of list items
 */
const OptimizedListRenderer = memo(({
  items = [],
  renderItem,
  pageSize = 20,
  currentPage = 1,
  className = '',
  loadingComponent = null,
  emptyComponent = null,
  keyExtractor = (item, idx) => idx,
}) => {
  const { data, totalPages } = usePaginatedList(items, pageSize, currentPage);

  const memoizedItems = useMemo(
    () => data.map((item, idx) => (
      <React.Fragment key={keyExtractor(item, idx)}>
        {renderItem(item, idx)}
      </React.Fragment>
    )),
    [data, renderItem, keyExtractor]
  );

  if (items.length === 0) {
    return emptyComponent || <div className="text-center py-8 text-gray-500">Nenhum item encontrado</div>;
  }

  return (
    <div className={className}>
      {memoizedItems}
    </div>
  );
});

OptimizedListRenderer.displayName = 'OptimizedListRenderer';

export default OptimizedListRenderer;