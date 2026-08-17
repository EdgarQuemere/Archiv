import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ExternalLink, BookOpen, MapPin, User } from 'lucide-react';
import gsap from 'gsap';

export function ListView({ items, focusedCoverId, onActiveCoverChange, onCardClick }) {
  const containerRef = useRef(null);
  const itemMapRef = useRef(new Map());
  const activeItemRef = useRef(null);
  const rAFRef = useRef(null);
  const isWrappingRef = useRef(false);
  const [activeItem, setActiveItem] = useState(null);

  // Magnetism state refs — GSAP-driven ultra-smooth snap
  const scrollIdleTimerRef = useRef(null);
  const isUserDraggingRef = useRef(false);
  const isSnappingRef = useRef(false);
  const wrapCooldownRef = useRef(false); // blocks snaps right after a wrap
  const snapTweenRef = useRef(null);

  // Triple items array for seamless infinite looping scroll (Set 0, Set 1, Set 2)
  // Small item lists (e.g. 1 filter result) are repeated within each set to ensure total set height > viewport height
  const { infiniteItems, setLength } = useMemo(() => {
    if (!items || items.length === 0) return { infiniteItems: [], setLength: 0 };

    const repeatFactor = Math.ceil(8 / items.length);
    const expandedItems = [];
    for (let r = 0; r < repeatFactor; r++) {
      items.forEach((item) => expandedItems.push(item));
    }

    const repeated = [];
    for (let setIndex = 0; setIndex < 3; setIndex++) {
      expandedItems.forEach((item, idx) => {
        repeated.push({
          ...item,
          loopKey: `set${setIndex}-${item.id}-${idx}`,
          originalId: item.id
        });
      });
    }
    return { infiniteItems: repeated, setLength: expandedItems.length };
  }, [items]);

  // Find the closest cover element to the viewport center and return its scroll offset
  const findSnapTarget = useCallback(() => {
    const el = containerRef.current;
    if (!el) return null;

    const viewportCenter = el.getBoundingClientRect().top + el.clientHeight / 2;
    let closestEl = null;
    let closestDist = Infinity;
    let closestItem = null;

    itemMapRef.current.forEach((itemEl, loopKey) => {
      if (!itemEl) return;
      const rect = itemEl.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const dist = Math.abs(itemCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestEl = itemEl;
        closestItem = infiniteItems.find(it => it.loopKey === loopKey) || null;
      }
    });

    if (!closestEl) return null;

    // Calculate the scrollTop that would place this item's center at viewport center
    const targetScrollTop = closestEl.offsetTop - el.clientHeight / 2 + closestEl.offsetHeight / 2;
    return { scrollTop: targetScrollTop, item: closestItem, distance: closestDist };
  }, [infiniteItems]);

  // Distance-based scaling + infinite wrapping
  const updateScrollPhysics = useCallback(() => {
    const el = containerRef.current;
    if (!el || infiniteItems.length === 0) return;

    const viewportCenter = el.getBoundingClientRect().top + el.clientHeight / 2;
    const scrollTop = el.scrollTop;

    // Exact vertical distance of 1 full set of items measured between Set 0 Item 0 and Set 1 Item 0
    const firstKeySet0 = infiniteItems[0]?.loopKey;
    const firstKeySet1 = infiniteItems[setLength]?.loopKey;
    const el0 = itemMapRef.current.get(firstKeySet0);
    const el1 = itemMapRef.current.get(firstKeySet1);

    if (el0 && el1 && !isWrappingRef.current) {
      const singleSetHeight = el1.offsetTop - el0.offsetTop;
      const middleSetStartScrollTop = el1.offsetTop - el.clientHeight / 2 + el1.offsetHeight / 2;
      const diff = scrollTop - middleSetStartScrollTop;

      // Wrap symmetrically whenever scroll strays too far into Set 0 or Set 2
      if (diff < -singleSetHeight / 2) {
        isWrappingRef.current = true;
        wrapCooldownRef.current = true;
        if (snapTweenRef.current) snapTweenRef.current.kill();
        if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
        isSnappingRef.current = false;
        el.scrollTop += singleSetHeight;
        requestAnimationFrame(() => {
          isWrappingRef.current = false;
          setTimeout(() => { wrapCooldownRef.current = false; }, 300);
        });
      } else if (diff > singleSetHeight / 2) {
        isWrappingRef.current = true;
        wrapCooldownRef.current = true;
        if (snapTweenRef.current) snapTweenRef.current.kill();
        if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
        isSnappingRef.current = false;
        el.scrollTop -= singleSetHeight;
        requestAnimationFrame(() => {
          isWrappingRef.current = false;
          setTimeout(() => { wrapCooldownRef.current = false; }, 300);
        });
      }
    }

    let closestItem = null;
    let minDistance = Infinity;
    const maxRange = el.clientHeight * 0.40;

    // Apply distance-based scale and opacity
    itemMapRef.current.forEach((itemEl, loopKey) => {
      if (!itemEl) return;
      const rect = itemEl.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const dist = Math.abs(itemCenter - viewportCenter);

      const normalizedDist = Math.min(dist / maxRange, 1.0);
      
      // Scale (1.10 at center, 0.85 when far) and opacity (1.0 at center, 0.50 when far)
      const scale = 0.85 + 0.25 * Math.cos(normalizedDist * (Math.PI / 2));
      const opacity = 0.50 + 0.50 * Math.cos(normalizedDist * (Math.PI / 2));

      itemEl.style.transform = `scale(${scale})`;
      itemEl.style.opacity = `${opacity}`;

      if (dist < minDistance) {
        minDistance = dist;
        const itemObj = infiniteItems.find(it => it.loopKey === loopKey);
        if (itemObj) closestItem = itemObj;
      }
    });

    // Update bottom-right info card for whichever cover is currently nearest the center line
    if (closestItem && activeItemRef.current?.loopKey !== closestItem.loopKey) {
      activeItemRef.current = closestItem;
      setActiveItem(closestItem);
      if (onActiveCoverChange) {
        onActiveCoverChange(closestItem.originalId);
      }
    }
  }, [infiniteItems, setLength, onActiveCoverChange]);

  // Ultra-smooth GSAP magnetic snap to center
  const snapToNearest = useCallback(() => {
    const el = containerRef.current;
    if (!el || isUserDraggingRef.current || isWrappingRef.current || wrapCooldownRef.current) return;

    const target = findSnapTarget();
    if (!target) return;

    // Don't snap if already within 2px
    if (Math.abs(el.scrollTop - target.scrollTop) < 2) return;

    isSnappingRef.current = true;

    if (snapTweenRef.current) snapTweenRef.current.kill();

    snapTweenRef.current = gsap.to(el, {
      scrollTop: target.scrollTop,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        updateScrollPhysics();
      },
      onComplete: () => {
        isSnappingRef.current = false;
        snapTweenRef.current = null;
      }
    });
  }, [findSnapTarget, updateScrollPhysics]);

  // Schedule a snap after scroll goes idle
  const scheduleSnap = useCallback(() => {
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = setTimeout(() => {
      if (!isUserDraggingRef.current) {
        snapToNearest();
      }
    }, 80);
  }, [snapToNearest]);

  // Scroll handler: update visuals + schedule snap
  const onScroll = useCallback(() => {
    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    rAFRef.current = requestAnimationFrame(updateScrollPhysics);

    // Only schedule snap if this scroll wasn't caused by our own snapping or a wrap
    if (!isSnappingRef.current && !isWrappingRef.current && !wrapCooldownRef.current) {
      scheduleSnap();
    }
  }, [updateScrollPhysics, scheduleSnap]);

  // Position initial center cover instantly without visual scrolling sweep animation
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || infiniteItems.length === 0) return;

    let targetIndexInItems = 0;
    if (focusedCoverId !== null && focusedCoverId !== undefined) {
      const foundIdx = items.findIndex(it => it.id === focusedCoverId);
      if (foundIdx !== -1) targetIndexInItems = foundIdx;
    }

    const targetLoopIndex = setLength + targetIndexInItems;
    const targetLoopKey = infiniteItems[targetLoopIndex]?.loopKey;

    const setInstantPosition = () => {
      const targetEl = itemMapRef.current.get(targetLoopKey);
      if (targetEl) {
        const containerRect = el.getBoundingClientRect();
        const offset = targetEl.offsetTop - containerRect.height / 2 + targetEl.offsetHeight / 2;
        el.style.scrollBehavior = 'auto';
        el.scrollTop = offset;
        updateScrollPhysics();
      }
    };

    setInstantPosition();
    const frameId = requestAnimationFrame(setInstantPosition);
    return () => cancelAnimationFrame(frameId);
  }, [items, infiniteItems, setLength, focusedCoverId, updateScrollPhysics]);

  // Set up scroll + pointer listeners for magnetism
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Interrupt snap animation if user starts interacting
    const stopActiveSnap = () => {
      if (snapTweenRef.current) {
        snapTweenRef.current.kill();
        snapTweenRef.current = null;
      }
    };

    const onPointerDown = () => {
      isUserDraggingRef.current = true;
      isSnappingRef.current = false;
      stopActiveSnap();
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    };

    const onPointerUp = () => {
      isUserDraggingRef.current = false;
      scheduleSnap();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('mousedown', onPointerDown, { passive: true });
    window.addEventListener('mouseup', onPointerUp, { passive: true });
    el.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    const onWheel = () => {
      stopActiveSnap();
      isSnappingRef.current = false;
      scheduleSnap();
    };
    el.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      el.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchend', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      stopActiveSnap();
    };
  }, [onScroll, scheduleSnap]);

  if (!items || items.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#EEEEEE] text-[#111111]">
        <BookOpen className="w-12 h-12 text-[#111111] mb-3 opacity-60 animate-bounce" />
        <h3 className="text-lg font-bold text-[#111111]">Aucun résultat trouvé</h3>
        <p className="text-xs text-slate-600 max-w-sm mt-1">
          Essayez de modifier vos critères de recherche ou réinitialisez les filtres.
        </p>
      </div>
    );
  }

  const currentInfoItem = activeItem || items[0];

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#EEEEEE',
      }}
      className="relative w-full h-full overflow-y-auto font-sans text-[#111111] select-none scrollbar-none"
    >
      {/* Fine Horizontal Center Line across the viewport */}
      <div className="fixed top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 bg-[#111111]/35 pointer-events-none z-0" />

      {/* Centered Covers Column */}
      <div className="relative z-10 max-w-md mx-auto py-[42vh] px-4 flex flex-col items-center gap-16">
        {infiniteItems.map((item) => (
          <div
            key={item.loopKey}
            ref={(el) => {
              if (el) itemMapRef.current.set(item.loopKey, el);
              else itemMapRef.current.delete(item.loopKey);
            }}
            onClick={() => onCardClick(item)}
            style={{
              transformOrigin: 'center center',
              willChange: 'transform, opacity'
            }}
            className="cursor-pointer flex flex-col items-center py-2"
          >
            {/* Clean Raw Cover Image Container */}
            <div className="w-64 sm:w-72 h-[380px] sm:h-[420px] bg-transparent flex items-center justify-center overflow-hidden">
              <img
                src={item.coverUrl}
                alt={item.title}
                loading="eager"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{ WebkitUserDrag: 'none', userSelect: 'none' }}
                className="w-full h-full object-contain block select-none pointer-events-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom-Right Information Card */}
      {currentInfoItem && (
        <div className="fixed bottom-8 right-8 z-30 bg-[#EEEEEE] border-2 border-[#111111] p-5 w-80 shadow-2xl font-sans text-[#111111] rounded-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1 text-[#111111]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#111111]" />
              {currentInfoItem.school}
            </span>
            <span>{currentInfoItem.year}</span>
          </div>

          <h3 className="text-base font-bold text-[#111111] leading-snug mb-1 line-clamp-2">
            {currentInfoItem.title}
          </h3>

          <p className="text-xs text-slate-700 font-medium mb-3 flex items-center gap-1">
            <User className="w-3 h-3 text-slate-500" />
            <span>par {currentInfoItem.author}</span>
          </p>

          <div className="flex items-center justify-between pt-3 border-t-2 border-[#111111]">
            <span className="text-[10px] bg-white border border-[#111111] text-[#111111] px-2 py-0.5 font-mono">
              {currentInfoItem.field}
            </span>

            <button
              onClick={() => onCardClick(currentInfoItem)}
              className="h-8 px-3.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors"
            >
              <span>Consulter</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
