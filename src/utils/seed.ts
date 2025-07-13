import prisma from "../config/db";

async function seedRoles() {
  try {
    await prisma.role.createMany({
      data: [
        { name: "student", description: "Default role" },
        { name: "teacher", description: "Can create courses" },
        { name: "admin", description: "Platform admin" },
      ],
      skipDuplicates: true, // avoids duplicate inserts
    });

    console.log("✅ Roles seeded successfully.");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();
