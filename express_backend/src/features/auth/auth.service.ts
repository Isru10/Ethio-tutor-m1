import { prisma } from "../../models/prisma.client";
import { hashPassword, comparePassword } from "../../utils/password.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.util";
import { AppError } from "../../middlewares/error.middleware";
import type { RegisterInput, LoginInput } from "./auth.model";

export const authService = {
  async register({ name, email, password, role, tenantId, phone, grade_name, learning_goals, bio, qualifications, experience_years, hourly_rate, languages, subjects, grade_from, grade_to }: RegisterInput) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new AppError("Email already registered.", 409);

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role as any, tenant_id: tenantId, phone },
      select: { user_id: true, email: true, role: true, tier: true, tenant_id: true, name: true, phone: true },
    });

    // Create profile based on role
    if (role === "STUDENT") {
      // Resolve grade_id from grade_name if provided
      let grade_id: number | undefined;
      if (grade_name) {
        const grade = await prisma.grade.findFirst({ where: { tenant_id: tenantId, grade_name } });
        grade_id = grade?.grade_id;
      }
      await prisma.studentProfile.create({
        data: { user_id: user.user_id, tenant_id: tenantId, grade_id, learning_goals },
      });
    } else if (role === "TUTOR") {
      const profile = await prisma.teacherProfile.create({
        data: {
          user_id:          user.user_id,
          tenant_id:        tenantId,
          bio:              bio ?? "",
          qualifications:   qualifications ?? "",
          experience_years: experience_years ?? 0,
          hourly_rate:      hourly_rate ?? 0,
          languages:        languages ?? "Amharic",
        },
      });

      // Link subjects if provided
      if (subjects && subjects.length > 0) {
        const subjectRecords = await prisma.subject.findMany({
          where: { tenant_id: tenantId, name: { in: subjects } },
        });
        for (const subj of subjectRecords) {
          await prisma.teacherSubject.create({
            data: {
              tenant_id:  tenantId,
              teacher_id: profile.teacher_profile_id,
              subject_id: subj.subject_id,
              grade_from: grade_from ?? 1,
              grade_to:   grade_to ?? 12,
            },
          });
        }
      }
    }

    return {
      user,
      accessToken:  signAccessToken({ userId: user.user_id, tenantId: user.tenant_id, role: user.role, tier: user.tier }),
      refreshToken: signRefreshToken(user.user_id),
    };
  },

  async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      throw new AppError("Invalid email or password.", 401);
    }
    if (user.status === "suspended") throw new AppError("Account suspended.", 403);
    const { password: _pw, ...safeUser } = user;
    return {
      user: safeUser,
      accessToken:  signAccessToken({ userId: user.user_id, tenantId: user.tenant_id, role: user.role, tier: user.tier }),
      refreshToken: signRefreshToken(user.user_id),
    };
  },

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUniqueOrThrow({ where: { user_id: payload.userId } });
    return {
      accessToken: signAccessToken({ userId: user.user_id, tenantId: user.tenant_id, role: user.role, tier: user.tier }),
    };
  },
};
