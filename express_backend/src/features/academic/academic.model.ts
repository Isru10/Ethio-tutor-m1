// academic.model.ts — Types for subjects and grades features
export interface SubjectRow {
  subject_id: number;
  name:       string;
  category:   string | null;
}

export interface GradeRow {
  grade_id:    number;
  grade_name:  string;
  level_group: string | null;
}
