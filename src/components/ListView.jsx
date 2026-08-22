import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ExternalLink, BookOpen, MapPin, User } from 'lucide-react';
import gsap from 'gsap';

export function ListView({ items, focusedCoverId, onActiveCoverChange, onCardClick, onOpenPublicProfile }) {
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

  // Calculate center ratio: 38% from top on mobile to clear bottom info card, 50% on desktop
  const getCenterRatio = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? 0.38 : 0.50);

  // Find the closest cover element to the viewport center and return its scroll offset
  const findSnapTarget = useCallback(() => {
    const el = containerRef.current;
    if (!el) return null;

    const centerRatio = getCenterRatio();
    const viewportCenter = el.getBoundingClientRect().top + el.clientHeight * centerRatio;
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

    // Calculate the scrollTop that would place this item's center at viewport center line
    const targetScrollTop = closestEl.offsetTop - el.clientHeight * centerRatio + closestEl.offsetHeight / 2;
    return { scrollTop: targetScrollTop, item: closestItem, distance: closestDist };
  }, [infiniteItems]);

  // Distance-based scaling + infinite wrapping
  const updateScrollPhysics = useCallback(() => {
    const el = containerRef.current;
    if (!el || infiniteItems.length === 0) return;

    const centerRatio = getCenterRatio();
    const viewportCenter = el.getBoundingClientRect().top + el.clientHeight * centerRatio;
    const scrollTop = el.scrollTop;

    // Exact vertical distance of 1 full set of items measured between Set 0 Item 0 and Set 1 Item 0
    const firstKeySet0 = infiniteItems[0]?.loopKey;
    const firstKeySet1 = infiniteItems[setLength]?.loopKey;
    const el0 = itemMapRef.current.get(firstKeySet0);
    const el1 = itemMapRef.current.get(firstKeySet1);

    if (el0 && el1 && !isWrappingRef.current) {
      const singleSetHeight = el1.offsetTop - el0.offsetTop;
      const middleSetStartScrollTop = el1.offsetTop - el.clientHeight * centerRatio + el1.offsetHeight / 2;
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

    const dist = Math.abs(el.scrollTop - target.scrollTop);
    // Precise lock: snap down to 0.5px offset to eliminate deadzones near center
    if (dist < 0.5) return;

    isSnappingRef.current = true;

    if (snapTweenRef.current) snapTweenRef.current.kill();

    // Magnetism force dynamics:
    // Near center (< 120px): Strong, tactile, crisp snap (duration ~ 0.28s to 0.35s)
    // Near extremities / edges: Smooth progressive magnetic pull (duration ~ 0.4s to 0.52s)
    const normalizedDist = Math.min(dist / 250, 1.0);
    const duration = 0.28 + 0.24 * normalizedDist;
    const ease = normalizedDist < 0.4 ? 'back.out(1.2)' : 'power2.out';

    snapTweenRef.current = gsap.to(el, {
      scrollTop: target.scrollTop,
      duration: duration,
      ease: ease,
      onUpdate: () => {
        updateScrollPhysics();
      },
      onComplete: () => {
        isSnappingRef.current = false;
        snapTweenRef.current = null;
      }
    });
  }, [findSnapTarget, updateScrollPhysics]);

  // Schedule a snap after scroll goes idle (120ms idle timeout for high responsiveness)
  const scheduleSnap = useCallback((delay = 120) => {
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = setTimeout(() => {
      if (!isUserDraggingRef.current) {
        snapToNearest();
      }
    }, delay);
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

  // Track mount state to prevent layoutEffect from re-teleporting on internal cover changes
  const isInitialMountedRef = useRef(false);
  const prevItemsRef = useRef(items);
  if (prevItemsRef.current !== items) {
    prevItemsRef.current = items;
    isInitialMountedRef.current = false;
  }

  // Position initial center cover ONCE on mount or when items change
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || infiniteItems.length === 0) return;

    if (isInitialMountedRef.current) return;
    isInitialMountedRef.current = true;

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
        const centerRatio = getCenterRatio();
        const offset = targetEl.offsetTop - containerRect.height * centerRatio + targetEl.offsetHeight / 2;
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
      scheduleSnap(20);
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
        <img
          src="/sad-spongebob.webp"
          alt="Aucun résultat"
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-4 filter drop-shadow-md select-none pointer-events-none"
        />
        <h3 className="text-xl font-bold text-[#111111] mb-1">Aucun résultat trouvé</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
          Essayez de modifier vos critères de recherche<br />ou réinitialisez les filtres.
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
      <div className="fixed top-[38%] sm:top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 bg-[#111111]/35 pointer-events-none z-0" />

      {/* Centered Covers Column */}
      <div className="relative z-10 max-w-md mx-auto py-[38vh] sm:py-[42vh] px-4 flex flex-col items-center gap-12 sm:gap-16">
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
            <div className="w-56 sm:w-72 h-[320px] sm:h-[420px] bg-transparent flex items-center justify-center overflow-hidden">
              <img
                src={item.coverUrl}
                alt={item.title}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{ WebkitUserDrag: 'none', userSelect: 'none' }}
                className="w-full h-full object-contain block select-none pointer-events-none hover:scale-[1.02] transition-transform"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom-Right Information Card (Right-aligned text style) */}
      {currentInfoItem && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-30 sm:w-[400px] max-w-[calc(100vw-2rem)] text-center sm:text-right font-sans text-[#111111] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="flex flex-col items-center sm:items-end gap-1 pointer-events-auto bg-[#EEEEEE] sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-4 sm:p-0 rounded-[16px] sm:rounded-none border-[1.5px] border-[#111111] sm:border-0 shadow-lg sm:shadow-none">
            <h3 className="text-base sm:text-xl font-bold leading-tight mb-0.5 sm:mb-1">
              {currentInfoItem.title}
            </h3>

            <p className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">
              par <span onClick={() => onOpenPublicProfile && onOpenPublicProfile(currentInfoItem.author)} className="underline cursor-pointer hover:opacity-80 font-bold">{currentInfoItem.author}</span>
            </p>

            <p className="text-[11px] sm:text-xs font-mono mb-2 sm:mb-4 text-slate-600">
              {currentInfoItem.school} — {currentInfoItem.year} • {currentInfoItem.field}
            </p>

            {currentInfoItem.abstract && (
              <p className="text-sm text-slate-700 leading-relaxed mb-4 text-right">
                {currentInfoItem.abstract}
              </p>
            )}

            <button
              onClick={() => onCardClick(currentInfoItem)}
              className="inline-flex items-center gap-2 h-10 sm:h-11 px-6 sm:px-8 bg-[#EEEEEE] border-[1.5px] border-[#111111] hover:bg-[#E2E2E2] text-[#111111] text-sm sm:text-base font-medium rounded-full transition-colors mt-2 shadow-sm cursor-pointer"
            >
              <span>Consulter</span>
              <ExternalLink className="w-4 h-4 stroke-[2.25]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
