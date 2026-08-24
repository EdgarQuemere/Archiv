import { getUserDisplayName } from '../utils/userUtils';
import React, { useEffect, useRef, useState } from 'react';
import { X, Info, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import api from '../api/axios';
import SEO from './SEO';

const IconUserProfile = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
  </svg>
);

const IconBehance = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M160,80a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H168A8,8,0,0,1,160,80Zm-24,78a42,42,0,0,1-42,42H32a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H90a38,38,0,0,1,25.65,66A42,42,0,0,1,136,158ZM40,116H90a22,22,0,0,0,0-44H40Zm80,42a26,26,0,0,0-26-26H40v52H94A26,26,0,0,0,120,158Zm128-6a8,8,0,0,1-8,8H169a32,32,0,0,0,56.59,11.2,8,8,0,0,1,12.8,9.61A48,48,0,1,1,248,152Zm-17-8a32,32,0,0,0-62,0Z" />
  </svg>
);

const IconLink = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z" />
  </svg>
);

const IconInstagram = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z" />
  </svg>
);

const IconDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.52l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.52ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Z" />
  </svg>
);

export function PublicProfileDrawer({
  isOpen,
  onClose,
  userId,
  user,
  covers = [],
  onOpenInfo,
  onOpenProfile,
  onOpenLogin,
  onSelectProject
}) {
  const containerRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectProject = (project) => {
    if (onSelectProject && profileData) {
      const domainName = project.domain ? (project.domain.name || project.domain) : (project.field || 'Inconnu');
      onSelectProject({
        id: project.id,
        slug: project.slug,
        title: project.title,
        author: profileData.pseudo || getUserDisplayName(profileData),
        authorPseudo: profileData.pseudo || profileData.id,
        school: project.school || profileData.currentSchool,
        year: project.year?.toString() || (project.createdAt ? new Date(project.createdAt).getFullYear().toString() : '2026'),
        type: project.type || 'Illustration',
        field: domainName,
        description: project.description,
        coverUrl: project.coverUrl,
        imageUrl: project.coverUrl,
        pdfUrl: project.pdfUrl,
        pdfSize: project.pdfSize || 'Inconnu',
        userId: profileData.id,
        tags: []
      });
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );

      if (userId) {
        setIsLoading(true);
        const cleanId = encodeURIComponent(String(userId).trim());

        // Appel direct vers /users/:id (le baseURL Axios inclut déjà /api)
        api.get(`/users/${cleanId}`)
          .then(res => {
            const data = res.data?.user || res.data;
            setProfileData(data);
          })
          .catch(err => {
            console.error("Erreur lors du chargement du profil public :", err);
            // Fallback si jamais baseURL n'avait pas /api
            if (err.response?.status === 404) {
              api.get(`/api/users/${cleanId}`)
                .then(res => setProfileData(res.data?.user || res.data))
                .catch(() => setProfileData(null));
            } else {
              setProfileData(null);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else {
      setProfileData(null);
      setIsLoading(true);
    }
  }, [isOpen, userId]);

  const handleClose = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => onClose()
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] overflow-hidden font-sans bg-[#EEEEEE] text-[#111111] flex items-center justify-center" ref={containerRef}>
        <span className="font-medium text-lg">Chargement du profil...</span>
        <button onClick={handleClose} className="fixed top-6 right-6 z-50 p-2 hover:bg-[#E2E2E2] rounded-full transition-colors cursor-pointer border-[1.5px] border-[#111111]">
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="fixed inset-0 z-[60] overflow-hidden font-sans bg-[#EEEEEE] text-[#111111] flex flex-col items-center justify-center" ref={containerRef}>
        <span className="font-medium text-lg mb-4 text-red-500">Profil introuvable ou erreur de chargement.</span>
        <button onClick={handleClose} className="px-6 py-2 border-[1.5px] border-[#111111] rounded-full hover:bg-[#E2E2E2] transition-colors font-medium cursor-pointer">
          Fermer
        </button>
        <button onClick={handleClose} className="fixed top-6 right-6 z-50 p-2 hover:bg-[#E2E2E2] rounded-full transition-colors cursor-pointer border-[1.5px] border-[#111111]">
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>
      </div>
    );
  }

  const userProjects = profileData.projects || [];
  const displayName = profileData.pseudo || getUserDisplayName(profileData) || 'Profil';
  const profileSlug = profileData.pseudo || profileData.id || userId;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden font-sans font-medium bg-[#EEEEEE] text-[#111111]" ref={containerRef}>
      <SEO
        title={`${displayName} (@${profileSlug}) | Artchiv'`}
        description={`Découvrez les projets et mémoires de ${displayName} sur Artchiv'.`}
        image={profileData.profilePicture || '/artchiv-og.png'}
        url={`/profil/${encodeURIComponent(profileSlug)}`}
      />

      {/* TOP HEADER (Exact clone of Navbar.jsx header wrapper) */}
      <header className="fixed top-3 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-50 flex items-center justify-between gap-1 sm:gap-3.5 pointer-events-none font-sans max-w-full">
        {/* Top Left Buttons Group */}
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-3.5 pointer-events-auto shrink-0">
          <picture onClick={handleClose} className="cursor-pointer mr-0.5 shrink-0 flex items-center">
            <source media="(max-width: 639px)" srcSet="/archiv_logo_condesed.webp" />
            <img
              src="/artchiv-logo.webp"
              alt="Artchiv"
              className="h-9 xs:h-10 sm:h-13 md:h-14 w-auto object-contain block"
            />
          </picture>
          <button
            onClick={() => {
              handleClose();
              onOpenInfo?.();
            }}
            title="Informations"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] flex items-center justify-center shrink-0 shadow-sm hover:bg-[#E2E2E2] transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
          <button
            onClick={() => {
              handleClose();
              if (user) {
                onOpenProfile?.();
              } else {
                onOpenLogin?.();
              }
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center shrink-0 shadow-sm transition-colors cursor-pointer"
            title={user ? getUserDisplayName(user) || 'Profil' : 'Se connecter'}
          >
            <IconUserProfile className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Top Right Group */}
        <div className="pointer-events-auto flex items-center gap-1 xs:gap-1.5 sm:gap-3.5 shrink-0">
          <button
            onClick={handleClose}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] flex items-center justify-center hover:bg-[#111111] hover:text-[#EEEEEE] transition-colors shadow-sm cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
        </div>
      </header>

      {/* VERTICAL SEPARATOR LINE */}
      <div className="hidden md:block absolute top-28 bottom-0 left-1/2 w-[1.5px] bg-[#111111] z-10 pointer-events-none" />

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col md:flex-row h-full w-full overflow-y-auto md:overflow-hidden">

        {/* LEFT COLUMN - USER PROFILE INFO */}
        <div className="w-full md:w-1/2 shrink-0 md:h-full flex flex-col justify-start md:justify-end p-4 xs:p-6 md:p-6 md:pl-6 pb-6 pt-20 xs:pt-24 md:pt-32 md:overflow-y-auto">
          <div className="max-w-md space-y-4">
            <div className="relative w-20 h-20 xs:w-24 xs:h-24 bg-[#111111] rounded-[10px] overflow-hidden shadow-sm">
              <img
                src={profileData.profilePicture || '/pdp_1.webp'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-2xl xs:text-3xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
                <span>{displayName}</span>
                {profileData.isOmniscient && (
                  <img
                    src="/logo-od.svg"
                    alt="Omniscient Design"
                    className="h-5 w-auto inline-block align-middle shrink-0 ml-0.5"
                    title="Membre Omniscient Design"
                  />
                )}
              </h1>
            </div>

            <p className="text-base font-medium text-[#111111]">{profileData.role || 'Créateur'}</p>
            <p className="text-base font-medium text-[#555555]">{profileData.currentSchool || 'École de design'}</p>

            {profileData.bio && (
              <p className="text-base font-medium text-[#333333] whitespace-pre-line leading-relaxed">
                {profileData.bio}
              </p>
            )}

            {profileData.email && (
              <p className="text-base font-medium text-[#111111] break-all">{profileData.email}</p>
            )}

            <div className="flex items-center gap-5 pt-1">
              {profileData.behanceLink && profileData.behanceLink !== '#' && (
                <a
                  href={profileData.behanceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#111111] hover:opacity-75 transition-opacity"
                  title="Behance"
                >
                  <IconBehance className="w-7 h-7 xs:w-8 xs:h-8" />
                </a>
              )}
              {profileData.instaLink && profileData.instaLink !== '#' && (
                <a
                  href={profileData.instaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#111111] hover:opacity-75 transition-opacity"
                  title="Instagram"
                >
                  <IconInstagram className="w-7 h-7 xs:w-8 xs:h-8" />
                </a>
              )}
              {profileData.personalLink && profileData.personalLink !== '#' && (
                <a
                  href={profileData.personalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#111111] hover:opacity-75 transition-opacity"
                  title="Site Web"
                >
                  <IconLink className="w-7 h-7 xs:w-8 xs:h-8" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - DOCUMENTS */}
        <div className="w-full md:w-1/2 shrink-0 md:h-full flex flex-col pt-8 md:pt-28 pb-10 md:pb-0 px-4 xs:px-6 md:pl-6 md:pr-14 md:overflow-hidden bg-[#EEEEEE]">
          <div className="mb-10 flex items-center justify-start shrink-0">
            <div className="h-10 border-[1.5px] border-[#111111] bg-[#EEEEEE] inline-flex items-center rounded-full overflow-hidden p-0 shadow-sm">
              <div className="h-full px-6 flex items-center gap-2.5 text-base font-medium bg-[#111111] text-[#EEEEEE]">
                <span>Documents ({userProjects.length})</span>
                <IconDocument className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-12 pr-2 pb-10 scrollbar-none">
            {userProjects.length === 0 ? (
              <div className="p-8 text-center bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-2xl">
                <p className="text-base font-medium text-[#111111]">Cet auteur n'a aucun document publié.</p>
              </div>
            ) : (
              userProjects.map((project) => (
                <div key={project.id} className="flex flex-col sm:flex-row gap-8 items-start">
                  <div
                    className="w-48 sm:w-56 shrink-0 shadow-sm bg-slate-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleSelectProject(project)}
                  >
                    {project.coverUrl ? (
                      <img
                        src={project.coverUrl}
                        alt={project.title}
                        className="w-full h-auto object-contain block"
                      />
                    ) : (
                      <div className="w-full h-44 flex items-center justify-center text-sm font-medium text-slate-400">PDF</div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-start py-0">
                    <div>
                      <h3
                        className="text-xl font-bold text-[#111111] mb-2 leading-snug cursor-pointer hover:underline"
                        onClick={() => handleSelectProject(project)}
                      >
                        {project.title}
                      </h3>
                      <p className="text-base font-medium text-[#111111] mb-0.5">
                        {project.year?.toString() || (project.createdAt ? new Date(project.createdAt).getFullYear().toString() : '2026')} — {project.type || 'Mémoire'}{project.domain?.name || project.field ? ` — ${project.domain?.name || project.field}` : ''}
                      </p>
                      {(project.school || profileData?.currentSchool) && (
                        <p className="text-base font-medium text-[#111111] mb-4">
                          {project.school || profileData?.currentSchool}
                        </p>
                      )}
                      <p className="text-base font-medium text-[#111111] leading-relaxed mb-6 max-w-md line-clamp-3">
                        {project.description || "Aucune description fournie."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSelectProject(project)}
                        className="h-10 px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] text-base font-medium rounded-full flex items-center gap-2.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <span>Consulter</span>
                        <ExternalLink className="w-4 h-4 stroke-[2.25]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfileDrawer;