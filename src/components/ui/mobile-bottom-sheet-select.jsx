import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileBottomSheetSelect = React.memo(({
  value,
  onChange,
  options = [],
  placeholder = 'Selecionar...',
  disabled = false,
  className = '',
  label = null,
  searchable = false,
  multiple = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedLabel = useCallback(() => {
    if (multiple && Array.isArray(value)) {
      return value.length === 0 ? placeholder : `${value.length} selecionado(s)`;
    }
    return options.find(opt => opt.value === value)?.label || placeholder;
  }, [value, options, placeholder, multiple]);

  const filteredOptions = useCallback(() => {
    if (!searchable || !searchTerm.trim()) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  const handleSelect = useCallback((optionValue) => {
    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  }, [value, onChange, multiple]);

  return (
    <div className={cn('relative w-full', className)}>
      {label && <label className="block text-sm font-medium mb-2 dark:text-white">{label}</label>}

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 border rounded-lg transition',
          'min-h-[44px] touch-feedback',
          'dark:bg-slate-700 dark:border-slate-600 dark:text-white',
          disabled
            ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        )}
      >
        <span className={selectedLabel() === placeholder ? 'text-gray-400 dark:text-slate-400' : 'dark:text-white'}>
          {selectedLabel()}
        </span>
        <ChevronDown className={cn('w-4 h-4 transition', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-50',
                'max-h-[70vh] overflow-hidden flex flex-col',
                'safe-area-bottom'
              )}
              style={{ paddingBottom: 'var(--sab, env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Handle Bar */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">{label || 'Selecionar'}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full touch-feedback"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              {searchable && (
                <div className="px-4 py-3 border-b dark:border-slate-700">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg',
                      'min-h-[44px]',
                      'dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                    )}
                  />
                </div>
              )}

              {/* Options List */}
              <div className="overflow-y-auto flex-1">
                {filteredOptions().length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-slate-400">
                    Nenhuma opção encontrada
                  </div>
                ) : (
                  filteredOptions().map((option) => {
                    const isSelected = multiple
                      ? Array.isArray(value) && value.includes(option.value)
                      : value === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full px-4 py-3 text-left border-b transition',
                          'min-h-[44px] touch-feedback',
                          'dark:border-slate-700',
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {multiple && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-5 h-5 rounded cursor-pointer"
                            />
                          )}
                          {option.label}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Close Button */}
              <div className="p-4 border-t dark:border-slate-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={cn(
                    'w-full py-3 rounded-lg font-medium transition',
                    'min-h-[44px] touch-feedback',
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

MobileBottomSheetSelect.displayName = 'MobileBottomSheetSelect';

export default MobileBottomSheetSelect;