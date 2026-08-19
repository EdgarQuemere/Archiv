const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

try {
  const db = new Database('./dev.db');
  console.log("DB opened", db.name);
  const adapter = new PrismaBetterSqlite3(db);
  console.log("Adapter created");
  const prisma = new PrismaClient({ adapter });
  console.log("Prisma created");
  prisma.user.findMany().then(res => {
    console.log("Query success", res);
  }).catch(e => {
    console.error("Query error", e);
  });
} catch(e) {
  console.error("Init error", e);
}
