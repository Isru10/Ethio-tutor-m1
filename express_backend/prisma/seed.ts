import { PrismaClient, Role, Tier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding EthioTutor database...");

  // ── 1. Tenants ─────────────────────────────────────────────
  const basicTenant = await prisma.tenant.upsert({
    where:  { subdomain: "basic" },
    update: {},
    create: { name: "EthioTutor Basic", subdomain: "basic", plan: "basic" },
  });

  const proTenant = await prisma.tenant.upsert({
    where:  { subdomain: "pro" },
    update: {},
    create: { name: "EthioTutor Pro", subdomain: "pro", plan: "pro" },
  });

  console.log(`✅  Tenants: Basic(${basicTenant.tenant_id}), Pro(${proTenant.tenant_id})`);

  // ── 2. Super Admin ──────────────────────────────────────────
  const hashed = await bcrypt.hash("SuperAdmin@1234!", 12);
  const superAdmin = await prisma.user.upsert({
    where:  { email: "superadmin@ethiotutor.et" },
    update: {},
    create: {
      tenant_id: basicTenant.tenant_id,
      name:      "EthioTutor Super Admin",
      email:     "superadmin@ethiotutor.et",
      password:  hashed,
      role:      Role.SUPER_ADMIN,
      tier:      Tier.PREMIUM,
    },
  });
  console.log(`✅  SuperAdmin created: ${superAdmin.email}`);

  // ── 3. Subjects (per tenant) ────────────────────────────────
  const subjectNames = [
    { name: "Mathematics",  category: "Math" },
    { name: "Physics",      category: "Science" },
    { name: "Chemistry",    category: "Science" },
    { name: "Biology",      category: "Science" },
    { name: "English",      category: "Language" },
    { name: "Amharic",      category: "Language" },
    { name: "History",      category: "Social" },
    { name: "Geography",    category: "Social" },
    { name: "Civics",       category: "Social" },
    { name: "ICT",          category: "Technology" },
  ];

  for (const tenant of [basicTenant, proTenant]) {
    for (const sub of subjectNames) {
      const exists = await prisma.subject.findFirst({
        where: { tenant_id: tenant.tenant_id, name: sub.name },
      });
      if (!exists) {
        await prisma.subject.create({
          data: { tenant_id: tenant.tenant_id, name: sub.name, category: sub.category },
        });
      }
    }
  }
  console.log(`✅  Subjects seeded`);

  // ── 4. Grades (per tenant) ──────────────────────────────────
  const gradeData = [
    { grade_name: "Grade 1",  level_group: "Primary" },
    { grade_name: "Grade 2",  level_group: "Primary" },
    { grade_name: "Grade 3",  level_group: "Primary" },
    { grade_name: "Grade 4",  level_group: "Primary" },
    { grade_name: "Grade 5",  level_group: "Primary" },
    { grade_name: "Grade 6",  level_group: "Primary" },
    { grade_name: "Grade 7",  level_group: "Middle" },
    { grade_name: "Grade 8",  level_group: "Middle" },
    { grade_name: "Grade 9",  level_group: "Secondary" },
    { grade_name: "Grade 10", level_group: "Secondary" },
    { grade_name: "Grade 11", level_group: "Preparatory" },
    { grade_name: "Grade 12", level_group: "Preparatory" },
  ];

  for (const tenant of [basicTenant, proTenant]) {
    for (const g of gradeData) {
      const exists = await prisma.grade.findFirst({
        where: { tenant_id: tenant.tenant_id, grade_name: g.grade_name },
      });
      if (!exists) {
        await prisma.grade.create({
          data: { tenant_id: tenant.tenant_id, ...g },
        });
      }
    }
  }
  console.log(`✅  Grades seeded`);

  console.log("🎉  Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
