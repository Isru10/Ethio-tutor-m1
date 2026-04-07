import { PrismaClient, Role, Tier } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/jwt.util";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Setting up E2E Test Data for LiveKit Sessions...");

  // 1. Ensure basic tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "basic" },
    update: {},
    create: { name: "EthioTutor Basic", subdomain: "basic", plan: "basic" },
  });

  // 2. Create a Dummy Tutor
  const tutorEmail = "tutor@test.com";
  let tutor = await prisma.user.findUnique({ where: { email: tutorEmail } });
  if (!tutor) {
    const hashed = await bcrypt.hash("password123", 10);
    tutor = await prisma.user.create({
      data: {
        tenant_id: tenant.tenant_id,
        name: "Test Tutor",
        email: tutorEmail,
        password: hashed,
        role: Role.TUTOR,
        tier: Tier.BASIC,
        teacherProfile: {
          create: {
            tenant_id: tenant.tenant_id,
            bio: "I am a test tutor.",
            hourly_rate: 100,
          }
        }
      },
      include: { teacherProfile: true }
    });
  }

  // 3. Create a Dummy Student
  const studentEmail = "student@test.com";
  let student = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!student) {
    const hashed = await bcrypt.hash("password123", 10);
    student = await prisma.user.create({
      data: {
        tenant_id: tenant.tenant_id,
        name: "Test Student",
        email: studentEmail,
        password: hashed,
        role: Role.STUDENT,
        tier: Tier.BASIC,
        studentProfile: {
          create: { tenant_id: tenant.tenant_id }
        }
      },
      include: { studentProfile: true }
    });
  }
  
  // Reload if profiles weren't included
  const tProfile = await prisma.teacherProfile.findUnique({ where: { user_id: tutor.user_id } });
  const sProfile = await prisma.studentProfile.findUnique({ where: { user_id: student.user_id } });

  // 4. Ensure a Subject exists
  const subject = await prisma.subject.upsert({
    where: { subject_id: 1 },
    update: {},
    create: { tenant_id: tenant.tenant_id, name: "Test Subject", category: "Test" }
  });

  // 5. Create a TimeSlot for the Tutor
  const slot = await prisma.timeSlot.create({
    data: {
      tenant_id: tenant.tenant_id,
      teacher_id: tProfile!.teacher_profile_id,
      subject_id: subject.subject_id,
      slot_date: new Date(),
      start_time: "10:00",
      end_time: "11:00",
      status: "available"
    }
  });

  // 6. Create a CONFIRMED Booking for the Student
  const booking = await prisma.booking.create({
    data: {
      tenant_id: tenant.tenant_id,
      slot_id: slot.slot_id,
      student_id: sProfile!.student_profile_id,
      status: "confirmed"
    }
  });

  // 7. Generate their JWT Access Tokens (for Postman)
  const tutorToken = signAccessToken({ userId: tutor.user_id, tenantId: tutor.tenant_id, role: tutor.role, tier: tutor.tier });
  const studentToken = signAccessToken({ userId: student.user_id, tenantId: student.tenant_id, role: student.role, tier: student.tier });

  console.log("\n✅ Test Data Successfully Created!");
  console.log("-----------------------------------------");
  console.log(`🎫 BOOKING_ID to use in Postman: ${booking.booking_id}`);
  
  console.log("\n👨‍🏫 TUTOR TOKEN (Use as Bearer Token to START session):");
  console.log(tutorToken);

  console.log("\n👨‍🎓 STUDENT TOKEN (Use as Bearer Token to JOIN session):");
  console.log(studentToken);
  console.log("-----------------------------------------");
}

main().catch(console.error).finally(() => prisma.$disconnect());
