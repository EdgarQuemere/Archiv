import React, { useEffect, useRef, useState } from 'react';
import { X, LogOut, Edit2, Trash2, User } from 'lucide-react';
import gsap from 'gsap';
import api from '../api/axios';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function ProfileDrawer({
  isOpen,
  onClose,
  user,
  logout,
  covers,
  onEditProject,
  onDeleteProject
}) {
  const { deleteAccount } = useContext(AuthContext);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  
  // Local state for delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  const userProjects = user ? covers.filter(c => c.userId === user.id) : [];

  useEffect(() => {
    if (isOpen) {
      setDeletingId(null);
      gsap.timeline()
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        )
        .fromTo(
          panelRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: 'power3.out' },
          '-=0.2'
        );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (panelRef.current && backdropRef.current) {
      gsap.timeline({
        onComplete: () => {
          onClose();
        }
      })
      .to(panelRef.current, { x: '100%', duration: 0.3, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, '-=0.15');
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
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-[#111111]/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer Panel (Right Side) */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div
          ref={panelRef}
          className="w-screen max-w-md bg-[#EEEEEE] shadow-2xl flex flex-col h-full border-l-2 border-[#111111] transform-gpu rounded-none text-[#111111]"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-[#111111] text-[#EEEEEE] flex items-center justify-between rounded-none">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-[#EEEEEE]" />
              <div>
                <h2 className="text-base font-bold tracking-tight">Espace Personnel</h2>
                <p className="text-xs text-slate-300 font-mono">
                  Connecté en tant que {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-none text-[#EEEEEE] hover:opacity-75 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* User Info Block */}
            <div className="p-4 border-2 border-[#111111] bg-white">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Profil</div>
              <div className="text-sm font-semibold mb-1">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-slate-700">{user.email}</div>
              <div className="text-xs text-slate-700 mt-1">{user.role} • {user.currentSchool}</div>
            </div>

            {/* Projects List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider">Mes Projets Publiés</h3>
                <span className="text-xs font-mono bg-[#111111] text-[#EEEEEE] px-2 py-0.5">{userProjects.length}</span>
              </div>
              
              {userProjects.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-[#111111] text-xs font-semibold text-slate-500">
                  Vous n'avez pas encore publié de projet.
                </div>
              ) : (
                <div className="space-y-4">
                  {userProjects.map(project => (
                    <div key={project.id} className="border-2 border-[#111111] bg-white p-3 flex gap-4">
                      {/* Cover Thumbnail */}
                      <div className="w-16 h-20 bg-slate-200 border border-[#111111] shrink-0 overflow-hidden">
                        {project.coverUrl ? (
                          <img src={project.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">PDF</div>
                        )}
                      </div>
                      
                      {/* Info & Actions */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-bold line-clamp-1">{project.title}</div>
                          <div className="text-[10px] text-slate-500">{project.type} • {project.year}</div>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          {deletingId === project.id ? (
                            <div className="flex gap-1 w-full">
                              <button onClick={() => handleDelete(project.id)} className="flex-1 bg-red-600 text-white text-[10px] font-bold py-1 border border-[#111111] hover:bg-red-700">Confirmer</button>
                              <button onClick={() => setDeletingId(null)} className="flex-1 bg-slate-200 text-[#111111] text-[10px] font-bold py-1 border border-[#111111] hover:bg-slate-300">Annuler</button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => onEditProject(project)}
                                className="flex-1 flex items-center justify-center gap-1 bg-[#111111] text-[#EEEEEE] text-[10px] font-bold py-1 border border-[#111111] hover:opacity-90"
                              >
                                <Edit2 className="w-3 h-3" /> Éditer
                              </button>
                              <button 
                                onClick={() => setDeletingId(project.id)}
                                className="flex items-center justify-center gap-1 bg-white text-red-600 text-[10px] font-bold py-1 px-2 border border-[#111111] hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-[#EEEEEE] border-t-2 border-[#111111] space-y-3">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 border-2 border-slate-400 text-slate-700 bg-white hover:bg-slate-50 rounded-none text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full py-2.5 border-2 border-red-600 text-red-600 bg-white hover:bg-red-50 rounded-none text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer mon compte</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
