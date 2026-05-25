import { Router } from "express";
import { db } from "@workspace/db";
import { doctorsTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import { ListDoctorsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = ListDoctorsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    const rows = params.city && params.city !== "All"
      ? await db.select().from(doctorsTable).where(ilike(doctorsTable.city, `%${params.city}%`))
      : await db.select().from(doctorsTable);

    res.json(rows.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      hospital: d.hospital,
      city: d.city,
      country: d.country,
      experience: d.experience,
      rating: d.rating,
      phone: d.phone,
      email: d.email,
      bio: d.bio,
      isOnline: d.isOnline,
      avatar: d.avatar,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list doctors");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
