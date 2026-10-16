import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

const expenseCategories = [
  { name: 'Makanan', icon: 'utensils', color: '#FF5733', type: TransactionType.EXPENSE },
  { name: 'Transportasi', icon: 'car', color: '#3498DB', type: TransactionType.EXPENSE },
  { name: 'Belanja', icon: 'shopping-bag', color: '#2ECC71', type: TransactionType.EXPENSE },
  { name: 'Tagihan', icon: 'zap', color: '#F39C12', type: TransactionType.EXPENSE },
  { name: 'Kesehatan', icon: 'heart-pulse', color: '#E74C3C', type: TransactionType.EXPENSE },
  { name: 'Hiburan', icon: 'gamepad-2', color: '#9B59B6', type: TransactionType.EXPENSE },
  { name: 'Pendidikan', icon: 'graduation-cap', color: '#1ABC9C', type: TransactionType.EXPENSE },
  { name: 'Pakaian', icon: 'shopping-bag', color: '#E91E63', type: TransactionType.EXPENSE },
  { name: 'Rumah Tangga', icon: 'home', color: '#795548', type: TransactionType.EXPENSE },
  { name: 'Lainnya', icon: 'more-horizontal', color: '#607D8B', type: TransactionType.EXPENSE },
];

const incomeCategories = [
  { name: 'Gaji', icon: 'banknote', color: '#0F9B8E', type: TransactionType.INCOME },
  { name: 'Freelance', icon: 'laptop', color: '#14B8A6', type: TransactionType.INCOME },
  { name: 'Bisnis', icon: 'briefcase', color: '#22C55E', type: TransactionType.INCOME },
  { name: 'Investasi', icon: 'line-chart', color: '#06B6D4', type: TransactionType.INCOME },
  { name: 'Bonus', icon: 'gift', color: '#84CC16', type: TransactionType.INCOME },
  { name: 'Lainnya', icon: 'sparkles', color: '#10B981', type: TransactionType.INCOME },
];

async function upsertDefaultCategory(category: {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}) {
  const existing = await prisma.category.findFirst({
    where: {
      name: category.name,
      isDefault: true,
      userId: null,
      type: category.type,
    },
  });

  if (!existing) {
    await prisma.category.create({
      data: {
        ...category,
        isDefault: true,
        userId: null,
      },
    });
    console.log(`  ✅ Created category: ${category.icon} ${category.name} (${category.type})`);
  } else if (existing.icon !== category.icon) {
    await prisma.category.update({
      where: { id: existing.id },
      data: { icon: category.icon },
    });
    console.log(`  🔄 Updated icon: ${category.name} → ${category.icon}`);
  } else {
    console.log(`  ⏭️  Category already exists: ${category.name}`);
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  console.log('\nPengeluaran:');
  for (const category of expenseCategories) {
    await upsertDefaultCategory(category);
  }

  console.log('\nPemasukan:');
  for (const category of incomeCategories) {
    await upsertDefaultCategory(category);
  }

  console.log('\n✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
