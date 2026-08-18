import express from "express";
import crypto from "crypto";
import { runAgentLoop } from "../agent/loop.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  const taskId = crypto.randomUUID();
  const question = req.body.original_question;

  try {
    const result = await runAgentLoop(question, taskId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
