import express from "express";
import crypto from "crypto";
import Task from "../models/Task.js";
import agentQueue from "../queue.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  const taskId = crypto.randomUUID();
  const question = req.body.original_question;

  try {
    const task = await Task.create({ taskId, original_question: question });
    await agentQueue.add("run-agent", { original_question: question, taskId });
    res.status(202).json({ taskId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/status/:taskId", async (req, res) => {
  const taskId = req.params.taskId;
  const task = await Task.findOne({ taskId });
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (task.status === "running") {
    return res.json({ status: task.status, history: task.history });
  }

  return res.json(task);
});

export default router;
