import { prisma } from "../../models/prisma.client";

export const academicService = {
  getSubjects: (tenantId: number) =>
    prisma.subject.findMany({ where: { tenant_id: tenantId }, orderBy: { name: "asc" } }),

  getGrades: (tenantId: number) =>
    prisma.grade.findMany({ where: { tenant_id: tenantId }, orderBy: { grade_id: "asc" } }),
};
