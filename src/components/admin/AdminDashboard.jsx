import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { 
  Users, FolderGit2, Globe, TrendingUp, Search, 
  Trash2, ChevronRight, Activity, LogOut, ArrowLeft, Ban 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, projectsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/projects')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données administrateur.");
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ? Tous ses projets seront perdus.")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      toast.success("Utilisateur supprimé avec succès.");
    } catch (err) {
      toast.error("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  const handleToggleBan = async (id, currentStatus) => {
    const action = currentStatus ? 'débannir' : 'bannir';
    if (!window.confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) return;
    try {
      const res = await api.patch(`/admin/users/${id}/ban`);
      setUsers(users.map(u => u.id === id ? { ...u, isBanned: res.data.isBanned } : u));
      toast.success(`Utilisateur ${res.data.isBanned ? 'banni' : 'débanni'} avec succès.`);
    } catch (err) {
      toast.error(`Erreur lors du ${currentStatus ? 'débannissement' : 'bannissement'}.`);
    }
  };

  // Protect route
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEEEEE] text-[#111111]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Accès Refusé</h1>
          <p className="text-gray-500 mb-4">Vous n'avez pas les droits d'administrateur.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-black text-white rounded-md"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce projet définitivement ?")) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, totalProjects: prev.totalProjects - 1 }));
      toast.success("Projet supprimé avec succès.");
    } catch (err) {
      toast.error("Erreur lors de la suppression du projet.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.firstName && u.firstName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
        <Activity className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F9F9] font-sans text-[#111111]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Ar</span>
            </div>
            <h1 className="font-semibold text-lg tracking-tight">Archiv Admin</h1>
          </div>
          <p className="text-xs text-gray-400">Panneau de contrôle sécurisé</p>
        </div>
        
        <div className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'overview' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <TrendingUp className="w-4 h-4" /> Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'users' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users className="w-4 h-4" /> Utilisateurs
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'projects' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FolderGit2 className="w-4 h-4" /> Projets
          </button>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </button>
          <button 
            onClick={() => { logout(); window.location.href = '/'; }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          
          <header className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab === 'overview' ? 'Vue d\'ensemble' : activeTab}</h2>
            <p className="text-gray-500 mt-1">Gérez votre plateforme, vos utilisateurs et leur contenu.</p>
          </header>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-8 text-sm">
              {error}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Utilisateurs</p>
                  <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Projets</p>
                  <h3 className="text-3xl font-bold">{stats.totalProjects}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Domaines liés</p>
                  <h3 className="text-3xl font-bold">{stats.totalDomains}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..." 
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50 uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Utilisateur</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">École</th>
                      <th className="px-6 py-4 font-medium text-center">Projets</th>
                      <th className="px-6 py-4 font-medium text-center">Statut</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                          {u.profilePicture ? (
                            <img src={u.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{u.firstName} {u.lastName} {u.isAdmin && <span className="ml-2 inline-block px-2 py-0.5 bg-black text-white text-[10px] rounded-full uppercase tracking-wider">Admin</span>}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 text-gray-500">{u.currentSchool || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-medium text-xs">
                            {u._count?.projects || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.isBanned ? (
                            <span className="inline-flex px-2 py-1 text-[10px] rounded-full bg-red-100 text-red-600 font-bold uppercase tracking-wider">
                              Banni
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-[10px] rounded-full bg-emerald-100 text-emerald-600 font-bold uppercase tracking-wider">
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleToggleBan(u.id, u.isBanned)}
                              disabled={u.isAdmin}
                              className={`p-2 rounded-md transition-colors ${u.isAdmin ? 'opacity-30 cursor-not-allowed' : (u.isBanned ? 'text-emerald-600 hover:bg-emerald-50' : 'text-orange-600 hover:bg-orange-50')}`}
                              title={u.isBanned ? "Débannir" : "Bannir"}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.isAdmin}
                              className={`p-2 rounded-md transition-colors ${u.isAdmin ? 'opacity-30 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un projet..." 
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50 uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16">Couverture</th>
                      <th className="px-6 py-4 font-medium">Titre</th>
                      <th className="px-6 py-4 font-medium">Auteur</th>
                      <th className="px-6 py-4 font-medium">École</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProjects.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-12 h-16 rounded overflow-hidden bg-gray-100">
                            {p.coverUrl && <img src={p.coverUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Inconnu'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{p.school}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
