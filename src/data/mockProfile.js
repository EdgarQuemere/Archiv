export const MOCK_USER_PROFILE = {
  id: 'mock-user-edgar',
  firstName: 'Edgar',
  lastName: 'Quéméré',
  email: 'edgarquemere2645@gmail.com',
  role: 'Enseignant',
  currentSchool: 'HEAR – Strasbourg',
  bio: 'Création des principes virtuels réagissant à la pression et à la vitesse du stylet pour une peinture numérique organique.',
  behanceLink: 'https://behance.net/edgarquemere',
  instaLink: 'https://instagram.com/edgarquemere',
  personalLink: 'https://edgarquemere.com',
  profilePicture: '/page-profile-test-front/edgar-avatar.jpg',
  isOmniscient: true,
  isAdmin: false,
  stats: {
    views: '2,840',
    downloads: '412',
    saves: '34',
    publicationCount: 2,
    appreciationRate: '98%'
  }
};

export const MOCK_USER_PROJECTS = [
  {
    id: 'mock-proj-1',
    title: "L'ecran comme toile",
    school: 'HEAR – Strasbourg',
    year: '2023',
    type: 'Illustration',
    field: 'Illustration',
    description: 'Création des principes virtuel réagisse la pression et à la vitesse du stylet pour une peinture numerique organique.',
    coverUrl: '/page-profile-test-front/cover.png',
    imageUrl: '/page-profile-test-front/cover.png',
    pdfUrl: '/pdf/Book.pdf',
    pdfSize: '1.2 Mo',
    userId: 'mock-user-edgar',
    author: 'Edgar Quéméré',
    tags: ['Illustration', 'Numérique', 'Stylet'],
    date: '2023-06-15T10:00:00.000Z'
  },
  {
    id: 'mock-proj-2',
    title: "Écrire en Afrique",
    school: 'HEAR – Strasbourg',
    year: '2023',
    type: 'Illustration',
    field: 'Illustration',
    description: 'Création des principes virtuel réagisse la pression et à la vitesse du stylet pour une peinture numerique organique.',
    coverUrl: '/page-profile-test-front/cover2.png',
    imageUrl: '/page-profile-test-front/cover2.png',
    pdfUrl: '/pdf/Book-2.pdf',
    pdfSize: '12.0 Mo',
    userId: 'mock-user-edgar',
    author: 'Edgar Quéméré',
    tags: ['Graphisme', 'Médias', 'Recherche'],
    date: '2023-09-20T14:30:00.000Z'
  }
];

export const MOCK_SAVED_PROJECTS = [
  {
    id: 'mock-saved-1',
    title: 'Formes & Matières Plastiques',
    author: 'Camille Moreau',
    school: 'École Boulle',
    year: '2024',
    type: 'Portfolio',
    field: 'Design d\'Espace',
    description: 'Recherche expérimentale autour de la réutilisation des matières thermoplastiques.',
    coverUrl: '/page-profile-test-front/cover.png',
    pdfUrl: '/pdf/Book.pdf',
    pdfSize: '6.5 Mo'
  },
  {
    id: 'mock-saved-2',
    title: 'Archiver le Futur',
    author: 'Lucas Martin',
    school: 'ENSCI – Les Ateliers',
    year: '2024',
    type: 'Mémoire',
    field: 'Design Textuel',
    description: 'Catalogue analytique des nouveaux polymères d\'origine végétale.',
    coverUrl: '/page-profile-test-front/cover3.png',
    pdfUrl: '/pdf/Book-2.pdf',
    pdfSize: '9.4 Mo'
  }
];
