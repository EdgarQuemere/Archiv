import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { Tag, Sparkles, RefreshCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

export function NetworkGraphCanvas({
  items,
  camera,
  setCamera,
  onCardClick
}) {
  const containerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Physics Data State
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const simulationRef = useRef(null);

  // Active hover node / tag filter state
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  // Dragging state & displacement distance tracker
  const isDraggingRef = useRef(false);
  const totalDragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const targetCamRef = useRef({ x: camera.x, y: camera.y, zoom: camera.zoom || 1.0 });
  const currentCamRef = useRef({ x: camera.x, y: camera.y, zoom: camera.zoom || 1.0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0, time: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // List of top popular tags for the interactive tag filter bar
  const topTags = useMemo(() => {
    if (!items) return [];
    const counts = {};
    items.forEach(item => {
      (item.tags || []).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [items]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      targetCamRef.current.x = camera.x;
      targetCamRef.current.y = camera.y;
    }
  }, [camera.x, camera.y]);

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

  // Compute graph relations and start D3 simulation
  useEffect(() => {
    if (!items || items.length === 0) return;

    // 1. Build Nodes in a balanced radius
    const spreadRadius = Math.max(900, items.length * 48);
    const nodes = items.map((item, idx) => {
      const angle = (idx / items.length) * Math.PI * 2;
      const r = 320 + Math.random() * (spreadRadius - 320);
      return {
        ...item,
        x: viewportSize.width / 2 + Math.cos(angle) * r,
        y: viewportSize.height / 2 + Math.sin(angle) * r,
      };
    });

    // 2. Build Links strictly based on shared tags
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        
        const aTags = a.tags || [];
        const bTags = b.tags || [];
        const shared = aTags.filter(t => bTags.includes(t));
        
        if (shared.length > 0) {
          links.push({ 
            source: a.id, 
            target: b.id, 
            value: shared.length,
            sharedTags: shared
          });
        }
      }
    }

    // Ensure no isolated nodes
    const connectedNodes = new Set();
    links.forEach(l => {
      connectedNodes.add(l.source);
      connectedNodes.add(l.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        const other = nodes.find(n => n.id !== node.id && n.field === node.field) || nodes[0];
        if (other) {
          links.push({
            source: node.id,
            target: other.id,
            value: 1,
            sharedTags: [node.field || "Thème"]
          });
        }
      }
    });

    // 3. D3 Force Simulation
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(d => Math.max(220, 520 - d.value * 75)))
      .force("charge", forceManyBody().strength(-2200))
      .force("center", forceCenter(viewportSize.width / 2, viewportSize.height / 2))
      .force("collide", forceCollide().radius(160))
      .on("tick", () => {
        setGraphData({ nodes: [...nodes], links: [...links] });
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [items, viewportSize.width, viewportSize.height]);

  // High performance GSAP Ticker for smooth camera panning & zoom
  useEffect(() => {
    const updatePhysics = () => {
      const target = targetCamRef.current;
      const current = currentCamRef.current;

      if (!isDraggingRef.current) {
        target.x += velocityRef.current.x;
        target.y += velocityRef.current.y;
        velocityRef.current.x *= 0.94;
        velocityRef.current.y *= 0.94;
        if (Math.abs(velocityRef.current.x) < 0.02) velocityRef.current.x = 0;
        if (Math.abs(velocityRef.current.y) < 0.02) velocityRef.current.y = 0;
      }

      const lerpFactor = 0.28;
      const newX = current.x + (target.x - current.x) * lerpFactor;
      const newY = current.y + (target.y - current.y) * lerpFactor;
      const newZoom = current.zoom + (target.zoom - current.zoom) * lerpFactor;

      const dx = Math.abs(newX - current.x);
      const dy = Math.abs(newY - current.y);
      const dz = Math.abs(newZoom - current.zoom);

      if (dx > 0.01 || dy > 0.01 || dz > 0.001) {
        current.x = newX;
        current.y = newY;
        current.zoom = newZoom;
        setCamera({ x: newX, y: newY, zoom: newZoom });
      }
    };

    gsap.ticker.add(updatePhysics);
    return () => gsap.ticker.remove(updatePhysics);
  }, [setCamera]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.01;
      const zoomDelta = -e.deltaY * zoomSensitivity;
      let newZoom = targetCamRef.current.zoom * Math.exp(zoomDelta);
      newZoom = Math.max(0.15, Math.min(newZoom, 4.0));
      
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldX = (mouseX - currentCamRef.current.x) / currentCamRef.current.zoom;
      const worldY = (mouseY - currentCamRef.current.y) / currentCamRef.current.zoom;
      
      targetCamRef.current.zoom = newZoom;
      targetCamRef.current.x = mouseX - worldX * newZoom;
      targetCamRef.current.y = mouseY - worldY * newZoom;
      
      currentCamRef.current.x = targetCamRef.current.x;
      currentCamRef.current.y = targetCamRef.current.y;
      currentCamRef.current.zoom = targetCamRef.current.zoom;
      setCamera({ x: currentCamRef.current.x, y: currentCamRef.current.y, zoom: currentCamRef.current.zoom });

    } else {
      const panSensitivity = 1.1;
      targetCamRef.current.x -= e.deltaX * panSensitivity;
      targetCamRef.current.y -= e.deltaY * panSensitivity;
      velocityRef.current.x = -e.deltaX * 0.4;
      velocityRef.current.y = -e.deltaY * 0.4;
    }
  }, [setCamera]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Zoom control helpers
  const handleZoomIn = () => {
    const newZoom = Math.min(4.0, targetCamRef.current.zoom * 1.3);
    const centerX = viewportSize.width / 2;
    const centerY = viewportSize.height / 2;
    const worldX = (centerX - targetCamRef.current.x) / targetCamRef.current.zoom;
    const worldY = (centerY - targetCamRef.current.y) / targetCamRef.current.zoom;
    
    targetCamRef.current.zoom = newZoom;
    targetCamRef.current.x = centerX - worldX * newZoom;
    targetCamRef.current.y = centerY - worldY * newZoom;
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.15, targetCamRef.current.zoom / 1.3);
    const centerX = viewportSize.width / 2;
    const centerY = viewportSize.height / 2;
    const worldX = (centerX - targetCamRef.current.x) / targetCamRef.current.zoom;
    const worldY = (centerY - targetCamRef.current.y) / targetCamRef.current.zoom;

    targetCamRef.current.zoom = newZoom;
    targetCamRef.current.x = centerX - worldX * newZoom;
    targetCamRef.current.y = centerY - worldY * newZoom;
  };

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

  const handleCardClick = (item, x, y) => {
    if (totalDragDistanceRef.current > 5) return;
    const centeredX = viewportSize.width / 2 - x * currentCamRef.current.zoom;
    const centeredY = viewportSize.height / 2 - y * currentCamRef.current.zoom;

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

  // Determine active connections for Fil d'Ariane
  const activeNeighborIds = useMemo(() => {
    const set = new Set();
    if (hoveredNodeId) {
      set.add(hoveredNodeId);
      graphData.links.forEach(l => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sId === hoveredNodeId) set.add(tId);
        if (tId === hoveredNodeId) set.add(sId);
      });
    } else if (selectedTag) {
      graphData.nodes.forEach(n => {
        if ((n.tags || []).includes(selectedTag)) {
          set.add(n.id);
        }
      });
    }
    return set;
  }, [hoveredNodeId, selectedTag, graphData]);

  // Active links for badge rendering
  const activeLinks = useMemo(() => {
    if (!hoveredNodeId && !selectedTag) return [];
    return graphData.links.filter(link => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;
      const sNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === sId);
      const tNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === tId);

      if (!sNode || !tNode) return false;

      if (hoveredNodeId) {
        return sId === hoveredNodeId || tId === hoveredNodeId;
      }
      if (selectedTag) {
        return (sNode.tags || []).includes(selectedTag) && (tNode.tags || []).includes(selectedTag);
      }
      return false;
    });
  }, [hoveredNodeId, selectedTag, graphData]);

  const cardWidth = 170;
  const currentZoomPercent = Math.round((camera.zoom || 1.0) * 100);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-[#EEEEEE] ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* REDESIGNED FIL D'ARIANE TOP BAR (Glassmorphism & Crisp Pills) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-[#111111] text-white px-4 py-2 flex items-center gap-2.5 shadow-2xl border border-white/20">
        <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1.5 border-r border-white/20 pr-3">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          FIL D'ARIANE :
        </span>
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-3 py-1 text-xs font-mono transition-all ${
            selectedTag === null
              ? 'bg-white text-[#111111] font-bold shadow-md'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Tous ({items.length})
        </button>
        {topTags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-3 py-1 text-xs font-mono flex items-center gap-1.5 transition-all ${
              selectedTag === tag
                ? 'bg-white text-[#111111] font-bold shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Tag className="w-3 h-3 opacity-70" />
            {tag}
          </button>
        ))}
      </div>

      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-auto transform-gpu select-none"
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom || 1.0})`,
          willChange: 'transform'
        }}
      >
        {/* CRISP VECTOR SVG LAYER (vector-effect="non-scaling-stroke" prevents pixelation on zoom) */}
        <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
          {graphData.links.map((link, i) => {
            const sId = typeof link.source === 'object' ? link.source.id : link.source;
            const tId = typeof link.target === 'object' ? link.target.id : link.target;
            const sNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === sId);
            const tNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === tId);

            if (!sNode || !tNode) return null;

            const isLinkActive =
              hoveredNodeId === sId ||
              hoveredNodeId === tId ||
              (selectedTag && (sNode.tags || []).includes(selectedTag) && (tNode.tags || []).includes(selectedTag));

            const hasActiveFilter = Boolean(hoveredNodeId || selectedTag);

            const dx = tNode.x - sNode.x;
            const dy = tNode.y - sNode.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            const cx = (sNode.x + tNode.x) / 2;
            const cy = (sNode.y + tNode.y) / 2 + (dr * 0.12);
            const pathData = `M ${sNode.x},${sNode.y} Q ${cx},${cy} ${tNode.x},${tNode.y}`;

            return (
              <path
                key={i}
                d={pathData}
                fill="none"
                stroke={isLinkActive ? '#111111' : '#94A3B8'}
                strokeWidth={isLinkActive ? 2.5 : 1.0}
                strokeOpacity={isLinkActive ? 0.9 : hasActiveFilter ? 0.03 : 0.22}
                strokeDasharray={isLinkActive ? 'none' : '4 4'}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* NODE LAYER (Cover Cards without thick black outlines) */}
        {graphData.nodes.map((node) => {
          const aspectRatio = node.aspectRatio || 1.414;
          const cardHeight = Math.round(cardWidth * Math.min(aspectRatio, 1.6));
          const posX = node.x - cardWidth / 2;
          const posY = node.y - cardHeight / 2;

          const isHovered = hoveredNodeId === node.id;
          const isActiveNeighbor = activeNeighborIds.has(node.id);
          const hasActiveFilter = Boolean(hoveredNodeId || selectedTag);

          let nodeOpacity = 1.0;
          if (hasActiveFilter) {
            nodeOpacity = isActiveNeighbor ? 1.0 : 0.25;
          }

          return (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => handleCardClick(node, node.x, node.y)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transform: `translate3d(${posX}px, ${posY}px, 0) scale(${isHovered ? 1.15 : isActiveNeighbor && hasActiveFilter ? 1.04 : 1.0})`,
                zIndex: isHovered ? 60 : isActiveNeighbor && hasActiveFilter ? 40 : 10,
                opacity: nodeOpacity,
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                cursor: 'pointer'
              }}
              className="group pointer-events-auto"
            >
              {/* CLEAN NO-OUTLINE FRAME with rich high-elevation drop shadow */}
              <div
                className={`w-full h-full relative overflow-visible bg-white transition-all duration-300 ${
                  isHovered
                    ? 'shadow-[0_25px_50px_rgba(0,0,0,0.35)] border border-[#111111]'
                    : isActiveNeighbor && hasActiveFilter
                    ? 'shadow-[0_15px_30px_rgba(0,0,0,0.25)] border border-[#111111]/70'
                    : 'shadow-md border border-[#111111]/20 hover:border-[#111111]/60'
                }`}
              >
                <img
                  src={node.coverUrl}
                  alt={node.title}
                  loading="lazy"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ WebkitUserDrag: 'none', userSelect: 'none', pointerEvents: 'none' }}
                  className="w-full h-full object-contain block select-none p-1"
                />

                {/* Title badge floating underneath when hovered */}
                {isHovered && (
                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-3 py-1 text-[11px] font-mono whitespace-nowrap shadow-2xl z-50 pointer-events-none">
                    {node.title} • <span className="text-slate-300">{node.author}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* OVERLAY LAYER FOR ACTIVE FIL D'ARIANE TAG BADGES (zIndex: 100 ensures badges stay ABOVE all cards!) */}
        <div className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ zIndex: 100 }}>
          {activeLinks.map((link, i) => {
            const sId = typeof link.source === 'object' ? link.source.id : link.source;
            const tId = typeof link.target === 'object' ? link.target.id : link.target;
            const sNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === sId);
            const tNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === tId);

            if (!sNode || !tNode) return null;

            const dx = tNode.x - sNode.x;
            const dy = tNode.y - sNode.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            const cx = (sNode.x + tNode.x) / 2;
            const cy = (sNode.y + tNode.y) / 2 + (dr * 0.12);

            const sharedText = (link.sharedTags || []).join(' • ');
            if (!sharedText) return null;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${cx}px`,
                  top: `${cy}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
                className="bg-[#111111] text-white text-[10px] font-mono font-bold px-2.5 py-1 shadow-2xl border border-white/20 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200"
              >
                🏷️ {sharedText}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM RIGHT CONTROLS: MATCHING NAVBAR EXACT DA (h-12, border-2 border-[#111111], segmented) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pointer-events-auto font-sans">
        {/* 1. Zoom Control Segmented Block (Solid Black #111111) */}
        <div className="h-12 bg-[#111111] flex items-center rounded-none overflow-hidden p-0 shadow-none">
          {/* Zoom Out (-) */}
          <button
            onClick={handleZoomOut}
            title="Dézoomer (-)"
            className="w-12 h-full flex items-center justify-center bg-[#111111] hover:bg-black text-white transition-colors rounded-none cursor-pointer"
          >
            <ZoomOut className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="w-[1.5px] h-full bg-white/20" />

          {/* Zoom Percentage Display */}
          <div className="h-full px-3.5 flex items-center justify-center bg-[#111111] text-white text-xs font-mono font-bold select-none min-w-[55px]">
            {currentZoomPercent}%
          </div>

          <div className="w-[1.5px] h-full bg-white/20" />

          {/* Zoom In (+) */}
          <button
            onClick={handleZoomIn}
            title="Zoomer (+)"
            className="w-12 h-full flex items-center justify-center bg-[#111111] hover:bg-black text-white transition-colors rounded-none cursor-pointer"
          >
            <ZoomIn className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* 2. Recenter Button (Matching 'Filtres' / 'Advertise Here' Button DA) */}
        <button
          onClick={() => {
            gsap.to(targetCamRef.current, {
              x: 0,
              y: 0,
              zoom: 1.0,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                setCamera({ x: 0, y: 0, zoom: 1.0 });
              }
            });
          }}
          className="h-12 px-6 bg-[#111111] hover:bg-black text-white text-sm font-normal tracking-wide rounded-none flex items-center gap-2.5 transition-colors cursor-pointer shadow-none"
        >
          <Compass className="w-4 h-4 text-white opacity-90 stroke-[2]" />
          <span>Recentrer</span>
        </button>
      </div>
    </div>
  );
}
