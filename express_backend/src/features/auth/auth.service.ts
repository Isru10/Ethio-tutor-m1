import { prisma } from "../../models/prisma.client";
import { hashPassword, comparePassword } from "../../utils/password.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.util";
import { AppError } from "../../middlewares/error.middleware";
import type { RegisterInput, LoginInput } from "./auth.model";

export const authService = {
  async register({ name, email, password, role, tenantId, phone, grade_name, learning_goals, bio, qualifications, experience_years, hourly_rate, languages, subjects, grade_from, grade_to, payout_method, payout_phone, payout_bank, payout_account, image_profile, file, available_days, available_times, default_max_students }: RegisterInput) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new AppError("Email already registered.", 409);

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role as any, tenant_id: tenantId, phone,
        // Tutors start as pending until a reviewer approves them
        status: role === "TUTOR" ? "pending_verification" : "active",
      },
      select: { user_id: true, email: true, role: true, tier: true, tenant_id: true, name: true, phone: true, status: true },
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
          user_id:              user.user_id,
          tenant_id:            tenantId,
          bio:                  bio ?? "",
          qualifications:       qualifications ?? "",
          experience_years:     experience_years ?? 0,
          hourly_rate:          hourly_rate ?? 0,
          languages:            languages ?? "Amharic",
          payout_method:        payout_method ?? null,
          payout_phone:         payout_phone ?? null,
          payout_bank:          payout_bank ?? null,
          payout_account:       payout_account ?? null,
          image_profile:        image_profile ?? null,
          file:                 file ?? null,
          available_days:       available_days?.length ? JSON.stringify(available_days) : null,
          available_times:      available_times?.length ? JSON.stringify(available_times) : null,
          default_max_students: default_max_students ?? 5,
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
      accessToken:  signAccessToken({ userId: user.user_id, tenantId: user.tenant_id, role: user.role, tier: user.tier, status: user.status }),
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
      accessToken:  signAccessToken({ userId: user.user_id, tenantId: user.tenant_id, role: user.role, tier: user.tier, status: user.status }),
      refreshToken: signRefreshToken(user.user_id),
    };
  },

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUniqueOrThrow({ where: { user_id: payload.userId } });
    return {
      accessToken: signAccessToken({ userId: user.user_id, tenantId: user.tenant_id, role: user.role, tier: user.tier, status: user.status }),
    };
  },

  /**
   * Issue a fresh access token for an already-authenticated user.
   * Used when user state changes server-side (e.g. tutor approval).
   */
  async freshTokenForUser(userId: number) {
    const user = await prisma.user.findUniqueOrThrow({ where: { user_id: userId } });
    return {
      accessToken: signAccessToken({
        userId:   user.user_id,
        tenantId: user.tenant_id,
        role:     user.role,
        tier:     user.tier,
        status:   user.status,
      }),
    };
  },
};
