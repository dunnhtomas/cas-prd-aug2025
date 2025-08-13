const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  await prisma.eventLog.create({ data: { type: 'seed:init', payload: JSON.stringify({ note: 'seeded' }) } });
  console.log('Seed complete');
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());
