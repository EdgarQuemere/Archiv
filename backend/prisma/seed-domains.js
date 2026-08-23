require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DOMAINS = [
  'Animation',
  'Espace',
  'Événement',
  'Graphisme',
  'Instrument',
  'Livre',
  'Matériaux',
  'Mode',
  'Numérique',
  'Objet',
  'Ornement',
  'Patrimoine',
  'Spectacle@',
  'Textile',
  'Design d\'espace',
  'Design graphique@',
  'Design de produit',
  'Design de mode et textile',
];

async function main() {
  console.log('🌱 Seeding domains...');

  // Get existing domains
  const existing = await prisma.domain.findMany();
  console.log(`Found ${existing.length} existing domains`);

  // Upsert all desired domains
  for (const name of DOMAINS) {
    const result = await prisma.domain.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ ${result.name}`);
  }

  // List domains NOT in new list (so user can decide what to do with them)
  const toReview = existing.filter(d => !DOMAINS.includes(d.name));
  if (toReview.length > 0) {
    console.log('\n⚠️  Ces anciens domaines ne sont plus dans la liste :');
    toReview.forEach(d => console.log(`  - [${d.id}] ${d.name}`));
    console.log('  → Ces domaines ont été conservés (des projets peuvent y être liés).');
  }

  console.log('\n✅ Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
