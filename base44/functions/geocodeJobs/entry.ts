import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Coordenadas aproximadas de capitais e principais cidades do Brasil
const CITY_COORDS = {
  'Acre': { 'Rio Branco': [-9.9754, -67.8249] },
  'Alagoas': { 'Maceió': [-9.6662, -35.7350] },
  'Amapá': { 'Macapá': [0.0349, -51.0694] },
  'Amazonas': { 'Manaus': [-3.1190, -60.0217] },
  'Bahia': { 'Salvador': [-12.9714, -38.5014], 'Feira de Santana': [-12.2664, -38.9663] },
  'Ceará': { 'Fortaleza': [-3.7172, -38.5433], 'Juazeiro do Norte': [-7.2131, -39.3151] },
  'Distrito Federal': { 'Brasília': [-15.8267, -47.9218] },
  'Espírito Santo': { 'Vitória': [-20.3155, -40.3128], 'Vila Velha': [-20.3497, -40.2925] },
  'Goiás': { 'Goiânia': [-16.6869, -49.2648] },
  'Maranhão': { 'São Luís': [-2.5387, -44.2825] },
  'Mato Grosso': { 'Cuiabá': [-15.6014, -56.0979] },
  'Mato Grosso do Sul': { 'Campo Grande': [-20.4697, -54.6201] },
  'Minas Gerais': { 'Belo Horizonte': [-19.9167, -43.9345], 'Uberlândia': [-18.9186, -48.2772], 'Contagem': [-19.9320, -44.0537] },
  'Pará': { 'Belém': [-1.4558, -48.5039] },
  'Paraíba': { 'João Pessoa': [-7.1195, -34.8450], 'Campina Grande': [-7.2306, -35.8811] },
  'Paraná': { 'Curitiba': [-25.4284, -49.2733], 'Londrina': [-23.3045, -51.1696], 'Maringá': [-23.4205, -51.9330] },
  'Pernambuco': { 'Recife': [-8.0476, -34.8770], 'Jaboatão dos Guararapes': [-8.1130, -35.0145] },
  'Piauí': { 'Teresina': [-5.0892, -42.8016] },
  'Rio de Janeiro': { 'Rio de Janeiro': [-22.9068, -43.1729], 'Niterói': [-22.8833, -43.1036], 'Duque de Caxias': [-22.7858, -43.3054] },
  'Rio Grande do Norte': { 'Natal': [-5.7945, -35.2110] },
  'Rio Grande do Sul': { 'Porto Alegre': [-30.0346, -51.2177], 'Caxias do Sul': [-29.1634, -51.1797], 'Pelotas': [-31.7654, -52.3376] },
  'Rondônia': { 'Porto Velho': [-8.7619, -63.9039] },
  'Roraima': { 'Boa Vista': [2.8235, -60.6758] },
  'Santa Catarina': { 'Florianópolis': [-27.5954, -48.5480], 'Joinville': [-26.3045, -48.8487], 'Blumenau': [-26.9194, -49.0661] },
  'São Paulo': { 'São Paulo': [-23.5505, -46.6333], 'Campinas': [-22.9099, -47.0626], 'São Bernardo do Campo': [-23.6914, -46.5646], 'Santos': [-23.9618, -46.3322], 'Guarulhos': [-23.4538, -46.5333], 'Osasco': [-23.5329, -46.7919], 'Ribeirão Preto': [-21.1704, -47.8103], 'Sorocaba': [-23.5015, -47.4526] },
  'Sergipe': { 'Aracaju': [-10.9472, -37.0731] },
  'Tocantins': { 'Palmas': [-10.1840, -48.3336] },
  'PB': { 'João Pessoa': [-7.1195, -34.8450], 'Campina Grande': [-7.2306, -35.8811] },
  'SP': { 'São Paulo': [-23.5505, -46.6333], 'Campinas': [-22.9099, -47.0626], 'Jundiaí': [-23.1864, -46.8842], 'Barueri': [-23.5106, -46.8767], 'São José dos Campos': [-23.1791, -45.8872] }
};

// Coordenadas de centro dos estados (fallback)
const STATE_CENTERS = {
  'AC': [-9.0238, -70.8120], 'AL': [-9.5713, -36.7820], 'AP': [1.4118, -51.7738],
  'AM': [-3.4168, -65.8561], 'BA': [-12.5797, -41.7007], 'CE': [-5.4984, -39.3206],
  'DF': [-15.7998, -47.8645], 'ES': [-19.1834, -40.3089], 'GO': [-15.8270, -49.8362],
  'MA': [-4.9609, -45.2744], 'MT': [-12.6819, -56.9211], 'MS': [-20.7722, -54.7852],
  'MG': [-18.5122, -44.5550], 'PA': [-1.9981, -54.9306], 'PB': [-7.2399, -36.7819],
  'PR': [-24.8978, -51.5524], 'PE': [-8.8137, -36.9541], 'PI': [-6.6695, -42.2828],
  'RJ': [-22.2876, -42.5897], 'RN': [-5.4026, -36.9541], 'RS': [-30.0346, -51.2177],
  'RO': [-10.9472, -62.8415], 'RR': [1.9981, -61.3300], 'SC': [-27.2423, -50.2189],
  'SP': [-22.1987, -48.6889], 'SE': [-10.5741, -37.3857], 'TO': [-10.1753, -48.2982]
};

function getRandomOffset() {
  return (Math.random() - 0.5) * 0.05; // ±0.025 graus (~2.8km)
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    let jobIds = null;
    try {
      const body = await req.json();
      jobIds = body?.jobIds;
    } catch {
      // Sem body, processar todas
    }

    const jobs = jobIds 
      ? await Promise.all(jobIds.map(id => base44.asServiceRole.entities.Job.filter({ id })))
      : await base44.asServiceRole.entities.Job.list('', 10000);

    const jobsList = jobIds ? jobs.flat() : jobs;
    
    let processed = 0;
    let errors = 0;
    let skipped = 0;

    for (const job of jobsList) {
      try {
        // Se for remoto, pular
        if (job.is_remote || job.work_mode === 'Remoto') {
          await base44.asServiceRole.entities.Job.update(job.id, {
            is_remote: true,
            geocode_status: 'remote',
            exibir_no_mapa: false
          });
          skipped++;
          continue;
        }

        const cidade = job.city?.trim();
        const uf = job.state?.trim()?.toUpperCase();
        const cep = job.cep?.replace(/\D/g, '');

        if (!cidade || !uf) {
          errors++;
          continue;
        }

        let lat, lng;
        let nivel = 'estado';
        let fonte = 'banco_interno';

        // 1. Tentar buscar por CEP (mais preciso)
        if (cep && cep.length === 8) {
          try {
            const cepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const cepData = await cepResponse.json();
            
            if (cepData && !cepData.erro) {
              // Buscar coordenadas do CEP via Nominatim
              const address = `${cepData.logradouro}, ${job.numero || ''}, ${cepData.localidade}, ${cepData.uf}, Brasil`;
              const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
              
              const nomResponse = await fetch(nomUrl, {
                headers: { 'User-Agent': 'VagasApp/1.0' }
              });
              const nomData = await nomResponse.json();
              
              if (nomData && nomData.length > 0) {
                lat = parseFloat(nomData[0].lat);
                lng = parseFloat(nomData[0].lon);
                nivel = 'precisa';
                fonte = 'cep_nominatim';
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (err) {
            console.log(`CEP falhou para job ${job.id}, tentando cidade`);
          }
        }

        // 2. Fallback: usar coordenadas da cidade
        if (!lat || !lng) {
          if (CITY_COORDS[uf] && CITY_COORDS[uf][cidade]) {
            [lat, lng] = CITY_COORDS[uf][cidade];
            nivel = 'cidade';
          } else if (CITY_COORDS[job.state] && CITY_COORDS[job.state][cidade]) {
            [lat, lng] = CITY_COORDS[job.state][cidade];
            nivel = 'cidade';
          } else if (STATE_CENTERS[uf]) {
            [lat, lng] = STATE_CENTERS[uf];
            nivel = 'estado';
          } else {
            errors++;
            continue;
          }

          // Adicionar offset aleatório para não empilhar vagas
          lat += getRandomOffset();
          lng += getRandomOffset();
        }

        await base44.asServiceRole.entities.Job.update(job.id, {
          latitude: lat,
          longitude: lng,
          geocode_status: 'ok',
          nivel_localizacao: nivel,
          exibir_no_mapa: true,
          fonte_geocode: fonte
        });
        processed++;

      } catch (err) {
        errors++;
        console.error(`Erro ao geocodificar vaga ${job.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      message: `Geocodificação concluída: ${processed} vagas processadas, ${errors} erros, ${skipped} puladas`,
      processed,
      errors,
      skipped
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});