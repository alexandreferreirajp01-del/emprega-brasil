import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Briefcase, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FloatingSearchModal({ 
  isOpen, 
  onClose, 
  title,
  placeholder,
  items = [], 
  selectedValue,
  onSelect,
  icon: Icon = Search,
  showAllOption = true,
  allOptionLabel = "Todos"
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Bloquear scroll do body quando modal está aberto
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

  const filteredItems = items.filter(item => 
    item.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-[#0056ff]" />
                <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 text-lg rounded-xl border-slate-200 focus:border-[#0056ff]"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {showAllOption && (
                  <button
                    onClick={() => handleSelect('all')}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      selectedValue === 'all' 
                        ? 'bg-[#0056ff] text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{allOptionLabel}</span>
                    {selectedValue === 'all' && <Check className="w-5 h-5" />}
                  </button>
                )}
                
                {filteredItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      selectedValue === item 
                        ? 'bg-[#0056ff] text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{item}</span>
                    {selectedValue === item && <Check className="w-5 h-5" />}
                  </button>
                ))}

                {filteredItems.length === 0 && search && (
                  <div className="text-center py-8 text-slate-500">
                    <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>Nenhum resultado para "{search}"</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}