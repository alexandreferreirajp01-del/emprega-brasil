import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function SafeImage({ src, alt, className, fallbackClassName, ...props }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center ${fallbackClassName || className}`}>
        <ImageOff className="w-8 h-8 text-slate-300" />
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className={`skeleton ${className}`} />
      )}
      <img
        src={src}
        alt={alt || ''}
        className={`${className} ${loading ? 'hidden' : ''}`}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        loading="lazy"
        {...props}
      />
    </>
  );
}