import toolRegistry from "./toolRegistry.js";
import toolDeclarations from "./toolDeclarations.js";

const MAX_STEPS = 10;

async function callGemini(state) {
  let requestBody;

  if (state.history.length === 0) {
    requestBody = {
      model: "gemini-3.6-flash",
      input: state.original_question,
      tools: toolDeclarations,
    };
  } else {
    const lastEntry = state.history[state.history.length - 1];
    requestBody = {
      model: "gemini-3.6-flash",
      previous_interaction_id: state.last_interaction_id,
      tools: toolDeclarations,
      input: [
        {
          type: "function_result",
          name: lastEntry.name,
          call_id: lastEntry.call_id,
          result: [{ type: "text", text: JSON.stringify(lastEntry.result) }],
        },
      ],
    };
  }
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    },
  );
  return res.json();
}

async function runAgentLoop(original_question, taskId) {
  const state = {
    task_id: taskId,
    original_question,
    history: [],
    last_interaction_id: null,
    step_count: 0,
    status: "running",
    final_answer: null,
  };

  while (state.status === "running" && state.step_count < MAX_STEPS) {
    const response = await callGemini(state);
    state.last_interaction_id = response.id;

    const functionCallStep = response.steps.find(
      (step) => step.type === "function_call",
    );

    if (functionCallStep) {
      const toolFn = toolRegistry[functionCallStep.name];

      if (!toolFn) {
        state.history.push({
          type: "observation",
          name: functionCallStep.name,
          call_id: functionCallStep.id,
          result: `Error: No tool names "${functionCallStep.name}" exists`,
        });
        state.step_count++;
        continue;
      }

      let result;
      try {
        result = await toolFn(functionCallStep.arguments);
        state.history.push({
          type: "observation",
          name: functionCallStep.name,
          call_id: functionCallStep.id,
          result: result,
        });
      } catch (err) {
        state.history.push({
          type: "observation",
          name: functionCallStep.name,
          call_id: functionCallStep.id,
          result: err.message,
        });
      }
      state.step_count++;
    } else {
      const textStep = response.steps.find(
        (step) => step.type === "model_output",
      );

      if (!textStep || !textStep.content?.length) {
        state.status = "failed";
        state.final_answer = "Gemini returned no final answer.";
      } else {
        state.final_answer = textStep.content[0].text;
        state.status = "completed";
      }
    }
  }

  if (state.status === "running") {
    state.status = "max_steps_reached";
  }

  return state;
}

export { runAgentLoop };
