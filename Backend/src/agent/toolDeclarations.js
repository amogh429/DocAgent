const toolDeclarations = [
  {
    type: "function",
    name: "calculator",
    description:
      "Evaluate mathematical expressions using normal arithmetic operations (+, -, *, /), /100 for percentage, ** for exponents, and sqrt(...) for square roots.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "A mathematical expression such as '47 * 892', '(20/100) * 500', '2**3', or 'sqrt(16)'.",
        },
      },
      required: ["expression"],
    },
  },
  {
    type: "function",
    name: "web_search",
    description:
      "Search the web for current events , recent developments, or facts that change over time and may postdate the model's training.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A search query such as 'latest Gemini API pricing'.",
        },
      },
      required: ["query"],
    },
  },
];

export default toolDeclarations;

