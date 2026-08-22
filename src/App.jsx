import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import gsap from 'gsap';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { NetworkGraphCanvas } from './components/NetworkGraphCanvas';
import { ListView } from './components/ListView';
import { Navbar } from './components/Navbar';
import { FilterDrawer } from './components/FilterDrawer';
import { ProfileDrawer } from './components/ProfileDrawer';
import { InfoModal } from './components/InfoModal';
import { ProjectDetailView } from './components/ProjectDetailView';
import { SubmitModal } from './components/SubmitModal';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { OmniscientCallback } from './components/auth/OmniscientCallback';
import AdminDashboard from './components/admin/AdminDashboard';
import { AuthContext } from './context/AuthContext';
import axios from './api/axios';
import { Toaster } from 'sonner';

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
  const [covers, setCovers] = useState([]);
  const [activeView, setActiveView] = useState('canvas'); // 'canvas' | 'network' | 'list'
  const [focusedCoverId, setFocusedCoverId] = useState(null); // Keeps track of last viewed cover in List mode
  const mainContainerRef = useRef(null);
  
  // Camera state locked at 1.0 zoom
  const [camera, setCamera] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - 125 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 - 177 : 0,
    zoom: 1.0
  });

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('complete_profile=true')) {
      setIsRegisterOpen(true);
    }
  }, []);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editProjectData, setEditProjectData] = useState(null); // Used to pass data to SubmitModal for editing

  const { user, logout } = useContext(AuthContext);

  // Deep Linking: Update URL when a project is selected/closed
  useEffect(() => {
    if (selectedCard) {
      const url = new URL(window.location);
      url.searchParams.set('project', selectedCard.id);
      window.history.pushState({}, '', url);
    } else {
      const url = new URL(window.location);
      url.searchParams.delete('project');
      window.history.pushState({}, '', url);
    }
  }, [selectedCard]);

  // Deep Linking: Check URL on mount and fetch specific project
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');
    
    if (projectId) {
      const fetchSpecificProject = async () => {
        try {
          const response = await axios.get(`/projects/${projectId}`);
          if (response.data && response.data.project) {
            const p = response.data.project;
            const formatted = {
              id: p.id,
              title: p.title,
              author: p.author ? p.author.name : 'Unknown',
              authorProfilePicture: p.author ? p.author.profilePicture : null,
              school: p.school,
              year: p.year.toString(),
              type: p.type,
              field: p.domain ? (p.domain.name || p.domain) : 'Inconnu',
              description: p.description,
              coverUrl: p.coverUrl,
              imageUrl: p.coverUrl,
              pdfUrl: p.pdfUrl,
              pdfSize: p.pdfSize || 'Inconnu',
              userId: p.userId,
              tags: [],
              date: p.createdAt
            };
            setSelectedCard(formatted);
          }
        } catch (err) {
          console.error("Erreur lors de la récupération du projet spécifique (Deep Link):", err);
        }
      };
      fetchSpecificProject();
    }
  }, []); // Run once on mount

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

  // Fetch projects from backend (Progressive Loading)
  useEffect(() => {
    let isCancelled = false;

    const fetchProjectsProgressively = async (page = 1) => {
      if (isCancelled) return;
      try {
        // Load 40 projects per batch
        const response = await axios.get(`/projects?limit=40&page=${page}`);
        if (response.data && response.data.projects) {
          const formattedProjects = response.data.projects.map(p => ({
            id: p.id,
            title: p.title,
            author: p.author ? `${p.author.firstName || ''} ${p.author.lastName || ''}`.trim() : 'Unknown',
            authorProfilePicture: p.author ? p.author.profilePicture : null,
            isOmniscient: p.author ? p.author.isOmniscient : false,
            school: p.school,
            year: p.year.toString(),
            type: p.type,
            field: p.domain ? (p.domain.name || p.domain) : 'Inconnu',
            // Excluded heavy fields from list: description, pdfUrl, pdfSize
            coverUrl: p.coverUrl,
            imageUrl: p.coverUrl,
            userId: p.userId,
            tags: [],
            date: p.createdAt
          }));
          
          setCovers(prev => {
            // Deduplicate by ID to prevent duplicate keys in Strict Mode
            const prevIds = new Set(prev.map(p => p.id));
            const uniqueNew = formattedProjects.filter(p => !prevIds.has(p.id));
            if (uniqueNew.length === 0) return prev;
            
            // Append new projects and shuffle the whole set to blend them in seamlessly
            const newSet = [...prev, ...uniqueNew];
            return shuffleArray(newSet);
          });

          // If there are more pages, fetch the next one progressively in the background
          if (page < response.data.totalPages) {
            // Small delay to allow browser to breathe and render images without blocking UI
            setTimeout(() => {
              fetchProjectsProgressively(page + 1);
            }, 300);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération progressive des projets:", error);
      }
    };

    fetchProjectsProgressively(1);

    return () => {
      isCancelled = true;
    };
  }, []);

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

  // Fetch full details on card click
  const handleCardClick = async (item) => {
    // If we already fetched the heavy fields (e.g. from Deep Linking), open it directly
    if (item.pdfUrl) {
      setSelectedCard(item);
      return;
    }

    try {
      const response = await axios.get(`/projects/${item.id}`);
      if (response.data && response.data.project) {
        const p = response.data.project;
        const formatted = {
          id: p.id,
          title: p.title,
          author: p.author ? `${p.author.firstName || ''} ${p.author.lastName || ''}`.trim() : 'Unknown',
          authorProfilePicture: p.author ? p.author.profilePicture : null,
          school: p.school,
          year: p.year.toString(),
          type: p.type,
          field: p.domain ? (p.domain.name || p.domain) : 'Inconnu',
          description: p.description,
          coverUrl: p.coverUrl,
          imageUrl: p.coverUrl,
          pdfUrl: p.pdfUrl,
          pdfSize: p.pdfSize || 'Inconnu',
          userId: p.userId,
          tags: [],
          date: p.createdAt
        };
        // Update it in the local state so we don't re-fetch later
        setCovers(prev => prev.map(c => c.id === item.id ? formatted : c));
        setSelectedCard(formatted);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err);
      setSelectedCard(item); // Fallback
    }
  };

  // Extract dynamic unique values for filters based on fetched data
  const dynamicSchools = useMemo(() => {
    const schools = new Set(covers.map(c => c.school).filter(Boolean));
    return ['Toutes les écoles', ...Array.from(schools).sort()];
  }, [covers]);

  const dynamicFields = useMemo(() => {
    const fields = new Set(covers.map(c => c.field).filter(Boolean));
    return ['Tous les domaines', ...Array.from(fields).sort()];
  }, [covers]);

  const dynamicYears = useMemo(() => {
    const years = new Set(covers.map(c => c.year).filter(Boolean));
    // Sort years descending (newest first)
    return ['Toutes', ...Array.from(years).sort((a, b) => b.localeCompare(a))];
  }, [covers]);

  const dynamicTypes = useMemo(() => {
    const types = new Set(covers.map(c => c.type).filter(Boolean));
    return ['Tous', ...Array.from(types).sort()];
  }, [covers]);

  // Handle adding new cover submission
  const handleAddCover = (newCover) => {
    setCovers((prev) => [newCover, ...prev]);
  };

  // Handle OAuth Callbacks simply by checking path
  if (window.location.pathname === '/auth/omniscient/callback') {
    return <OmniscientCallback />;
  }

  if (window.location.pathname === '/admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative font-sans select-none bg-[#EEEEEE] text-[#111111]">
      
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenFilter={() => setIsFilterOpen(prev => !prev)}
        isFilterOpen={isFilterOpen}
        onOpenInfo={() => setIsInfoOpen(prev => !prev)}
        isInfoOpen={isInfoOpen}
        onOpenSubmit={() => {
          if (user) {
            setEditProjectData(null); // Ensure it's not in edit mode
            setIsSubmitOpen(true);
          } else {
            setIsLoginOpen(true);
          }
        }}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        isProfileOpen={isProfileOpen}
        user={user}
        logout={logout}
        activeFilterCount={activeFilterCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Viewport Content */}
      <main ref={mainContainerRef} className="w-full h-full transform-gpu relative">
        {filteredCovers.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#EEEEEE] text-[#111111] font-sans">
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
        ) : activeView === 'canvas' ? (
          <InfiniteCanvas
            items={filteredCovers}
            camera={camera}
            setCamera={setCamera}
            onCardClick={handleCardClick}
          />
        ) : activeView === 'network' ? (
          <NetworkGraphCanvas
            items={filteredCovers}
            camera={camera}
            setCamera={setCamera}
            onCardClick={handleCardClick}
          />
        ) : (
          <ListView
            items={filteredCovers}
            focusedCoverId={focusedCoverId}
            onActiveCoverChange={(id) => setFocusedCoverId(id)}
            onCardClick={handleCardClick}
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
        dynamicSchools={dynamicSchools}
        dynamicFields={dynamicFields}
        dynamicYears={dynamicYears}
        dynamicTypes={dynamicTypes}
      />

      {/* Full-screen Project View with PDF Reader */}
      {selectedCard && (
        <ProjectDetailView
          item={selectedCard}
          onClose={() => setSelectedCard(null)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenInfo={() => setIsInfoOpen(true)}
        />
      )}

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        user={user}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        logout={logout}
        covers={covers}
        onOpenInfo={() => setIsInfoOpen(true)}
        onEditProject={(project) => {
          setEditProjectData(project);
          setIsSubmitOpen(true);
        }}
        onDeleteProject={(projectId) => {
          setCovers(prev => prev.filter(c => c.id !== projectId));
        }}
      />

      {/* Submit/Edit Cover Modal */}
      <SubmitModal
        isOpen={isSubmitOpen}
        onClose={() => {
          setIsSubmitOpen(false);
          setTimeout(() => setEditProjectData(null), 300); // clear after animation
        }}
        onAddCover={handleAddCover}
        editData={editProjectData}
        onUpdateCover={(updatedProject) => {
          setCovers(prev => prev.map(c => c.id === updatedProject.id ? updatedProject : c));
        }}
      />

      {/* Auth Modals */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onSuccess={() => setIsSubmitOpen(true)} // Open submit right after login
      />
      
      <RegisterModal 
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSuccess={() => setIsSubmitOpen(true)} // Open submit right after register
      />

      <Toaster position="bottom-center" />
    </div>
  );
}
export default App;
