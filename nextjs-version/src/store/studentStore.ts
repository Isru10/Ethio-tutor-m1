import { create } from "zustand";
import type { BookingWithDetails, SlotWithDetails, Subject, Grade } from "@/types/database";

interface StudentState {
  // ── Browse page filters ──────────────────────────────────
  browseFilters: {
    subjectId: number | null;
    gradeId: number | null;
    dateFrom: string;
    dateTo: string;
  };
  setBrowseFilter: <K extends keyof StudentState["browseFilters"]>(
    key: K,
    value: StudentState["browseFilters"][K]
  ) => void;
  resetBrowseFilters: () => void;

  // ── Available slots (Browse page) ────────────────────────
  availableSlots: SlotWithDetails[];
  setAvailableSlots: (slots: SlotWithDetails[]) => void;

  // ── My bookings ──────────────────────────────────────────
  myBookings: BookingWithDetails[];
  setMyBookings: (bookings: BookingWithDetails[]) => void;

  // ── Reference data (dropdowns) ──────────────────────────
  subjects: Subject[];
  grades: Grade[];
  setSubjects: (subjects: Subject[]) => void;
  setGrades: (grades: Grade[]) => void;
}

const defaultFilters: StudentState["browseFilters"] = {
  subjectId: null,
  gradeId: null,
  dateFrom: "",
  dateTo: "",
};

export const useStudentStore = create<StudentState>()((set) => ({
  browseFilters: defaultFilters,
  setBrowseFilter: (key, value) =>
    set((s) => ({
      browseFilters: { ...s.browseFilters, [key]: value },
    })),
  resetBrowseFilters: () => set({ browseFilters: defaultFilters }),

  availableSlots: [],
  setAvailableSlots: (availableSlots) => set({ availableSlots }),

  myBookings: [],
  setMyBookings: (myBookings) => set({ myBookings }),

  subjects: [],
  grades: [],
  setSubjects: (subjects) => set({ subjects }),
  setGrades: (grades) => set({ grades }),
}));
