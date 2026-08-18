import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { getItemForGridCoordinate } from '../utils/gridAlgorithm';

export function CompactGridCanvas({
  items,
  camera,
  setCamera,
  onCardClick,
  cardWidth = 220,
  cardHeight = 310
}) {
  const containerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Hover state for subtle highlight
  const [hoveredKey, setHoveredKey] = useState(null);

  // Dragging state & displacement tracker
  const isDraggingRef = useRef(false);
  const totalDragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // STRICTLY LOCKED ZOOM = 1.0 ALWAYS (NO ZOOM)
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

  // ----------------------------------------------------------------------
  // ZERO-GAP PUZZLE MASONRY GRID (Edge-to-edge seamless wall of covers)
  // ----------------------------------------------------------------------
  const pitchX = cardWidth; // Zero margin X
  const pitchY = cardHeight; // Zero margin Y

  // Staggered vertical offset formula to create an interlocking puzzle / brickwork pattern
  const getPuzzleOffsetY = (col) => {
    const mod = Math.abs(col) % 4;
    switch (mod) {
      case 1: return 50;
      case 2: return 20;
      case 3: return 60;
      default: return 0;
    }
  };

  const visibleTiles = useMemo(() => {
    if (!items || items.length === 0) return [];

    const worldLeft = (0 - camera.x) / FIXED_ZOOM;
    const worldRight = (viewportSize.width - camera.x) / FIXED_ZOOM;
    const worldTop = (0 - camera.y) / FIXED_ZOOM;
    const worldBottom = (viewportSize.height - camera.y) / FIXED_ZOOM;

    const buffer = 3;
    const minCol = Math.floor(worldLeft / pitchX) - buffer;
    const maxCol = Math.ceil(worldRight / pitchX) + buffer;
    const minRow = Math.floor((worldTop - 70) / pitchY) - buffer;
    const maxRow = Math.ceil((worldBottom + 70) / pitchY) + buffer;

    const tiles = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const item = getItemForGridCoordinate(c, r, items);
        if (item) {
          const x = c * pitchX;
          const offsetY = getPuzzleOffsetY(c);
          const y = r * pitchY + offsetY;

          tiles.push({
            position: { col: c, row: r, x, y, width: cardWidth, height: cardHeight },
            item
          });
        }
      }
    }
    return tiles;
  }, [items, camera.x, camera.y, viewportSize, cardWidth, cardHeight, pitchX, pitchY]);

  const containerStyle = {
    backgroundColor: '#111111', // Sleek dark slate backdrop for seamless edge-to-edge puzzle
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
                zIndex: isHovered ? 30 : 10,
                transition: 'filter 0.25s ease, opacity 0.25s ease',
                opacity: isHovered ? 1.0 : 0.92,
                cursor: 'pointer'
              }}
              className="pointer-events-auto overflow-hidden bg-black"
            >
              {/* SEAMLESS EDGE-TO-EDGE RAW COVER IMAGE (Zero Margins) */}
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
                  filter: isHovered
                    ? 'brightness(1.15) contrast(1.05)'
                    : 'brightness(0.95)'
                }}
                className="w-full h-full object-cover block select-none transition-all duration-200"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
