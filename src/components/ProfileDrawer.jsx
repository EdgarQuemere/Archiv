import React, { useEffect, useRef, useState, useContext } from 'react';
import { X, Info, User, Edit2, Trash2, Link2, Instagram, UploadCloud } from 'lucide-react';
import gsap from 'gsap';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import { AvatarCropperModal } from './AvatarCropperModal';

export function ProfileDrawer({
  isOpen,
  onClose,
  user,
  logout,
  covers,
  onEditProject,
  onDeleteProject
}) {
  const { deleteAccount, setUser } = useContext(AuthContext);
  const containerRef = useRef(null);
  
  // Local state for tabs and delete confirmation
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'enregistrements'
  const [deletingId, setDeletingId] = useState(null);

  const userProjects = user ? covers.filter(c => c.userId === user.id) : [];
  const savedProjects = user?.savedProjects ? user.savedProjects.map(sp => sp.project).filter(p => p !== null) : [];

  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Lire l'image localement pour le cropper
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
    setCropperImageSrc(null); // fermer la modale
    
    const formData = new FormData();
    formData.append('profilePicture', croppedFile);
    setIsUploadingAvatar(true);
    
    // Toast de chargement (promise)
    toast.promise(
      api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
      {
        loading: 'Mise à jour de l\'avatar...',
        success: (response) => {
          setUser(response.data.user);
          setIsUploadingAvatar(false);
          return 'Ton profil a été mis à jour avec succès !';
        },
        error: (err) => {
          console.error(err);
          setIsUploadingAvatar(false);
          return 'Impossible de mettre à jour la photo.';
        }
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setDeletingId(null);
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, { 
        opacity: 0, 
        scale: 0.98,
        duration: 0.3, 
        ease: 'power2.in',
        onComplete: () => onClose()
      });
    } else {
      onClose();
    }
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Es-tu sûr de vouloir supprimer définitivement ton compte et tous tes projets associés ? Cette action est irréversible.")) {
      try {
        await deleteAccount();
        handleClose();
      } catch (err) {
        console.error("Erreur lors de la suppression du compte:", err);
        alert("Impossible de supprimer le compte.");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      onDeleteProject(id);
      setDeletingId(null);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Impossible de supprimer le projet.");
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans bg-[#EEEEEE] text-[#111111]" ref={containerRef}>
      <div className="flex h-full w-full">
        
        {/* LEFT COLUMN - USER INFO */}
        <div className="w-1/2 h-full flex flex-col justify-between border-r-2 border-[#111111] p-12">
          
          {/* Top pseudo-navbar */}
          <div className="flex gap-4">
            <button className="bg-[#111111] text-[#EEEEEE] text-xs font-bold px-4 py-2 border-2 border-[#111111]">
              Archiv'
            </button>
            <button className="bg-transparent text-[#111111] px-3 py-2 border-2 border-[#111111] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </button>
            <button className="bg-[#111111] text-[#EEEEEE] px-3 py-2 border-2 border-[#111111] flex items-center justify-center">
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom user details */}
          <div className="max-w-md">
            {/* Avatar */}
            <div 
              className="relative w-24 h-24 bg-black mb-6 border-2 border-[#111111] group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleAvatarDrop}
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold bg-[#111111]">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <UploadCloud className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-center leading-tight">Glisser ou<br/>Modifier</span>
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

            {/* Identity */}
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {user.firstName} {user.lastName}
                {user.isOmniscient && (
                  <img src="/logo-od.svg" alt="Omniscient Design" className="h-6 w-auto object-contain" title="Membre de la communauté Omniscient Design" />
                )}
              </h1>
              <div className="w-4 h-4 bg-black rounded-full text-white flex items-center justify-center text-[8px] font-bold">©</div>
            </div>

            {/* Info */}
            <div className="space-y-4 mb-8">
              <p className="text-sm font-semibold">{user.role}</p>
              <p className="text-sm font-semibold">{user.currentSchool}</p>
              <p className="text-sm">{user.email}</p>
              <p className="text-sm tracking-widest">**************</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 mb-8">
              <button className="font-serif text-2xl font-bold">Bē</button>
              <button><Instagram className="w-6 h-6" /></button>
              <button><Link2 className="w-6 h-6" /></button>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="px-6 py-2 border-2 border-[#111111] text-xs font-semibold flex items-center gap-2 hover:bg-black hover:text-white transition-colors">
                Modifier <Edit2 className="w-3 h-3" />
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="px-6 py-2 border-2 border-red-500 text-red-500 text-xs font-semibold flex items-center gap-2 hover:bg-red-50 transition-colors"
              >
                Supprimer mon compte <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            {/* Logout hidden in the bottom just in case */}
            <button onClick={handleLogout} className="mt-8 text-xs underline text-slate-500 hover:text-black">
              Se déconnecter
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - PROJECTS */}
        <div className="w-1/2 h-full flex flex-col relative">
          
          {/* Top right Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-12 right-12 w-8 h-8 border-2 border-[#111111] flex items-center justify-center hover:bg-[#111111] hover:text-[#EEEEEE] transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content Area */}
          <div className="p-12 pt-32 h-full flex flex-col">
            
            {/* Tabs */}
            <div className="flex mb-12">
              <button 
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-2.5 border-2 border-[#111111] text-xs font-bold flex items-center gap-2 ${activeTab === 'documents' ? 'bg-[#111111] text-[#EEEEEE]' : 'bg-[#EEEEEE] text-[#111111]'}`}
              >
                Mes documents ({userProjects.length})
                <div className="w-3 h-4 border-2 border-current rounded-sm"></div>
              </button>
              <button 
                onClick={() => setActiveTab('enregistrements')}
                className={`px-6 py-2.5 border-2 border-l-0 border-[#111111] text-xs font-bold flex items-center gap-2 ${activeTab === 'enregistrements' ? 'bg-[#111111] text-[#EEEEEE]' : 'bg-white text-[#111111]'}`}
              >
                Mes enregistrements ({savedProjects.length})
                <div className="w-3 h-4 border-2 border-current rounded-sm border-t-0"></div>
              </button>
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto space-y-12 pr-4 pb-12">
              {activeTab === 'enregistrements' ? (
                savedProjects.length === 0 ? (
                  <div className="text-sm font-semibold text-slate-500 mt-8">
                    Vous n'avez pas encore d'enregistrements.
                  </div>
                ) : (
                  savedProjects.map(project => (
                    <div key={project.id} className="flex gap-8 group">
                      <div className="w-48 shrink-0">
                        <div className="aspect-[3/4] bg-slate-200 border-2 border-[#111111] overflow-hidden shadow-[4px_4px_0_#111111]">
                          {project.coverUrl ? (
                            <img src={project.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">PDF</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col py-2">
                        <h3 className="text-xl font-bold mb-4">{project.title}</h3>
                        <p className="text-xs font-semibold mb-6">
                          {project.school} - {project.year} - {project.type}
                        </p>
                        <p className="text-xs leading-relaxed max-w-sm mb-auto">
                          {project.description || "Aucune description fournie."}
                        </p>

                        <div className="mt-6">
                          <button 
                            onClick={async () => {
                              try {
                                await api.delete(`/projects/${project.id}/save`);
                                setUser(prev => ({
                                  ...prev,
                                  savedProjects: prev.savedProjects.filter(sp => sp.projectId !== project.id)
                                }));
                              } catch (err) {
                                console.error(err);
                                alert("Impossible de retirer le projet.");
                              }
                            }}
                            className="px-6 py-2 border-2 border-[#111111] bg-white text-red-600 text-xs font-semibold flex items-center gap-2 hover:bg-red-50 transition-colors"
                          >
                            Retirer des enregistrements
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : userProjects.length === 0 ? (
                <div className="text-sm font-semibold text-slate-500 mt-8">
                  Vous n'avez pas encore publié de projet.
                </div>
              ) : (
                userProjects.map(project => (
                  <div key={project.id} className="flex gap-8 group">
                    {/* Cover Thumbnail (left) */}
                    <div className="w-48 shrink-0">
                      <div className="aspect-[3/4] bg-slate-200 border-2 border-[#111111] overflow-hidden shadow-[4px_4px_0_#111111]">
                        {project.coverUrl ? (
                          <img src={project.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">PDF</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Project Info (right) */}
                    <div className="flex-1 flex flex-col py-2">
                      <h3 className="text-xl font-bold mb-4">{project.title}</h3>
                      <p className="text-xs font-semibold mb-6">
                        {project.school} - {project.year} - {project.type}
                      </p>
                      
                      <p className="text-xs leading-relaxed max-w-sm mb-auto">
                        {project.description || "Aucune description fournie."}
                      </p>

                      <div className="mt-6">
                        {deletingId === project.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete(project.id)} className="px-4 py-2 bg-red-600 text-white text-xs font-bold border-2 border-[#111111] hover:bg-red-700">Confirmer suppression</button>
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 bg-white text-[#111111] text-xs font-bold border-2 border-[#111111] hover:bg-slate-100">Annuler</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onEditProject(project)}
                              className="px-6 py-2 border-2 border-[#111111] bg-[#EEEEEE] text-xs font-semibold flex items-center gap-2 hover:bg-[#111111] hover:text-[#EEEEEE] transition-colors"
                            >
                              Modifier <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => setDeletingId(project.id)}
                              className="px-4 py-2 border-2 border-[#111111] bg-white text-red-600 text-xs font-semibold flex items-center gap-2 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modale de Crop Avatar */}
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
