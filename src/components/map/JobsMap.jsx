import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Briefcase, Clock, Navigation, X } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import TimeAgo from "@/components/common/TimeAgo";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon colors
const createCustomIcon = (color = '#0A66C2') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 6px; margin-left: 7px;"><svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

function LocationButton() {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleMyLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 13, { duration: 1.5 });
          setLoading(false);
        },
        (error) => {
          alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocalização não é suportada pelo seu navegador.');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMyLocation}
      disabled={loading}
      className="absolute top-4 right-4 z-[1000] bg-white hover:bg-slate-50 text-slate-700 shadow-lg rounded-xl border border-slate-200"
      size="icon"
    >
      <Navigation className="w-4 h-4" />
    </Button>
  );
}

export default function JobsMap({ onJobClick }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const allJobs = await base44.entities.Job.filter({
        status: 'ativa',
        exibir_no_mapa: true,
        geocode_status: 'ok'
      }, '-created_date', 5000);

      const validJobs = allJobs.filter(j => 
        j.latitude && 
        j.longitude && 
        !isNaN(j.latitude) && 
        !isNaN(j.longitude) &&
        j.latitude >= -90 && j.latitude <= 90 &&
        j.longitude >= -180 && j.longitude <= 180
      );

      setJobs(validJobs);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
    } finally {
      setLoading(false);
    }
  };

  const centerBrasil = useMemo(() => [-14.2350, -51.9253], []);

  const groupedJobs = useMemo(() => {
    const groups = {};
    jobs.forEach(job => {
      const key = `${job.latitude.toFixed(4)}_${job.longitude.toFixed(4)}`;
      if (!groups[key]) {
        groups[key] = {
          lat: job.latitude,
          lng: job.longitude,
          jobs: []
        };
      }
      groups[key].jobs.push(job);
    });
    return Object.values(groups);
  }, [jobs]);

  if (loading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-300">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Nenhuma vaga com localização disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
      <MapContainer
        center={centerBrasil}
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationButton />

        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          maxClusterRadius={60}
        >
          {groupedJobs.map((group, idx) => (
            <Marker
              key={idx}
              position={[group.lat, group.lng]}
              icon={createCustomIcon(group.jobs.length > 1 ? '#F9C846' : '#0A66C2')}
              eventHandlers={{
                click: () => {
                  if (group.jobs.length === 1) {
                    onJobClick && onJobClick(group.jobs[0]);
                  } else {
                    setSelectedCluster(group.jobs);
                  }
                }
              }}
            >
              <Popup maxWidth={300}>
                <div className="p-2">
                  <p className="font-bold text-sm mb-2">
                    {group.jobs.length} {group.jobs.length === 1 ? 'vaga' : 'vagas'} neste local
                  </p>
                  {group.jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="mb-2 pb-2 border-b last:border-0">
                      <p className="font-semibold text-xs">{job.title}</p>
                      <p className="text-xs text-slate-600">{job.company}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        <MapPin className="w-2.5 h-2.5 mr-1" />
                        {job.city}, {job.state}
                      </Badge>
                    </div>
                  ))}
                  {group.jobs.length > 3 && (
                    <p className="text-xs text-slate-500 mt-2">
                      +{group.jobs.length - 3} vagas
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Modal Cluster */}
      {selectedCluster && (
        <div className="absolute inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">
                  {selectedCluster.length} vagas neste local
                </h3>
                <p className="text-white/80 text-sm">
                  {selectedCluster[0]?.city}, {selectedCluster[0]?.state}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCluster(null)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <CardContent className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
              {selectedCluster.map((job) => (
                <Link key={job.id} to={createPageUrl('JobDetail') + `?id=${job.id}`}>
                  <div className="p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-1">{job.title}</h4>
                    <p className="text-sm text-slate-600 flex items-center gap-1 mb-2">
                      <Building2 className="w-3 h-3" />
                      {job.company}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {job.job_type && (
                        <Badge variant="outline" className="text-xs">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {job.job_type}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <TimeAgo date={job.created_date} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}