// Prisma Seed Script
// Populates the database with initial data from mock-data

import { PrismaClient } from "@prisma/client";
import {
  initialUsers,
  initialDisciplines,
  initialInstructors,
  initialMembershipPlans,
  initialOrganization,
} from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Create organization first
    console.log("📋 Creating organization...");
    await prisma.organization.upsert({
      where: { id: initialOrganization.id },
      update: {},
      create: {
        id: initialOrganization.id,
        name: initialOrganization.name,
        settings: initialOrganization as any,
        isActive: true,
      },
    });
    console.log("✅ Organization created");

    // Seed disciplines
    console.log("🏃‍♂️ Seeding disciplines...");
    for (const discipline of initialDisciplines) {
      await prisma.discipline.upsert({
        where: { id: discipline.id },
        update: {
          name: discipline.name,
          description: discipline.description,
          color: discipline.color,
          isActive: discipline.isActive,
          schedule: discipline.schedule as any,
          cancellationRules: discipline.cancellationRules as any,
        },
        create: {
          id: discipline.id,
          organizationId: discipline.organizationId,
          name: discipline.name,
          description: discipline.description,
          color: discipline.color,
          isActive: discipline.isActive,
          schedule: discipline.schedule as any,
          cancellationRules: discipline.cancellationRules as any,
        },
      });
    }
    console.log(`✅ ${initialDisciplines.length} disciplines seeded`);

    // Seed instructors
    console.log("👨‍🏫 Seeding instructors...");
    for (const instructor of initialInstructors) {
      await prisma.instructor.upsert({
        where: { email: instructor.email },
        update: {
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          phone: instructor.phone,
          role: instructor.role,
          isActive: instructor.isActive,
          profile: instructor as any,
        },
        create: {
          id: instructor.id,
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          email: instructor.email,
          phone: instructor.phone,
          role: instructor.role,
          isActive: instructor.isActive,
          profile: instructor as any,
        },
      });
    }
    console.log(`✅ ${initialInstructors.length} instructors seeded`);

    // Seed membership plans
    console.log("💳 Seeding membership plans...");
    for (const plan of initialMembershipPlans) {
      await prisma.membershipPlan.upsert({
        where: { name: plan.name },
        update: {
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          isActive: plan.isActive,
          features: plan.features as any,
          config: plan as any,
        },
        create: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          isActive: plan.isActive,
          features: plan.features as any,
          config: plan as any,
        },
      });
    }
    console.log(`✅ ${initialMembershipPlans.length} membership plans seeded`);

    // Seed users
    console.log("👥 Seeding users...");
    for (const user of initialUsers) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          membership: user.membership as any,
        },
        create: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          membership: user.membership as any,
        },
      });
    }
    console.log(`✅ ${initialUsers.length} users seeded`);

    // Create some sample class sessions
    console.log("📅 Creating sample class sessions...");
    const sampleClasses = [
      {
        id: "class_sample_1",
        organizationId: initialOrganization.id,
        disciplineId: initialDisciplines[0].id,
        name: "Morning CrossFit",
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        durationMinutes: 60,
        instructorId: initialInstructors[0].id,
        capacity: 15,
        registeredParticipantsIds: [],
        waitlistParticipantsIds: [],
        status: "scheduled",
        notes: "High intensity morning workout",
        isGenerated: false,
      },
      {
        id: "class_sample_2",
        organizationId: initialOrganization.id,
        disciplineId: initialDisciplines[1].id,
        name: "Evening Yoga",
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        durationMinutes: 90,
        instructorId: initialInstructors[1].id,
        capacity: 20,
        registeredParticipantsIds: [],
        waitlistParticipantsIds: [],
        status: "scheduled",
        notes: "Relaxing evening yoga session",
        isGenerated: false,
      },
    ];

    for (const classSession of sampleClasses) {
      await prisma.classSession.upsert({
        where: { id: classSession.id },
        update: {},
        create: classSession,
      });
    }
    console.log(`✅ ${sampleClasses.length} sample classes created`);

    console.log("🎉 Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during database seed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
