import { PrismaClient, UserRole, Prisma, BookingStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BUSINESS_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_ID = '11111111-1111-1111-1111-111111111112';
const STAFF_IDS = {
  john: '11111111-1111-1111-1111-111111111113',
  jane: '11111111-1111-1111-1111-111111111114',
  mike: '11111111-1111-1111-1111-111111111115',
};
const CUSTOMER_ID = '11111111-1111-1111-1111-111111111116';
const SERVICE_IDS = {
  essentialWash: '11111111-1111-1111-1111-111111111121',
  premiumInterior: '11111111-1111-1111-1111-111111111122',
  theWorks: '11111111-1111-1111-1111-111111111123',
  ceramicShield: '11111111-1111-1111-1111-111111111124',
};
const BOOKING_IDEMPOTENCY = '11111111-1111-1111-1111-111111111131';

async function main() {
  console.log('Starting seeding...');

  const business = await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: {
      address: '123 Detail Ave, Auto City',
      phone: '+1000000010',
      email: 'hello@cardetailing.com',
      timezone: 'UTC',
      workingHours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '14:00' },
      },
      closedDays: [0],
    },
    create: {
      id: BUSINESS_ID,
      name: 'Rapid Auto Detail',
      address: '123 Detail Ave, Auto City',
      phone: '+1000000010',
      email: 'hello@cardetailing.com',
      timezone: 'UTC',
      workingHours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '14:00' },
      },
      closedDays: [0],
    },
  });
  console.log('✅ Business created/verified');

  // 1. Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cardetailing.com' },
    update: { phone: '+1000000000', businessId: business.id },
    create: {
      id: ADMIN_ID,
      email: 'admin@cardetailing.com',
      passwordHash: adminPassword,
      firstName: 'Professional',
      lastName: 'Admin',
      phone: '+1000000000',
      role: UserRole.ADMIN,
      isActive: true,
      businessId: business.id,
    },
  });
  console.log('✅ Admin user created/verified');

  // 2. Create Staff
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffNames = [
    {
      first: 'John',
      last: 'Doe',
      pos: 'Senior Detailer',
      rate: 25,
      phone: '+1000000001',
    },
    {
      first: 'Jane',
      last: 'Smith',
      pos: 'Interior Specialist',
      rate: 22,
      phone: '+1000000002',
    },
    {
      first: 'Mike',
      last: 'Johnson',
      pos: 'Junior Washer',
      rate: 18,
      phone: '+1000000003',
    },
  ];

  for (const s of staffNames) {
    const user = await prisma.user.upsert({
      where: { email: `${s.first.toLowerCase()}@cardetailing.com` },
      update: { phone: s.phone, businessId: business.id },
      create: {
        id: s.first === 'John' ? STAFF_IDS.john : s.first === 'Jane' ? STAFF_IDS.jane : STAFF_IDS.mike,
        email: `${s.first.toLowerCase()}@cardetailing.com`,
        passwordHash: staffPassword,
        firstName: s.first,
        lastName: s.last,
        phone: s.phone,
        role: UserRole.STAFF,
        isActive: true,
        businessId: business.id,
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

  // Customer seed for login testing
  const customerPassword = await bcrypt.hash('customer123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: { phone: '+1000000099', businessId: business.id },
    create: {
      id: CUSTOMER_ID,
      email: 'customer@example.com',
      passwordHash: customerPassword,
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+1000000099',
      role: UserRole.CUSTOMER,
      isActive: true,
      businessId: business.id,
    },
  });
  console.log('✅ Test customer created/verified');

  // 3. Create Services
  const services = [
    {
      id: SERVICE_IDS.essentialWash,
      name: 'Essential Wash',
      duration: 45,
      basePrice: new Prisma.Decimal(35.0),
      description: 'Exterior hand wash, wheel cleaning, and tire shine.',
      businessId: business.id,
    },
    {
      id: SERVICE_IDS.premiumInterior,
      name: 'Premium Interior',
      duration: 120,
      basePrice: new Prisma.Decimal(95.0),
      description: 'Deep vacuum, steam cleaning, and leather conditioning.',
      businessId: business.id,
    },
    {
      id: SERVICE_IDS.theWorks,
      name: 'The Works',
      duration: 240,
      basePrice: new Prisma.Decimal(250.0),
      description: 'Full exterior & interior detail plus clay bar and wax.',
      businessId: business.id,
    },
    {
      id: SERVICE_IDS.ceramicShield,
      name: 'Ceramic Shield',
      duration: 360,
      basePrice: new Prisma.Decimal(650.0),
      description: 'Multi-year ceramic coating for ultimate protection.',
      businessId: business.id,
    },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { name: svc.name },
      update: {
        duration: svc.duration,
        basePrice: svc.basePrice,
        description: svc.description,
        businessId: svc.businessId,
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

  const customer = await prisma.user.findUnique({
    where: { email: 'customer@example.com' },
  });
  const staff = await prisma.user.findUnique({
    where: { email: 'john@cardetailing.com' },
  });

  if (customer && staff && washService) {
    const booking = await prisma.booking.upsert({
      where: { idempotencyKey: BOOKING_IDEMPOTENCY },
      update: {
        customerId: customer.id,
        staffId: staff.id,
        serviceId: washService.id,
        businessId: business.id,
        startTime: new Date(Date.UTC(2026, 4, 15, 10, 0, 0)),
        endTime: new Date(Date.UTC(2026, 4, 15, 10, 45, 0)),
        totalPrice: washService.basePrice,
        status: BookingStatus.CONFIRMED,
        notes: 'Seed sample booking for end-to-end testing',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          licensePlate: 'SEED-123',
          color: 'Blue',
        },
      },
      create: {
        customerId: customer.id,
        staffId: staff.id,
        serviceId: washService.id,
        businessId: business.id,
        startTime: new Date(Date.UTC(2026, 4, 15, 10, 0, 0)),
        endTime: new Date(Date.UTC(2026, 4, 15, 10, 45, 0)),
        totalPrice: washService.basePrice,
        status: BookingStatus.CONFIRMED,
        notes: 'Seed sample booking for end-to-end testing',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          licensePlate: 'SEED-123',
          color: 'Blue',
        },
        idempotencyKey: BOOKING_IDEMPOTENCY,
      },
    });

    await prisma.payment.upsert({
      where: { transactionId: 'txn-seed-001' },
      update: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        method: 'CARD',
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
      create: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        method: 'CARD',
        status: PaymentStatus.PAID,
        transactionId: 'txn-seed-001',
        paidAt: new Date(),
      },
    });
  }

  console.log('✅ Seed booking and payment created/verified');
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
