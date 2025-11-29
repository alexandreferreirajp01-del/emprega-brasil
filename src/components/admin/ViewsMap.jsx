import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Eye, Globe, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function ViewsMap() {
  const [dateFilter, setDateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const { data: views = [] } = useQuery({
    queryKey: ['job-views'],
    queryFn: async () => {
      try {
        return await base44.entities.JobView.list('-created_date', 2000) || [];
      } catch (e) {
        console.error('Erro ao carregar visualizações:', e);
        return [];
      }
    },
  });

  // Filtrar por data
  const filteredViews = useMemo(() => {
    let result = views;
    
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      result = result.filter(v => new Date(v.created_date) >= filterDate);
    }

    if (cityFilter !== 'all') {
      result = result.filter(v => v.city === cityFilter);
    }

    return result;
  }, [views, dateFilter, cityFilter]);

  // Agrupar visualizações por localização
  const locationData = useMemo(() => {
    const locations = {};
    filteredViews.forEach(v => {
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
  }, [filteredViews]);

  // Estatísticas por estado
  const stateStats = useMemo(() => {
    const stats = {};
    filteredViews.forEach(v => {
      const state = v.state || 'Outros';
      stats[state] = (stats[state] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews]);

  // Estatísticas por cidade
  const cityStats = useMemo(() => {
    const stats = {};
    filteredViews.forEach(v => {
      const city = v.city || 'Outros';
      stats[city] = (stats[city] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredViews]);

  // Lista única de cidades
  const uniqueCities = useMemo(() => {
    const cities = new Set();
    views.forEach(v => {
      if (v.city) cities.add(v.city);
    });
    return Array.from(cities).sort();
  }, [views]);

  // Centro do mapa (Paraíba)
  const mapCenter = [-7.1195, -36.7241];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40 rounded-lg">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-40 rounded-lg">
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Badge className="bg-[#0056ff]/10 text-[#0056ff] border-0 ml-auto">
              {filteredViews.length} visualizações
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Mapa - Tamanho reduzido */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0056ff]" />
            Mapa de Visualizações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[280px] relative">
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
                  radius={Math.min(loc.count * 2 + 5, 25)}
                  fillColor="#0056ff"
                  color="#0044cc"
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.6}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <p className="font-semibold text-sm">{loc.city}</p>
                      {loc.state && <p className="text-xs text-slate-500">{loc.state}</p>}
                      <p className="text-base font-bold text-[#0056ff]">{loc.count}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Por Estado */}
        <Card className="rounded-xl">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0056ff]" />
              Por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {stateStats.length > 0 ? stateStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#0056ff] text-white text-xs font-bold rounded-full">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{item.state}</span>
                  </div>
                  <Badge className="bg-[#0056ff]/10 text-[#0056ff] border-0 text-xs">
                    {item.count}
                  </Badge>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-4 text-sm">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Cidade */}
        <Card className="rounded-xl">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              Top 10 Cidades
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {cityStats.length > 0 ? cityStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 flex items-center justify-center text-white text-xs font-bold rounded-full ${
                      index < 3 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{item.city}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                    {item.count}
                  </Badge>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-4 text-sm">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}