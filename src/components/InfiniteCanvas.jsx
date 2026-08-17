import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { CoverCard } from './CoverCard';
import {
  getTilePosition,
  getVisibleTileRange,
  getItemForGridCoordinate,
  DEFAULT_CARD_WIDTH,
  DEFAULT_CARD_HEIGHT,
  DEFAULT_GAP
} from '../utils/gridAlgorithm';

export function InfiniteCanvas({
  items,
  gap = DEFAULT_GAP,
  camera,
  setCamera,
  onCardClick,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT
}) {
  const containerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Dragging state & displacement distance tracker
  const isDraggingRef = useRef(false);
  const totalDragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Target and Current camera states for smooth lerp & momentum
  const targetCamRef = useRef({ x: camera.x, y: camera.y, zoom: camera.zoom || 1.0 });
  const currentCamRef = useRef({ x: camera.x, y: camera.y, zoom: camera.zoom || 1.0 });

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
      targetCamRef.current.zoom = camera.zoom;
    }
  }, [camera.x, camera.y, camera.zoom]);

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

  // High performance GSAP Ticker for smooth velocity decay & ultra-smooth lerp zoom/pan
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

      // Ultra-smooth Lerp Factor for pan & zoom
      const lerpFactor = 0.20;
      const newX = current.x + (target.x - current.x) * lerpFactor;
      const newY = current.y + (target.y - current.y) * lerpFactor;
      const newZoom = current.zoom + (target.zoom - current.zoom) * lerpFactor;

      const dx = Math.abs(newX - current.x);
      const dy = Math.abs(newY - current.y);
      const dz = Math.abs(newZoom - current.zoom);

      if (dx > 0.01 || dy > 0.01 || dz > 0.0001) {
        current.x = newX;
        current.y = newY;
        current.zoom = newZoom;

        setCamera({
          x: newX,
          y: newY,
          zoom: newZoom
        });
      }
    };

    gsap.ticker.add(updatePhysics);
    return () => {
      gsap.ticker.remove(updatePhysics);
    };
  }, [setCamera]);

  // Trackpad 2-finger pan & Cmd/Pinch Zoom / Smooth Mouse Wheel Zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();

    const isPinchOrCtrl = e.ctrlKey || e.metaKey;

    if (isPinchOrCtrl) {
      // Smooth Pinch / Cmd-scroll Zoom centered on mouse cursor
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const currentTarget = targetCamRef.current;
      const worldX = (cursorX - currentTarget.x) / currentTarget.zoom;
      const worldY = (cursorY - currentTarget.y) / currentTarget.zoom;

      // Exponential continuous smooth zoom factor
      const zoomFactor = Math.pow(0.993, e.deltaY);
      const newZoom = Math.min(Math.max(currentTarget.zoom * zoomFactor, 0.3), 3.0);

      const newPanX = cursorX - worldX * newZoom;
      const newPanY = cursorY - worldY * newZoom;

      targetCamRef.current = {
        x: newPanX,
        y: newPanY,
        zoom: newZoom
      };
    } else {
      // 2-finger Figma-style trackpad pan
      const panSensitivity = 1.1;
      targetCamRef.current.x -= e.deltaX * panSensitivity;
      targetCamRef.current.y -= e.deltaY * panSensitivity;

      velocityRef.current.x = -e.deltaX * 0.4;
      velocityRef.current.y = -e.deltaY * 0.4;
    }
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

  // Touch gestures for mobile pan
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

  // Smoothly center card on click (only if it was a click, not a drag movement)
  const handleCardClick = (item, position) => {
    if (totalDragDistanceRef.current > 5) {
      return;
    }

    const currentZoom = camera.zoom;
    const centeredX = viewportSize.width / 2 - (position.x + position.width / 2) * currentZoom;
    const centeredY = viewportSize.height / 2 - (position.y + position.height / 2) * currentZoom;

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

  // Viewport Culling & Visible Tiles Generation
  const tileRange = getVisibleTileRange(
    camera.x,
    camera.y,
    camera.zoom,
    viewportSize.width,
    viewportSize.height,
    cardWidth,
    gap
  );

  const visibleTiles = [];
  if (items && items.length > 0) {
    for (let r = tileRange.minRow; r <= tileRange.maxRow; r++) {
      for (let c = tileRange.minCol; c <= tileRange.maxCol; c++) {
        const item = getItemForGridCoordinate(c, r, items);
        if (item) {
          const position = getTilePosition(c, r, item, cardWidth, gap);
          visibleTiles.push({
            position,
            item
          });
        }
      }
    }
  }

  // Dot background pattern scaled with camera.zoom
  const gridCellSize = 24 * camera.zoom;
  const dotColor = 'rgba(160, 160, 160, 0.7)';

  const containerStyle = {
    backgroundColor: '#EEEEEE',
    backgroundImage: `radial-gradient(circle, ${dotColor} ${Math.max(0.6, 0.9 * camera.zoom)}px, transparent ${Math.max(0.6, 0.9 * camera.zoom)}px)`,
    backgroundSize: `${gridCellSize}px ${gridCellSize}px`,
    backgroundPosition: `${camera.x}px ${camera.y}px`,
    userSelect: 'none',
    WebkitUserSelect: 'none'
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
      {/* World Plane Container */}
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-auto transform-gpu select-none"
        onDragStart={(e) => e.preventDefault()}
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
          willChange: 'transform',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {visibleTiles.map(({ position, item }) => (
          <CoverCard
            key={item.uniqueKey}
            item={item}
            position={position}
            zoom={camera.zoom}
            onClick={(itm) => handleCardClick(itm, position)}
          />
        ))}
      </div>
    </div>
  );
}
