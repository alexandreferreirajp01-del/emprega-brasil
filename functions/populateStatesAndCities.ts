import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const statesAndCities = `RO	Alta Floresta D'Oeste
RO	Ariquemes
RO	Cabixi
RO	Cacoal
RO	Cerejeiras
RO	Colorado do Oeste
RO	Corumbiara
RO	Costa Marques
RO	Espigão D'Oeste
RO	Guajará-Mirim
RO	Jaru
RO	Ji-Paraná
RO	Machadinho D'Oeste
RO	Nova Brasilândia D'Oeste
RO	Ouro Preto do Oeste
RO	Pimenta Bueno
RO	Porto Velho
RO	Presidente Médici
RO	Rio Crespo
RO	Rolim de Moura
RO	Santa Luzia D'Oeste
RO	Vilhena
RO	São Miguel do Guaporé
RO	Nova Mamoré
RO	Alvorada D'Oeste
RO	Alto Alegre dos Parecis
RO	Alto Paraíso
RO	Buritis
RO	Novo Horizonte do Oeste
RO	Cacaulândia
RO	Campo Novo de Rondônia
RO	Candeias do Jamari
RO	Castanheiras
RO	Chupinguaia
RO	Cujubim
RO	Governador Jorge Teixeira
RO	Itapuã do Oeste
RO	Ministro Andreazza
RO	Mirante da Serra
RO	Monte Negro
RO	Nova União
RO	Parecis
RO	Pimenteiras do Oeste
RO	Primavera de Rondônia
RO	São Felipe D'Oeste
RO	São Francisco do Guaporé
RO	Seringueiras
RO	Teixeirópolis
RO	Theobroma
RO	Urupá
RO	Vale do Anari
RO	Vale do Paraíso
AC	Acrelândia
AC	Assis Brasil
AC	Brasiléia
AC	Bujari
AC	Capixaba
AC	Cruzeiro do Sul
AC	Epitaciolândia
AC	Feijó
AC	Jordão
AC	Mâncio Lima
AC	Manoel Urbano
AC	Marechal Thaumaturgo
AC	Plácido de Castro
AC	Porto Walter
AC	Rio Branco
AC	Rodrigues Alves
AC	Santa Rosa do Purus
AC	Senador Guiomard
AC	Sena Madureira
AC	Tarauacá
AC	Xapuri
AC	Porto Acre`.split('\n');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação admin
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cities = [];
    
    // Parse do arquivo
    for (const line of statesAndCities) {
      if (!line.trim()) continue;
      const [state, cityName] = line.split('\t');
      if (state && cityName) {
        cities.push({
          state: state.trim(),
          name: cityName.trim()
        });
      }
    }

    // Inserir em lotes de 100
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize);
      await base44.asServiceRole.entities.City.bulkCreate(batch);
      inserted += batch.length;
    }

    return Response.json({ 
      success: true, 
      message: `${inserted} cidades inseridas com sucesso!`,
      total: cities.length
    });
    
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});