import {
  PrismaClient,
  UserRole,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cardetailing.com' },
    update: {},
    create: {
      email: 'admin@cardetailing.com',
      passwordHash: adminPassword,
      firstName: 'Professional',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created/verified');

  // 2. Create Staff
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffNames = [
    { first: 'John', last: 'Doe', pos: 'Senior Detailer', rate: 25 },
    { first: 'Jane', last: 'Smith', pos: 'Interior Specialist', rate: 22 },
    { first: 'Mike', last: 'Johnson', pos: 'Junior Washer', rate: 18 },
  ];

  for (const s of staffNames) {
    const user = await prisma.user.upsert({
      where: { email: `${s.first.toLowerCase()}@cardetailing.com` },
      update: {},
      create: {
        email: `${s.first.toLowerCase()}@cardetailing.com`,
        passwordHash: staffPassword,
        firstName: s.first,
        lastName: s.last,
        role: UserRole.STAFF,
        isActive: true,
      },
    });

    await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        position: s.pos,
        hourlyRate: new Prisma.Decimal(s.rate),
        hireDate: new Date(),
      },
    });
  }
  console.log('✅ Staff profiles created/verified');

  // 3. Create Services
  const services = [
    {
      name: 'Essential Wash',
      duration: 45,
      basePrice: new Prisma.Decimal(35.0),
      description: 'Exterior hand wash, wheel cleaning, and tire shine.',
    },
    {
      name: 'Premium Interior',
      duration: 120,
      basePrice: new Prisma.Decimal(95.0),
      description: 'Deep vacuum, steam cleaning, and leather conditioning.',
    },
    {
      name: 'The Works',
      duration: 240,
      basePrice: new Prisma.Decimal(250.0),
      description: 'Full exterior & interior detail plus clay bar and wax.',
    },
    {
      name: 'Ceramic Shield',
      duration: 360,
      basePrice: new Prisma.Decimal(650.0),
      description: 'Multi-year ceramic coating for ultimate protection.',
    },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { name: svc.name },
      update: {
        duration: svc.duration,
        basePrice: svc.basePrice,
        description: svc.description,
      },
      create: svc,
    });
  }
  console.log('✅ Services created/verified');

  // 4. Create Inventory
  const inventoryItems = [
    {
      name: 'Ultra Foam Shampoo',
      sku: 'CHEM-001',
      category: 'Chemicals',
      quantity: 15,
      unit: 'Liters',
      costPerUnit: new Prisma.Decimal(8.5),
    },
    {
      name: 'Premium Carnauba Wax',
      sku: 'CHEM-002',
      category: 'Chemicals',
      quantity: 10,
      unit: 'Bottles',
      costPerUnit: new Prisma.Decimal(25.0),
    },
    {
      name: 'Microfiber Towel Set',
      sku: 'TOOL-001',
      category: 'Tools',
      quantity: 100,
      unit: 'Pieces',
      costPerUnit: new Prisma.Decimal(1.5),
    },
    {
      name: 'Iron Remover',
      sku: 'CHEM-003',
      category: 'Chemicals',
      quantity: 5,
      unit: 'Liters',
      costPerUnit: new Prisma.Decimal(12.0),
    },
    {
      name: 'Dual Action Polisher',
      sku: 'EQP-001',
      category: 'Equipment',
      quantity: 2,
      unit: 'Units',
      costPerUnit: new Prisma.Decimal(350.0),
    },
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { sku: item.sku },
      update: {
        quantity: item.quantity,
        costPerUnit: item.costPerUnit,
      },
      create: item,
    });
  }
  console.log('✅ Inventory items created/verified');

  // 5. Link Materials to Services (optional sample)
  const shampoo = await prisma.inventory.findUnique({
    where: { sku: 'CHEM-001' },
  });
  const washService = await prisma.service.findUnique({
    where: { name: 'Essential Wash' },
  });

  if (shampoo && washService) {
    await prisma.serviceMaterial.upsert({
      where: {
        serviceId_inventoryId: {
          serviceId: washService.id,
          inventoryId: shampoo.id,
        },
      },
      update: {},
      create: {
        serviceId: washService.id,
        inventoryId: shampoo.id,
        quantity: 1,
      },
    });
  }

  console.log('Seeding completed successfully! 🚀');
}

main()
  .catch((e: unknown) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });