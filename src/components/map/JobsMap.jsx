import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, RefreshCw, Loader2, Briefcase, Building2 } from "lucide-react";

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
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
  const [mapCenter, setMapCenter] = useState([-7.1195, -34.8450]); // João Pessoa default
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Load jobs with real-time updates
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const activeJobs = await base44.entities.Job.filter({ status: 'ativa' }, '-created_date', 5000);
        setJobs(activeJobs);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();

    // Real-time subscription
    const unsubscribe = base44.entities.Job.subscribe((event) => {
      if (event.type === 'create' && event.data.status === 'ativa') {
        setJobs(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setJobs(prev => prev.map(j => j.id === event.id ? event.data : j).filter(j => j.status === 'ativa'));
      } else if (event.type === 'delete') {
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

  // Group jobs by location
  const jobsByLocation = useMemo(() => {
    const grouped = {};
    
    jobs.forEach(job => {
      if (job.latitude && job.longitude) {
        const key = `${job.latitude.toFixed(4)},${job.longitude.toFixed(4)}`;
        if (!grouped[key]) {
          grouped[key] = {
            lat: job.latitude,
            lng: job.longitude,
            city: job.city,
            state: job.state,
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
        j.city?.toLowerCase().includes(search)
      )
    })).filter(loc => loc.jobs.length > 0);
  }, [jobsByLocation, searchTerm]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
        <Card className="p-2 shadow-lg">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cargo, empresa ou cidade..."
              className="flex-1"
            />
            <Button size="icon" variant="outline" onClick={getUserLocation}>
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
        
        <MarkerClusterGroup>
          {filteredLocations.map((location, idx) => (
            <Marker
              key={idx}
              position={[location.lat, location.lng]}
              icon={jobIcon}
              eventHandlers={{
                click: () => setSelectedLocation(location)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{location.city}, {location.state}</h3>
                  <p className="text-xs text-slate-600 mb-2">{location.jobs.length} vaga(s)</p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedLocation(location)}
                  >
                    Ver Vagas
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Você está aqui</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Jobs Panel */}
      {selectedLocation && (
        <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-0 md:top-0 md:w-96 bg-white shadow-2xl z-[1001] md:h-full overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">{selectedLocation.city}, {selectedLocation.state}</h2>
              <p className="text-sm text-slate-600">{selectedLocation.jobs.length} vagas disponíveis</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setSelectedLocation(null)}>
              ✕
            </Button>
          </div>
          
          <div className="p-4 space-y-3">
            {selectedLocation.jobs.map(job => (
              <Card 
                key={job.id} 
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onJobClick && onJobClick(job)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{job.title}</h3>
                    {job.company && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{job.company}</span>
                      </div>
                    )}
                    {job.salary_range && (
                      <p className="text-xs text-green-600 mt-1">{job.salary_range}</p>
                    )}
                    {job.neighborhood && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{job.neighborhood}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{filteredLocations.length} locais</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">{jobs.length} vagas ativas</span>
        </div>
      </div>
    </div>
  );
}