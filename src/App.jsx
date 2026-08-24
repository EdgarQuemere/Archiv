import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import gsap from 'gsap';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { NetworkGraphCanvas } from './components/NetworkGraphCanvas';
import { ListView } from './components/ListView';
import { Navbar } from './components/Navbar';
import { FilterDrawer } from './components/FilterDrawer';
import { ProfileDrawer } from './components/ProfileDrawer';
import { PublicProfileDrawer } from './components/PublicProfileDrawer';
import { InfoModal } from './components/InfoModal';
import { ProjectDetailView } from './components/ProjectDetailView';
import { SubmitModal } from './components/SubmitModal';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ResetPassword } from './components/auth/ResetPassword';
import { VerifyEmail } from './components/auth/VerifyEmail';
import { OmniscientCallback } from './components/auth/OmniscientCallback';
import SEO from './components/SEO';
import AdminDashboard from './components/admin/AdminDashboard';
import { MentionsLegales } from './components/MentionsLegales';
import { AuthContext } from './context/AuthContext';
import axios from './api/axios';
import { Toaster } from 'sonner';


// Algorithme de mélange Fisher-Yates
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
  </svg>
);

// Formatage standardisé des données d'un projet
const formatProjectData = (p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  authorPseudo: p.author?.pseudo || p.userId,
  authorProfilePicture: p.author ? p.author.profilePicture : null,
  isOmniscient: p.author ? p.author.isOmniscient : false,
  school: p.school,
  year: p.year ? p.year.toString() : '',
  type: p.type,
  field: p.domain ? (p.domain.name || p.domain) : 'Inconnu',
  description: p.description,
  coverUrl: p.coverUrl,
  imageUrl: p.coverUrl,
  pdfUrl: p.pdfUrl,
  pdfSize: p.pdfSize || 'Inconnu',
  orientation: p.orientation,
  aspectRatio: p.aspectRatio,
  allowDownload: p.allowDownload,
  userId: p.userId,
  tags: [],
  date: p.createdAt
});

export function App() {
  const [covers, setCovers] = useState([]);
  const [activeView, setActiveView] = useState('canvas'); // 'canvas' | 'network' | 'list'
  const [focusedCoverId, setFocusedCoverId] = useState(null);
  const mainContainerRef = useRef(null);
  const [isOAuthCompletion, setIsOAuthCompletion] = useState(false);

  // État de la caméra verrouillée
  const [camera, setCamera] = useState({
    x: typeof window !== 'undefined' ? Math.round(window.innerWidth / 2 - 110) : 0,
    y: typeof window !== 'undefined' ? Math.round(window.innerHeight / 2 - 130) : 0,
    zoom: 1.0
  });

  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'Tous',
    school: 'Toutes les écoles',
    field: 'Tous les domaines',
    year: 'Toutes'
  });

  // États des tiroirs et fenêtres modales
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPublicProfileOpen, setIsPublicProfileOpen] = useState(false);
  const [publicProfileUserId, setPublicProfileUserId] = useState(null);

  const [selectedCard, setSelectedCard] = useState(null);
  const [editProjectData, setEditProjectData] = useState(null);

  const { user, logout } = useContext(AuthContext);

  // 🚀 1. Détection initiale unique au chargement (Routes directes)
  useEffect(() => {
    const pathname = window.location.pathname;

    if (pathname === '/info') {
      setIsInfoOpen(true);
    } else if (pathname === '/connexion' || pathname === '/login') {
      setIsLoginOpen(true);
    } else if (pathname === '/inscription' || pathname === '/register') {
      setIsRegisterOpen(true);
    } else if (pathname.startsWith('/projet/')) {
      const identifier = pathname.replace('/projet/', '').trim();
      if (identifier) {
        axios.get(`/projects/${identifier}`)
          .then((res) => {
            if (res.data && res.data.project) {
              setSelectedCard(formatProjectData(res.data.project));
            }
          })
          .catch((err) => console.error("Erreur chargement direct projet :", err));
      }
    } else if (pathname.startsWith('/profil/')) {
      const profileId = decodeURIComponent(pathname.replace('/profil/', '').trim());
      if (profileId) {
        setPublicProfileUserId(profileId);
        setIsPublicProfileOpen(true);
      }
    }

    if (window.location.search.includes('complete_profile=true')) {
      setIsOAuthCompletion(true);
      setIsRegisterOpen(true);
      const url = new URL(window.location);
      url.searchParams.delete('complete_profile');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []);

  // --- Handlers de navigation / synchronisation URL ---

  // Modal Info
  const handleOpenInfo = () => {
    setIsInfoOpen(true);
    if (window.location.pathname !== '/info') {
      window.history.pushState(null, '', '/info');
    }
  };

  const handleCloseInfo = () => {
    setIsInfoOpen(false);
    if (window.location.pathname === '/info') {
      window.history.pushState(null, '', '/');
    }
  };

  // Profil public
  const handleOpenPublicProfile = (userIdOrPseudo) => {
    setPublicProfileUserId(userIdOrPseudo);
    setIsPublicProfileOpen(true);
    const targetUrl = `/profil/${encodeURIComponent(userIdOrPseudo)}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  };

  const handleClosePublicProfile = () => {
    setIsPublicProfileOpen(false);
    setPublicProfileUserId(null);
    if (window.location.pathname.startsWith('/profil/')) {
      window.history.pushState(null, '', '/');
    }
  };

  // Modal Connexion
  const handleOpenLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
    if (window.location.pathname !== '/connexion') {
      window.history.pushState(null, '', '/connexion');
    }
  };

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    if (window.location.pathname === '/connexion' || window.location.pathname === '/login') {
      window.history.pushState(null, '', '/');
    }
  };

  // Modal Inscription
  const handleOpenRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
    if (window.location.pathname !== '/inscription') {
      window.history.pushState(null, '', '/inscription');
    }
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
    if (window.location.pathname === '/inscription' || window.location.pathname === '/register') {
      window.history.pushState(null, '', '/');
    }
  };

  // Clic sur une carte projet
  const handleCardClick = async (item) => {
    const projectSlug = item.slug || item.id;
    window.history.pushState(null, '', `/projet/${projectSlug}`);

    if (item.pdfUrl) {
      setSelectedCard(item);
      return;
    }

    try {
      const response = await axios.get(`/projects/${projectSlug}`);
      if (response.data && response.data.project) {
        const formatted = formatProjectData(response.data.project);
        setCovers((prev) => prev.map((c) => (c.id === item.id ? formatted : c)));
        setSelectedCard(formatted);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des détails :", err);
      setSelectedCard(item);
    }
  };

  // Fermeture de la vue projet
  const handleCloseProject = () => {
    setSelectedCard(null);
    if (window.location.pathname.startsWith('/projet/')) {
      window.history.pushState(null, '', '/');
    }
  };

  // 🚀 Gestion de l'historique et du bouton Retour navigateur
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;

      // 1. Synchronisation Projet
      if (!pathname.startsWith('/projet/')) {
        setSelectedCard(null);
      } else {
        const identifier = pathname.replace('/projet/', '').trim();
        if (identifier) {
          axios.get(`/projects/${identifier}`)
            .then((res) => {
              if (res.data?.project) setSelectedCard(formatProjectData(res.data.project));
            })
            .catch(() => setSelectedCard(null));
        }
      }

      // 2. Synchronisation Profil Public
      if (pathname.startsWith('/profil/')) {
        const profileId = decodeURIComponent(pathname.replace('/profil/', '').trim());
        setPublicProfileUserId(profileId);
        setIsPublicProfileOpen(true);
      } else {
        setIsPublicProfileOpen(false);
        setPublicProfileUserId(null);
      }

      // 3. Synchronisation Modals
      setIsInfoOpen(pathname === '/info');
      setIsLoginOpen(pathname === '/connexion' || pathname === '/login');
      setIsRegisterOpen(pathname === '/inscription' || pathname === '/register');

      setIsFilterOpen(false);
      setIsProfileOpen(false);
      setIsSubmitOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Animation GSAP de changement de vue
  useEffect(() => {
    if (mainContainerRef.current) {
      gsap.fromTo(
        mainContainerRef.current,
        { opacity: 0.3, scale: 0.985 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [activeView]);

  // Chargement progressif des projets
  useEffect(() => {
    let isCancelled = false;

    const fetchProjectsProgressively = async (page = 1) => {
      if (isCancelled) return;
      try {
        const response = await axios.get(`/projects?limit=40&page=${page}`);
        if (response.data && response.data.projects) {
          const formattedProjects = response.data.projects.map(formatProjectData);

          setCovers((prev) => {
            const prevIds = new Set(prev.map((p) => p.id));
            const uniqueNew = formattedProjects.filter((p) => !prevIds.has(p.id));
            if (uniqueNew.length === 0) return prev;

            const newSet = [...prev, ...uniqueNew];
            return shuffleArray(newSet);
          });

          if (page < response.data.totalPages) {
            setTimeout(() => {
              fetchProjectsProgressively(page + 1);
            }, 300);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération progressive :", error);
      }
    };

    fetchProjectsProgressively(1);

    return () => {
      isCancelled = true;
    };
  }, []);

  // Réinitialisation des filtres
  const handleResetFilters = () => {
    setFilters({
      type: 'Tous',
      school: 'Toutes les écoles',
      field: 'Tous les domaines',
      year: 'Toutes'
    });
    setSearchQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'Tous') count++;
    if (filters.school !== 'Toutes les écoles') count++;
    if (filters.field !== 'Tous les domaines') count++;
    if (filters.year !== 'Toutes') count++;
    if (searchQuery.trim().length > 0) count++;
    return count;
  }, [filters, searchQuery]);

  const filteredCovers = useMemo(() => {
    return covers.filter((item) => {
      if (filters.type !== 'Tous' && item.type !== filters.type) return false;
      if (filters.school !== 'Toutes les écoles' && item.school !== filters.school) return false;
      if (filters.field !== 'Tous les domaines' && item.field !== filters.field) return false;
      if (filters.year !== 'Toutes' && item.year !== filters.year) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesAuthor = item.author.toLowerCase().includes(q);
        const matchesSchool = item.school.toLowerCase().includes(q);
        const matchesField = item.field.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAuthor && !matchesSchool && !matchesField && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [covers, filters, searchQuery]);

  const dynamicSchools = useMemo(() => {
    const schools = new Set(covers.map((c) => c.school).filter(Boolean));
    return ['Toutes les écoles', ...Array.from(schools).sort()];
  }, [covers]);

  const dynamicFields = useMemo(() => {
    const fields = new Set(covers.map((c) => c.field).filter(Boolean));
    return ['Tous les domaines', ...Array.from(fields).sort()];
  }, [covers]);

  const dynamicYears = useMemo(() => {
    const years = new Set(covers.map((c) => c.year).filter(Boolean));
    return ['Toutes', ...Array.from(years).sort((a, b) => String(b).localeCompare(String(a)))];
  }, [covers]);

  const dynamicTypes = useMemo(() => {
    const types = new Set(covers.map((c) => c.type).filter(Boolean));
    return ['Tous', ...Array.from(types).sort()];
  }, [covers]);

  const handleAddCover = (newCover) => {
    setCovers((prev) => [newCover, ...prev]);
  };

  // Traitement des routes statiques
  if (window.location.pathname === '/auth/omniscient/callback') {
    return <OmniscientCallback />;
  }

  if (window.location.pathname.startsWith('/verify-email/')) {
    const token = window.location.pathname.split('/').pop();
    return (
      <>
        <SEO title="Vérification de votre email" description="Confirmez votre adresse email Artchiv." />
        <VerifyEmail token={token} />
      </>
    );
  }

  if (window.location.pathname.startsWith('/reset-password/')) {
    const token = window.location.pathname.split('/').pop();
    return (
      <>
        <SEO title="Nouveau mot de passe" description="Réinitialisez votre mot de passe Archiv." />
        <ResetPassword token={token} />
      </>
    );
  }

  if (window.location.pathname === '/admin') {
    return (
      <>
        <SEO title="Administration" />
        <AdminDashboard />
      </>
    );
  }

  if (window.location.pathname === '/mentions-legales') {
    return <MentionsLegales />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative font-sans bg-[#EEEEEE] text-[#111111]">
      <SEO />

      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenFilter={() => setIsFilterOpen((prev) => !prev)}
        isFilterOpen={isFilterOpen}
        onOpenInfo={() => {
          if (isInfoOpen) handleCloseInfo();
          else handleOpenInfo();
        }}
        isInfoOpen={isInfoOpen}
        onOpenSubmit={() => {
          if (user) {
            setEditProjectData(null);
            setIsSubmitOpen(true);
          } else {
            handleOpenLogin();
          }
        }}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={() => {
          if (user) setIsProfileOpen((prev) => !prev);
          else handleOpenLogin();
        }}
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
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-4 filter drop-shadow-md pointer-events-none"
            />
            <h3 className="text-xl font-bold text-[#111111] mb-1">Aucun résultat trouvé</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
              Essayez de modifier vos critères de recherche<br />ou réinitialisez les filtres.
            </p>
            <button
              onClick={() => {
                if (user) {
                  setIsSubmitOpen(true);
                } else {
                  handleOpenLogin();
                }
              }}
              className="mt-6 h-9 xs:h-10 px-5 xs:px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Ajouter mon travail</span>
              <IconAddDocument className="w-4 h-4 text-[#111111]" />
            </button>
          </div>
        ) : activeView === 'canvas' ? (
          <InfiniteCanvas
            items={filteredCovers}
            camera={camera}
            setCamera={setCamera}
            onCardClick={handleCardClick}
            onAddWork={() => {
              if (user) setIsSubmitOpen(true);
              else handleOpenLogin();
            }}
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
            onOpenPublicProfile={(authorIdentifier) => {
              handleOpenPublicProfile(authorIdentifier);
            }}
            onAddWork={() => {
              if (user) setIsSubmitOpen(true);
              else handleOpenLogin();
            }}
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

      {/* Vue plein écran du projet avec lecteur PDF */}
      {selectedCard && (
        <ProjectDetailView
          item={selectedCard}
          onClose={handleCloseProject}
          onOpenProfile={() => {
            if (user) setIsProfileOpen((prev) => !prev);
            else handleOpenLogin();
          }}
          onOpenLogin={handleOpenLogin}
          onOpenInfo={handleOpenInfo}
          onOpenSubmit={() => {
            if (user) {
              setEditProjectData(null);
              setIsSubmitOpen(true);
            } else {
              handleOpenLogin();
            }
          }}
          onOpenPublicProfile={(userId) => {
            handleOpenPublicProfile(userId);
          }}
        />
      )}

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={handleCloseInfo}
        user={user}
        onOpenProfile={() => {
          if (user) setIsProfileOpen((prev) => !prev);
          else handleOpenLogin();
        }}
        onOpenSubmit={() => {
          if (user) {
            setEditProjectData(null);
            setIsSubmitOpen(true);
          } else {
            handleOpenLogin();
          }
        }}
        onOpenLogin={handleOpenLogin}
        onOpenMentions={() => (window.location.href = '/mentions-legales')}
      />

      {/* Profile Drawer (Profil connecté) */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        logout={logout}
        covers={covers}
        onOpenInfo={handleOpenInfo}
        onOpenSubmit={() => setIsSubmitOpen(true)}
        onSelectProject={(project) => {
          handleCardClick(project);
        }}
        onEditProject={(project) => {
          setEditProjectData(project);
          setIsSubmitOpen(true);
        }}
        onDeleteProject={(projectId) => {
          setCovers((prev) => prev.filter((c) => c.id !== projectId));
        }}
      />

      {/* Public Profile Drawer (Vue profil tiers) */}
      <PublicProfileDrawer
        isOpen={isPublicProfileOpen}
        onClose={handleClosePublicProfile}
        userId={publicProfileUserId}
        user={user}
        covers={covers}
        onOpenInfo={handleOpenInfo}
        onOpenProfile={() => {
          if (user) setIsProfileOpen((prev) => !prev);
          else handleOpenLogin();
        }}
        onOpenLogin={handleOpenLogin}
        onSelectProject={(project) => {
          handleCardClick(project);
        }}
      />

      {/* Submit Modal */}
      <SubmitModal
        isOpen={isSubmitOpen}
        onClose={() => {
          setIsSubmitOpen(false);
          setTimeout(() => setEditProjectData(null), 300);
        }}
        onAddCover={handleAddCover}
        editData={editProjectData}
        onUpdateCover={(updatedProject) => {
          setCovers((prev) => prev.map((c) => (c.id === updatedProject.id ? updatedProject : c)));
        }}
      />

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleCloseLogin}
        onOpenRegister={handleOpenRegister}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        isOAuthCompletion={isOAuthCompletion}
        onClose={() => {
          handleCloseRegister();
          setIsOAuthCompletion(false);
        }}
        onOpenLogin={handleOpenLogin}
      />

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            backgroundColor: '#EEEEEE',
            color: '#111111',
            border: '1.5px solid #111111',
            borderRadius: '14px',
            fontFamily: "'Satoshi', 'Inter', sans-serif",
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 4px 16px rgba(17, 17, 17, 0.12)'
          }
        }}
      />
    </div>
  );
}

export default App;