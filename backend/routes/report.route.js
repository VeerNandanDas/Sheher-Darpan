import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "reports ok" });
});

export default router;

