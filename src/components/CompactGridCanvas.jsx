import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { CoverCard } from './CoverCard';
import {
  getTilePosition,
  getVisibleTileRange,
  getItemForGridCoordinate,
  DEFAULT_CARD_WIDTH,
  DEFAULT_CARD_HEIGHT
} from '../utils/gridAlgorithm';

export function CompactGridCanvas({
  items,
  gap = 0, // No gap!
  camera,
  setCamera,
  onCardClick,
  cardWidth = 200,
  cardHeight = 283
}) {
  const containerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Hover state for pushing neighbors
  const [hoveredCoord, setHoveredCoord] = useState(null); // { col, row }

  // Dragging state & displacement distance tracker
  const isDraggingRef = useRef(false);
  const totalDragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // STRICTLY LOCKED ZOOM = 1.0 ALWAYS (NO ZOOMING PERMITTED)
  const FIXED_ZOOM = 1.0;

  // Target and Current camera states for smooth lerp & momentum
  const targetCamRef = useRef({ x: camera.x, y: camera.y, zoom: FIXED_ZOOM });
  const currentCamRef = useRef({ x: camera.x, y: camera.y, zoom: FIXED_ZOOM });

  // Enhanced Velocity & Momentum Physics for snappy Figma-style panning
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

  // High performance GSAP Ticker for smooth velocity decay & lerp panning
  useEffect(() => {
    const updatePhysics = () => {
      const target = targetCamRef.current;
      const current = currentCamRef.current;

      // Apply momentum velocity if not actively dragging
      if (!isDraggingRef.current) {
        target.x += velocityRef.current.x;
        target.y += velocityRef.current.y;

        // Friction decay
        velocityRef.current.x *= 0.94;
        velocityRef.current.y *= 0.94;

        if (Math.abs(velocityRef.current.x) < 0.02) velocityRef.current.x = 0;
        if (Math.abs(velocityRef.current.y) < 0.02) velocityRef.current.y = 0;
      }

      // Responsive Lerp Factor for panning
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

  // Trackpad / Mouse wheel handler: STRICT PANNING ONLY (NO ZOOMING)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const panSensitivity = 1.1;
    targetCamRef.current.x -= e.deltaX * panSensitivity;
    targetCamRef.current.y -= e.deltaY * panSensitivity;
    if (e.deltaX === 0 && e.deltaY !== 0 && !e.ctrlKey && !e.metaKey) {
      targetCamRef.current.y -= e.deltaY * panSensitivity;
    }
    velocityRef.current.x = -e.deltaX * 0.4;
    velocityRef.current.y = -e.deltaY * 0.4;
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
    if (e.touches.length > 1) {
      e.preventDefault();
      return;
    }
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
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        if (onCardClick) onCardClick(item);
      }
    });
  };

  // ----------------------------------------------------
  // Custom Compact Grid Math (Zero Gaps, Tight Rows)
  // ----------------------------------------------------
  const compactRowHeight = cardHeight; // e.g. 283
  const pitchX = cardWidth + gap;
  const pitchY = compactRowHeight + gap;

  const getCompactVisibleTileRange = (panX, panY, zoom, vw, vh, buffer = 3) => {
    const worldLeft = (0 - panX) / zoom;
    const worldRight = (vw - panX) / zoom;
    const worldTop = (0 - panY) / zoom;
    const worldBottom = (vh - panY) / zoom;

    const minCol = Math.floor(worldLeft / pitchX) - buffer;
    const maxCol = Math.ceil(worldRight / pitchX) + buffer;
    const minRow = Math.floor(worldTop / pitchY) - buffer;
    const maxRow = Math.ceil(worldBottom / pitchY) + buffer;

    return { minCol, maxCol, minRow, maxRow };
  };

  const getCompactTilePosition = (col, row, item) => {
    // Force a strict uniform grid block to ensure ZERO holes between covers
    return {
      col,
      row,
      x: col * pitchX,
      y: row * pitchY, // No cellOffsetY, everything is strictly packed
      width: cardWidth,
      height: compactRowHeight,
      gap
    };
  };

  const expansionScale = 1.4;

  const visibleTiles = useMemo(() => {
    // Determine visible tile range based on compact layout
    const tileRange = getCompactVisibleTileRange(
      camera.x,
      camera.y,
      FIXED_ZOOM,
      viewportSize.width,
      viewportSize.height,
      3
    );

    const tiles = [];
    if (items && items.length > 0) {
      for (let r = tileRange.minRow; r <= tileRange.maxRow; r++) {
        for (let c = tileRange.minCol; c <= tileRange.maxCol; c++) {
          const item = getItemForGridCoordinate(c, r, items);
          if (item) {
            
            let w = cardWidth;
            let h = compactRowHeight;
            let x = c * pitchX;
            let y = r * pitchY;

            if (hoveredCoord) {
              const diffW = (cardWidth * expansionScale - cardWidth);
              const diffH = (compactRowHeight * expansionScale - compactRowHeight);
              
              // Column logic (Width and X)
              if (c === hoveredCoord.col) {
                w = cardWidth * expansionScale;
                x -= diffW / 2;
              } else if (c < hoveredCoord.col) {
                x -= diffW / 2;
              } else if (c > hoveredCoord.col) {
                x += diffW / 2;
              }

              // Row logic (Height and Y)
              if (r === hoveredCoord.row) {
                h = compactRowHeight * expansionScale;
                y -= diffH / 2;
              } else if (r < hoveredCoord.row) {
                y -= diffH / 2;
              } else if (r > hoveredCoord.row) {
                y += diffH / 2;
              }
            }

            tiles.push({
              position: { col: c, row: r, x, y, width: w, height: h, gap: 0 },
              item,
              isHovered: hoveredCoord && c === hoveredCoord.col && r === hoveredCoord.row
            });
          }
        }
      }
    }
    return tiles;
  }, [items, camera.x, camera.y, viewportSize, cardWidth, gap, hoveredCoord]);

  const gridCellSize = 24;
  const dotColor = 'rgba(160, 160, 160, 0.7)';
  const containerStyle = {
    backgroundColor: '#EEEEEE',
    backgroundImage: `radial-gradient(circle, ${dotColor} 0.9px, transparent 0.9px)`,
    backgroundSize: `${gridCellSize}px ${gridCellSize}px`,
    backgroundPosition: `${camera.x}px ${camera.y}px`,
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
        {visibleTiles.map(({ position, item, isHovered }) => (
          <div
            key={item.uniqueKey}
            onMouseEnter={() => setHoveredCoord({ col: item.gridCol, row: item.gridRow })}
            onMouseLeave={() => setHoveredCoord(null)}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${position.width}px`,
              height: `${position.height}px`,
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              zIndex: isHovered ? 50 : 10,
              transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease',
              boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.4)' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => handleCardClick(item, position)}
          >
            <div className="w-full h-full relative overflow-visible bg-transparent transform-gpu pointer-events-none">
              <img
                src={item.coverUrl}
                alt={item.title}
                loading="lazy"
                draggable={false}
                style={{ WebkitUserDrag: 'none', userSelect: 'none', pointerEvents: 'none' }}
                className="w-full h-full object-cover block select-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
