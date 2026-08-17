import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

export function CoverCard({ item, position, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const { x, y, width, height } = position;

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: `${width}px`,
        height: `${height}px`,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      className="group cursor-pointer select-none z-10 hover:z-30"
      onDragStart={(e) => e.preventDefault()}
      onClick={() => onClick && onClick(item)}
    >
      {/* Inner container scales up on parent group-hover without inline style conflict */}
      <div className="w-full h-full relative overflow-visible bg-transparent transform-gpu pointer-events-none transition-transform duration-300 ease-out group-hover:scale-110">
        {/* Skeleton Loader */}
        {!loaded && (
          <div className="absolute inset-0 bg-[#e0e0e0] animate-pulse flex items-center justify-center pointer-events-none">
            <BookOpen className="w-8 h-8 text-[#111111] opacity-40" />
          </div>
        )}

        {/* Clean Cover Image */}
        <img
          src={item.coverUrl}
          alt={item.title}
          loading="lazy"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={() => setLoaded(true)}
          style={{ WebkitUserDrag: 'none', userSelect: 'none', pointerEvents: 'none' }}
          className={`w-full h-full object-contain block transition-opacity duration-300 pointer-events-none select-none ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
}
