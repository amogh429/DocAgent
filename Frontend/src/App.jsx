import { useState, useRef, useEffect } from "react";

function App() {
  const [taskId, setTaskId] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const questionRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = questionRef.current.value;

    if (!question.trim()) {
      return;
    }

    setIsLoading(true);

    const res = await fetch("http://localhost:5000/api/agent/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        original_question: question,
      }),
    });

    if (!res.ok) {
      console.error("Failed to submit question");
      setIsLoading(false);
      return;
    }

    const data = await res.json();
    setTaskId(data.taskId);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!taskId) return;

    const intervalId = setInterval(async () => {
      const res = await fetch(
        `http://localhost:5000/api/agent/status/${taskId}`,
      );

      if (!res.ok) {
        console.error("Failed to fetch task status");
        clearInterval(intervalId);
        return;
      }

      const data = await res.json();

      setTaskData(data);

      if (data.status !== "running") {
        clearInterval(intervalId);
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [taskId]);

  return (
    <div>
      {/* Piece 1: Form */}
      <form onSubmit={handleSubmit}>
        <input ref={questionRef} />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Submit"}
        </button>
      </form>

      {/* Piece 2: Task Data */}

      {taskData?.status === "running" && (
        <div>
          <p>Agent is working...</p>
          {taskData.history?.map((entry, index) => (
            <div key={index}>
              {entry.name}: {JSON.stringify(entry.result)}
            </div>
          ))}
        </div>
      )}

      {taskData && taskData.status !== "running" && (
        <div>
          <p>{taskData.final_answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;
