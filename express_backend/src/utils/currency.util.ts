import { PLATFORM_FEE_RATE } from "../config/constants";

export const birrToSantim   = (birr: number) => Math.round(birr * 100);
export const santimToBirr   = (santim: number) => santim / 100;
export const calcCommission = (amount: number, rate = PLATFORM_FEE_RATE) =>
  parseFloat((amount * rate).toFixed(2));
export const calcTeacherNet = (gross: number, rate = PLATFORM_FEE_RATE) =>
  parseFloat((gross - calcCommission(gross, rate)).toFixed(2));
export const formatETB = (amount: number) =>
  new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount);
