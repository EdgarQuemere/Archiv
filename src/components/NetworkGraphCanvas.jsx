import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { CoverCard } from './CoverCard';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

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

    // 1. Build Nodes
    const nodes = items.map(item => ({
      ...item,
      // Distribute randomly initially near center
      x: viewportSize.width / 2 + (Math.random() - 0.5) * 400,
      y: viewportSize.height / 2 + (Math.random() - 0.5) * 400,
    }));

    // Color taxonomy logic
    const getCategory = (item) => {
      const tagsStr = (item.tags || []).join(' ').toLowerCase();
      const field = (item.field || '').toLowerCase();
      
      if (tagsStr.includes('biomimétisme') || tagsStr.includes('organique') || tagsStr.includes('nature') || tagsStr.includes('hybride')) {
        return 'Nature'; // Yellow
      }
      if (tagsStr.includes('graphisme') || tagsStr.includes('art') || tagsStr.includes('illustration') || tagsStr.includes('édition') || field.includes('graphique')) {
        return 'Art'; // Blue
      }
      if (tagsStr.includes('tech') || tagsStr.includes('pixel') || tagsStr.includes('ui') || tagsStr.includes('automates') || field.includes('design')) {
        return 'Tech'; // Red
      }
      return 'Autre'; // Gray
    };

    const CATEGORY_COLORS = {
      'Nature': '#FACC15', // Yellow
      'Art': '#3B82F6',    // Blue
      'Tech': '#EF4444',   // Red
      'Autre': '#9CA3AF'   // Gray
    };

    // Color mixing for cross-category links
    const getLinkColor = (catA, catB) => {
      if (catA === catB) return CATEGORY_COLORS[catA] || '#9CA3AF';
      const mix = [catA, catB].sort().join('-');
      switch (mix) {
        case 'Art-Nature': return '#22C55E'; // Blue + Yellow = Green
        case 'Nature-Tech': return '#F97316'; // Yellow + Red = Orange
        case 'Art-Tech': return '#A855F7'; // Blue + Red = Purple
        default: return '#9CA3AF';
      }
    };

    // 2. Build Links based on tags and categories
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let score = 0;
        
        const catA = getCategory(a);
        const catB = getCategory(b);
        
        const aTags = a.tags || [];
        const bTags = b.tags || [];
        const commonTags = aTags.filter(t => bTags.includes(t)).length;
        
        // Link strength strictly based on shared tags and same family
        score += commonTags * 3; // strong bond for shared tags
        if (catA === catB && catA !== 'Autre') {
          score += 1; // minor bond for same family
        }
        
        if (score > 0) {
          links.push({ 
            source: a.id, 
            target: b.id, 
            value: score,
            color: getLinkColor(catA, catB)
          });
        }
      }
    }

    // Ensure no isolated nodes (fake links)
    const connectedNodes = new Set();
    links.forEach(l => {
      connectedNodes.add(l.source);
      connectedNodes.add(l.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        // Find a random other node
        const otherNodes = nodes.filter(n => n.id !== node.id);
        if (otherNodes.length > 0) {
          const randomNode = otherNodes[Math.floor(Math.random() * otherNodes.length)];
          links.push({ 
            source: node.id, 
            target: randomNode.id, 
            value: 0.5,
            color: getLinkColor(getCategory(node), getCategory(randomNode))
          });
          connectedNodes.add(node.id);
          connectedNodes.add(randomNode.id);
        }
      }
    });

    // 3. Initialize Simulation
    const simulation = forceSimulation(nodes)
      // The stronger the relationship (value), the closer they should be
      .force("link", forceLink(links).id(d => d.id).distance(d => 600 / Math.max(d.value, 1)))
      .force("charge", forceManyBody().strength(-2000)) // Repel each other strongly
      .force("center", forceCenter(viewportSize.width / 2, viewportSize.height / 2))
      .force("collide", forceCollide().radius(180)) // Prevent card overlap (approx card radius)
      .on("tick", () => {
        // Trigger React render on tick
        setGraphData({ nodes: [...nodes], links: [...links] });
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [items, viewportSize.width, viewportSize.height]);


  // High performance GSAP Ticker for smooth velocity decay & lerp panning
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
      const dx = Math.abs(newX - current.x);
      const dy = Math.abs(newY - current.y);
      const dz = Math.abs(target.zoom - current.zoom);

      if (dx > 0.01 || dy > 0.01 || dz > 0.001) {
        current.x = newX;
        current.y = newY;
        current.zoom += (target.zoom - current.zoom) * lerpFactor;
        setCamera({ x: newX, y: newY, zoom: current.zoom });
      }
    };

    gsap.ticker.add(updatePhysics);
    return () => gsap.ticker.remove(updatePhysics);
  }, [setCamera]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Zooming (Pinch or Ctrl+Scroll)
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.01;
      const zoomDelta = -e.deltaY * zoomSensitivity;
      
      const oldZoom = targetCamRef.current.zoom;
      let newZoom = oldZoom * Math.exp(zoomDelta);
      
      // Clamp zoom
      newZoom = Math.max(0.1, Math.min(newZoom, 5));
      
      // Zoom into cursor
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate world coordinates under cursor based on CURRENT visual state
      const worldX = (mouseX - currentCamRef.current.x) / currentCamRef.current.zoom;
      const worldY = (mouseY - currentCamRef.current.y) / currentCamRef.current.zoom;
      
      // Set new target zoom and position
      targetCamRef.current.zoom = newZoom;
      targetCamRef.current.x = mouseX - worldX * newZoom;
      targetCamRef.current.y = mouseY - worldY * newZoom;
      
      // Snap current to avoid wobbling when zooming rapidly
      currentCamRef.current.x = targetCamRef.current.x;
      currentCamRef.current.y = targetCamRef.current.y;
      currentCamRef.current.zoom = targetCamRef.current.zoom;
      setCamera({ x: currentCamRef.current.x, y: currentCamRef.current.y, zoom: currentCamRef.current.zoom });

    } else {
      // Panning
      const panSensitivity = 1.1;
      targetCamRef.current.x -= e.deltaX * panSensitivity;
      targetCamRef.current.y -= e.deltaY * panSensitivity;
      if (e.deltaX === 0 && e.deltaY !== 0) {
        targetCamRef.current.y -= e.deltaY * panSensitivity;
      }
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
    const centeredX = viewportSize.width / 2 - x;
    const centeredY = viewportSize.height / 2 - y;

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

  const containerStyle = {
    backgroundColor: '#EEEEEE',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none'
  };

  const cardWidth = 200;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={containerStyle}
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
        {/* SVG layer for connection lines */}
        <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
          {graphData.links.map((link, i) => {
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            // Drooping cable effect (quadratic bezier)
            const cx = (link.source.x + link.target.x) / 2;
            const cy = (link.source.y + link.target.y) / 2 + (dr * 0.2); 
            const pathData = `M ${link.source.x},${link.source.y} Q ${cx},${cy} ${link.target.x},${link.target.y}`;
            
            return (
              <path
                key={i}
                d={pathData}
                fill="none"
                stroke={link.color || "#111111"}
                strokeWidth={Math.max(1.5, link.value * 0.8)}
                strokeOpacity={0.6}
              />
            );
          })}
        </svg>

        {/* Node layer for covers */}
        {graphData.nodes.map((node) => {
          // Center the card on the node's x/y
          const aspectRatio = node.aspectRatio || 1.414;
          const cardHeight = Math.round(cardWidth * Math.min(aspectRatio, 1.71));
          
          const posX = node.x - cardWidth / 2;
          const posY = node.y - cardHeight / 2;

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transform: `translate3d(${posX}px, ${posY}px, 0)`,
                zIndex: 10,
                cursor: 'pointer'
              }}
              onClick={() => handleCardClick(node, node.x, node.y)}
              className="group"
            >
               <div className="w-full h-full relative overflow-visible bg-transparent transform-gpu pointer-events-none transition-transform duration-300 ease-out group-hover:scale-110 group-hover:z-50 shadow-sm group-hover:shadow-2xl">
                <img
                  src={node.coverUrl}
                  alt={node.title}
                  loading="lazy"
                  draggable={false}
                  style={{ WebkitUserDrag: 'none', userSelect: 'none', pointerEvents: 'none' }}
                  className="w-full h-full object-contain block select-none bg-white p-1 border border-[#111111]"
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Recenter Button */}
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
        className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white px-5 py-3 text-sm font-normal tracking-wide rounded-none hover:bg-black transition-colors shadow-none cursor-pointer pointer-events-auto"
      >
        Recentrer la vue
      </button>
    </div>
  );
}
