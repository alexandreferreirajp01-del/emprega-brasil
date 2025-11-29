import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingSearchKeyboard({ 
  isOpen, 
  onClose, 
  title,
  placeholder,
  options = [],
  onSelect,
  icon: Icon = Search
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option) => {
    onSelect(option);
    setSearch('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-[#0056ff]" />
                  <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-slate-200 focus:border-[#0056ff] text-base"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={() => setSearch('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-[60vh] p-2">
              {/* "Todas" option */}
              <button
                onClick={() => handleSelect('all')}
                className="w-full p-4 text-left rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center gap-3 border-b"
              >
                <div className="w-10 h-10 bg-[#0056ff]/10 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0056ff]" />
                </div>
                <span className="font-medium text-slate-800">Todas as opções</span>
              </button>

              {filteredOptions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum resultado encontrado</p>
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(option)}
                    className="w-full p-4 text-left rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="text-slate-700">{option}</span>
                  </button>
                ))
              )}
            </div>

            {/* Safe area padding for iOS */}
            <div className="h-8 bg-white" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}