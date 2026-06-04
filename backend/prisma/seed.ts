import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create categories
  const food = await prisma.category.create({
    data: { name: 'Food', icon: '🍕' },
  });

  const shopping = await prisma.category.create({
    data: { name: 'Shopping', icon: '🛍️' },
  });

  const transport = await prisma.category.create({
    data: { name: 'Transport', icon: '🚕' },
  });

  console.log('Created categories');

  // Create user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      defaultCurrency: 'INR',
    },
  });

  console.log('Created user');

  // Create expenses
  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: 325,
      currency: 'INR',
      categoryId: food.id,
      description: 'Coffee',
      merchant: 'Starbucks',
      date: new Date(),
    },
  });

  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: 450,
      currency: 'INR',
      categoryId: food.id,
      description: 'Lunch',
      merchant: 'Swiggy',
      date: new Date(),
    },
  });

  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: 280,
      currency: 'INR',
      categoryId: transport.id,
      description: 'Ride',
      merchant: 'Uber',
      date: new Date(),
    },
  });

  console.log('✓ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });