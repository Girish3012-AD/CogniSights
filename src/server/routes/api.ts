import express from "express";
import { handleQuery } from "../analysis/executor.js";

const router = express.Router();

router.post("/query", async (req, res) => {
  try {
    const { nlQuery, aoi } = req.body;
    if (!nlQuery) {
      return res.status(400).json({ error: "nlQuery is required" });
    }

    const result = await handleQuery(nlQuery, aoi);
    res.json(result);
  } catch (error: any) {
    console.error("Query Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
