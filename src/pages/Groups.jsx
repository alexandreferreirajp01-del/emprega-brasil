import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, AlertCircle, ExternalLink } from "lucide-react";


const GROUPS = [
  {
    id: 1,
    name: "Grupo Vagas Express Paraíba 01",
    type: "whatsapp",
    link: "https://chat.whatsapp.com/Du2d06epAdYDuMesmEqxgO",
    description: "Vagas de emprego da Paraíba"
  },
  {
    id: 2,
    name: "Grupo Vagas Express Paraíba 02",
    type: "whatsapp",
    link: "https://chat.whatsapp.com/E6XkQpXlzwx4VXu9cdKri9",
    description: "Vagas de emprego da Paraíba"
  },
  {
    id: 3,
    name: "Grupo Vagas Express Paraíba 03",
    type: "whatsapp",
    link: "https://chat.whatsapp.com/IF8TgMaS9SnFo6BaEnWnaW",
    description: "Vagas de emprego da Paraíba"
  },
  {
    id: 4,
    name: "Grupo Vagas Express Paraíba 04",
    type: "whatsapp",
    link: "https://chat.whatsapp.com/Lf7D58fdMoO9E9f2fscEq0",
    description: "Vagas de emprego da Paraíba"
  },
  {
    id: 5,
    name: "Grupo Vagas Express Paraíba 05",
    type: "whatsapp",
    link: "https://chat.whatsapp.com/H4ndslzhK8wH5jFuSiIUIJ",
    description: "Vagas de emprego da Paraíba"
  },
  {
    id: 6,
    name: "Fórum de Discussões",
    type: "whatsapp",
    link: "https://chat.whatsapp.com/CZlRimefW7q7enneeJuqyI",
    description: "Discussões e dúvidas sobre emprego"
  },
  {
    id: 7,
    name: "Canal no WhatsApp",
    type: "whatsapp_channel",
    link: "https://whatsapp.com/channel/0029Vb6YmMcGk1FqqIjJ312z",
    description: "Canal oficial de vagas"
  },
  {
    id: 8,
    name: "Grupo no Telegram",
    type: "telegram",
    link: "https://t.me/vagasexpressparaiba",
    description: "Vagas de emprego no Telegram"
  },
  {
    id: 9,
    name: "Grupo no Facebook",
    type: "facebook",
    link: "https://www.facebook.com/groups/811215621908198/?ref=share&mibextid=NSMWBT",
    description: "Comunidade no Facebook"
  }
];

export default function Groups() {
  const getIcon = (type) => {
    switch(type) {
      case 'telegram':
        return <Send className="w-8 h-8" />;
      case 'facebook':
        return <Users className="w-8 h-8" />;
      default:
        return <MessageCircle className="w-8 h-8" />;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'telegram':
        return 'bg-[#0088cc]';
      case 'facebook':
        return 'bg-[#1877f2]';
      case 'whatsapp_channel':
        return 'bg-[#25D366]';
      default:
        return 'bg-[#25D366]';
    }
  };

  const getColorLight = (type) => {
    switch(type) {
      case 'telegram':
        return 'bg-[#0088cc]/10 text-[#0088cc]';
      case 'facebook':
        return 'bg-[#1877f2]/10 text-[#1877f2]';
      default:
        return 'bg-[#25D366]/10 text-[#25D366]';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Grupos de Vagas</h1>
          <p className="text-white/70">Entre em nossos grupos exclusivos para receber vagas diariamente</p>
        </div>
      </div>

      {/* Warning */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-6">
        <div>
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">Atenção aos Limites dos Grupos</h3>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Cada grupo do WhatsApp possui uma capacidade máxima de <strong>1.025 membros</strong>. 
                    Caso não consiga entrar em um grupo por estar lotado, não se preocupe! 
                    Tente entrar no próximo grupo disponível. Todos os grupos recebem as mesmas vagas diariamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GROUPS.map((group) => (
            <div key={group.id}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group rounded-2xl">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Icon Side */}
                    <div className={`${getColor(group.type)} p-6 flex items-center justify-center text-white`}>
                      {getIcon(group.type)}
                    </div>
                    
                    {/* Content Side */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-[#0056ff] transition-colors">
                            {group.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">{group.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <Badge className={`${getColorLight(group.type)} border-0 rounded-full`}>
                          {group.type === 'telegram' ? 'Telegram' : 
                           group.type === 'facebook' ? 'Facebook' :
                           group.type === 'whatsapp_channel' ? 'Canal' : 'WhatsApp'}
                        </Badge>
                        
                        <a href={group.link} target="_blank" rel="noopener noreferrer">
                          <Button 
                            size="sm" 
                            className={`${getColor(group.type)} hover:opacity-90 rounded-full text-white`}
                          >
                            Entrar
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}