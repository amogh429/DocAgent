import { Worker } from "bullmq";
import { runAgentLoop } from "./agent/loop.js";
import Task from "./models/Task.js";

new Worker("agentQueue", async (job) => {
  const { original_question, taskId } = job.data;

  const state = await runAgentLoop(original_question, taskId);

  await Task.findOneAndUpdate({ taskId }, state, { new: true, upsert: true });
});
