import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "admin ok" });
});

export default router;

