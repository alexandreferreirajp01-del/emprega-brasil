import React, { useState } from 'react';
import JobsMap from '@/components/map/JobsMap';
import JobDetailModal from '@/components/jobs/JobDetailModal';

export default function MapaVagas() {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <>
      <JobsMap onJobClick={setSelectedJob} />
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