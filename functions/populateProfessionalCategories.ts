import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const CATEGORIES_DATA = [
  {
    category_name: "Administração e Escritório",
    category_order: 1,
    job_titles: ["Administrador", "Administrador de Empresas", "Administrador de Banco de Dados", "Analista Administrativo", "Assistente Administrativo", "Auxiliar Administrativo", "Office Boy", "Digitador", "Recepcionista", "Secretária", "Apontador de Obras", "Analista de Documentação", "Analista de Processos", "Analista de Projetos", "Analista de Controle Interno"],
    keywords: ["administração", "escritório", "gestão", "administrativo"],
  },
  {
    category_name: "Contabilidade e Finanças",
    category_order: 2,
    job_titles: ["Contador", "Analista Contábil", "Assistente Contábil", "Auxiliar Contábil", "Analista Financeiro", "Assistente Financeiro", "Auxiliar Financeiro", "Analista Fiscal", "Auxiliar Fiscal", "Analista de Crédito", "Consultor Financeiro", "Analista de Custos", "Assistente de Faturamento"],
    keywords: ["contabilidade", "finanças", "fiscal", "contábil"],
  },
  {
    category_name: "Recursos Humanos e Departamento Pessoal",
    category_order: 3,
    job_titles: ["Analista de RH", "Assistente de RH", "Auxiliar de RH", "Analista de Departamento Pessoal", "Recrutador", "Consultor de RH", "Instrutor de Treinamento", "Coordenador de Recursos Humanos", "Analista de Benefícios"],
    keywords: ["rh", "recursos humanos", "departamento pessoal", "recrutamento"],
  },
  {
    category_name: "Comercial e Vendas",
    category_order: 4,
    job_titles: ["Vendedor", "Vendedor Interno", "Vendedor Externo", "Consultor Comercial", "Representante Comercial", "Promotor de Vendas", "Promotor de Merchandising", "Atendente de Loja", "Atendente de Balcão", "Atendente de SAC", "Atendente de Farmácia", "Telemarketing", "Agente Comercial", "Consultor de Atendimento", "Balconista", "Supervisor Comercial", "Gerente Comercial"],
    keywords: ["vendas", "comercial", "atendimento", "loja"],
  },
  {
    category_name: "Logística e Suprimentos",
    category_order: 5,
    job_titles: ["Auxiliar de Almoxarifado", "Almoxarife", "Estoquista", "Conferente", "Assistente de Logística", "Analista de Logística", "Coordenador de Logística", "Motorista", "Motorista Carreteiro", "Motorista Escolar", "Motoboy", "Caminhoneiro", "Entregador", "Operador de Empilhadeira", "Ajudante de Carga e Descarga", "Carregador", "Auxiliar de Depósito"],
    keywords: ["logística", "estoque", "transporte", "entrega"],
  },
  {
    category_name: "Atendimento e Hospitalidade",
    category_order: 6,
    job_titles: ["Garçom", "Cozinheiro", "Copeira", "Chapeiro", "Bartender", "Atendente de Restaurante", "Atendente de Padaria", "Atendente de Cafeteria", "Camareira", "Recepcionista de Hotel", "Hostess", "Chefe de Cozinha"],
    keywords: ["hospitalidade", "atendimento", "restaurante", "hotel"],
  },
  {
    category_name: "Tecnologia da Informação (TI)",
    category_order: 7,
    job_titles: ["Desenvolvedor Front-end", "Desenvolvedor Back-end", "Desenvolvedor Full Stack", "Desenvolvedor Mobile", "Programador", "Analista de Sistemas", "Analista de Dados", "Analista de Segurança da Informação", "Administrador de Redes", "Suporte Técnico", "Técnico em Informática", "Web Designer", "Designer UX/UI", "Arquiteto de Software"],
    keywords: ["ti", "tecnologia", "programação", "desenvolvedor", "sistemas"],
  },
  {
    category_name: "Marketing e Comunicação",
    category_order: 8,
    job_titles: ["Analista de Marketing", "Assistente de Marketing", "Social Media", "Gestor de Tráfego", "Produtor de Conteúdo", "Designer Gráfico", "Editor de Vídeo", "Fotógrafo", "Analista de Comunicação", "Redator", "Analista de SEO", "Influenciador"],
    keywords: ["marketing", "comunicação", "mídias sociais", "conteúdo"],
  },
  {
    category_name: "Engenharia e Técnico Industrial",
    category_order: 9,
    job_titles: ["Engenheiro Civil", "Engenheiro Elétrico", "Engenheiro Mecânico", "Engenheiro de Produção", "Engenheiro Ambiental", "Engenheiro Agrônomo", "Engenheiro de Software", "Técnico Eletricista", "Técnico Mecânico", "Técnico em Automação", "Eletricista Industrial", "Mecânico Industrial", "Operador de Máquinas", "Operador de CNC", "Torneiro Mecânico", "Fresador", "Técnico em Manutenção"],
    keywords: ["engenharia", "técnico", "industrial", "manutenção"],
  },
  {
    category_name: "Construção Civil",
    category_order: 10,
    job_titles: ["Pedreiro", "Servente de Obras", "Mestre de Obras", "Encarregado de Obras", "Carpinteiro", "Serralheiro", "Pintor", "Encanador", "Eletricista Predial", "Marceneiro", "Montador", "Instalador de Ar-condicionado"],
    keywords: ["construção civil", "obras", "pedreiro", "construtor"],
  },
  {
    category_name: "Saúde",
    category_order: 11,
    job_titles: ["Enfermeiro", "Técnico em Enfermagem", "Médico", "Fisioterapeuta", "Farmacêutico", "Dentista", "Psicólogo", "Nutricionista", "Técnico em Radiologia", "Esteticista", "Massoterapeuta", "Podólogo", "Auxiliar de Saúde"],
    keywords: ["saúde", "enfermagem", "médico", "hospitalar"],
  },
  {
    category_name: "Educação e Treinamento",
    category_order: 12,
    job_titles: ["Professor", "Pedagogo", "Monitor Escolar", "Monitor de Alunos", "Instrutor de Cursos", "Orientador Educacional", "Coordenador Pedagógico", "Estagiário de Pedagogia"],
    keywords: ["educação", "ensino", "professor", "pedagogia"],
  },
  {
    category_name: "Segurança Patrimonial",
    category_order: 13,
    job_titles: ["Vigilante", "Vigia", "Porteiro", "Controlador de Acesso", "Segurança Patrimonial", "Bombeiro Civil"],
    keywords: ["segurança", "vigilância", "portaria"],
  },
  {
    category_name: "Serviços Gerais e Manutenção",
    category_order: 14,
    job_titles: ["Auxiliar de Serviços Gerais", "Auxiliar de Limpeza", "Faxineiro", "Zelador", "Jardineiro", "Auxiliar de Manutenção", "Técnico de Manutenção", "Lavador de Carros", "Caseiro", "Auxiliar de Jardinagem"],
    keywords: ["serviços gerais", "limpeza", "manutenção", "zelador"],
  },
  {
    category_name: "Área Jurídica",
    category_order: 15,
    job_titles: ["Advogado", "Assistente Jurídico", "Analista Jurídico", "Estagiário de Direito"],
    keywords: ["jurídico", "direito", "advogado", "legal"],
  },
  {
    category_name: "Agropecuária e Rural",
    category_order: 16,
    job_titles: ["Agrônomo", "Técnico Agrícola", "Vaqueiro", "Trabalhador Rural", "Jardineiro", "Florista"],
    keywords: ["agropecuária", "rural", "agrícola", "campo"],
  },
  {
    category_name: "Criatividade, Artes e Mídia",
    category_order: 17,
    job_titles: ["Designer", "Artesão", "Ator", "Cantor", "Criador de Conteúdo", "Editor de Vídeo", "Fotógrafo", "Designer de Moda", "Designer de Produto"],
    keywords: ["artes", "criatividade", "designer", "mídia"],
  },
  {
    category_name: "Transporte e Mobilidade",
    category_order: 18,
    job_titles: ["Motorista", "Motorista Carreteiro", "Motorista de Caminhão", "Motorista de Aplicativo", "Motorista Escolar", "Motoboy", "Entregador"],
    keywords: ["transporte", "motorista", "entrega", "mobilidade"],
  },
  {
    category_name: "Telecomunicações e Internet",
    category_order: 19,
    job_titles: ["Instalador de Internet", "Técnico de Telecom", "Antenista", "Técnico de Redes", "Instalador de Fibra Óptica"],
    keywords: ["telecomunicações", "internet", "redes", "telecom"],
  },
  {
    category_name: "Indústria e Produção",
    category_order: 20,
    job_titles: ["Auxiliar de Produção", "Operador de Produção", "Operador de Máquina", "Operador de Usinagem", "Fresador", "Torneiro Mecânico", "Montador Industrial", "Controlador Qualidade"],
    keywords: ["indústria", "produção", "operador", "fábrica"],
  },
  {
    category_name: "Alimentação e Gastronomia",
    category_order: 21,
    job_titles: ["Cozinheiro", "Auxiliar de Cozinha", "Chapeiro", "Padeiro", "Confeiteiro", "Chefe de Cozinha", "Atendente de Padaria", "Açougueiro", "Garçom"],
    keywords: ["gastronomia", "alimentação", "cozinha", "culinária"],
  },
  {
    category_name: "Beleza e Estética",
    category_order: 22,
    job_titles: ["Cabeleireiro", "Barbeiro", "Maquiador", "Manicure", "Esteticista", "Massoterapeuta"],
    keywords: ["beleza", "estética", "cabeleireiro", "salão"],
  },
  {
    category_name: "Hotelaria e Turismo",
    category_order: 23,
    job_titles: ["Recepcionista de Hotel", "Camareira", "Guia Turístico", "Concierge", "Atendente de Hospedagem", "Organizador de Eventos"],
    keywords: ["hotelaria", "turismo", "hotel", "hospedagem"],
  },
  {
    category_name: "Comércio e Varejo",
    category_order: 24,
    job_titles: ["Caixa", "Balconista", "Repositor", "Atendente de Loja", "Gerente de Loja", "Supervisor de Loja", "Estoquista", "Visual Merchandising"],
    keywords: ["varejo", "comércio", "loja", "caixa"],
  },
  {
    category_name: "Setor Público e Governamental",
    category_order: 25,
    job_titles: ["Agente Administrativo", "Professor da Rede Pública", "Técnico Público", "Assistente Administrativo Público", "Fiscal", "Atendente Público"],
    keywords: ["público", "governamental", "concurso", "servidor"],
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user || (user.email !== 'alexandreferreirajp01@gmail.com' && user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Criar todas as categorias
    const results = [];
    for (const category of CATEGORIES_DATA) {
      const result = await base44.asServiceRole.entities.ProfessionalCategory.create(category);
      results.push(result);
    }

    return Response.json({ 
      success: true, 
      message: `${results.length} categorias criadas com sucesso!`,
      categories: results
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});