import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Briefcase, Building2, Navigation, Search, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas das principais cidades da Paraíba
const COORDINATES = {
  'João Pessoa': [-7.1195, -34.8450],
  'Campina Grande': [-7.2306, -35.8811],
  'Santa Rita': [-7.1139, -34.9781],
  'Patos': [-7.0242, -37.2800],
  'Bayeux': [-7.1253, -34.9319],
  'Sousa': [-6.7608, -38.2239],
  'Cajazeiras': [-6.8900, -38.5544],
  'Guarabira': [-6.8542, -35.4903],
  'Cabedelo': [-6.9811, -34.8342],
  'Sapé': [-7.0928, -35.2358],
  'Mamanguape': [-6.8383, -35.1269],
  'Rio Tinto': [-6.8039, -35.0772],
  'Mari': [-7.0561, -35.3192],
  'Monteiro': [-7.8906, -37.1208],
  'Itabaiana': [-7.3283, -35.3322],
  'Pombal': [-6.7686, -37.8011],
  'Princesa Isabel': [-7.7336, -37.9914],
  'Picuí': [-6.5092, -36.3464],
  'Esperança': [-7.0264, -35.8564],
  'Areia': [-6.9575, -35.6958]
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function MapaVagas() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-7.1195, -34.8450]); // João Pessoa padrão
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
        },
        (error) => {
          console.log('Geolocalização não disponível:', error);
        }
      );
    }
  };

  const loadData = async () => {
    try {
      const [jobsData, catsData] = await Promise.all([
        base44.entities.Job.list('-created_date', 500),
        base44.entities.ProfessionalCategory.list('category_order', 100)
      ]);

      // Adicionar coordenadas às vagas
      const jobsWithCoords = jobsData.map(job => {
        const coords = COORDINATES[job.city] || [-7.1195, -34.8450];
        return { ...job, latitude: coords[0], longitude: coords[1] };
      });

      setJobs(jobsWithCoords);
      setFilteredJobs(jobsWithCoords);
      setCategories(catsData.filter(c => c.is_active !== false));
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(job => 
        job.job_type === selectedType ||
        (job.contract_types && job.contract_types.includes(selectedType))
      );
    }

    setFilteredJobs(filtered);
  }, [searchTerm, selectedCategory, selectedType, jobs]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Mapa de Vagas
          </h1>

          {/* Filters */}
          <Card className="shadow-lg rounded-xl border-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar vagas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl h-10"
                  />
                </div>

                {/* Category */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.category_name}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="Estágio">Estágio</SelectItem>
                    <SelectItem value="Home Office">Home Office</SelectItem>
                    <SelectItem value="PCD">PCD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} no mapa
                </p>
                {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 -mt-4">
        <Card className="shadow-xl rounded-xl border-0 overflow-hidden">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={mapCenter}
              zoom={8}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap center={mapCenter} />
              
              <MarkerClusterGroup chunkedLoading>
                {filteredJobs.map((job) => (
                  <Marker
                    key={job.id}
                    position={[job.latitude, job.longitude]}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-sm mb-1">{job.title}</h3>
                        <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {job.company || 'Empresa'}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {job.city && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="w-2 h-2 mr-1" />
                              {job.city}
                            </Badge>
                          )}
                          {job.job_type && (
                            <Badge variant="outline" className="text-xs">
                              {job.job_type}
                            </Badge>
                          )}
                        </div>
                        <Link to={createPageUrl('JobDetail') + `?id=${job.id}`}>
                          <Button size="sm" className="w-full h-8 text-xs bg-[#0056ff] hover:bg-[#0044cc]">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>

              {/* User location marker */}
              {userLocation && (
                <Marker position={userLocation}>
                  <Popup>
                    <div className="text-center p-2">
                      <Navigation className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-medium">Você está aqui</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}