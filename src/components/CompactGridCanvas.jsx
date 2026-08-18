import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { Compass } from 'lucide-react';

export function CompactGridCanvas({
  items,
  camera,
  setCamera,
  onCardClick,
  cardWidth = 220
}) {
  const containerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Hover state
  const [hoveredKey, setHoveredKey] = useState(null);

  // Dragging state & displacement tracker
  const isDraggingRef = useRef(false);
  const totalDragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // STRICTLY LOCKED ZOOM = 1.0 ALWAYS (NO CAMERA ZOOM)
  const FIXED_ZOOM = 1.0;

  // Target and Current camera states for smooth lerp & momentum
  const targetCamRef = useRef({ x: camera.x, y: camera.y, zoom: FIXED_ZOOM });
  const currentCamRef = useRef({ x: camera.x, y: camera.y, zoom: FIXED_ZOOM });

  // Physics momentum velocity
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0, time: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Sync camera position if updated externally
  useEffect(() => {
    if (!isDraggingRef.current) {
      targetCamRef.current.x = camera.x;
      targetCamRef.current.y = camera.y;
      targetCamRef.current.zoom = FIXED_ZOOM;
    }
  }, [camera.x, camera.y]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // GSAP Ticker for smooth velocity decay & momentum panning
  useEffect(() => {
    const updatePhysics = () => {
      const target = targetCamRef.current;
      const current = currentCamRef.current;

      if (!isDraggingRef.current) {
        target.x += velocityRef.current.x;
        target.y += velocityRef.current.y;

        velocityRef.current.x *= 0.92;
        velocityRef.current.y *= 0.92;

        if (Math.abs(velocityRef.current.x) < 0.01) velocityRef.current.x = 0;
        if (Math.abs(velocityRef.current.y) < 0.01) velocityRef.current.y = 0;
      }

      const lerpFactor = 0.28;
      const newX = current.x + (target.x - current.x) * lerpFactor;
      const newY = current.y + (target.y - current.y) * lerpFactor;

      const dx = Math.abs(newX - current.x);
      const dy = Math.abs(newY - current.y);

      if (dx > 0.01 || dy > 0.01) {
        current.x = newX;
        current.y = newY;
        current.zoom = FIXED_ZOOM;

        setCamera({
          x: newX,
          y: newY,
          zoom: FIXED_ZOOM
        });
      }
    };

    gsap.ticker.add(updatePhysics);
    return () => {
      gsap.ticker.remove(updatePhysics);
    };
  }, [setCamera]);

  // Wheel / Trackpad handler (PANNING ONLY)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const panSensitivity = 1.1;
    targetCamRef.current.x -= e.deltaX * panSensitivity;
    targetCamRef.current.y -= e.deltaY * panSensitivity;
    velocityRef.current.x = -e.deltaX * 0.35;
    velocityRef.current.y = -e.deltaY * 0.35;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    totalDragDistanceRef.current = 0;
    setIsDragging(true);

    const now = performance.now();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: targetCamRef.current.x, y: targetCamRef.current.y };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };
    velocityRef.current = { x: 0, y: 0 };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastMousePosRef.current.time);

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    totalDragDistanceRef.current = Math.hypot(dx, dy);

    const vx = ((e.clientX - lastMousePosRef.current.x) / dt) * 16;
    const vy = ((e.clientY - lastMousePosRef.current.y) / dt) * 16;

    velocityRef.current = { x: vx, y: vy };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };

    targetCamRef.current.x = panStartRef.current.x + dx;
    targetCamRef.current.y = panStartRef.current.y + dy;
  }, []);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      totalDragDistanceRef.current = 0;
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { x: targetCamRef.current.x, y: targetCamRef.current.y };
      velocityRef.current = { x: 0, y: 0 };
    }
  };

  const handleTouchMove = (e) => {
    if (isDraggingRef.current && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      totalDragDistanceRef.current = Math.hypot(dx, dy);
      targetCamRef.current.x = panStartRef.current.x + dx;
      targetCamRef.current.y = panStartRef.current.y + dy;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleCardClick = (item, position) => {
    if (totalDragDistanceRef.current > 5) return;
    const centeredX = viewportSize.width / 2 - (position.x + position.width / 2);
    const centeredY = viewportSize.height / 2 - (position.y + position.height / 2);

    gsap.to(targetCamRef.current, {
      x: centeredX,
      y: centeredY,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        if (onCardClick) onCardClick(item);
      }
    });
  };

  // Standard fixed column width (220px)
  const colWidth = cardWidth;

  // Calculate EXACT height for each cover image so container aspect ratio matches image native ratio 100%
  const itemsWithMetrics = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.map(item => {
      let ar = 1.4;
      if (item.nativeHeight && item.nativeWidth) {
        ar = item.nativeHeight / item.nativeWidth;
      } else if (item.aspectRatio) {
        ar = item.aspectRatio;
      }
      // Exact height matching the image's original proportions at colWidth
      const exactHeight = Math.round(colWidth * ar);
      return {
        ...item,
        scaledHeight: exactHeight
      };
    });
  }, [items, colWidth]);

  // MAX RANDOM NON-REPETITIVE INFINITE MASONRY CANVAS
  const visibleTiles = useMemo(() => {
    if (!itemsWithMetrics || itemsWithMetrics.length === 0) return [];

    const worldLeft = 0 - camera.x;
    const worldRight = viewportSize.width - camera.x;
    const worldTop = 0 - camera.y;
    const worldBottom = viewportSize.height - camera.y;

    const minCol = Math.floor(worldLeft / colWidth) - 2;
    const maxCol = Math.ceil(worldRight / colWidth) + 2;

    const tiles = [];
    const N = itemsWithMetrics.length;

    // Total average height of 1 full set of items
    const avgCycleHeight = itemsWithMetrics.reduce((sum, it) => sum + it.scaledHeight, 0);
    if (avgCycleHeight === 0) return [];

    // PRNG helper
    const getRand = (seed) => {
      let s = Math.abs(seed) % 233280;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };

    // Deterministic shuffle for each (column, cycle) block
    const getShuffledItems = (c, cycleIdx) => {
      const rand = getRand(c * 9973 + cycleIdx * 104729 + 17);
      const arr = [...itemsWithMetrics];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    };

    for (let c = minCol; c <= maxCol; c++) {
      // Deterministic Y-offset per column to break horizontal grid alignment
      const colRand = getRand(c * 48271 + 31);
      const colYOffset = (colRand() - 0.5) * 500;

      // Calculate approximate cycle index range covering current viewport top -> bottom
      const startCycleIndex = Math.floor((worldTop - colYOffset - 400) / avgCycleHeight) - 1;
      const endCycleIndex = Math.ceil((worldBottom - colYOffset + 400) / avgCycleHeight) + 1;

      for (let cycleIdx = startCycleIndex; cycleIdx <= endCycleIndex; cycleIdx++) {
        // Compute precise Y position for the start of this cycle
        let currentY = cycleIdx * avgCycleHeight + colYOffset;
        const cycleItems = getShuffledItems(c, cycleIdx);

        for (let i = 0; i < N; i++) {
          const item = cycleItems[i];
          const itemY = currentY;
          const itemH = item.scaledHeight;

          // Render tile if inside active buffer
          if (itemY + itemH >= worldTop - 400 && itemY <= worldBottom + 400) {
            const uniqueKey = `c${c}_cy${cycleIdx}_i${i}_item${item.id}`;
            tiles.push({
              position: {
                col: c,
                x: c * colWidth,
                y: itemY,
                width: colWidth,
                height: itemH
              },
              item: {
                ...item,
                uniqueKey
              }
            });
          }

          currentY += itemH;
        }
      }
    }

    return tiles;
  }, [itemsWithMetrics, camera.x, camera.y, viewportSize.width, viewportSize.height, colWidth]);

  const containerStyle = {
    backgroundColor: '#EEEEEE',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none'
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={containerStyle}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-auto transform-gpu select-none"
        onDragStart={(e) => e.preventDefault()}
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${FIXED_ZOOM})`,
          willChange: 'transform',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {visibleTiles.map(({ position, item }) => {
          const isHovered = hoveredKey === item.uniqueKey;

          return (
            <div
              key={item.uniqueKey}
              onMouseEnter={() => setHoveredKey(item.uniqueKey)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => handleCardClick(item, position)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${position.width}px`,
                height: `${position.height}px`,
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                zIndex: isHovered ? 50 : 10,
                cursor: 'pointer'
              }}
              className="pointer-events-auto group overflow-visible"
            >
              {/* GAPLESS MASONRY CARD (Exact ratio match = 100% Uncropped & Zero dark bars!) */}
              <div
                className={`w-full h-full transition-all duration-300 ease-out origin-center ${
                  isHovered
                    ? 'scale-125 bg-white p-2.5 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-2 border-[#111111] z-50'
                    : 'scale-100 p-0 bg-transparent shadow-none border-0'
                }`}
              >
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  loading="lazy"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    WebkitUserDrag: 'none',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    filter: isHovered ? 'brightness(1.08) contrast(1.02)' : 'brightness(0.95)'
                  }}
                  className="w-full h-full object-contain block select-none transition-all duration-200"
                />

                {/* Title Overlay on Hover */}
                {isHovered && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-2.5 py-1 text-[11px] font-mono whitespace-nowrap shadow-2xl z-50 pointer-events-none">
                    {item.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recenter Button (Matching Navbar DA) */}
      <button
        onClick={() => {
          gsap.to(targetCamRef.current, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => {
              setCamera({ x: 0, y: 0, zoom: FIXED_ZOOM });
            }
          });
        }}
        className="fixed bottom-6 right-6 z-50 h-12 px-6 bg-[#111111] hover:bg-black text-white text-sm font-normal tracking-wide rounded-none flex items-center gap-2.5 transition-colors cursor-pointer shadow-none pointer-events-auto border border-white/10"
      >
        <Compass className="w-4 h-4 text-white opacity-90 stroke-[2]" />
        <span>Recentrer</span>
      </button>
    </div>
  );
}
