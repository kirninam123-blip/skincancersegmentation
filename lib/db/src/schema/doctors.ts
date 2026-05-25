import { pgTable, serial, text, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  hospital: text("hospital").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("Pakistan"),
  experience: integer("experience").notNull(),
  rating: real("rating").notNull(),
  phone: text("phone"),
  email: text("email"),
  bio: text("bio"),
  isOnline: boolean("is_online").notNull().default(true),
  avatar: text("avatar"),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
