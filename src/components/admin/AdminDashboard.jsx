import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { 
  Users, FolderGit2, Globe, TrendingUp, Search, 
  Trash2, ChevronRight, Activity, LogOut, ArrowLeft, Ban, 
  ExternalLink, Eye, Download, Bookmark, Shield, Sparkles, Filter,
  ArrowUpDown, RefreshCw, Layers, GraduationCap, Calendar,
  CheckCircle2, XCircle, Menu, X, Edit3, Check
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { getFileUrl } from '../../utils/url';
import { decodeHTMLEntities } from '../../utils/text';
import { getUserDisplayName } from '../../utils/userUtils';

export function AdminDashboard() {
  const { user, logout } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // ALL | OMNISCIENT | BANNED | ACTIVE
  const [projectTypeFilter, setProjectTypeFilter] = useState('ALL');
  const [projectDomainFilter, setProjectDomainFilter] = useState('ALL');
  const [projectSchoolFilter, setProjectSchoolFilter] = useState('ALL');
  
  // Tri
  const [userSortField, setUserSortField] = useState('createdAt'); // createdAt | projects | name
  const [userSortOrder, setUserSortOrder] = useState('desc');
  const [projectSortField, setProjectSortField] = useState('createdAt'); // createdAt | views | downloads | title
  const [projectSortOrder, setProjectSortOrder] = useState('desc');

  // Modal d'édition rapide de projet
  const [editingProject, setEditingProject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    school: '',
    year: '',
    type: 'Mémoire',
    domainId: '',
    description: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchData();
    }
  }, [user]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsRes, usersRes, projectsRes, deletedRes, domainsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: null })),
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
        api.get('/admin/projects').catch(() => ({ data: [] })),
        api.get('/admin/deleted-accounts').catch(() => ({ data: [] })),
        api.get('/domains').catch(() => ({ data: { domains: [] } }))
      ]);

      if (statsRes.data) setStats(statsRes.data);
      setUsers(usersRes.data.users || usersRes.data || []);
      setProjects(projectsRes.data || []);
      setDeletedAccounts(deletedRes.data || []);
      setDomains(domainsRes.data.domains || domainsRes.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données administrateur.");
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement l'utilisateur "${userName}" ? Tous ses projets seront supprimés.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setStats(prev => prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : prev);
      toast.success("Utilisateur supprimé avec succès.");
    } catch (err) {
      toast.error("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  const handleToggleBan = async (id, currentStatus, userName) => {
    const action = currentStatus ? 'débannir' : 'bannir';
    if (!window.confirm(`Voulez-vous vraiment ${action} ${userName} ?`)) return;
    try {
      const res = await api.patch(`/admin/users/${id}/ban`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isBanned: res.data.isBanned } : u));
      toast.success(`Utilisateur ${res.data.isBanned ? 'banni' : 'débanni'} avec succès.`);
    } catch (err) {
      toast.error(`Erreur lors du ${currentStatus ? 'débannissement' : 'bannissement'}.`);
    }
  };

  const handleDeleteProject = async (id, projectTitle) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement le projet "${projectTitle}" ?`)) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      setStats(prev => prev ? { ...prev, totalProjects: prev.totalProjects - 1 } : prev);
      toast.success("Projet supprimé avec succès.");
    } catch (err) {
      toast.error("Erreur lors de la suppression du projet.");
    }
  };

  const handleOpenEditProject = (p) => {
    setEditingProject(p);
    setEditFormData({
      title: decodeHTMLEntities(p.title || ''),
      school: decodeHTMLEntities(p.school || ''),
      year: p.year ? String(p.year) : '2026',
      type: p.type || 'Mémoire',
      domainId: p.domainId || (p.domain && p.domain.id) || '',
      description: decodeHTMLEntities(p.description || '')
    });
  };

  const handleSaveEditProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    setEditLoading(true);
    try {
      const payload = {
        title: editFormData.title,
        school: editFormData.school,
        year: parseInt(editFormData.year, 10) || 2026,
        type: editFormData.type,
        domainId: editFormData.domainId || undefined,
        description: editFormData.description
      };

      const res = await api.put(`/admin/projects/${editingProject.id}`, payload);
      const updated = res.data.project || { ...editingProject, ...payload };
      
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...updated } : p));
      toast.success("Projet mis à jour avec succès.");
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erreur lors de la mise à jour du projet.");
    } finally {
      setEditLoading(false);
    }
  };

  // 🚀 Filtrage & Tri des utilisateurs
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        (u.pseudo && u.pseudo.toLowerCase().includes(q)) ||
        (u.currentSchool && u.currentSchool.toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;

      if (userRoleFilter === 'OMNISCIENT') return u.isOmniscient;
      if (userRoleFilter === 'BANNED') return u.isBanned;
      if (userRoleFilter === 'ACTIVE') return !u.isBanned;
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (userSortField === 'createdAt') {
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (userSortField === 'projects') {
        const countA = a._count?.projects ?? a.projectsCount ?? 0;
        const countB = b._count?.projects ?? b.projectsCount ?? 0;
        comparison = countA - countB;
      } else if (userSortField === 'name') {
        const nameA = `${a.firstName || ''} ${a.lastName || ''} ${a.pseudo || ''}`.trim().toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''} ${b.pseudo || ''}`.trim().toLowerCase();
        comparison = nameA.localeCompare(nameB);
      }
      return userSortOrder === 'desc' ? -comparison : comparison;
    });
  }, [users, searchQuery, userRoleFilter, userSortField, userSortOrder]);

  // 🚀 Filtrage & Tri des projets
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const authorName = p.author ? `${p.author.firstName || ''} ${p.author.lastName || ''} ${p.author.pseudo || ''}`.toLowerCase() : '';
      const matchesSearch = !q || (
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.school && p.school.toLowerCase().includes(q)) ||
        authorName.includes(q)
      );

      if (!matchesSearch) return false;

      if (projectTypeFilter !== 'ALL' && p.type !== projectTypeFilter) return false;
      if (projectDomainFilter !== 'ALL' && (p.domain?.name !== projectDomainFilter && p.domainId !== projectDomainFilter)) return false;
      if (projectSchoolFilter !== 'ALL' && p.school !== projectSchoolFilter) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (projectSortField === 'createdAt') {
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (projectSortField === 'views') {
        comparison = (a.viewsCount || a.views || 0) - (b.viewsCount || b.views || 0);
      } else if (projectSortField === 'downloads') {
        comparison = (a.downloadsCount || 0) - (b.downloadsCount || 0);
      } else if (projectSortField === 'saves') {
        const savesA = a.savesCount || a._count?.savedBy || a.savedCount || 0;
        const savesB = b.savesCount || b._count?.savedBy || b.savedCount || 0;
        comparison = savesA - savesB;
      } else if (projectSortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      }
      return projectSortOrder === 'desc' ? -comparison : comparison;
    });
  }, [projects, searchQuery, projectTypeFilter, projectDomainFilter, projectSchoolFilter, projectSortField, projectSortOrder]);

  // Liste des écoles uniques pour le filtre
  const uniqueSchools = useMemo(() => {
    const set = new Set();
    projects.forEach(p => {
      if (p.school && p.school.trim()) set.add(p.school.trim());
    });
    return Array.from(set).sort();
  }, [projects]);

  // Total cumulé de vues, téléchargements et enregistrements
  const aggregatedMetrics = useMemo(() => {
    let totalViews = 0;
    let totalDownloads = 0;
    let totalSaves = 0;
    let booksCount = 0;
    let memoiresCount = 0;
    let pdfCount = 0;

    projects.forEach(p => {
      totalViews += (p.viewsCount || p.views || 0);
      totalDownloads += (p.downloadsCount || 0);
      totalSaves += (p.savesCount || p._count?.savedBy || p.savedCount || 0);
      if (p.type === 'Book') booksCount++;
      else memoiresCount++;
      if (p.pdfUrl) pdfCount++;
    });

    return { totalViews, totalDownloads, totalSaves, booksCount, memoiresCount, pdfCount };
  }, [projects]);

  // Protection d'accès
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEEEEE] text-[#111111] font-sans p-6">
        <div className="bg-white border-[1.5px] border-[#111111] rounded-[24px] p-8 sm:p-12 max-w-md w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-red-100 border-[1.5px] border-red-300 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Accès Administrateur</h1>
          <p className="text-sm text-slate-600 mb-6">
            Cet espace est strictement réservé aux administrateurs de la plateforme Artchiv'.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="h-11 px-8 bg-[#111111] text-[#EEEEEE] font-medium text-sm rounded-full hover:bg-black transition-colors cursor-pointer"
          >
            Retourner à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEEEEE] text-[#111111] font-sans">
        <Activity className="w-8 h-8 text-[#111111] animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Chargement du panneau d'administration...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#EEEEEE] font-sans text-[#111111] overflow-hidden">
      
      {/* 📱 Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* 📂 Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#EEEEEE] border-r-[1.5px] border-[#111111] flex flex-col transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b-[1.5px] border-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/artchiv-logo.webp" alt="Artchiv" className="h-9 w-auto object-contain" />
            <span className="px-2 py-0.5 bg-[#111111] text-[#EEEEEE] text-[10px] font-bold uppercase tracking-wider rounded-full">
              Admin
            </span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-full hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Info */}
        <div className="px-5 py-4 bg-[#E4E4E4] border-b-[1.5px] border-[#111111]/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#111111] text-[#EEEEEE] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#111111]">
            {user.profilePicture ? (
              <img src={getFileUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
            ) : (
              (user.firstName || user.pseudo || 'A').charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate leading-tight">{getUserDisplayName(user)}</p>
            <p className="text-[11px] text-slate-600 truncate font-mono">{user.email}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeTab === 'overview' ? 'bg-[#111111] text-[#EEEEEE]' : 'text-[#111111] hover:bg-black/5'}`}
          >
            <TrendingUp className="w-4 h-4 stroke-[2.25]" />
            <span>Vue d'ensemble</span>
          </button>

          <button 
            onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeTab === 'users' ? 'bg-[#111111] text-[#EEEEEE]' : 'text-[#111111] hover:bg-black/5'}`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 stroke-[2.25]" />
              <span>Utilisateurs</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-black/10 text-[#111111]'}`}>
              {users.length}
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('projects'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeTab === 'projects' ? 'bg-[#111111] text-[#EEEEEE]' : 'text-[#111111] hover:bg-black/5'}`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-4 h-4 stroke-[2.25]" />
              <span>Projets</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-black/10 text-[#111111]'}`}>
              {projects.length}
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('deleted'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeTab === 'deleted' ? 'bg-[#111111] text-[#EEEEEE]' : 'text-[#111111] hover:bg-black/5'}`}
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 stroke-[2.25]" />
              <span>Comptes supprimés</span>
            </div>
            {deletedAccounts.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-mono font-bold">
                {deletedAccounts.length}
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t-[1.5px] border-[#111111] space-y-2">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium bg-[#EEEEEE] hover:bg-[#E2E2E2] transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.25]" />
            <span>Retourner au site</span>
          </button>
          <button 
            onClick={() => { logout(); window.location.href = '/'; }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-red-700 hover:bg-red-100/70 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[2.25]" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* 🚀 Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Bar Header */}
        <header className="h-16 border-b-[1.5px] border-[#111111] px-4 sm:px-8 flex items-center justify-between shrink-0 bg-[#EEEEEE]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {activeTab === 'overview' && "Vue d'ensemble"}
              {activeTab === 'users' && "Gestion des Utilisateurs"}
              {activeTab === 'projects' && "Gestion des Projets"}
              {activeTab === 'deleted' && "Historique des Suppressions"}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              title="Rafraîchir les données"
              className="h-9 px-3.5 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-100 border-[1.5px] border-red-400 text-red-700 rounded-[16px] text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. OVERVIEW TAB                                          */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Utilisateurs</span>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                      <Users className="w-4 h-4 stroke-[2.25]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold font-mono">{stats?.totalUsers ?? users.length}</h3>
                    <p className="text-xs text-slate-500 mt-1">Inscrits sur la plateforme</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Projets</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <FolderGit2 className="w-4 h-4 stroke-[2.25]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold font-mono">{stats?.totalProjects ?? projects.length}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {aggregatedMetrics.memoiresCount} mémoires • {aggregatedMetrics.booksCount} books
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vues</span>
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                      <Eye className="w-4 h-4 stroke-[2.25]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold font-mono">{aggregatedMetrics.totalViews.toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 mt-1">Lectures totales de projets</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Téléchargements</span>
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                      <Download className="w-4 h-4 stroke-[2.25]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold font-mono">{aggregatedMetrics.totalDownloads.toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 mt-1">PDFs téléchargés</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Enregistrés</span>
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                      <Bookmark className="w-4 h-4 stroke-[2.25]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold font-mono">{aggregatedMetrics.totalSaves.toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 mt-1">Projets mis en favoris</p>
                  </div>
                </div>
              </div>

              {/* Secondary Details & Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Derniers projets publiés */}
                <div className="bg-white p-6 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4" />
                      <span>Derniers projets publiés</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('projects')}
                      className="text-xs font-bold text-[#111111] underline hover:opacity-80"
                    >
                      Voir tout
                    </button>
                  </div>

                  <div className="space-y-3">
                    {projects.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#EEEEEE]/60 border border-[#111111]/10">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-[8px] bg-slate-200 overflow-hidden shrink-0 border border-[#111111]/20">
                            {p.coverUrl && <img src={getFileUrl(p.coverUrl)} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{decodeHTMLEntities(p.title)}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {p.author ? getUserDisplayName(p.author) : 'Inconnu'} • {p.school || 'Sans école'}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={`/projet/${p.slug || p.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 text-slate-600 hover:text-[#111111] transition-colors"
                          title="Voir le projet"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Derniers utilisateurs inscrits */}
                <div className="bg-white p-6 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Dernières inscriptions</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-[#111111] underline hover:opacity-80"
                    >
                      Voir tout
                    </button>
                  </div>

                  <div className="space-y-3">
                    {users.slice(0, 5).map(u => (
                      <div key={u.id} className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#EEEEEE]/60 border border-[#111111]/10">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-[#111111]/20 flex items-center justify-center font-bold text-xs">
                            {u.profilePicture ? (
                              <img src={getFileUrl(u.profilePicture)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (u.firstName || u.pseudo || 'A').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{getUserDisplayName(u)}</span>
                              {u.isOmniscient && (
                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[9px] font-bold rounded-full">Omni</span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate font-mono">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 2. USERS TAB                                             */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              
              {/* Filter and Search Bar */}
              <div className="bg-white p-4 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, pseudo, email, école..." 
                    className="w-full h-10 pl-9.5 pr-4 text-xs sm:text-sm bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none focus:ring-2 focus:ring-black/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="h-10 px-3.5 text-xs font-medium bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="ACTIVE">Actifs</option>
                    <option value="OMNISCIENT">Membres Omniscient</option>
                    <option value="BANNED">Bannis</option>
                  </select>

                  <select
                    value={`${userSortField}-${userSortOrder}`}
                    onChange={(e) => {
                      const [f, o] = e.target.value.split('-');
                      setUserSortField(f);
                      setUserSortOrder(o);
                    }}
                    className="h-10 px-3.5 text-xs font-medium bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none cursor-pointer"
                  >
                    <option value="createdAt-desc">Plus récents</option>
                    <option value="createdAt-asc">Plus anciens</option>
                    <option value="projects-desc">Plus de projets</option>
                    <option value="name-asc">Nom (A-Z)</option>
                  </select>
                </div>

              </div>

              {/* Table Container */}
              <div className="bg-white rounded-[20px] border-[1.5px] border-[#111111] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#EEEEEE] border-b-[1.5px] border-[#111111] text-[11px] uppercase tracking-wider font-bold text-slate-700">
                      <tr>
                        <th className="px-5 py-3.5">Utilisateur</th>
                        <th className="px-5 py-3.5">Email</th>
                        <th className="px-5 py-3.5">École</th>
                        <th className="px-5 py-3.5 text-center">Projets</th>
                        <th className="px-5 py-3.5 text-center">Statut</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#111111]/10">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                            Aucun utilisateur ne correspond à votre recherche.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5 font-medium">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-[#111111]/20 flex items-center justify-center font-bold text-xs">
                                  {u.profilePicture ? (
                                    <img src={getFileUrl(u.profilePicture)} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    (u.firstName || u.pseudo || 'A').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#111111] flex items-center gap-1.5">
                                    <span>{getUserDisplayName(u)}</span>
                                    {u.isAdmin && (
                                      <span className="px-1.5 py-0.2 bg-[#111111] text-white text-[9px] font-bold rounded-full">Admin</span>
                                    )}
                                    {u.isOmniscient && (
                                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[9px] font-bold rounded-full">Omni</span>
                                    )}
                                  </p>
                                  {u.pseudo && (
                                    <p className="text-[11px] text-slate-500 font-mono">@{u.pseudo}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{u.email}</td>
                            <td className="px-5 py-3.5 text-slate-600 text-xs">{u.currentSchool || '—'}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#EEEEEE] border border-[#111111]/20 font-bold font-mono text-xs">
                                {u._count?.projects ?? u.projectsCount ?? 0}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {u.isBanned ? (
                                  <span className="inline-flex px-2.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-700 font-bold uppercase tracking-wider border border-red-200">
                                    Banni
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider border border-emerald-200">
                                    Actif
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 font-mono" title={u.cguAcceptedAt ? `Consentement RGPD le ${new Date(u.cguAcceptedAt).toLocaleString('fr-FR')}` : 'Consentement RGPD au profil'}>
                                  RGPD: {u.cguAcceptedAt ? new Date(u.cguAcceptedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '✓'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {u.pseudo && (
                                  <a
                                    href={`/profil/${encodeURIComponent(u.pseudo)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-slate-600 hover:text-[#111111] hover:bg-black/5 rounded-full transition-colors"
                                    title="Voir le profil public"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <button 
                                  onClick={() => handleToggleBan(u.id, u.isBanned, getUserDisplayName(u))}
                                  disabled={u.isAdmin}
                                  className={`p-1.5 rounded-full transition-colors ${u.isAdmin ? 'opacity-20 cursor-not-allowed' : (u.isBanned ? 'text-emerald-700 hover:bg-emerald-50' : 'text-amber-700 hover:bg-amber-50')}`}
                                  title={u.isBanned ? "Débannir" : "Bannir"}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id, getUserDisplayName(u))}
                                  disabled={u.isAdmin}
                                  className={`p-1.5 rounded-full transition-colors ${u.isAdmin ? 'opacity-20 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 3. PROJECTS TAB                                          */}
          {/* ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              
              {/* Filter and Search Bar */}
              <div className="bg-white p-4 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par titre, auteur, école..." 
                    className="w-full h-10 pl-9.5 pr-4 text-xs sm:text-sm bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none focus:ring-2 focus:ring-black/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                    className="h-10 px-3.5 text-xs font-medium bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tous les types</option>
                    <option value="Mémoire">Mémoire</option>
                    <option value="Book">Book</option>
                  </select>

                  <select
                    value={projectDomainFilter}
                    onChange={(e) => setProjectDomainFilter(e.target.value)}
                    className="h-10 px-3.5 text-xs font-medium bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="ALL">Tous les domaines</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>

                  <select
                    value={projectSchoolFilter}
                    onChange={(e) => setProjectSchoolFilter(e.target.value)}
                    className="h-10 px-3.5 text-xs font-medium bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="ALL">Toutes les écoles</option>
                    {uniqueSchools.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <select
                    value={`${projectSortField}-${projectSortOrder}`}
                    onChange={(e) => {
                      const [f, o] = e.target.value.split('-');
                      setProjectSortField(f);
                      setProjectSortOrder(o);
                    }}
                    className="h-10 px-3.5 text-xs font-medium bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full focus:outline-none cursor-pointer"
                  >
                    <option value="createdAt-desc">Plus récents</option>
                    <option value="createdAt-asc">Plus anciens</option>
                    <option value="views-desc">Plus consultés</option>
                    <option value="downloads-desc">Plus téléchargés</option>
                    <option value="saves-desc">Plus enregistrés</option>
                    <option value="title-asc">Titre (A-Z)</option>
                  </select>
                </div>

              </div>

              {/* Table Container */}
              <div className="bg-white rounded-[20px] border-[1.5px] border-[#111111] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#EEEEEE] border-b-[1.5px] border-[#111111] text-[11px] uppercase tracking-wider font-bold text-slate-700">
                      <tr>
                        <th className="px-5 py-3.5 w-16">Couverture</th>
                        <th className="px-5 py-3.5">Titre & Auteur</th>
                        <th className="px-5 py-3.5">Type & Domaine</th>
                        <th className="px-5 py-3.5">École & Année</th>
                        <th className="px-5 py-3.5 text-center">Vues / DL / Favs</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#111111]/10">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                            Aucun projet ne correspond à vos critères.
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="w-12 h-16 rounded-[6px] overflow-hidden bg-slate-200 border border-[#111111]/20 shrink-0">
                                {p.coverUrl && <img src={getFileUrl(p.coverUrl)} alt="" className="w-full h-full object-cover" />}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-medium max-w-xs">
                              <p className="font-bold text-[#111111] line-clamp-1">{decodeHTMLEntities(p.title)}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {p.author ? getUserDisplayName(p.author) : 'Auteur inconnu'}
                              </p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-block font-medium text-xs text-[#111111] bg-[#EEEEEE] px-2 py-0.5 rounded-full border border-[#111111]/20">
                                {p.type || 'Mémoire'}
                              </span>
                              {p.domain && (
                                <p className="text-[11px] text-slate-500 mt-1">{p.domain.name || p.domain}</p>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 text-xs">
                              <p className="font-medium text-[#111111] line-clamp-1">{p.school || '—'}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.year || '—'}</p>
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono text-xs">
                              <div className="flex items-center justify-center gap-3">
                                <span className="flex items-center gap-1 text-slate-700" title="Vues">
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  {p.viewsCount || p.views || 0}
                                </span>
                                <span className="flex items-center gap-1 text-slate-700" title="Téléchargements">
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  {p.downloadsCount || 0}
                                </span>
                                <span className="flex items-center gap-1 text-rose-700" title="Enregistré en favoris">
                                  <Bookmark className="w-3.5 h-3.5 text-rose-500" />
                                  {p.savesCount || p._count?.savedBy || p.savedCount || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a 
                                  href={`/projet/${p.slug || p.id}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-600 hover:text-[#111111] hover:bg-black/5 rounded-full transition-colors"
                                  title="Ouvrir la vue projet"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button 
                                  onClick={() => handleOpenEditProject(p)}
                                  className="p-1.5 text-slate-700 hover:text-black hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                                  title="Modifier les métadonnées"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProject(p.id, p.title)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 4. DELETED ACCOUNTS TAB                                  */}
          {/* ======================================================== */}
          {activeTab === 'deleted' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="bg-white p-5 rounded-[20px] border-[1.5px] border-[#111111] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">Comptes supprimés ({deletedAccounts.length})</h3>
                  <p className="text-xs text-slate-500">Registre d'audit des demandes de suppression RGPD</p>
                </div>

                {deletedAccounts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    Aucune suppression de compte enregistrée.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-[#EEEEEE] border-b-[1.5px] border-[#111111] text-[11px] uppercase tracking-wider font-bold text-slate-700">
                        <tr>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Nom / Pseudo</th>
                          <th className="px-4 py-3">École</th>
                          <th className="px-4 py-3">Raison</th>
                          <th className="px-4 py-3 text-right">Date de suppression</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#111111]/10">
                        {deletedAccounts.map(d => (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.email}</td>
                            <td className="px-4 py-3 font-medium">
                              {d.pseudo ? `@${d.pseudo}` : [d.firstName, d.lastName].filter(Boolean).join(' ') || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{d.school || '—'}</td>
                            <td className="px-4 py-3">
                              <span className="inline-block max-w-[250px] truncate text-slate-800 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 text-xs" title={d.reason}>
                                {d.reason || 'Non précisée'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs text-right whitespace-nowrap font-mono">
                              {new Date(d.deletedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ======================================================== */}
      {/* 🛠️ MODAL RAPIDE DE MODIFICATION DE PROJET                 */}
      {/* ======================================================== */}
      {editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[24px] max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                <span>Modifier le projet</span>
              </h3>
              <button 
                onClick={() => setEditingProject(null)}
                className="w-8 h-8 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProject} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold block mb-1">Titre du projet *</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full h-10 px-3.5 bg-white border-[1.5px] border-[#111111] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Type *</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 px-3 bg-white border-[1.5px] border-[#111111] rounded-[10px] focus:outline-none cursor-pointer"
                  >
                    <option value="Mémoire">Mémoire</option>
                    <option value="Book">Book</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Année *</label>
                  <input 
                    type="number" 
                    required
                    value={editFormData.year}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-white border-[1.5px] border-[#111111] rounded-[10px] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">École</label>
                <input 
                  type="text" 
                  value={editFormData.school}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, school: e.target.value }))}
                  placeholder="Ex: École Boulle..."
                  className="w-full h-10 px-3.5 bg-white border-[1.5px] border-[#111111] rounded-[10px] focus:outline-none"
                />
              </div>

              {domains.length > 0 && (
                <div>
                  <label className="font-bold block mb-1">Domaine</label>
                  <select
                    value={editFormData.domainId}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, domainId: e.target.value }))}
                    className="w-full h-10 px-3 bg-white border-[1.5px] border-[#111111] rounded-[10px] focus:outline-none cursor-pointer"
                  >
                    <option value="">Sélectionner un domaine</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Résumé du projet..."
                  className="w-full p-3 bg-white border-[1.5px] border-[#111111] rounded-[10px] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="h-10 px-5 rounded-full border-[1.5px] border-[#111111] hover:bg-black/5 font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="h-10 px-6 bg-[#111111] text-[#EEEEEE] rounded-full hover:bg-black font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
