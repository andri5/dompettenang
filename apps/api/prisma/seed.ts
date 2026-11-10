import { ensureDefaultCategories } from '../src/services/defaultCategories.service.js';
import { prisma } from '../src/utils/prisma.js';

async function main() {
  console.log('🌱 Seeding database...');
  await ensureDefaultCategories();
  console.log('✨ Default categories ensured (idempotent)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
