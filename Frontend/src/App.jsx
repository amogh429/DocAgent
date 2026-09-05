import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

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

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/agent/ask`, {
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
        `${import.meta.env.VITE_API_URL}/api/agent/status/${taskId}`,
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
    <div className="min-h-screen bg-slates-50 font-sans flex justify-center px-4 py-16">
      <div className="w-full max-w-x1">
        {/* Piece 1: Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={questionRef}
            type="text"
            placeholder="Ask something..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-white-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
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
                  <div className="pl-4 text-slate-200">
                    → <ReactMarkdown>{String(entry.result)}</ReactMarkdown>
                  </div>
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
            <div className="text-slate-900 leading-relaxed">
              <ReactMarkdown>{taskData.final_answer}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
