import React, { useEffect, useRef, useState, useContext } from 'react';
import { X, Info, User, UploadCloud } from 'lucide-react';
import gsap from 'gsap';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import { AvatarCropperModal } from './AvatarCropperModal';
import { EditProfileModal } from './EditProfileModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { DeleteAccountReasonModal } from './DeleteAccountReasonModal';
import { DeleteAccountConfirmModal } from './DeleteAccountConfirmModal';
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
    <path d="M216.49,79.52l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.52ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Z" />
  </svg>
);

const IconBookmark = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M184,28H72A20,20,0,0,0,52,48V224a12,12,0,0,0,18.36,10.18l57.63-36,57.65,36A12,12,0,0,0,204,224V48A20,20,0,0,0,184,28Zm-4,174.35-45.65-28.53a12,12,0,0,0-12.72,0L76,202.35V52H180Z" />
  </svg>
);

const IconPencil = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M230.14,70.54,185.46,25.85a20,20,0,0,0-28.29,0L33.86,149.17A19.85,19.85,0,0,0,28,163.31V208a20,20,0,0,0,20,20H92.69a19.86,19.86,0,0,0,14.14-5.86L230.14,98.82a20,20,0,0,0,0-28.28ZM91,204H52V165l84-84,39,39ZM192,103,153,64l18.34-18.34,39,39Z" />
  </svg>
);

const IconLogOut = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M124,216a12,12,0,0,1-12,12H48a12,12,0,0,1-12-12V40A12,12,0,0,1,48,28h64a12,12,0,0,1,0,24H60V204h52A12,12,0,0,1,124,216Zm108.49-96.49-40-40a12,12,0,0,0-17,17L195,116H112a12,12,0,0,0,0,24h83l-19.52,19.51a12,12,0,0,0,17,17l40-40A12,12,0,0,0,232.49,119.51Z" />
  </svg>
);

const IconDelete = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216,48H180V36A28,28,0,0,0,152,8H104A28,28,0,0,0,76,36V48H40a12,12,0,0,0,0,24h4V208a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V72h4a12,12,0,0,0,0-24ZM100,36a4,4,0,0,1,4-4h48a4,4,0,0,1,4,4V48H100Zm88,168H68V72H188ZM116,104v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Zm48,0v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Z" />
  </svg>
);

export function ProfileDrawer({
  isOpen,
  onClose,
  user,
  logout,
  covers = [],
  onEditProject,
  onDeleteProject,
  onOpenInfo
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteReasonModalOpen, setIsDeleteReasonModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

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

  const handleConfirmLogout = async () => {
    if (logout) await logout();
    toast.success("Déconnexion réussie");
    handleClose();
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      if (deleteAccount && user) {
        await deleteAccount();
      } else {
        toast.success("Compte supprimé avec succès.");
      }
      handleClose();
    } catch (err) {
      console.error("Erreur suppression compte:", err);
      toast.error("Impossible de supprimer le compte.");
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
      
      {/* 1. TOP NAVBAR (Identical responsive classes top-3 left-3 sm:top-6 sm:left-6 matching Navbar.jsx) */}
      <div className="fixed top-3 left-3 sm:top-6 sm:left-6 z-50 flex items-center gap-1.5 xs:gap-2.5 sm:gap-3.5 pointer-events-auto">
        <picture onClick={handleClose} className="cursor-pointer transition-opacity hover:opacity-80 mr-0.5 shrink-0 flex items-center">
          <source media="(max-width: 639px)" srcset="/Archiv_logo_condesed.webp" />
          <img 
            src="/Artchiv-logo.webp" 
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
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] flex items-center justify-center shrink-0 shadow-sm hover:bg-[#E2E2E2] transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
        </button>
        <button 
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#111111] text-[#EEEEEE] flex items-center justify-center shrink-0 shadow-sm"
          title="Mon Profil"
        >
          <IconUserProfile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* TOP RIGHT CLOSE BUTTON (Matching Navbar.jsx position) */}
      <button 
        onClick={handleClose}
        className="fixed top-3 right-3 sm:top-6 sm:right-6 z-50 w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] flex items-center justify-center hover:bg-[#111111] hover:text-[#EEEEEE] transition-colors shadow-sm"
        title="Fermer"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
      </button>

      {/* VERTICAL SEPARATOR LINE */}
      <div className="hidden md:block absolute top-28 bottom-0 left-1/2 w-[1.5px] bg-[#111111] z-10 pointer-events-none" />

      {/* MAIN CONTENT AREA: SCROLLABLE ON MOBILE, 2-COLUMN LAYOUT ON DESKTOP */}
      <div className="flex flex-col md:flex-row h-full w-full overflow-y-auto md:overflow-hidden">
        
        {/* LEFT COLUMN - USER PROFILE INFO */}
        <div className="w-full md:w-1/2 shrink-0 md:h-full flex flex-col justify-start md:justify-end p-4 xs:p-6 md:p-6 md:pl-6 pb-6 pt-20 xs:pt-24 md:pt-32 md:overflow-y-auto">
          
          <div className="max-w-md space-y-5 xs:space-y-6 sm:space-y-7">
            {/* Avatar (NO stroke/border) */}
            <div 
              className="relative w-20 h-20 xs:w-24 xs:h-24 bg-[#111111] rounded-[10px] overflow-hidden group cursor-pointer shadow-sm transition-transform hover:scale-[1.02]" 
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
              <h1 className="text-xl xs:text-2xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
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
            <p className="text-sm xs:text-base font-medium text-[#111111]">{profileData.role || 'Enseignant'}</p>

            {/* School */}
            <p className="text-sm xs:text-base font-medium text-[#111111]">{profileData.currentSchool || 'HEAR – Strasbourg'}</p>

            {/* Email */}
            <p className="text-sm xs:text-base font-medium text-[#111111] break-all">{profileData.email}</p>

            {/* Password */}
            <p className="text-sm xs:text-base font-medium text-[#111111] tracking-widest">**************</p>

            {/* Social Links (User-provided Phosphor SVGs) */}
            <div className="flex items-center gap-5 pt-1">
              <a 
                href={profileData.behanceLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#111111] hover:opacity-75 transition-opacity"
                title="Behance"
              >
                <IconBehance className="w-5 h-5 xs:w-6 xs:h-6" />
              </a>
              <a 
                href={profileData.instaLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#111111] hover:opacity-75 transition-opacity"
                title="Instagram"
              >
                <IconInstagram className="w-5 h-5 xs:w-6 xs:h-6" />
              </a>
              <a 
                href={profileData.personalLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#111111] hover:opacity-75 transition-opacity"
                title="Portfolio Link"
              >
                <IconLink className="w-5 h-5 xs:w-6 xs:h-6" />
              </a>
            </div>

            {/* ACTION BUTTONS ROW (User-provided Phosphor SVGs) */}
            <div className="flex flex-wrap items-center gap-2.5 xs:gap-3 pt-1">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="h-9 xs:h-10 px-4 xs:px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-xs xs:text-base font-medium text-[#111111] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Modifier</span>
                <IconPencil className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </button>

              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="h-9 xs:h-10 px-4 xs:px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-xs xs:text-base font-medium text-[#111111] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Se déconnecter</span>
                <IconLogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </button>

              <button 
                onClick={() => setIsDeleteReasonModalOpen(true)}
                className="h-9 xs:h-10 px-4 xs:px-6 border-[1.5px] border-[#FF0000] bg-[#EEEEEE] hover:bg-red-50 rounded-full text-xs xs:text-base font-medium text-[#FF0000] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Supprimer mon compte</span>
                <IconDelete className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#FF0000]" />
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - DOCUMENTS / ENREGISTREMENTS */}
        <div className="w-full md:w-1/2 shrink-0 md:h-full flex flex-col pt-8 md:pt-28 pb-10 px-4 xs:px-6 md:pl-6 md:pr-14 md:overflow-hidden bg-[#EEEEEE]">
          
          {/* SEGMENTED SWITCH CONTROL */}
          <div className="mb-8 xs:mb-10 flex items-center justify-start shrink-0">
            <div className="h-9 xs:h-10 border-[1.5px] border-[#111111] bg-[#EEEEEE] inline-flex items-center rounded-full overflow-hidden p-0 shadow-sm">
              <button 
                onClick={() => setActiveTab('documents')}
                className={`h-full px-3.5 xs:px-5 sm:px-6 flex items-center gap-1.5 sm:gap-2.5 text-xs xs:text-sm sm:text-base font-medium transition-colors cursor-pointer ${
                  activeTab === 'documents' 
                    ? 'bg-[#111111] text-[#EEEEEE]' 
                    : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
              >
                <span className="inline sm:hidden">Documents ({userProjects.length})</span>
                <span className="hidden sm:inline">Mes documents ({userProjects.length})</span>
                <IconDocument className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="w-[1.5px] h-full bg-[#111111]" />

              <button 
                onClick={() => setActiveTab('enregistrements')}
                className={`h-full px-3.5 xs:px-5 sm:px-6 flex items-center gap-1.5 sm:gap-2.5 text-xs xs:text-sm sm:text-base font-medium transition-colors cursor-pointer ${
                  activeTab === 'enregistrements' 
                    ? 'bg-[#111111] text-[#EEEEEE]' 
                    : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
              >
                <span className="inline sm:hidden">Enregistrements ({savedProjects.length || 34})</span>
                <span className="hidden sm:inline">Mes enregistrements ({savedProjects.length || 34})</span>
                <IconBookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                  <div key={project.id} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-end">
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
                              className="h-10 px-5 rounded-full bg-[#EEEEEE] text-[#111111] text-base font-medium border border-[#111111] hover:bg-[#E2E2E2]"
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
                  <div key={project.id} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-end">
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

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Delete Account Step 1: Reason Modal */}
      <DeleteAccountReasonModal
        isOpen={isDeleteReasonModalOpen}
        onClose={() => setIsDeleteReasonModalOpen(false)}
        onNext={(reason) => {
          setDeletionReason(reason);
          setIsDeleteReasonModalOpen(false);
          setIsDeleteConfirmModalOpen(true);
        }}
      />

      {/* Delete Account Step 2: Final Confirmation Modal */}
      <DeleteAccountConfirmModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        onConfirm={handleConfirmDeleteAccount}
      />
    </div>
  );
}
