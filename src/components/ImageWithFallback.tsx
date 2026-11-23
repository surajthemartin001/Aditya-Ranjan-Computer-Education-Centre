import { useState } from 'react';
import { Monitor } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Monitor className="w-8 h-8 text-slate-400 mb-2" />
        <span className="text-xs font-medium text-slate-600">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
