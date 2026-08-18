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

  // Active hover node filter state
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Dragging state & displacement distance tracker
  const isDraggingRef = useRef(false);
  const totalDragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Initial zoom logic
  const targetCamRef = useRef({ x: camera.x, y: camera.y, zoom: camera.zoom || 0.5 });
  const currentCamRef = useRef({ x: camera.x, y: camera.y, zoom: camera.zoom || 0.5 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0, time: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Center camera on mount
  useEffect(() => {
    if (viewportSize.width > 0) {
      const cx = viewportSize.width / 2;
      const cy = viewportSize.height / 2;
      targetCamRef.current.zoom = 0.5;
      targetCamRef.current.x = cx;
      targetCamRef.current.y = cy;
      
      currentCamRef.current.x = cx;
      currentCamRef.current.y = cy;
      currentCamRef.current.zoom = 0.5;
      setCamera({ x: cx, y: cy, zoom: 0.5 });
    }
  }, [viewportSize.width, viewportSize.height]);

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

    // 1. Build Nodes centered around (0,0)
    const spreadRadius = Math.max(900, items.length * 48);
    const nodes = items.map((item, idx) => {
      const angle = (idx / items.length) * Math.PI * 2;
      const r = 320 + Math.random() * (spreadRadius - 320);
      return {
        ...item,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      };
    });

    const getWords = (text) => {
      if (!text) return [];
      const stopWords = new Set(["de", "la", "le", "les", "des", "un", "une", "et", "ou", "en", "dans", "par", "pour", "sur", "au", "aux", "du", "qui", "que", "quoi", "dont", "où", "il", "elle", "ils", "elles", "on", "nous", "vous", "je", "tu", "me", "te", "se", "ce", "cette", "ces", "mon", "ton", "son", "ma", "ta", "sa", "mes", "tes", "ses", "notre", "votre", "leur", "nos", "vos", "leurs", "avec", "sans", "sous", "vers", "chez", "est", "sont", "a", "ont", "pas", "ne", "plus", "moins", "très", "bien", "fait", "comme", "tout", "tous", "toute", "toutes", "comment", "faire", "l", "d", "qu", "n", "s", "m", "t", "c", "j", "d'un", "d'une", "l'on"]);
      return text.toLowerCase()
        .replace(/['’]/g, " ")
        .split(/[\s,.;:!?()[\]{}"]+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
    };

    const links = [];
    const degreeMap = {};
    nodes.forEach(n => degreeMap[n.id] = 0);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        
        const aWords = getWords(a.abstract);
        const bWords = getWords(b.abstract);
        let shared = [...new Set(aWords.filter(w => bWords.includes(w)))];
        
        // Cap the number of connecting words to 4 max to avoid heavy visual clutter
        if (shared.length > 4) {
          shared = shared.slice(0, 4);
        }
        
        if (shared.length > 0) {
          links.push({ 
            source: a.id, 
            target: b.id, 
            value: shared.length * 2,
            sharedTags: shared
          });
          degreeMap[a.id]++;
          degreeMap[b.id]++;
        }
      }
    }

    // Identify the node with max connections. Tie-breaker: most recent (year), then highest id.
    let maxDegree = -1;
    let maxYear = -1;
    let maxId = -1;
    let centerNode = nodes[0];

    nodes.forEach(n => {
      const deg = degreeMap[n.id] || 0;
      const yr = parseInt(n.year, 10) || 0;
      const idNum = parseInt(n.id, 10) || 0;

      if (deg > maxDegree) {
        maxDegree = deg;
        maxYear = yr;
        maxId = idNum;
        centerNode = n;
      } else if (deg === maxDegree) {
        if (yr > maxYear || (yr === maxYear && idNum > maxId)) {
          maxYear = yr;
          maxId = idNum;
          centerNode = n;
        }
      }
    });

    // Pin the chosen center node to (0,0) during layout computation
    if (centerNode) {
      centerNode.fx = 0;
      centerNode.fy = 0;
    }

    // 3. D3 Force Simulation around (0,0)
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(d => Math.max(220, 520 - d.value * 75)))
      .force("charge", forceManyBody().strength(-2200))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide().radius(160));

    // Pre-calculate physics 300 ticks synchronously so covers are ALREADY at their exact place on arrival
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }

    // Unfix center node so it isn't unnaturally frozen anymore
    if (centerNode) {
      delete centerNode.fx;
      delete centerNode.fy;
    }

    // Set initial static graph data once
    setGraphData({ nodes: [...nodes], links: [...links] });
    simulation.stop();

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
      
      const worldX = (mouseX - targetCamRef.current.x) / targetCamRef.current.zoom;
      const worldY = (mouseY - targetCamRef.current.y) / targetCamRef.current.zoom;
      
      targetCamRef.current.zoom = newZoom;
      targetCamRef.current.x = mouseX - worldX * newZoom;
      targetCamRef.current.y = mouseY - worldY * newZoom;

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
    
    // Use current visual state for accurate centering
    const worldX = (centerX - currentCamRef.current.x) / currentCamRef.current.zoom;
    const worldY = (centerY - currentCamRef.current.y) / currentCamRef.current.zoom;
    
    targetCamRef.current.zoom = newZoom;
    targetCamRef.current.x = centerX - worldX * newZoom;
    targetCamRef.current.y = centerY - worldY * newZoom;
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.15, targetCamRef.current.zoom / 1.3);
    const centerX = viewportSize.width / 2;
    const centerY = viewportSize.height / 2;
    
    // Use current visual state for accurate centering
    const worldX = (centerX - currentCamRef.current.x) / currentCamRef.current.zoom;
    const worldY = (centerY - currentCamRef.current.y) / currentCamRef.current.zoom;

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

  // Determine active connections for hover highlighting
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
    }
    return set;
  }, [hoveredNodeId, graphData]);

  // Active links for badge rendering
  const activeLinks = useMemo(() => {
    if (!hoveredNodeId) return [];
    return graphData.links.filter(link => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;
      return sId === hoveredNodeId || tId === hoveredNodeId;
    });
  }, [hoveredNodeId, graphData]);

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
              hoveredNodeId === tId;

            const hasActiveFilter = Boolean(hoveredNodeId);

            const sharedCount = (link.sharedTags || []).length;
            
            // Shared color scale function: 1=Blue, 2=Amber, 3=Orange, 4+=Crimson
            const getHeatColor = (count, active) => {
              if (count >= 4) return active ? '#BE123C' : '#E11D48';
              if (count === 3) return active ? '#C2410C' : '#EA580C';
              if (count === 2) return active ? '#D97706' : '#F59E0B';
              return active ? '#1D4ED8' : '#38BDF8';
            };

            const strokeColor = getHeatColor(sharedCount, isLinkActive);

            const baseWidth = sharedCount >= 4 ? 2.6 : sharedCount === 3 ? 2.0 : sharedCount === 2 ? 1.4 : 1.0;
            const activeWidth = sharedCount >= 4 ? 4.0 : sharedCount === 3 ? 3.2 : sharedCount === 2 ? 2.5 : 1.8;

            const baseOpacity = sharedCount >= 4 ? 0.75 : sharedCount === 3 ? 0.60 : sharedCount === 2 ? 0.45 : 0.30;
            const activeOpacity = 0.95;

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
                stroke={strokeColor}
                strokeWidth={isLinkActive ? activeWidth : baseWidth}
                strokeOpacity={isLinkActive ? activeOpacity : hasActiveFilter ? 0.04 : baseOpacity}
                strokeDasharray={isLinkActive ? 'none' : '4 4'}
                style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease, stroke-opacity 0.3s ease' }}
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
          const hasActiveFilter = Boolean(hoveredNodeId);

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
                transform: `translate3d(${posX}px, ${posY}px, 0)`,
                zIndex: isHovered ? 60 : isActiveNeighbor && hasActiveFilter ? 40 : 10,
                opacity: nodeOpacity,
                transition: 'opacity 0.3s ease',
                cursor: 'pointer'
              }}
              className="group pointer-events-auto"
            >
              <div 
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(${isHovered ? 1.15 : isActiveNeighbor && hasActiveFilter ? 1.04 : 1.0})`,
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
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
                </div>
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
            
            // Midpoint of the quadratic bezier curve
            const midX = (sNode.x + tNode.x) / 2;
            const midY = (sNode.y + tNode.y) / 2 + (dr * 0.06);

            const sharedText = (link.sharedTags || []).join(' • ');
            if (!sharedText) return null;

            const sharedCount = (link.sharedTags || []).length;
            const getHeatColor = (count, active) => {
              if (count >= 4) return active ? '#BE123C' : '#E11D48';
              if (count === 3) return active ? '#C2410C' : '#EA580C';
              if (count === 2) return active ? '#D97706' : '#F59E0B';
              return active ? '#1D4ED8' : '#38BDF8';
            };
            const heatColor = getHeatColor(sharedCount, true);

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${midX}px`,
                  top: `${midY}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  transition: 'none',
                  borderColor: heatColor
                }}
                className="bg-[#111111] text-white text-[10px] font-mono font-bold px-3 py-1.5 shadow-2xl border whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill={heatColor} viewBox="0 0 256 256">
                  <path d="M100,56H40A16,16,0,0,0,24,72v64a16,16,0,0,0,16,16h60v8a32,32,0,0,1-32,32,8,8,0,0,0,0,16,48.05,48.05,0,0,0,48-48V72A16,16,0,0,0,100,56Zm0,80H40V72h60ZM216,56H156a16,16,0,0,0-16,16v64a16,16,0,0,0,16,16h60v8a32,32,0,0,1-32,32,8,8,0,0,0,0,16,48.05,48.05,0,0,0,48-48V72A16,16,0,0,0,216,56Zm0,80H156V72h60Z"></path>
                </svg>
                {sharedText}
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
            const cx = viewportSize.width / 2;
            const cy = viewportSize.height / 2;
            gsap.to(targetCamRef.current, {
              x: cx,
              y: cy,
              zoom: 0.5,
              duration: 0.8,
              ease: 'power2.out'
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
