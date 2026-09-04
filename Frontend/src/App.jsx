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

        <button type="submit" disabled={isLoading} className="">
          {isLoading ? "Loading..." : "Submit"}
        </button>
      </form>

      {/* Piece 2: Task Data */}

      {taskData?.history?.length > 0 && (
        <div className="bg-slate-900 text-slate-400 font-mono text-sm rounded-1g p-6 mt-6">
          <p className="text-slate-200 mb-4">AGENT EXECUTION</p>
          <div className="border-t border-slate-700 mb-4" />
          {taskData.history?.map((entry, index) => {
            const isError =
              typeof entry.result === "string" &&
              entry.result.startsWith("Error");
            return (
              <div key={index} className="mb-3">
                <p className="text-slate-200">
                  Step {index + 1} {isError ? "x" : "🔧"} {entry.name}
                </p>
                <p className="p1-4">{Object.values(entry.arguments)[0]}</p>
                <p className="p1-4 text-slate-200">
                  → {JSON.stringify(entry.result)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {taskData && taskData.status !== "running" && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mt-6">
          <p className="text-xs tracking-wide text-slate-400 mb-2">
            FINAL ANSWER
          </p>
          <div className="border-t border-slate-100 mb-4"></div>
          <p className="text-slate-400 leading-relaxed">
            {taskData.final_answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
