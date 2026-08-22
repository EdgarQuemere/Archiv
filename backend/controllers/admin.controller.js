const prisma = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalProjects = await prisma.project.count();
    const totalDomains = await prisma.domain.count();
    res.json({ totalUsers, totalProjects, totalDomains });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    
    const total = await prisma.user.count();

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { author: true, domain: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleBanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned }
    });
    
    res.json({ 
      message: updatedUser.isBanned ? 'Utilisateur banni avec succès' : 'Utilisateur débanni avec succès', 
      isBanned: updatedUser.isBanned 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeletedAccounts = async (req, res) => {
  try {
    const deletedAccounts = await prisma.deletedAccount.findMany({
      orderBy: { deletedAt: 'desc' }
    });
    res.json(deletedAccounts);
  } catch (error) {
    console.error("Get Deleted Accounts Error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des comptes supprimés." });
  }
};
