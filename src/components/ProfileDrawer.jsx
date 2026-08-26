import { getUserDisplayName } from '../utils/userUtils';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { X, Info, User, UploadCloud, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import { AvatarCropperModal } from './AvatarCropperModal';
import { EditProfileModal } from './EditProfileModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { DeleteAccountReasonModal } from './DeleteAccountReasonModal';
import { DeleteAccountConfirmModal } from './DeleteAccountConfirmModal';
import { getFileUrl } from '../utils/url';
import { decodeHTMLEntities } from '../utils/text';



/* Custom Phosphor Profile User SVG */
const IconEye = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z" />
  </svg>
);

const IconDownload = ({ className = "w-3.5 h-3.5 text-[#111111]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z" />
  </svg>
);

const IconBookmarkSave = ({ className = "w-3.5 h-3.5 text-[#111111]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z" />
  </svg>
);

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

const IconBookmark = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M184,28H72A20,20,0,0,0,52,48V224a12,12,0,0,0,18.36,10.18l57.63-36,57.65,36A12,12,0,0,0,204,224V48A20,20,0,0,0,184,28Zm-4,174.35-45.65-28.53a12,12,0,0,0-12.72,0L76,202.35V52H180Z" />
  </svg>
);

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
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
  onOpenInfo,
  onOpenSubmit,
  onSelectProject
}) {
  const { deleteAccount, setUser } = useContext(AuthContext);
  const containerRef = useRef(null);

  const [profileData, setProfileData] = useState(user || {});

  const handleSelectProject = (project) => {
    if (onSelectProject) {
      const domainName = project.domain ? (project.domain.name || project.domain) : (project.field || 'Autre');
      onSelectProject({
        id: project.id,
        slug: project.slug,
        title: project.title,
        author: typeof project.author === 'object' && project.author !== null
          ? getUserDisplayName(project.author)
          : (project.author || getUserDisplayName(profileData) || 'Auteur'),
        school: project.school || profileData?.currentSchool || '',
        year: project.year?.toString() || (project.createdAt ? new Date(project.createdAt).getFullYear().toString() : '2026'),
        type: project.type || 'Mémoire',
        field: domainName,
        description: project.description,
        coverUrl: project.coverUrl,
        imageUrl: project.coverUrl,
        pdfUrl: project.pdfUrl,
        pdfSize: project.pdfSize || 'Inconnu',
        userId: project.userId || profileData?.id,
        allowDownload: project.allowDownload ?? true,
        tags: project.tags || []
      });
      if (onClose) onClose();
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData(user);
    } else {
      setProfileData({});
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState('documents');
  const [deletingId, setDeletingId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteReasonModalOpen, setIsDeleteReasonModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  const [userProjects, setUserProjects] = useState(() => {
    if (user) {
      return covers.filter(c => c.userId === user.id);
    }
    return [];
  });

  const [savedProjects, setSavedProjects] = useState(() => {
    if (user) {
      return user.savedProjects ? user.savedProjects.map(sp => sp.project).filter(Boolean) : [];
    }
    return [];
  });

  useEffect(() => {
    if (user) {
      setUserProjects(covers.filter(c => c.userId === user.id));
      setSavedProjects(user?.savedProjects ? user.savedProjects.map(sp => sp.project).filter(Boolean) : []);
    } else {
      setUserProjects([]);
      setSavedProjects([]);
    }
  }, [user, covers]);

  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(<span>L'image de profil ne doit pas dépasser <br /> 5 Mo.</span>);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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
      if (file.size > 5 * 1024 * 1024) {
        toast.error(<span>L'image de profil ne doit pas dépasser <br /> 5 Mo.</span>);
        return;
      }
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
      toast.success("Avatar mis à jour !");
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
        await deleteAccount(deletionReason);
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

  const handleSaveProfileData = async (updatedFields) => {
    setProfileData(prev => ({
      ...prev,
      ...updatedFields
    }));
    if (user && setUser) {
      setUser(prev => ({ ...prev, ...updatedFields }));
    }
    try {
      if (user) {
        await api.put('/users/me', updatedFields);
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du profil :", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden font-sans font-medium bg-[#EEEEEE] text-[#111111]" ref={containerRef}>

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
            onClick={handleClose}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#111111] text-[#EEEEEE] flex items-center justify-center shrink-0 shadow-sm transition-colors cursor-pointer"
            title="Fermer le Profil"
          >
            <IconUserProfile className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => onOpenSubmit?.()}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
            title="Ajouter mon travail"
          >
            <IconAddDocument className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Top Right Group */}
        <div className="pointer-events-auto flex items-center gap-1 xs:gap-1.5 sm:gap-3.5 shrink-0">
          <button
            onClick={handleClose}
            title="Fermer"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
        </div>
      </header>

      {/* VERTICAL SEPARATOR LINE (1px) */}
      <div className="hidden md:block absolute top-28 bottom-0 left-1/2 w-[1px] bg-[#111111] z-10 pointer-events-none" />

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col md:flex-row h-full w-full overflow-y-auto md:overflow-hidden">

        {/* LEFT COLUMN - USER PROFILE INFO */}
        <div className="w-full md:w-1/2 shrink-0 md:h-full flex flex-col justify-start md:justify-end p-6 pb-6 pt-20 xs:pt-24 md:pt-32 md:overflow-y-auto">

          <div className="max-w-md space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-start">
              <div
                className="relative w-20 h-20 xs:w-24 xs:h-24 bg-[#111111] rounded-[10px] overflow-hidden group cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleAvatarDrop}
              >
                <img
                  src={getFileUrl(profileData.profilePicture) || '/pdp_1.webp'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center">
                  <UploadCloud className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-bold uppercase leading-tight">Glisser / Modifier</span>
                  <span className="text-[8px] opacity-80 mt-0.5 font-mono">Max 5 Mo</span>
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
            </div>

            {/* Name + Pseudo + Logo */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl xs:text-3xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
                  <span>{getUserDisplayName(profileData)}</span>
                  {profileData.isOmniscient && (
                    <a
                      href="https://omniscientdesign.fr/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center hover:opacity-80 transition-opacity"
                    >
                      <img
                        src="/logo-od.svg"
                        alt="Omniscient Design"
                        className="h-5 w-auto inline-block align-middle shrink-0 ml-0.5 cursor-pointer"
                        title="Membre Omniscient Design"
                      />
                    </a>
                  )}
                </h1>
              </div>
              {profileData.pseudo && (
                <p className="text-sm sm:text-base font-medium text-slate-500 mt-0.5">
                  @{profileData.pseudo}
                </p>
              )}
            </div>

            {/* Role + School */}
            <div className="space-y-1">
              {profileData.role && <p className="text-base font-medium text-[#111111]">{profileData.role}</p>}
              {profileData.currentSchool && <p className="text-base font-medium text-[#555555]">{profileData.currentSchool}</p>}
            </div>

            {/* Credentials */}
            <div className="space-y-1">
              <p className="text-base font-medium text-[#111111] break-all">{profileData.email}</p>
              <p className="text-base font-medium text-[#AAAAAA] tracking-widest">**************</p>
            </div>

            {/* Social Links */}
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
                  title="Book Link"
                >
                  <IconLink className="w-7 h-7 xs:w-8 xs:h-8" />
                </a>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2.5 xs:gap-3 pt-1">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="h-9 xs:h-10 px-4 xs:px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Modifier</span>
                <IconPencil className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </button>

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="h-9 xs:h-10 px-4 xs:px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Se déconnecter</span>
                <IconLogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </button>

              <button
                onClick={() => setIsDeleteReasonModalOpen(true)}
                className="h-9 xs:h-10 px-4 xs:px-6 border-[1.5px] border-[#FF0000] bg-[#EEEEEE] hover:bg-red-50 rounded-full text-base font-medium text-[#FF0000] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Supprimer mon compte</span>
                <IconDelete className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#FF0000]" />
              </button>
            </div>

          </div>
        </div>

        {/* MOBILE SEPARATOR LINE (1px) */}
        <div className="w-full h-[1px] bg-[#111111] md:hidden shrink-0" />

        {/* RIGHT COLUMN - DOCUMENTS / ENREGISTREMENTS */}
        <div className="w-full md:w-1/2 shrink-0 md:h-full flex flex-col pt-8 md:pt-28 pb-10 md:pb-0 px-4 xs:px-6 md:pl-6 md:pr-14 md:overflow-hidden bg-[#EEEEEE]">

          {/* SEGMENTED SWITCH CONTROL */}
          <div className="mb-5 xs:mb-6 flex items-center justify-start shrink-0">
            <div className="h-9 xs:h-10 border-[1.5px] border-[#111111] bg-[#EEEEEE] inline-flex items-center rounded-full overflow-hidden p-0 shadow-sm">
              <button
                onClick={() => setActiveTab('documents')}
                className={`h-full px-3.5 xs:px-5 sm:px-6 flex items-center gap-1.5 sm:gap-2.5 text-sm xs:text-sm sm:text-base font-medium transition-colors cursor-pointer ${activeTab === 'documents'
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
                className={`h-full px-3.5 xs:px-5 sm:px-6 flex items-center gap-1.5 sm:gap-2.5 text-sm xs:text-sm sm:text-base font-medium transition-colors cursor-pointer ${activeTab === 'enregistrements'
                  ? 'bg-[#111111] text-[#EEEEEE]'
                  : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                  }`}
              >
                <span className="inline sm:hidden">Enregistrements ({savedProjects.length || 0})</span>
                <span className="hidden sm:inline">Mes enregistrements ({savedProjects.length || 0})</span>
                <IconBookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* CTA "AJOUTER MON TRAVAIL" */}
          {activeTab === 'documents' && (
            <div className="mb-6 xs:mb-8 flex items-center justify-start shrink-0">
              <button
                onClick={() => onOpenSubmit?.()}
                className="h-9 xs:h-10 px-4 xs:px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Ajouter mon travail</span>
                <IconAddDocument className="w-4 h-4 text-[#111111]" />
              </button>
            </div>
          )}

          {/* SCROLLABLE COVERS LIST */}
          <div className="flex-1 overflow-y-auto space-y-12 pr-2 pb-10 scrollbar-none">
            {activeTab === 'documents' ? (
              userProjects.length === 0 ? (
                <div className="p-8 text-center bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-2xl">
                  <p className="text-base font-medium text-[#111111]">Vous n'avez aucun document publié.</p>
                </div>
              ) : (
                userProjects.map((project) => {
                  const domainName = project.domain?.name || project.field;
                  return (
                    <div key={project.id} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                      <div
                        className="w-48 sm:w-56 shrink-0 shadow-sm bg-slate-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleSelectProject(project)}
                      >
                        {project.coverUrl ? (
                          <img
                            src={getFileUrl(project.coverUrl)}
                            alt={project.title}
                            className="w-full h-auto object-contain block"
                          />
                        ) : (
                          <div className="w-full h-44 flex items-center justify-center text-sm font-medium text-slate-400">PDF</div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-start py-0">
                        <div>
                          <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mb-1 font-semibold">
                            <div className="flex items-center gap-1">
                              <IconEye className="w-3.5 h-3.5 text-[#111111]" />
                              <span>{project.viewsCount ?? project.views ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <IconBookmarkSave className="w-3.5 h-3.5 text-[#111111]" />
                              <span>{project.savesCount ?? project._count?.savedBy ?? project.savedCount ?? 0}</span>
                            </div>
                            {project.allowDownload && (
                              <div className="flex items-center gap-1">
                                <IconDownload className="w-3.5 h-3.5 text-[#111111]" />
                                <span>{project.downloadsCount ?? 0}</span>
                              </div>
                            )}
                          </div>
                          <h3
                            className="text-xl font-bold text-[#111111] mb-2 leading-snug cursor-pointer hover:underline"
                            onClick={() => handleSelectProject(project)}
                          >
                            {decodeHTMLEntities(project.title)}
                          </h3>
                          <p className="text-base font-medium text-[#111111] mb-0.5">
                            {[
                              project.year ? String(project.year) : null,
                              project.type ? decodeHTMLEntities(project.type) : null,
                              domainName && domainName.trim() !== '' && domainName !== 'Inconnu' ? decodeHTMLEntities(domainName) : null
                            ].filter(Boolean).join(' — ')}
                          </p>

                          <p className="text-base font-medium text-[#111111] leading-relaxed mb-6 max-w-md">
                            {decodeHTMLEntities(project.description) || "Pas de description"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {deletingId === project.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteProjectItem(project.id)}
                                className="h-10 px-5 rounded-full bg-red-600 text-white text-base font-medium border border-[#111111] hover:bg-red-700 cursor-pointer"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="h-10 px-5 rounded-full bg-[#EEEEEE] text-[#111111] text-base font-medium border border-[#111111] hover:bg-[#E2E2E2] cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSelectProject(project)}
                                className="h-10 px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer shadow-sm"
                              >
                                <span>Consulter</span>
                                <ExternalLink className="w-4 h-4 stroke-[2.25]" />
                              </button>
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
                  );
                })
              )
            ) : (
              savedProjects.length === 0 ? (
                <div className="p-8 text-center bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-2xl">
                  <p className="text-base font-medium text-[#111111]">Vous n'avez aucun enregistrement.</p>
                </div>
              ) : (
                savedProjects.map((project) => {
                  const domainName = project.domain?.name || project.field;
                  const authorName = project.author ? (typeof project.author === 'object' ? getUserDisplayName(project.author) : decodeHTMLEntities(project.author)) : null;
                  return (
                    <div key={project.id} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                      <div
                        className="w-48 sm:w-56 shrink-0 shadow-sm bg-slate-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleSelectProject(project)}
                      >
                        {project.coverUrl ? (
                          <img src={getFileUrl(project.coverUrl)} alt={project.title} className="w-full h-auto object-contain block" />
                        ) : (
                          <div className="w-full h-44 flex items-center justify-center text-sm font-medium text-slate-400">PDF</div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-start py-0">
                        <div>
                          <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mb-1 font-semibold">
                            <div className="flex items-center gap-1">
                              <IconEye className="w-3.5 h-3.5 text-[#111111]" />
                              <span>{project.viewsCount ?? project.views ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <IconBookmarkSave className="w-3.5 h-3.5 text-[#111111]" />
                              <span>{project.savesCount ?? project._count?.savedBy ?? project.savedCount ?? 0}</span>
                            </div>
                            {project.allowDownload && (
                              <div className="flex items-center gap-1">
                                <IconDownload className="w-3.5 h-3.5 text-[#111111]" />
                                <span>{project.downloadsCount ?? 0}</span>
                              </div>
                            )}
                          </div>
                          <h3
                            className="text-xl font-bold text-[#111111] mb-2 leading-snug cursor-pointer hover:underline"
                            onClick={() => handleSelectProject(project)}
                          >
                            {decodeHTMLEntities(project.title)}
                          </h3>
                          <p className="text-base font-medium text-[#111111] mb-0.5">
                            {[
                              project.year ? String(project.year) : null,
                              project.type ? decodeHTMLEntities(project.type) : null,
                              domainName && domainName.trim() !== '' && domainName !== 'Inconnu' ? decodeHTMLEntities(domainName) : null
                            ].filter(Boolean).join(' — ')}
                          </p>
                          <p className="text-base font-medium text-[#111111] mb-4">
                            {[
                              authorName,
                              project.school && project.school.trim() !== '' && project.school !== 'Inconnu' ? decodeHTMLEntities(project.school) : null
                            ].filter(Boolean).join(' — ')}
                          </p>
                          <p className="text-base font-medium text-[#111111] leading-relaxed mb-6 max-w-md">
                            {decodeHTMLEntities(project.description) || "Pas de description"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleSelectProject(project)}
                            className="h-10 px-6 border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-base font-medium text-[#111111] flex items-center gap-2.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Consulter</span>
                            <ExternalLink className="w-4 h-4 stroke-[2.25]" />
                          </button>
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
                  );
                })
              )
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={profileData}
        onSaveProfile={handleSaveProfileData}
      />

      {cropperImageSrc && (
        <AvatarCropperModal
          imageSrc={cropperImageSrc}
          onClose={() => setCropperImageSrc(null)}
          onComplete={handleCropComplete}
        />
      )}

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      <DeleteAccountReasonModal
        isOpen={isDeleteReasonModalOpen}
        onClose={() => setIsDeleteReasonModalOpen(false)}
        onNext={(reason) => {
          setDeletionReason(reason);
          setIsDeleteReasonModalOpen(false);
          setIsDeleteConfirmModalOpen(true);
        }}
      />

      <DeleteAccountConfirmModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        onConfirm={handleConfirmDeleteAccount}
      />
    </div>
  );
}

export default ProfileDrawer;