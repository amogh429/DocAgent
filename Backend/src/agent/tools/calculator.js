import { evaluate } from "mathjs";

async function runCalculator({ expression }) {
  const normalizedExpression = expression.replace(/\*\*/g, "^");
  return evaluate(normalizedExpression);
}

export default runCalculator;
