import { useState, useRef , useEffect} from "react";

function App(){

  const [taskId, setTaskId] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const questionRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = questionRef.current.value;

    if(!question.trim()){
      return;
    }

    setIsLoading(true);

    const res = await fetch("http://localhost:5000/api/agent/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        original_question: question
      })
    });

    if(!res.ok){
      console.error("Failed to submit question");
      setIsLoading(false);
      return;
    }

    const data = await res.json();
    setTaskId(data.taskId);
    setIsLoading(false);
  }

  useEffect(() =>{
    if(!taskId) return;

    const intervalId = setInterval(async() => {
      const res = await fetch(`http://localhost:5000/api/agent/status/${taskId}`);

      if(!res.ok){
        console.error("Failed to fetch task status");
        clearInterval(intervalId);
        return;
      }
      
      const data = await res.json();

      setTaskData(data);

      if(data.status !== "running"){
        clearInterval(intervalId);
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };

  }, [taskId]);
}

export default App();
