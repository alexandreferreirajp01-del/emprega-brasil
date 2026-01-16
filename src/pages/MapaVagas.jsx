import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import JobsMap from '@/components/map/JobsMap';
import JobDetailModal from '@/components/jobs/JobDetailModal';

// Prevent SSR issues with Leaflet
const DynamicMap = dynamic(() => import('@/components/map/JobsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-600">Carregando mapa...</p>
      </div>
    </div>
  )
});

export default function MapaVagas() {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <>
      <DynamicMap onJobClick={setSelectedJob} />
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </>
  );
}