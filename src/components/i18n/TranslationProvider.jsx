import React, { createContext, useContext, useState, useEffect } from 'react';

// Traduções disponíveis
const translations = {
  'pt-BR': {
    // Menu/Navigation
    'Início': 'Início',
    'Vagas': 'Vagas',
    'Social': 'Social',
    'Notícias': 'Notícias',
    'Perfil': 'Perfil',
    'Planos': 'Planos',
    'Admin': 'Admin',
    'Postar': 'Postar',
    'Entrar': 'Entrar',
    'Sair': 'Sair',
    'Grupos': 'Grupos',
    
    // Common
    'Buscar': 'Buscar',
    'Pesquisar': 'Pesquisar',
    'Carregar mais': 'Carregar mais',
    'Ver mais': 'Ver mais',
    'Ver todas': 'Ver todas',
    'Voltar': 'Voltar',
    'Salvar': 'Salvar',
    'Cancelar': 'Cancelar',
    'Confirmar': 'Confirmar',
    'Excluir': 'Excluir',
    'Editar': 'Editar',
    'Enviar': 'Enviar',
    'Publicar': 'Publicar',
    
    // Jobs
    'Vagas de Emprego': 'Vagas de Emprego',
    'Vagas disponíveis': 'Vagas disponíveis',
    'Candidatar-se': 'Candidatar-se',
    'Empresa': 'Empresa',
    'Cidade': 'Cidade',
    'Salário': 'Salário',
    'Tipo': 'Tipo',
    'Função': 'Função',
    'Descrição': 'Descrição',
    'visualizações': 'visualizações',
    
    // User
    'Meu Perfil': 'Meu Perfil',
    'Configurações': 'Configurações',
    'Premium': 'Premium',
    'Básico': 'Básico',
    
    // Notifications
    'Notificações': 'Notificações',
    'Nova vaga': 'Nova vaga',
    'Marcar todas': 'Marcar todas',
    'Nenhuma notificação': 'Nenhuma notificação',
  },
  'en': {
    'Início': 'Home',
    'Vagas': 'Jobs',
    'Social': 'Social',
    'Notícias': 'News',
    'Perfil': 'Profile',
    'Planos': 'Plans',
    'Admin': 'Admin',
    'Postar': 'Post',
    'Entrar': 'Login',
    'Sair': 'Logout',
    'Grupos': 'Groups',
    
    'Buscar': 'Search',
    'Pesquisar': 'Search',
    'Carregar mais': 'Load more',
    'Ver mais': 'See more',
    'Ver todas': 'See all',
    'Voltar': 'Back',
    'Salvar': 'Save',
    'Cancelar': 'Cancel',
    'Confirmar': 'Confirm',
    'Excluir': 'Delete',
    'Editar': 'Edit',
    'Enviar': 'Send',
    'Publicar': 'Publish',
    
    'Vagas de Emprego': 'Job Openings',
    'Vagas disponíveis': 'Available jobs',
    'Candidatar-se': 'Apply',
    'Empresa': 'Company',
    'Cidade': 'City',
    'Salário': 'Salary',
    'Tipo': 'Type',
    'Função': 'Function',
    'Descrição': 'Description',
    'visualizações': 'views',
    
    'Meu Perfil': 'My Profile',
    'Configurações': 'Settings',
    'Premium': 'Premium',
    'Básico': 'Basic',
    
    'Notificações': 'Notifications',
    'Nova vaga': 'New job',
    'Marcar todas': 'Mark all',
    'Nenhuma notificação': 'No notifications',
  },
  'es': {
    'Início': 'Inicio',
    'Vagas': 'Empleos',
    'Social': 'Social',
    'Notícias': 'Noticias',
    'Perfil': 'Perfil',
    'Planos': 'Planes',
    'Admin': 'Admin',
    'Postar': 'Publicar',
    'Entrar': 'Entrar',
    'Sair': 'Salir',
    'Grupos': 'Grupos',
    
    'Buscar': 'Buscar',
    'Pesquisar': 'Buscar',
    'Carregar mais': 'Cargar más',
    'Ver mais': 'Ver más',
    'Ver todas': 'Ver todos',
    'Voltar': 'Volver',
    'Salvar': 'Guardar',
    'Cancelar': 'Cancelar',
    'Confirmar': 'Confirmar',
    'Excluir': 'Eliminar',
    'Editar': 'Editar',
    'Enviar': 'Enviar',
    'Publicar': 'Publicar',
    
    'Vagas de Emprego': 'Ofertas de Empleo',
    'Vagas disponíveis': 'Empleos disponibles',
    'Candidatar-se': 'Aplicar',
    'Empresa': 'Empresa',
    'Cidade': 'Ciudad',
    'Salário': 'Salario',
    'Tipo': 'Tipo',
    'Função': 'Función',
    'Descrição': 'Descripción',
    'visualizações': 'vistas',
    
    'Meu Perfil': 'Mi Perfil',
    'Configurações': 'Configuraciones',
    'Premium': 'Premium',
    'Básico': 'Básico',
    
    'Notificações': 'Notificaciones',
    'Nova vaga': 'Nuevo empleo',
    'Marcar todas': 'Marcar todas',
    'Nenhuma notificação': 'Sin notificaciones',
  }
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState('pt-BR');

  useEffect(() => {
    // Verificar idioma salvo
    const savedLang = localStorage.getItem('vagas_app_language');
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
      return;
    }

    // Detectar idioma do navegador
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('en')) {
      setLanguage('en');
    } else if (browserLang.startsWith('es')) {
      setLanguage('es');
    } else {
      setLanguage('pt-BR');
    }
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('vagas_app_language', lang);
    }
  };

  const t = (key) => {
    if (language === 'pt-BR') return key;
    return translations[language]?.[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, t, availableLanguages: Object.keys(translations) }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    return { language: 'pt-BR', changeLanguage: () => {}, t: (k) => k, availableLanguages: ['pt-BR'] };
  }
  return context;
}

export default TranslationProvider;