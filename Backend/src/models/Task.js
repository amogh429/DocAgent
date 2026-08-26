import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
  },
  original_question: {
    type: String,
    required: true,
  },
  history: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  last_interaction_id: {
    type: String,
    default: null,
  },
  step_count: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["running", "completed", "failed", "max_steps_reached"],
    default: "running",
  },
  final_answer: {
    type: String,
    default: null,
  },
});

export default mongoose.model("Task", taskSchema);
