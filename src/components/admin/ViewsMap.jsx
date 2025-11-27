import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function ViewsMap() {
  const { data: views = [] } = useQuery({
    queryKey: ['job-views'],
    queryFn: async () => {
      try {
        return await base44.entities.JobView.list('-created_date', 1000) || [];
      } catch (e) {
        console.error('Erro ao carregar visualizações:', e);
        return [];
      }
    },
  });

  // Agrupar visualizações por localização
  const locationData = useMemo(() => {
    const locations = {};
    views.forEach(v => {
      if (v.latitude && v.longitude) {
        const key = `${v.latitude.toFixed(2)},${v.longitude.toFixed(2)}`;
        if (!locations[key]) {
          locations[key] = {
            lat: v.latitude,
            lng: v.longitude,
            city: v.city || 'Desconhecido',
            state: v.state || '',
            country: v.country || 'Brasil',
            count: 0
          };
        }
        locations[key].count++;
      }
    });
    return Object.values(locations);
  }, [views]);

  // Estatísticas por estado
  const stateStats = useMemo(() => {
    const stats = {};
    views.forEach(v => {
      const state = v.state || 'Outros';
      stats[state] = (stats[state] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  }, [views]);

  // Estatísticas por cidade
  const cityStats = useMemo(() => {
    const stats = {};
    views.forEach(v => {
      const city = v.city || 'Outros';
      stats[city] = (stats[city] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [views]);

  // Centro do mapa (Paraíba)
  const mapCenter = [-7.1195, -36.7241];

  return (
    <div className="space-y-6">
      {/* Mapa */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0056ff]" />
            Mapa de Visualizações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] relative">
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {locationData.map((loc, index) => (
                <CircleMarker
                  key={index}
                  center={[loc.lat, loc.lng]}
                  radius={Math.min(loc.count * 2 + 5, 30)}
                  fillColor="#0056ff"
                  color="#0044cc"
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.6}
                >
                  <Popup>
                    <div className="text-center p-2">
                      <p className="font-semibold">{loc.city}</p>
                      {loc.state && <p className="text-sm text-slate-500">{loc.state}</p>}
                      <p className="text-lg font-bold text-[#0056ff] mt-1">{loc.count} visualizações</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Por Estado */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0056ff]" />
              Visualizações por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stateStats.length > 0 ? stateStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#0056ff] text-white text-xs font-bold rounded-full">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.state}</span>
                  </div>
                  <Badge className="bg-[#0056ff]/10 text-[#0056ff] border-0">
                    <Eye className="w-3 h-3 mr-1" />
                    {item.count}
                  </Badge>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-8">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Cidade */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Top 10 Cidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {cityStats.length > 0 ? cityStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 flex items-center justify-center text-white text-xs font-bold rounded-full ${
                      index < 3 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.city}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <Eye className="w-3 h-3 mr-1" />
                    {item.count}
                  </Badge>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-8">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}