import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, Loader2, Briefcase, Building2, DollarSign, X, Clock, ChevronRight } from "lucide-react";
import TimeAgo from "@/components/common/TimeAgo";

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom blue marker icon (like Google Maps)
const jobIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function JobsMap({ onJobClick }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-15.7801, -47.9292]); // Brasil center
  const [mapZoom, setMapZoom] = useState(4);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Load ALL active jobs - NO FILTERS
  useEffect(() => {
    const loadJobs = async () => {
      try {
        console.log('🔍 Carregando TODAS as vagas...');
        
        // Buscar TODAS as vagas - SEM FILTROS
        const allJobs = await base44.entities.Job.list('-created_date', 10000);
        
        console.log(`📊 Total no banco: ${allJobs.length}`);
        console.log('Primeiras 3 vagas:', allJobs.slice(0, 3).map(j => ({
          id: j.id,
          title: j.title,
          status: j.status,
          city: j.city,
          lat: j.latitude,
          lng: j.longitude,
          latType: typeof j.latitude,
          lngType: typeof j.longitude
        })));
        
        // Filtrar apenas ativas
        const activeJobs = allJobs.filter(j => j.status === 'ativa');
        console.log(`✅ Ativas: ${activeJobs.length}`);
        
        // Processar coordenadas com mais flexibilidade
        const validJobs = [];
        const invalidJobs = [];
        
        activeJobs.forEach(job => {
          // Tentar converter latitude e longitude
          const lat = job.latitude;
          const lng = job.longitude;
          
          // Verificar se existem e são válidos
          if (lat != null && lng != null) {
            const latNum = typeof lat === 'string' ? parseFloat(lat.trim()) : parseFloat(lat);
            const lngNum = typeof lng === 'string' ? parseFloat(lng.trim()) : parseFloat(lng);
            
            if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
              validJobs.push({
                ...job,
                latitude: latNum,
                longitude: lngNum
              });
            } else {
              invalidJobs.push({ ...job, reason: 'Coordenadas inválidas ou zero' });
            }
          } else {
            invalidJobs.push({ ...job, reason: 'Sem coordenadas' });
          }
        });
        
        console.log(`📍 Válidas: ${validJobs.length}`);
        console.log(`❌ Inválidas: ${invalidJobs.length}`);
        
        if (invalidJobs.length > 0) {
          console.warn('⚠️ Vagas sem coordenadas:', invalidJobs.slice(0, 10).map(j => ({
            title: j.title,
            city: j.city,
            lat: j.latitude,
            lng: j.longitude,
            reason: j.reason
          })));
        }
        
        setJobs(validJobs);
        console.log(`✅ ${validJobs.length} vagas no mapa`);
        
      } catch (error) {
        console.error('❌ Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();

    // Real-time subscription para atualizações automáticas
    const unsubscribe = base44.entities.Job.subscribe((event) => {
      console.log('🔄 Atualização em tempo real:', event.type, event.data?.title);
      
      if (event.type === 'create' && event.data.status === 'ativa') {
        // Nova vaga criada - adicionar ao mapa
        if (event.data.latitude && event.data.longitude) {
          setJobs(prev => [{
            ...event.data,
            latitude: parseFloat(event.data.latitude),
            longitude: parseFloat(event.data.longitude)
          }, ...prev]);
        }
      } else if (event.type === 'update') {
        // Vaga atualizada
        setJobs(prev => {
          const updated = prev.map(j => {
            if (j.id === event.id) {
              return {
                ...event.data,
                latitude: parseFloat(event.data.latitude),
                longitude: parseFloat(event.data.longitude)
              };
            }
            return j;
          });
          // Filtrar apenas ativas com coordenadas válidas
          return updated.filter(j => 
            j.status === 'ativa' && 
            j.latitude && 
            j.longitude && 
            !isNaN(j.latitude) && 
            !isNaN(j.longitude)
          );
        });
      } else if (event.type === 'delete') {
        // Vaga deletada - remover do mapa
        setJobs(prev => prev.filter(j => j.id !== event.id));
      }
    });

    return () => unsubscribe();
  }, []);

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setMapZoom(13);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  // Group jobs by location (cluster nearby jobs)
  const jobsByLocation = useMemo(() => {
    const grouped = {};
    
    jobs.forEach(job => {
      if (job.latitude && job.longitude) {
        // Agrupar por coordenadas arredondadas (precisão de ~100m)
        const key = `${job.latitude.toFixed(3)},${job.longitude.toFixed(3)}`;
        if (!grouped[key]) {
          grouped[key] = {
            lat: job.latitude,
            lng: job.longitude,
            city: job.city,
            state: job.state,
            neighborhood: job.neighborhood,
            jobs: []
          };
        }
        grouped[key].jobs.push(job);
      }
    });
    
    return Object.values(grouped);
  }, [jobs]);

  // Filter by search
  const filteredLocations = useMemo(() => {
    if (!searchTerm) return jobsByLocation;
    
    const search = searchTerm.toLowerCase();
    return jobsByLocation.map(loc => ({
      ...loc,
      jobs: loc.jobs.filter(j => 
        j.title?.toLowerCase().includes(search) ||
        j.company?.toLowerCase().includes(search) ||
        j.city?.toLowerCase().includes(search) ||
        j.neighborhood?.toLowerCase().includes(search)
      )
    })).filter(loc => loc.jobs.length > 0);
  }, [jobsByLocation, searchTerm]);

  // Handle marker click
  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
    setIsBottomSheetOpen(true);
    // Centralizar no marcador clicado
    setMapCenter([location.lat, location.lng]);
    setMapZoom(14);
  };

  // Handle job click
  const handleJobClick = (job) => {
    if (onJobClick) {
      onJobClick(job);
    }
    setIsBottomSheetOpen(false);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Search Bar - Desktop */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4 hidden md:block">
        <Card className="p-2 shadow-lg">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cargo, empresa ou cidade..."
              className="flex-1"
            />
            <Button size="icon" variant="outline" onClick={getUserLocation} title="Minha localização">
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Search Bar - Mobile */}
      <div className="absolute top-2 left-2 right-2 z-[1000] md:hidden">
        <Card className="p-2 shadow-lg">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar vagas..."
              className="flex-1 text-sm"
            />
            <Button size="icon" variant="outline" onClick={getUserLocation} className="shrink-0">
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={true}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {filteredLocations.map((location, idx) => (
            <Marker
              key={idx}
              position={[location.lat, location.lng]}
              icon={jobIcon}
              eventHandlers={{
                click: () => handleMarkerClick(location)
              }}
            />
          ))}
        </MarkerClusterGroup>

        {userLocation && (
          <Marker position={userLocation}>
            <div className="bg-blue-600 w-4 h-4 rounded-full border-2 border-white"></div>
          </Marker>
        )}
      </MapContainer>

      {/* Stats Badge */}
      <div className="absolute bottom-4 left-4 z-[999] bg-white rounded-lg shadow-lg p-2 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{filteredLocations.length} locais</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">{jobs.length} vagas</span>
        </div>
      </div>

      {/* Bottom Sheet - Mobile */}
      {isBottomSheetOpen && selectedLocation && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[1001] bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base truncate">
                {selectedLocation.neighborhood ? `${selectedLocation.neighborhood}, ` : ''}{selectedLocation.city}, {selectedLocation.state}
              </h2>
              <p className="text-sm text-slate-600">{selectedLocation.jobs.length} {selectedLocation.jobs.length === 1 ? 'vaga' : 'vagas'}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setIsBottomSheetOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Jobs List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedLocation.jobs.map(job => (
              <Card 
                key={job.id} 
                className="p-3 cursor-pointer hover:shadow-md transition-shadow active:bg-slate-50"
                onClick={() => handleJobClick(job)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-2">{job.title}</h3>
                    {job.company && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{job.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {job.salary_range && (
                        <span className="text-xs text-green-600 font-medium">{job.salary_range}</span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <TimeAgo date={job.created_date} />
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Side Panel - Desktop */}
      {selectedLocation && (
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-[1001] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">
                {selectedLocation.neighborhood ? `${selectedLocation.neighborhood}, ` : ''}{selectedLocation.city}, {selectedLocation.state}
              </h2>
              <p className="text-sm text-slate-600">{selectedLocation.jobs.length} vagas disponíveis</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setSelectedLocation(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Jobs List */}
          <div className="overflow-y-auto h-[calc(100%-80px)] p-4 space-y-3">
            {selectedLocation.jobs.map(job => (
              <Card 
                key={job.id} 
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleJobClick(job)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-2">{job.title}</h3>
                    {job.company && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{job.company}</span>
                      </div>
                    )}
                    {job.salary_range && (
                      <p className="text-xs text-green-600 font-medium mt-1">{job.salary_range}</p>
                    )}
                    {job.neighborhood && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{job.neighborhood}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <TimeAgo date={job.created_date} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}