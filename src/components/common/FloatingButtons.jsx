import React from 'react';

export default function FloatingButtons() {
  try {
    const UniversalChat = React.lazy(() => import('@/components/chat/UniversalChat'));
    return (
      <React.Suspense fallback={null}>
        <UniversalChat />
      </React.Suspense>
    );
  } catch {
    return null;
  }
}