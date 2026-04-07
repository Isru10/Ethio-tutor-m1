import type { Request, Response, NextFunction } from "express";
import { bookingService } from "./booking.service";
import { CreateBookingSchema } from "./booking.model";

export const bookingController = {
  getMyBookings: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await bookingService.getMyBookings(req.user!.user_id, req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },
  getTutorBookings: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await bookingService.getTutorBookings(req.user!.user_id, req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CreateBookingSchema.parse(req.body);
      const booking = await bookingService.create(req.user!.user_id, req.user!.tenant_id, req.user!.tier, input);
      res.status(201).json({ status: "success", data: booking });
    } catch (err) { next(err); }
  },
  cancel: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await bookingService.cancel(Number(req.params.id), req.user!.user_id) }); }
    catch (err) { next(err); }
  },
  confirm: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await bookingService.confirm(Number(req.params.id), req.user!.user_id) }); }
    catch (err) { next(err); }
  },
};
