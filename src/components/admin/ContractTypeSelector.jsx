import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Check, Briefcase, FileText, UserCheck, GraduationCap, Clock3, Code, Users, Globe } from "lucide-react";

const CONTRACT_TYPES = [
  { id: 'CLT', label: 'CLT', icon: Briefcase },
  { id: 'PJ', label: 'PJ', icon: FileText },
  { id: 'Autônomo', label: 'Autônomo', icon: UserCheck },
  { id: 'Estágio', label: 'Estágio', icon: GraduationCap },
  { id: 'Jovem Aprendiz', label: 'Jovem Aprendiz', icon: GraduationCap },
  { id: 'Temporário', label: 'Temporário', icon: Clock3 },
  { id: 'Freelancer', label: 'Freelancer', icon: Code },
  { id: 'Trainee', label: 'Trainee', icon: GraduationCap },
  { id: 'Banco de Talentos', label: 'Banco de Talentos', icon: Users },
  { id: 'Home Office', label: 'Home Office', icon: Globe },
  { id: 'PCD', label: 'PCD', icon: UserCheck },
];

export default function ContractTypeSelector({ selected = [], onChange }) {
  const toggleType = (typeId) => {
    const newSelected = selected.includes(typeId)
      ? selected.filter(t => t !== typeId)
      : [...selected, typeId];
    onChange(newSelected);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {CONTRACT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected.includes(type.id);
          return (
            <button
              key={type.id}
              onClick={() => toggleType(type.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isSelected 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                  {type.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
              </div>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-2">Selecionados:</p>
          <div className="flex flex-wrap gap-1">
            {selected.map(type => (
              <Badge key={type} className="bg-blue-600 text-white text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}