import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, MapPin, DollarSign, Calendar, ExternalLink } from "lucide-react";
import moment from 'moment';

export default function JobDetailModal({ job, isOpen, onClose }) {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {job.image_url && (
            <img src={job.image_url} alt={job.title} className="w-full h-48 object-cover rounded-lg" />
          )}

          <div className="flex flex-wrap gap-2">
            {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
            {job.category && <Badge variant="secondary">{job.category}</Badge>}
            {job.is_featured && <Badge className="bg-yellow-500">Destaque</Badge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {job.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{job.company}</span>
              </div>
            )}
            
            {(job.city || job.state) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{job.city}{job.state && `, ${job.state}`}</span>
              </div>
            )}

            {job.neighborhood && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Bairro: {job.neighborhood}</span>
              </div>
            )}

            {job.salary_range && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">{job.salary_range}</span>
              </div>
            )}

            {job.job_function && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>{job.job_function}</span>
              </div>
            )}

            {job.published_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{moment(job.published_at).fromNow()}</span>
              </div>
            )}
          </div>

          {job.description && (
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {job.additional_info && (
            <div>
              <h3 className="font-semibold mb-2">Informações Adicionais</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.additional_info}</p>
            </div>
          )}

          {job.contract_types && job.contract_types.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tipos de Contrato</h3>
              <div className="flex flex-wrap gap-2">
                {job.contract_types.map((type, idx) => (
                  <Badge key={idx} variant="outline">{type}</Badge>
                ))}
              </div>
            </div>
          )}

          {job.application_link && (
            <Button 
              className="w-full" 
              onClick={() => window.open(job.application_link, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Candidatar-se
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}