const toolDeclarations = [
    {
        type: "function",
        name: "calculator",
        description: "Evaluate mathematical expressions using normal arithmetic operations (+, -, *, /), /100 for percentage, ** for exponents, and sqrt(...) for square roots.",
        parameters: {
            type: "object",
            properties: {
                expression: {
                    type: "string",
                    description: "A mathematical expression such as '47 * 892', '(20/100) * 500', '2**3', or 'sqrt(16)'."
                }
            },
            required: ["expression"]
        }
    }
]

export default toolDeclarations;
