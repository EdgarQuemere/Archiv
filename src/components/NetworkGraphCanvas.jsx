import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceRadial } from 'd3-force';
import { ZoomIn, ZoomOut, Compass } from 'lucide-react';

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
  const [imageRatios, setImageRatios] = useState({});

  // Dragging state & displacement distance tracker
  const isDraggingRef = useRef(false);
  const totalDragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageLoad = useCallback((nodeId, e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalHeight / naturalWidth;
      setImageRatios(prev => {
        if (prev[nodeId] === ratio) return prev;
        return { ...prev, [nodeId]: ratio };
      });
    }
  }, []);

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

    const getWords = (text) => {
      if (!text) return [];
      const stopWords = new Set(["de", "la", "le", "les", "des", "un", "une", "et", "ou", "en", "dans", "par", "pour", "sur", "au", "aux", "du", "qui", "que", "quoi", "dont", "où", "il", "elle", "ils", "elles", "on", "nous", "vous", "je", "tu", "me", "te", "se", "ce", "cette", "ces", "mon", "ton", "son", "ma", "ta", "sa", "mes", "tes", "ses", "notre", "votre", "leur", "nos", "vos", "leurs", "avec", "sans", "sous", "vers", "chez", "est", "sont", "a", "ont", "pas", "ne", "plus", "moins", "très", "bien", "fait", "comme", "tout", "tous", "toute", "toutes", "comment", "faire", "l", "d", "qu", "n", "s", "m", "t", "c", "j", "d'un", "d me", "l'on"]);
      return text.toLowerCase()
        .replace(/['’]/g, " ")
        .split(/[\s,.;:!?()[\]{}"]+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
    };

    // 1. Calculate links and node degrees first
    const links = [];
    const degreeMap = {};
    items.forEach(n => degreeMap[n.id] = 0);

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        const aWords = getWords(`${a.title || ''} ${a.description || ''}`);
        const bWords = getWords(`${b.title || ''} ${b.description || ''}`);
        let shared = [...new Set(aWords.filter(w => bWords.includes(w)))];

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

    // 2. Build Nodes centered around (0,0) with eccentric outer orbit for unlinked nodes
    const spreadRadius = Math.max(1000, items.length * 60);
    const nodes = items.map((item, idx) => {
      const angle = (idx / items.length) * Math.PI * 2;
      const isUnlinked = (degreeMap[item.id] || 0) === 0;
      const r = isUnlinked
        ? 750 + Math.random() * 200
        : 350 + Math.random() * (spreadRadius - 350);
      return {
        ...item,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      };
    });

    // Identify the node with max connections
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

    // 3. D3 Force Simulation with eccentric radial ring (850px) for unlinked covers
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(d => Math.max(380, 750 - d.value * 90)))
      .force("charge", forceManyBody().strength(d => ((degreeMap[d.id] || 0) === 0 ? -2200 : -4500)))
      .force("radial", forceRadial(850, 0, 0).strength(d => ((degreeMap[d.id] || 0) === 0 ? 0.35 : 0.01)))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide().radius(240));

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

      const vx = ((touch.clientX - lastMousePosRef.current.x) / dt) * 16;
      const vy = ((touch.clientY - lastMousePosRef.current.y) / dt) * 16;

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
      className={`relative w-full h-full overflow-hidden  bg-[#EEEEEE] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
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
          let ar = imageRatios[node.id];
          if (!ar) {
            if (node.nativeHeight && node.nativeWidth) {
              ar = node.nativeHeight / node.nativeWidth;
            } else if (node.orientation === 'landscape') {
              ar = 0.707;
            } else if (node.aspectRatio) {
              ar = node.aspectRatio < 0.95 ? node.aspectRatio : (node.aspectRatio > 1.8 ? 1 / node.aspectRatio : node.aspectRatio);
            } else {
              ar = 1.414;
            }
          }

          const isLandscape = ar < 0.95 || node.orientation === 'landscape';
          const currentCardWidth = isLandscape ? 220 : 170;
          const cardHeight = Math.round(currentCardWidth * ar);
          const posX = node.x - currentCardWidth / 2;
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
                width: `${currentCardWidth}px`,
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
                  className={`w-full h-full relative overflow-visible bg-[#EEEEEE] transition-all duration-300 ${isHovered
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
                    onLoad={(e) => handleImageLoad(node.id, e)}
                    style={{ WebkitUserDrag: 'none', userSelect: 'none', pointerEvents: 'none' }}
                    className="w-full h-full object-contain block p-1"
                  />
                </div>
              </div>

              {/* DOCUMENT TITLE BADGE ON HOVER FOCUS */}
              {isHovered && node.title && (
                <div className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-[#111111] text-[#EEEEEE] text-xs font-medium rounded-full shadow-2xl pointer-events-none z-50 flex items-center gap-1.5 whitespace-nowrap max-w-[320px] border border-[#111111] animate-in fade-in zoom-in-95 duration-150">
                  <span className="truncate">{node.title}</span>
                </div>
              )}
            </div>
          );
        })}
        {/* OVERLAY LAYER FOR ACTIVE FIL D'ARIANE TAG BADGES (zIndex: 100 ensures badges stay ABOVE all cards!) */}
        <div className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ zIndex: 100 }}>
          {(() => {
            const rawItems = activeLinks.map((link, i) => {
              const sId = typeof link.source === 'object' ? link.source.id : link.source;
              const tId = typeof link.target === 'object' ? link.target.id : link.target;
              const sNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === sId);
              const tNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === tId);

              if (!sNode || !tNode) return null;

              const sharedText = (link.sharedTags || []).join(' • ');
              if (!sharedText) return null;

              const dx = tNode.x - sNode.x;
              const dy = tNode.y - sNode.y;
              const dr = Math.sqrt(dx * dx + dy * dy);
              const midX = (sNode.x + tNode.x) / 2;
              const midY = (sNode.y + tNode.y) / 2 + (dr * 0.06);

              const estimatedWidth = Math.max(110, 50 + sharedText.length * 7.5);
              const estimatedHeight = 30;

              return {
                id: i,
                link,
                sharedText,
                x: midX,
                y: midY,
                width: estimatedWidth,
                height: estimatedHeight,
                sharedCount: (link.sharedTags || []).length
              };
            }).filter(Boolean);

            // Iterative 2D Box Collision Relaxation algorithm to eliminate overlaps
            for (let iter = 0; iter < 12; iter++) {
              for (let i = 0; i < rawItems.length; i++) {
                for (let j = i + 1; j < rawItems.length; j++) {
                  const b1 = rawItems[i];
                  const b2 = rawItems[j];

                  const dx = b2.x - b1.x;
                  const dy = b2.y - b1.y;

                  const minSpacingX = (b1.width + b2.width) / 2 + 14;
                  const minSpacingY = (b1.height + b2.height) / 2 + 10;

                  if (Math.abs(dx) < minSpacingX && Math.abs(dy) < minSpacingY) {
                    const overlapX = minSpacingX - Math.abs(dx);
                    const overlapY = minSpacingY - Math.abs(dy);

                    if (overlapX < overlapY) {
                      const shiftX = (overlapX / 2) * (dx >= 0 ? 1 : -1);
                      b1.x -= shiftX;
                      b2.x += shiftX;
                    } else {
                      const shiftY = (overlapY / 2) * (dy >= 0 ? 1 : -1);
                      b1.y -= shiftY;
                      b2.y += shiftY;
                    }
                  }
                }
              }
            }

            const getHeatColor = (count, active) => {
              if (count >= 4) return active ? '#BE123C' : '#E11D48';
              if (count === 3) return active ? '#C2410C' : '#EA580C';
              if (count === 2) return active ? '#D97706' : '#F59E0B';
              return active ? '#1D4ED8' : '#38BDF8';
            };

            return rawItems.map((item) => {
              const heatColor = getHeatColor(item.sharedCount, true);

              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    transition: 'none',
                    borderColor: heatColor
                  }}
                  className="bg-[#111111] text-[#EEEEEE] text-[10px] font-mono font-bold px-3 py-1.5 shadow-2xl border whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill={heatColor} viewBox="0 0 256 256">
                    <path d="M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128c0-.74,0-1.48-.08-2.21l13.23-4.41A32,32,0,1,0,168,104c0,.74,0,1.48.08,2.21l-13.23,4.41A32,32,0,0,0,128,96a32.59,32.59,0,0,0-5.27.44L115.89,81A32,32,0,1,0,96,88a32.59,32.59,0,0,0,5.27-.44l6.84,15.4a31.92,31.92,0,0,0-8.57,39.64L73.83,165.44a32.06,32.06,0,1,0,10.63,12l25.71-22.84a31.91,31.91,0,0,0,37.36-1.24l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32Zm0-64a16,16,0,1,1-16,16A16,16,0,0,1,200,88ZM80,56A16,16,0,1,1,96,72,16,16,0,0,1,80,56ZM56,208a16,16,0,1,1,16-16A16,16,0,0,1,56,208Zm56-80a16,16,0,1,1,16,16A16,16,0,0,1,112,128Zm88,72a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z"></path>
                  </svg>
                  {item.sharedText}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Network Graph Floating Bottom Controls */}
      <div className="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3.5 z-50 pointer-events-none font-sans">
        {/* 1. Zoom Control Block (A gauche sur mobile, A droite cote a cote sur desktop) */}
        <div className="h-10 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shadow-sm pointer-events-auto">
          {/* Zoom Out (-) */}
          <button
            onClick={handleZoomOut}
            title="Dézoomer (-)"
            className="w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* Zoom Percentage Display */}
          <div className="h-full px-2.5 xs:px-3.5 flex items-center justify-center bg-[#EEEEEE] text-[#111111] text-xs sm:text-base font-medium min-w-[48px] sm:min-w-[56px]">
            {currentZoomPercent}%
          </div>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* Zoom In (+) */}
          <button
            onClick={handleZoomIn}
            title="Zoomer (+)"
            className="w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
        </div>

        {/* 2. Recenter Button */}
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
          className="h-10 sm:h-11 px-4 sm:px-6 bg-[#EEEEEE] border-[1.5px] border-[#111111] hover:bg-[#E2E2E2] text-[#111111] text-xs sm:text-base font-medium rounded-full flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shadow-sm pointer-events-auto"
        >
          <Compass className="w-4 h-4 sm:w-4 sm:h-4 text-[#111111] stroke-[2.25]" />
          <span>Recentrer</span>
        </button>
      </div>
    </div>
  );
}
