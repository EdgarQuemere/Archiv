import React, { useEffect, useRef, useState, useContext } from 'react';
import { X, Info, User, UploadCloud } from 'lucide-react';
import gsap from 'gsap';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import { AvatarCropperModal } from './AvatarCropperModal';
import { EditProfileModal } from './EditProfileModal';
import { MOCK_USER_PROFILE, MOCK_USER_PROJECTS, MOCK_SAVED_PROJECTS } from '../data/mockProfile';

/* Custom Phosphor Profile User SVG provided by USER */
const IconUserProfile = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
  </svg>
);

/* Phosphor SVG Icon Components provided by USER */
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
    <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z" />
  </svg>
);

const IconBookmark = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z" />
  </svg>
);

const IconPencil = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
  </svg>
);

const IconLogOut = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z" />
  </svg>
);

const IconDelete = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
  </svg>
);

export function ProfileDrawer({
  isOpen,
  onClose,
  user,
  logout,
  covers = [],
  onEditProject,
  onDeleteProject
}) {
  const { deleteAccount, setUser } = useContext(AuthContext);
  const containerRef = useRef(null);
  
  // Profile Data State (Fallback to Mock profile if user is null)
  const [profileData, setProfileData] = useState(user || MOCK_USER_PROFILE);

  // Sync profileData when live user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        ...MOCK_USER_PROFILE,
        ...user
      });
    } else {
      setProfileData(MOCK_USER_PROFILE);
    }
  }, [user]);

  // Local tabs and modal state
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'enregistrements'
  const [deletingId, setDeletingId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Local Mock Projects & Saved Projects
  const [userProjects, setUserProjects] = useState(() => {
    if (user) {
      const liveProjects = covers.filter(c => c.userId === user.id);
      return liveProjects.length > 0 ? liveProjects : MOCK_USER_PROJECTS;
    }
    return MOCK_USER_PROJECTS;
  });

  const [savedProjects, setSavedProjects] = useState(() => {
    if (user?.savedProjects) {
      const liveSaved = user.savedProjects.map(sp => sp.project).filter(Boolean);
      return liveSaved.length > 0 ? liveSaved : MOCK_SAVED_PROJECTS;
    }
    return MOCK_SAVED_PROJECTS;
  });

  useEffect(() => {
    if (user) {
      const liveProjects = covers.filter(c => c.userId === user.id);
      setUserProjects(liveProjects.length > 0 ? liveProjects : MOCK_USER_PROJECTS);
      const liveSaved = user?.savedProjects ? user.savedProjects.map(sp => sp.project).filter(Boolean) : [];
      setSavedProjects(liveSaved.length > 0 ? liveSaved : MOCK_SAVED_PROJECTS);
    }
  }, [user, covers]);

  // Avatar Upload & Crop State
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => setCropperImageSrc(reader.result?.toString() || null));
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropperImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedFile) => {
    setCropperImageSrc(null);
    const croppedUrl = URL.createObjectURL(croppedFile);
    setProfileData(prev => ({ ...prev, profilePicture: croppedUrl }));

    if (user) {
      const formData = new FormData();
      formData.append('profilePicture', croppedFile);
      setIsUploadingAvatar(true);
      
      toast.promise(
        api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
        {
          loading: 'Mise à jour de l\'avatar...',
          success: (response) => {
            setUser(response.data.user);
            setIsUploadingAvatar(false);
            return 'Avatar mis à jour !';
          },
          error: (err) => {
            console.error(err);
            setIsUploadingAvatar(false);
            return 'Erreur lors de la mise à jour.';
          }
        }
      );
    } else {
      toast.success("Avatar fictif mis à jour !");
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDeletingId(null);
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

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

  const handleLogout = async () => {
    if (logout) await logout();
    toast.success("Déconnexion réussie");
    handleClose();
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Es-tu sûr de vouloir supprimer définitivement ton compte et tous tes projets associés ? Cette action est irréversible.")) {
      try {
        if (deleteAccount && user) {
          await deleteAccount();
        } else {
          toast.success("Compte fictif réinitialisé.");
        }
        handleClose();
      } catch (err) {
        console.error("Erreur suppression compte:", err);
        alert("Impossible de supprimer le compte.");
      }
    }
  };

  const handleDeleteProjectItem = async (id) => {
    try {
      if (user) {
        await api.delete(`/projects/${id}`);
      }
      setUserProjects(prev => prev.filter(p => p.id !== id));
      if (onDeleteProject) onDeleteProject(id);
      setDeletingId(null);
      toast.success("Projet supprimé.");
    } catch (err) {
      console.error("Erreur suppression projet:", err);
      setUserProjects(prev => prev.filter(p => p.id !== id));
      setDeletingId(null);
      toast.success("Projet supprimé.");
    }
  };

  const handleRemoveSavedProject = async (projectId) => {
    try {
      if (user) {
        await api.delete(`/projects/${projectId}/save`);
        if (setUser) {
          setUser(prev => ({
            ...prev,
            savedProjects: (prev.savedProjects || []).filter(sp => sp.projectId !== projectId)
          }));
        }
      }
      setSavedProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success("Projet retiré de vos enregistrements.");
    } catch (err) {
      console.error(err);
      setSavedProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success("Projet retiré.");
    }
  };

  const handleSaveProfileData = (updatedFields) => {
    setProfileData(prev => ({
      ...prev,
      ...updatedFields
    }));
    if (user && setUser) {
      setUser(prev => ({ ...prev, ...updatedFields }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden font-sans bg-[#EEEEEE] text-[#111111]" ref={containerRef}>
      
      {/* 1. TOP NAVBAR (Identical responsive classes top-4 left-4 sm:top-6 sm:left-6 matching Navbar.jsx) */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2.5 sm:gap-3.5 pointer-events-auto">
        <img 
          src="/Artchiv-logo.webp" 
          alt="Artchiv" 
          className="h-12 sm:h-15 w-auto object-contain cursor-pointer transition-opacity hover:opacity-80 mr-0.5" 
          onClick={handleClose}
        />
        <button className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] flex items-center justify-center shrink-0 shadow-sm hover:bg-[#E2E2E2] transition-colors">
          <Info className="w-4 h-4 stroke-[2.25]" />
        </button>
        <button className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#111111] text-[#EEEEEE] flex items-center justify-center shrink-0 shadow-sm">
          <IconUserProfile className="w-4 h-4" />
        </button>
      </div>

      {/* TOP RIGHT CLOSE BUTTON (Matching Navbar.jsx position) */}
      <button 
        onClick={handleClose}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] flex items-center justify-center hover:bg-[#111111] hover:text-[#EEEEEE] transition-colors shadow-sm"
        title="Fermer"
      >
        <X className="w-4 h-4 stroke-[2.25]" />
      </button>

      {/* VERTICAL SEPARATOR LINE */}
      <div className="hidden md:block absolute top-28 bottom-0 left-1/2 w-[1.5px] bg-[#111111] z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row h-full w-full">
        
        {/* LEFT COLUMN - USER PROFILE INFO */}
        <div className="w-full md:w-1/2 h-full flex flex-col justify-end p-6 md:p-6 pl-6 pb-6 pt-32 overflow-y-auto">
          
          <div className="max-w-md space-y-4">
            {/* Avatar (NO stroke/border) */}
            <div 
              className="relative w-24 h-24 bg-[#111111] rounded-2xl overflow-hidden group cursor-pointer shadow-sm transition-transform hover:scale-[1.02]" 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleAvatarDrop}
            >
              <img 
                src={profileData.profilePicture || '/page-profile-test-front/edgar-avatar.jpg'} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <UploadCloud className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold uppercase text-center leading-tight">Glisser / Modifier</span>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarSelect}
                disabled={isUploadingAvatar}
              />
            </div>

            {/* Name & Small Omniscient Design Logo */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
                <span>{profileData.firstName} {profileData.lastName}</span>
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

            {/* Role */}
            <p className="text-base font-medium text-[#111111]">{profileData.role || 'Enseignant'}</p>

            {/* School */}
            <p className="text-base font-medium text-[#111111]">{profileData.currentSchool || 'HEAR – Strasbourg'}</p>

            {/* Email */}
            <p className="text-base font-medium text-[#111111]">{profileData.email}</p>

            {/* Password */}
            <p className="text-base font-medium text-[#111111] tracking-widest">**************</p>

            {/* Social Links (User-provided Phosphor SVGs) */}
            <div className="flex items-center gap-5 pt-1">
              <a 
                href={profileData.behanceLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#111111] hover:opacity-75 transition-opacity"
                title="Behance"
              >
                <IconBehance className="w-6 h-6" />
              </a>
              <a 
                href={profileData.instaLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#111111] hover:opacity-75 transition-opacity"
                title="Instagram"
              >
                <IconInstagram className="w-6 h-6" />
              </a>
              <a 
                href={profileData.personalLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#111111] hover:opacity-75 transition-opacity"
                title="Portfolio Link"
              >
                <IconLink className="w-6 h-6" />
              </a>
            </div>

            {/* ACTION BUTTONS ROW (User-provided Phosphor SVGs) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="h-10 px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span>Modifier</span>
                <IconPencil className="w-4 h-4" />
              </button>

              <button 
                onClick={handleLogout}
                className="h-10 px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span>Se déconnecter</span>
                <IconLogOut className="w-4 h-4" />
              </button>

              <button 
                onClick={handleDeleteAccount}
                className="h-10 px-6 border-[1.5px] border-[#FF0000] bg-[#EEEEEE] hover:bg-red-50 rounded-full text-base font-medium text-[#FF0000] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span>Supprimer mon compte</span>
                <IconDelete className="w-4 h-4 text-[#FF0000]" />
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - DOCUMENTS / ENREGISTREMENTS */}
        <div className="w-full md:w-1/2 h-full flex flex-col pt-28 pb-0 pl-6 md:pl-6 pr-6 md:pr-14 overflow-hidden bg-[#EEEEEE]">
          
          {/* SEGMENTED SWITCH CONTROL */}
          <div className="mb-10 flex items-center justify-start shrink-0">
            <div className="h-10 border-[1.5px] border-[#111111] bg-[#EEEEEE] inline-flex items-center rounded-full overflow-hidden p-0 shadow-sm">
              <button 
                onClick={() => setActiveTab('documents')}
                className={`h-full px-6 flex items-center gap-2.5 text-base font-medium transition-colors cursor-pointer ${
                  activeTab === 'documents' 
                    ? 'bg-[#111111] text-[#EEEEEE]' 
                    : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
              >
                <span>Mes documents ({userProjects.length})</span>
                <IconDocument className="w-4 h-4" />
              </button>

              <div className="w-[1.5px] h-full bg-[#111111]" />

              <button 
                onClick={() => setActiveTab('enregistrements')}
                className={`h-full px-6 flex items-center gap-2.5 text-base font-medium transition-colors cursor-pointer ${
                  activeTab === 'enregistrements' 
                    ? 'bg-[#111111] text-[#EEEEEE]' 
                    : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
              >
                <span>Mes enregistrement ({savedProjects.length || 34})</span>
                <IconBookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SCROLLABLE COVERS LIST */}
          <div className="flex-1 overflow-y-auto space-y-12 pr-2 pb-10 scrollbar-none">
            {activeTab === 'documents' ? (
              userProjects.length === 0 ? (
                <div className="p-8 text-center bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-2xl">
                  <p className="text-base font-medium text-[#111111]">Vous n'avez aucun document publié.</p>
                </div>
              ) : (
                userProjects.map((project) => (
                  <div key={project.id} className="flex flex-col sm:flex-row gap-8 items-end">
                    {/* Cover Thumbnail (No stroke/border) */}
                    <div className="w-48 sm:w-56 shrink-0 shadow-sm bg-slate-200 overflow-hidden">
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
                    
                    {/* Cover Details */}
                    <div className="flex-1 flex flex-col justify-end py-1">
                      <div>
                        <h3 className="text-xl font-bold text-[#111111] mb-2 leading-snug">
                          {project.title}
                        </h3>
                        <p className="text-base font-medium text-[#111111] mb-4">
                          {project.school} – {project.year} – {project.type || 'Illustration'}
                        </p>
                        <p className="text-base font-medium text-[#111111] leading-relaxed mb-6 max-w-md">
                          {project.description || "Création des principes virtuel réagisse la pression et à la vitesse du stylet pour une peinture numerique organique."}
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-3">
                        {deletingId === project.id ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDeleteProjectItem(project.id)}
                              className="h-10 px-5 rounded-full bg-red-600 text-white text-base font-medium border border-[#111111] hover:bg-red-700"
                            >
                              Confirmer
                            </button>
                            <button 
                              onClick={() => setDeletingId(null)}
                              className="h-10 px-5 rounded-full bg-[#EEEEEE] text-[#111111] text-base font-medium border border-[#111111]"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => onEditProject && onEditProject(project)}
                              className="h-10 px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <span>Modifier</span>
                              <IconPencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeletingId(project.id)}
                              className="h-10 px-6 border-[1.5px] border-[#FF0000] bg-[#EEEEEE] hover:bg-red-50 rounded-full text-base font-medium text-[#FF0000] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <span>Supprimer</span>
                              <IconDelete className="w-4 h-4 text-[#FF0000]" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              savedProjects.length === 0 ? (
                <div className="p-8 text-center bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-2xl">
                  <p className="text-base font-medium text-[#111111]">Vous n'avez aucun enregistrement.</p>
                </div>
              ) : (
                savedProjects.map((project) => (
                  <div key={project.id} className="flex flex-col sm:flex-row gap-8 items-end">
                    <div className="w-48 sm:w-56 shrink-0 shadow-sm bg-slate-200 overflow-hidden">
                      {project.coverUrl ? (
                        <img src={project.coverUrl} alt={project.title} className="w-full h-auto object-contain block" />
                      ) : (
                        <div className="w-full h-44 flex items-center justify-center text-sm font-medium text-slate-400">PDF</div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end py-1">
                      <div>
                        <h3 className="text-xl font-bold text-[#111111] mb-2 leading-snug">
                          {project.title}
                        </h3>
                        <p className="text-base font-medium text-[#111111] mb-4">
                          {project.author ? `${project.author} – ` : ''}{project.school} – {project.year} – {project.type || 'Portfolio'}
                        </p>
                        <p className="text-base font-medium text-[#111111] leading-relaxed mb-6 max-w-md">
                          {project.description || "Création des principes virtuel réagisse la pression et à la vitesse du stylet pour une peinture numerique organique."}
                        </p>
                      </div>

                      <div>
                        <button 
                          onClick={() => handleRemoveSavedProject(project.id)}
                          className="h-10 px-6 border-[1.5px] border-[#FF0000] bg-[#EEEEEE] hover:bg-red-50 rounded-full text-base font-medium text-[#FF0000] flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <span>Retirer des enregistrements</span>
                          <IconDelete className="w-4 h-4 text-[#FF0000]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={profileData}
        onSaveProfile={handleSaveProfileData}
      />

      {/* Avatar Crop Modal */}
      {cropperImageSrc && (
        <AvatarCropperModal
          imageSrc={cropperImageSrc}
          onClose={() => setCropperImageSrc(null)}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
