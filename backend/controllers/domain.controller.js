const prisma = require('../config/db');

exports.getAllDomains = async (req, res) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des domaines' });
  }
};

exports.createDomain = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le nom du domaine est requis' });
    }
    
    // Check if it exists
    const existing = await prisma.domain.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'Ce domaine existe déjà' });
    }

    const newDomain = await prisma.domain.create({
      data: { name }
    });
    res.status(201).json(newDomain);
  } catch (error) {
    console.error('Error creating domain:', error);
    res.status(500).json({ error: 'Erreur lors de la création du domaine' });
  }
};

exports.deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's used by projects
    const projectsCount = await prisma.project.count({
      where: { domainId: id }
    });
    
    if (projectsCount > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer ce domaine car des projets y sont liés' });
    }

    await prisma.domain.delete({
      where: { id }
    });
    res.json({ message: 'Domaine supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du domaine' });
  }
};
