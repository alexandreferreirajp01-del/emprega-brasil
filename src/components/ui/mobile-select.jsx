import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function MobileSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecionar...',
  disabled = false,
  className = '',
  label = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      
      <button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg transition ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed opacity-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <span className={selectedLabel === placeholder ? 'text-gray-400' : 'text-gray-900'}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} />
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
              className="fixed inset-0 z-40"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 max-h-[70vh] overflow-hidden flex flex-col"
            >
              {/* Handle Bar */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Options List */}
              <div className="overflow-y-auto flex-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left border-b transition ${
                      value === option.value
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Close Button */}
              <div className="p-4 border-t">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="w-full rounded-lg"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}