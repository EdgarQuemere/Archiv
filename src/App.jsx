import React, { useState, useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { ListView } from './components/ListView';
import { Navbar } from './components/Navbar';
import { FilterDrawer } from './components/FilterDrawer';
import { DetailModal } from './components/DetailModal';
import { SubmitModal } from './components/SubmitModal';
import { COVERS_DATA } from './data/coversData';
import { DEFAULT_GAP } from './utils/gridAlgorithm';

// Fisher-Yates Shuffle algorithm for randomizing memory covers
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function App() {
  // Randomize initial covers dataset
  const [covers, setCovers] = useState(() => shuffleArray(COVERS_DATA));
  const [activeView, setActiveView] = useState('canvas'); // 'canvas' | 'list'
  const [focusedCoverId, setFocusedCoverId] = useState(null); // Keeps track of last viewed cover in List mode
  const mainContainerRef = useRef(null);
  
  // Camera state locked at 1.0 zoom
  const [camera, setCamera] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - 125 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 - 177 : 0,
    zoom: 1.0
  });

  // Gap Size state (Defaulted to 140px)
  const [gap] = useState(DEFAULT_GAP);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'Tous',
    school: 'Toutes les écoles',
    field: 'Tous les domaines',
    year: 'Toutes'
  });

  // Modals & Drawers state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // GSAP View Transition Animation on activeView change
  useEffect(() => {
    if (mainContainerRef.current) {
      gsap.fromTo(
        mainContainerRef.current,
        { opacity: 0.3, scale: 0.985 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [activeView]);

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      type: 'Tous',
      school: 'Toutes les écoles',
      field: 'Tous les domaines',
      year: 'Toutes'
    });
    setSearchQuery('');
  };

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'Tous') count++;
    if (filters.school !== 'Toutes les écoles') count++;
    if (filters.field !== 'Tous les domaines') count++;
    if (filters.year !== 'Toutes') count++;
    if (searchQuery.trim().length > 0) count++;
    return count;
  }, [filters, searchQuery]);

  // Filtered dataset
  const filteredCovers = useMemo(() => {
    return covers.filter((item) => {
      // Type filter
      if (filters.type !== 'Tous' && item.type !== filters.type) return false;
      // School filter
      if (filters.school !== 'Toutes les écoles' && item.school !== filters.school) return false;
      // Field filter
      if (filters.field !== 'Tous les domaines' && item.field !== filters.field) return false;
      // Year filter
      if (filters.year !== 'Toutes' && item.year !== filters.year) return false;

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesAuthor = item.author.toLowerCase().includes(q);
        const matchesSchool = item.school.toLowerCase().includes(q);
        const matchesField = item.field.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAuthor && !matchesSchool && !matchesField && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [covers, filters, searchQuery]);

  // Handle adding new cover submission
  const handleAddCover = (newCover) => {
    setCovers((prev) => [newCover, ...prev]);
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative font-sans select-none bg-[#EEEEEE] text-[#111111]">
      
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenFilter={() => setIsFilterOpen(true)}
        onOpenSubmit={() => setIsSubmitOpen(true)}
        activeFilterCount={activeFilterCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Viewport Content */}
      <main ref={mainContainerRef} className="w-full h-full transform-gpu">
        {activeView === 'canvas' ? (
          <InfiniteCanvas
            items={filteredCovers}
            gap={gap}
            camera={camera}
            setCamera={setCamera}
            onCardClick={(item) => setSelectedCard(item)}
          />
        ) : (
          <ListView
            items={filteredCovers}
            focusedCoverId={focusedCoverId}
            onActiveCoverChange={(id) => setFocusedCoverId(id)}
            onCardClick={(item) => setSelectedCard(item)}
          />
        )}
      </main>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resetFilters={handleResetFilters}
        totalResults={filteredCovers.length}
      />

      {/* Detail Lightbox Modal */}
      <DetailModal
        item={selectedCard}
        onClose={() => setSelectedCard(null)}
      />

      {/* Submit Cover Modal */}
      <SubmitModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onAddCover={handleAddCover}
      />

    </div>
  );
}
export default App;
