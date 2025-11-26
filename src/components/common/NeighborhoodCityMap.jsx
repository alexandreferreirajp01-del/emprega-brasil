// Mapeamento de bairros para cidades da Paraíba
export const NEIGHBORHOOD_TO_CITY = {
  // João Pessoa
  'mangabeira': 'João Pessoa',
  'manaíra': 'João Pessoa',
  'tambaú': 'João Pessoa',
  'cabo branco': 'João Pessoa',
  'bessa': 'João Pessoa',
  'aeroclube': 'João Pessoa',
  'altiplano': 'João Pessoa',
  'bancários': 'João Pessoa',
  'castelo branco': 'João Pessoa',
  'cristo redentor': 'João Pessoa',
  'cruz das armas': 'João Pessoa',
  'centro': 'João Pessoa',
  'expedicionários': 'João Pessoa',
  'funcionários': 'João Pessoa',
  'geisel': 'João Pessoa',
  'grotão': 'João Pessoa',
  'jaguaribe': 'João Pessoa',
  'jardim cidade universitária': 'João Pessoa',
  'josé américo': 'João Pessoa',
  'mandacaru': 'João Pessoa',
  'miramar': 'João Pessoa',
  'pedro gondim': 'João Pessoa',
  'penha': 'João Pessoa',
  'roger': 'João Pessoa',
  'tambiá': 'João Pessoa',
  'torre': 'João Pessoa',
  'varadouro': 'João Pessoa',
  'valentina': 'João Pessoa',
  'valentina de figueiredo': 'João Pessoa',
  'água fria': 'João Pessoa',
  'ilha do bispo': 'João Pessoa',
  'oitizeiro': 'João Pessoa',
  'paratibe': 'João Pessoa',
  'gramame': 'João Pessoa',
  'mumbaba': 'João Pessoa',
  'costa do sol': 'João Pessoa',
  'portal do sol': 'João Pessoa',
  'jardim oceania': 'João Pessoa',
  'brisamar': 'João Pessoa',
  'quadramares': 'João Pessoa',
  'planalto boa esperança': 'João Pessoa',
  'anatólia': 'João Pessoa',
  'trincheiras': 'João Pessoa',
  'alto do mateus': 'João Pessoa',
  'alto do céu': 'João Pessoa',
  'distrito industrial': 'João Pessoa',
  'cuiá': 'João Pessoa',
  'costa e silva': 'João Pessoa',

  // Cabedelo
  'intermares': 'Cabedelo',
  'camboinha': 'Cabedelo',
  'poço': 'Cabedelo',
  'jardim manguinhos': 'Cabedelo',
  'renascer': 'Cabedelo',
  'jacaré': 'Cabedelo',
  'ponta de campina': 'Cabedelo',
  'areia dourada': 'Cabedelo',
  'formosa': 'Cabedelo',

  // Santa Rita
  'tibiri': 'Santa Rita',
  'marcos moura': 'Santa Rita',
  'eitel santiago': 'Santa Rita',
  'várzea nova': 'Santa Rita',
  'heitel santiago': 'Santa Rita',

  // Bayeux
  'sesi': 'Bayeux',
  'imaculada': 'Bayeux',
  'rio do meio': 'Bayeux',
  'são bento': 'Bayeux',
  'jardim aeroporto': 'Bayeux',
  'baralho': 'Bayeux',

  // Campina Grande
  'catolé': 'Campina Grande',
  'liberdade': 'Campina Grande',
  'alto branco': 'Campina Grande',
  'bodocongó': 'Campina Grande',
  'malvinas': 'Campina Grande',
  'palmeira': 'Campina Grande',
  'prata': 'Campina Grande',
  'santa rosa': 'Campina Grande',
  'sandra cavalcante': 'Campina Grande',
  'quarenta': 'Campina Grande',
  'mirante': 'Campina Grande',
  'dinamérica': 'Campina Grande',
  'centenário': 'Campina Grande',
  'conceição': 'Campina Grande',
  'cruzeiro': 'Campina Grande',
  'estação velha': 'Campina Grande',
  'itararé': 'Campina Grande',
  'jardim paulistano': 'Campina Grande',
  'josé pinheiro': 'Campina Grande',
  'lauritzen': 'Campina Grande',
  'monte castelo': 'Campina Grande',
  'nova brasília': 'Campina Grande',
  'nações': 'Campina Grande',
  'pedregal': 'Campina Grande',
  'presidente médici': 'Campina Grande',
  'ramadinha': 'Campina Grande',
  'santo antônio': 'Campina Grande',
  'são josé': 'Campina Grande',
  'serrotão': 'Campina Grande',
  'tambor': 'Campina Grande',
  'três irmãs': 'Campina Grande',
  'universitário': 'Campina Grande',
  'velame': 'Campina Grande',
  'vila cabral': 'Campina Grande',

  // Guarabira
  'nordeste': 'Guarabira',
  'cordeiro': 'Guarabira',

  // Patos
  'belo horizonte': 'Patos',
  'monte santo': 'Patos',
  'brasília': 'Patos',

  // Sousa
  'gato preto': 'Sousa',
  'jardim sorrilândia': 'Sousa',

  // Cajazeiras
  'casas populares': 'Cajazeiras',
  'capoeiras': 'Cajazeiras',
};

export function getCityFromNeighborhood(location) {
  if (!location) return null;
  
  const locationLower = location.toLowerCase().trim();
  
  // Verificar se já é uma cidade conhecida
  const cities = ['joão pessoa', 'cabedelo', 'santa rita', 'bayeux', 'campina grande', 
                  'guarabira', 'patos', 'sousa', 'cajazeiras', 'conde', 'alhandra',
                  'pitimbu', 'lucena', 'rio tinto', 'mamanguape', 'sapé', 'mari',
                  'cruz do espírito santo', 'pedras de fogo', 'caaporã'];
  
  if (cities.includes(locationLower)) {
    return location; // Já é uma cidade
  }
  
  // Procurar no mapeamento de bairros
  for (const [neighborhood, city] of Object.entries(NEIGHBORHOOD_TO_CITY)) {
    if (locationLower.includes(neighborhood)) {
      return city;
    }
  }
  
  return null;
}

export function formatLocationWithCity(location) {
  if (!location) return 'Não informado';
  
  const city = getCityFromNeighborhood(location);
  
  if (city && location.toLowerCase() !== city.toLowerCase()) {
    return `${location} - ${city}`;
  }
  
  return location;
}