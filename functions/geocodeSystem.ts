import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Coordenadas fallback para capitais brasileiras
const CAPITAL_COORDS = {
  'AC': { lat: -9.97499, lon: -67.8243, nome: 'Rio Branco' },
  'AL': { lat: -9.66599, lon: -35.7350, nome: 'Maceió' },
  'AP': { lat: 0.03483, lon: -51.0694, nome: 'Macapá' },
  'AM': { lat: -3.11866, lon: -60.0212, nome: 'Manaus' },
  'BA': { lat: -12.9714, lon: -38.5014, nome: 'Salvador' },
  'CE': { lat: -3.71722, lon: -38.5433, nome: 'Fortaleza' },
  'DF': { lat: -15.7939, lon: -47.8828, nome: 'Brasília' },
  'ES': { lat: -20.3155, lon: -40.3128, nome: 'Vitória' },
  'GO': { lat: -16.6869, lon: -49.2648, nome: 'Goiânia' },
  'MA': { lat: -2.53073, lon: -44.3068, nome: 'São Luís' },
  'MT': { lat: -15.6014, lon: -56.0979, nome: 'Cuiabá' },
  'MS': { lat: -20.4486, lon: -54.6295, nome: 'Campo Grande' },
  'MG': { lat: -19.9167, lon: -43.9345, nome: 'Belo Horizonte' },
  'PA': { lat: -1.45583, lon: -48.5044, nome: 'Belém' },
  'PB': { lat: -7.11509, lon: -34.8641, nome: 'João Pessoa' },
  'PR': { lat: -25.4195, lon: -49.2646, nome: 'Curitiba' },
  'PE': { lat: -8.04666, lon: -34.8771, nome: 'Recife' },
  'PI': { lat: -5.08917, lon: -42.8016, nome: 'Teresina' },
  'RJ': { lat: -22.9068, lon: -43.1729, nome: 'Rio de Janeiro' },
  'RN': { lat: -5.79357, lon: -35.1986, nome: 'Natal' },
  'RS': { lat: -30.0346, lon: -51.2177, nome: 'Porto Alegre' },
  'RO': { lat: -8.76077, lon: -63.9004, nome: 'Porto Velho' },
  'RR': { lat: 2.82384, lon: -60.6753, nome: 'Boa Vista' },
  'SC': { lat: -27.5954, lon: -48.5480, nome: 'Florianópolis' },
  'SP': { lat: -23.5505, lon: -46.6333, nome: 'São Paulo' },
  'SE': { lat: -10.9472, lon: -37.0731, nome: 'Aracaju' },
  'TO': { lat: -10.1753, lon: -48.2982, nome: 'Palmas' }
};

// Normalizar texto
function normalizar(texto) {
  if (!texto) return '';
  return texto
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

// Geocode via Nominatim
async function geocodeNominatim(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EmpregaBrasil/1.0' }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
  } catch (error) {
    console.error('Erro Nominatim:', error.message);
  }
  return null;
}

// Buscar no cache
async function buscarCache(base44, query) {
  try {
    const caches = await base44.asServiceRole.entities.LocationCache.filter({ query }, '-created_date', 1);
    if (caches.length > 0) {
      // Incrementar contador de uso
      await base44.asServiceRole.entities.LocationCache.update(caches[0].id, {
        uso_count: (caches[0].uso_count || 0) + 1
      });
      return caches[0];
    }
  } catch (e) {
    console.error('Erro ao buscar cache:', e.message);
  }
  return null;
}

// Salvar no cache
async function salvarCache(base44, data) {
  try {
    await base44.asServiceRole.entities.LocationCache.create(data);
  } catch (e) {
    console.error('Erro ao salvar cache:', e.message);
  }
}

// Geocode principal
async function geocodeJob(base44, job) {
  const resultado = {
    latitude: null,
    longitude: null,
    nivel_localizacao: 'pendente',
    fonte_geocode: null,
    geocode_status: 'pendente',
    geocode_query: null,
    geocode_score: 0,
    is_remote: false,
    exibir_no_mapa: false,
    motivo_nao_exibir: null,
    cidade_normalizada: null,
    uf_normalizado: null,
    bairro_normalizado: null
  };

  // Detectar remoto
  const tituloLower = (job.title || '').toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const tipoLower = (job.job_type || '').toLowerCase();
  
  if (tipoLower.includes('home office') || 
      tipoLower.includes('remot') ||
      tituloLower.includes('home office') ||
      tituloLower.includes('remot') ||
      descLower.includes('trabalho remoto') ||
      descLower.includes('100% remoto')) {
    resultado.is_remote = true;
    resultado.nivel_localizacao = 'remoto';
    resultado.geocode_status = 'ok';
    resultado.exibir_no_mapa = false;
    resultado.motivo_nao_exibir = 'Vaga remota';
    return resultado;
  }

  // Normalizar dados
  const cidade = job.city ? normalizar(job.city) : null;
  const uf = job.state ? normalizar(job.state) : null;
  const bairro = job.neighborhood ? normalizar(job.neighborhood) : null;

  resultado.cidade_normalizada = cidade;
  resultado.uf_normalizado = uf;
  resultado.bairro_normalizado = bairro;

  // Verificar mínimo necessário
  if (!cidade || !uf) {
    resultado.geocode_status = 'pendente';
    resultado.motivo_nao_exibir = 'Falta cidade ou UF';
    return resultado;
  }

  // Montar queries
  let queries = [];
  if (bairro) {
    queries.push(`${bairro}, ${cidade}, ${uf}, Brasil`);
  }
  queries.push(`${cidade}, ${uf}, Brasil`);

  // Tentar geocode
  for (const query of queries) {
    resultado.geocode_query = query;

    // Buscar no cache
    const cached = await buscarCache(base44, query);
    if (cached) {
      resultado.latitude = cached.latitude;
      resultado.longitude = cached.longitude;
      resultado.nivel_localizacao = cached.nivel_precisao;
      resultado.fonte_geocode = 'cache';
      resultado.geocode_status = 'ok';
      resultado.geocode_score = cached.score || 80;
      resultado.exibir_no_mapa = true;
      return resultado;
    }

    // Chamar Nominatim
    await new Promise(r => setTimeout(r, 1000)); // Rate limit
    const coords = await geocodeNominatim(query);
    
    if (coords) {
      const nivel = bairro && query.includes(bairro) ? 'bairro' : 'cidade';
      resultado.latitude = coords.lat;
      resultado.longitude = coords.lon;
      resultado.nivel_localizacao = nivel;
      resultado.fonte_geocode = 'auto';
      resultado.geocode_status = 'ok';
      resultado.geocode_score = 85;
      resultado.exibir_no_mapa = true;

      // Salvar no cache
      await salvarCache(base44, {
        query,
        cidade,
        uf,
        bairro: bairro || null,
        latitude: coords.lat,
        longitude: coords.lon,
        nivel_precisao: nivel,
        fonte: 'Nominatim',
        score: 85,
        uso_count: 1
      });

      return resultado;
    }
  }

  // Fallback: centro da capital do estado
  if (uf && CAPITAL_COORDS[uf]) {
    const capital = CAPITAL_COORDS[uf];
    resultado.latitude = capital.lat;
    resultado.longitude = capital.lon;
    resultado.nivel_localizacao = 'uf';
    resultado.fonte_geocode = 'estado_centro';
    resultado.geocode_status = 'ok';
    resultado.geocode_score = 40;
    resultado.exibir_no_mapa = true;
    resultado.geocode_query = `Capital de ${uf}`;
    return resultado;
  }

  // Falhou
  resultado.geocode_status = 'falhou';
  resultado.motivo_nao_exibir = 'Não foi possível geocodificar';
  return resultado;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { action, jobId, batchSize } = await req.json();

    // Processar vaga única
    if (action === 'single' && jobId) {
      const job = await base44.asServiceRole.entities.Job.filter({ id: jobId }, '-created_date', 1);
      if (!job || job.length === 0) {
        return Response.json({ error: 'Vaga não encontrada' }, { status: 404 });
      }

      const resultado = await geocodeJob(base44, job[0]);
      await base44.asServiceRole.entities.Job.update(jobId, {
        ...resultado,
        ultima_atualizacao_localizacao: new Date().toISOString()
      });

      return Response.json({ success: true, resultado });
    }

    // Processar em lote
    if (action === 'batch') {
      const limit = batchSize || 50;
      const jobs = await base44.asServiceRole.entities.Job.filter(
        { 
          status: 'ativa',
          geocode_status: { $in: ['pendente', 'falhou', null] }
        },
        '-created_date',
        limit
      );

      let processados = 0;
      let sucessos = 0;
      let falhas = 0;

      for (const job of jobs) {
        try {
          const resultado = await geocodeJob(base44, job);
          await base44.asServiceRole.entities.Job.update(job.id, {
            ...resultado,
            ultima_atualizacao_localizacao: new Date().toISOString()
          });
          
          if (resultado.geocode_status === 'ok') {
            sucessos++;
          } else {
            falhas++;
          }
          processados++;
        } catch (error) {
          console.error(`Erro ao processar vaga ${job.id}:`, error.message);
          falhas++;
        }
      }

      return Response.json({
        success: true,
        processados,
        sucessos,
        falhas,
        total_encontrado: jobs.length
      });
    }

    // Estatísticas
    if (action === 'stats') {
      const allJobs = await base44.asServiceRole.entities.Job.filter({ status: 'ativa' }, '-created_date', 10000);
      
      const stats = {
        total: allJobs.length,
        com_coords: allJobs.filter(j => j.latitude && j.longitude).length,
        sem_coords: allJobs.filter(j => !j.latitude || !j.longitude).length,
        remotas: allJobs.filter(j => j.is_remote).length,
        exibindo_mapa: allJobs.filter(j => j.exibir_no_mapa).length,
        pendentes: allJobs.filter(j => j.geocode_status === 'pendente' || !j.geocode_status).length,
        falhas: allJobs.filter(j => j.geocode_status === 'falhou').length,
        sem_cidade: allJobs.filter(j => !j.city).length,
        sem_uf: allJobs.filter(j => !j.state).length
      };

      return Response.json({ success: true, stats });
    }

    return Response.json({ error: 'Ação não especificada' }, { status: 400 });

  } catch (error) {
    console.error('Erro no geocodeSystem:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});