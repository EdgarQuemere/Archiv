import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { Compass, Grid } from 'lucide-react';
import { getFileUrl } from '../utils/url';
import { decodeHTMLEntities } from '../utils/text';

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
  </svg>
);

export function InfiniteCanvas({
  items,
  camera,
  setCamera,
  onCardClick,
  onAddWork,
  cardWidth = 220
}) {
  const containerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Dynamic Spacing Gap State (0px = Serré, 48px = Moyen, 240px = Large)
  const [canvasGap, setCanvasGap] = useState(0);

  // Hover state
  const [hoveredKey, setHoveredKey] = useState(null);
  const [imageRatios, setImageRatios] = useState({});

  const handleImageLoad = useCallback((id, e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalHeight / naturalWidth;
      setImageRatios(prev => {
        if (prev[id] === ratio) return prev;
        return { ...prev, [id]: ratio };
      });
    }
  }, []);

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

        velocityRef.current.x *= 0.94;
        velocityRef.current.y *= 0.94;

        if (Math.abs(velocityRef.current.x) < 0.01) velocityRef.current.x = 0;
        if (Math.abs(velocityRef.current.y) < 0.01) velocityRef.current.y = 0;
      }

      const lerpFactor = 0.45;
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

  // Wheel / Trackpad handler (LIGHTWEIGHT RESPONSIVE PANNING)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const panSensitivity = 1.45;
    targetCamRef.current.x -= e.deltaX * panSensitivity;
    targetCamRef.current.y -= e.deltaY * panSensitivity;
    velocityRef.current.x = -e.deltaX * 0.45;
    velocityRef.current.y = -e.deltaY * 0.45;
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

    const vx = ((e.clientX - lastMousePosRef.current.x) / dt) * 22;
    const vy = ((e.clientY - lastMousePosRef.current.y) / dt) * 22;

    velocityRef.current = { x: vx, y: vy };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };

    targetCamRef.current.x = panStartRef.current.x + dx;
    targetCamRef.current.y = panStartRef.current.y + dy;
  }, []);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    const now = performance.now();
    if (now - lastMousePosRef.current.time > 80) {
      velocityRef.current = { x: 0, y: 0 };
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      totalDragDistanceRef.current = 0;
      setIsDragging(true);

      const touch = e.touches[0];
      const now = performance.now();
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      panStartRef.current = { x: targetCamRef.current.x, y: targetCamRef.current.y };
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY, time: now };
      velocityRef.current = { x: 0, y: 0 };
    }
  };

  const handleTouchMove = (e) => {
    if (isDraggingRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const now = performance.now();
      const dt = Math.max(1, now - lastMousePosRef.current.time);

      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      totalDragDistanceRef.current = Math.hypot(dx, dy);

      const vx = ((touch.clientX - lastMousePosRef.current.x) / dt) * 22;
      const vy = ((touch.clientY - lastMousePosRef.current.y) / dt) * 22;

      velocityRef.current = { x: vx, y: vy };
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY, time: now };

      targetCamRef.current.x = panStartRef.current.x + dx;
      targetCamRef.current.y = panStartRef.current.y + dy;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    const now = performance.now();
    if (now - lastMousePosRef.current.time > 80) {
      velocityRef.current = { x: 0, y: 0 };
    }
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

  // UNIFORM HOVER FRAME SIZE FOR ALL COVERS (Exact same border size on hover!)
  const UNIFORM_HOVER_WIDTH = 280;
  const UNIFORM_HOVER_HEIGHT = 360;

  // Calculate EXACT height for each cover image so container aspect ratio matches image native ratio 100%
  const itemsWithMetrics = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.map(item => {
      let ar = imageRatios[item.id];

      if (!ar) {
        if (item.nativeHeight && item.nativeWidth) {
          ar = item.nativeHeight / item.nativeWidth;
        } else if (item.orientation === 'landscape') {
          ar = 0.707;
        } else if (item.aspectRatio && item.aspectRatio < 0.95) {
          ar = item.aspectRatio;
        } else if (item.aspectRatio && item.aspectRatio > 1.8) {
          ar = 1 / item.aspectRatio;
        } else {
          ar = 1.414;
        }
      }

      const isLandscape = ar < 0.95 || item.orientation === 'landscape';
      const itemWidth = colWidth;
      const exactHeight = Math.round(colWidth * ar);

      return {
        ...item,
        scaledWidth: itemWidth,
        scaledHeight: exactHeight,
        isLandscape,
        ar
      };
    });
  }, [items, colWidth, canvasGap, imageRatios]);

  // MASONRY PUZZLE INFINITE CANVAS (ZERO HOLES, UNFINISHED CONTINUOUS STACK)
  // IN LARGE MODE (canvasGap >= 400): CLEAN ALIGNED STRUCTURED GRID MATRIX
  const visibleTiles = useMemo(() => {
    if (!itemsWithMetrics || itemsWithMetrics.length === 0) return [];

    const worldLeft = 0 - camera.x;
    const worldRight = viewportSize.width - camera.x;
    const worldTop = 0 - camera.y;
    const worldBottom = viewportSize.height - camera.y;

    const tiles = [];
    const N = itemsWithMetrics.length;

    // Mode Large (canvasGap >= 400): Clean aligned structured grid matrix (no column Y-offsets, no random shuffling)
    if (canvasGap >= 400) {
      const maxRowHeight = 420;
      const pitchX = colWidth + canvasGap;
      const pitchY = maxRowHeight + canvasGap;

      const minCol = Math.floor(worldLeft / pitchX) - 2;
      const maxCol = Math.ceil(worldRight / pitchX) + 2;
      const minRow = Math.floor(worldTop / pitchY) - 2;
      const maxRow = Math.ceil(worldBottom / pitchY) + 2;

      for (let c = minCol; c <= maxCol; c++) {
        for (let r = minRow; r <= maxRow; r++) {
          const modCol = ((c % N) + N) % N;
          const modRow = ((r % N) + N) % N;
          const hashIndex = (modCol + modRow * 5 + Math.abs(c * 3)) % N;
          const baseItem = itemsWithMetrics[hashIndex];

          if (baseItem) {
            const cellOffsetY = Math.round((maxRowHeight - baseItem.scaledHeight) / 2);
            const x = c * pitchX;
            const y = r * pitchY + cellOffsetY;
            const uniqueKey = `grid_c${c}_r${r}_i${baseItem.id}`;

            tiles.push({
              position: {
                col: c,
                row: r,
                x,
                y,
                width: baseItem.scaledWidth,
                height: baseItem.scaledHeight
              },
              item: {
                ...baseItem,
                uniqueKey
              }
            });
          }
        }
      }

      return tiles;
    }

    // Modes Serré & Moyen (canvasGap < 400): Continuous staggered masonry stack
    const pitchX = colWidth + canvasGap;
    const minCol = Math.floor(worldLeft / pitchX) - 2;
    const maxCol = Math.ceil(worldRight / pitchX) + 2;

    // Total average height of 1 full set of items with gaps
    const avgCycleHeight = itemsWithMetrics.reduce((sum, it) => sum + it.scaledHeight + canvasGap, 0);
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
                x: c * pitchX,
                y: itemY,
                width: item.scaledWidth,
                height: itemH
              },
              item: {
                ...item,
                uniqueKey
              }
            });
          }

          currentY += itemH + canvasGap;
        }
      }
    }

    return tiles;
  }, [itemsWithMetrics, camera.x, camera.y, viewportSize.width, viewportSize.height, colWidth, canvasGap]);

  const containerStyle = {
    backgroundColor: '#EEEEEE',
    backgroundImage: 'radial-gradient(rgba(17, 17, 17, 0.28) 1.2px, transparent 1.2px)',
    backgroundSize: '24px 24px',
    backgroundPosition: `${camera.x}px ${camera.y}px`,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none'
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden  ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
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
        className="absolute top-0 left-0 origin-top-left pointer-events-auto transform-gpu "
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

          const HOVER_SCALE = 1.25;
          const HOVER_PADDING = 14; // Exact 14px padding on ALL 4 sides

          // Scaled image size
          const scaledImgW = position.width * HOVER_SCALE;
          const scaledImgH = position.height * HOVER_SCALE;

          // Outer frame size including uniform padding
          const hoverFrameW = Math.round(scaledImgW + HOVER_PADDING * 2);
          const hoverFrameH = Math.round(scaledImgH + HOVER_PADDING * 2);

          // Center position of current tile
          const centerX = position.x + position.width / 2;
          const centerY = position.y + position.height / 2;

          const hoveredX = Math.round(centerX - hoverFrameW / 2);
          const hoveredY = Math.round(centerY - hoverFrameH / 2);

          const renderWidth = isHovered ? hoverFrameW : position.width;
          const renderHeight = isHovered ? hoverFrameH : position.height;
          const renderX = isHovered ? hoveredX : position.x;
          const renderY = isHovered ? hoveredY : position.y;

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
                width: `${renderWidth}px`,
                height: `${renderHeight}px`,
                transform: `translate3d(${renderX}px, ${renderY}px, 0)`,
                zIndex: isHovered ? 60 : 10,
                transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer'
              }}
              className="pointer-events-auto group overflow-visible"
            >
              {/* PASSE-PARTOUT HOVER FRAME: 100% Equal Padding on All 4 Sides! */}
              <div
                style={{
                  padding: isHovered ? `${HOVER_PADDING}px` : '0px'
                }}
                className={`w-full h-full flex flex-col items-center justify-center transition-all duration-250 ease-out origin-center ${isHovered
                  ? 'bg-[#EEEEEE] shadow-[0_30px_60px_rgba(0,0,0,0.85)] border-3 border-[#111111] rounded-none'
                  : 'bg-transparent shadow-none border-0'
                  }`}
              >
                <img
                  src={getFileUrl(item.coverUrl)}
                  alt={item.title}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onLoad={(e) => handleImageLoad(item.id, e)}
                  style={{
                    WebkitUserDrag: 'none',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    filter: isHovered ? 'brightness(1.05) contrast(1.02)' : 'brightness(0.95)'
                  }}
                  className="w-full h-full object-contain block"
                />
              </div>

              {/* DOCUMENT TITLE BADGE ON HOVER FOCUS */}
              {isHovered && item.title && (
                <div className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-[#111111] text-[#EEEEEE] text-xs font-medium rounded-full shadow-2xl pointer-events-none z-50 flex items-center gap-1.5 whitespace-nowrap max-w-[320px] border border-[#111111] animate-in fade-in zoom-in-95 duration-150">
                  <span className="truncate">{decodeHTMLEntities(item.title)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM CONTROL BAR (SPACING GAP TOGGLE - Centered on mobile, Right-aligned on desktop) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 sm:bottom-6 z-50 flex items-center gap-3 pointer-events-auto font-sans max-w-[95vw] sm:max-w-none">
        {/* Segmented Cover Spacing Selector (0px, 96px, 300px) */}
        <div className="h-10 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shadow-sm shrink-0">
          <button
            onClick={() => setCanvasGap(0)}
            title="Espacement 0px (Serré)"
            className={`h-full px-3 xs:px-4 sm:px-6 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base font-medium transition-colors cursor-pointer ${canvasGap === 0
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
              }`}
          >
            <Grid className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
            <span>Serré</span>
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          <button
            onClick={() => setCanvasGap(96)}
            title="Espacement 96px (Moyen)"
            className={`h-full px-3 xs:px-4 sm:px-6 flex items-center justify-center text-xs sm:text-base font-medium transition-colors cursor-pointer ${canvasGap === 96
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
              }`}
          >
            <span>Moyen</span>
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          <button
            onClick={() => setCanvasGap(300)}
            title="Espacement 300px (Large)"
            className={`h-full px-3 xs:px-4 sm:px-6 flex items-center justify-center text-xs sm:text-base font-medium transition-colors cursor-pointer ${canvasGap >= 280
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
              }`}
          >
            <span>Large</span>
          </button>
        </div>
      </div>
    </div>
  );
}
