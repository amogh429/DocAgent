import runCalculator from "./tools/calculator.js";
import runWebSearch from "./tools/webSearch.js";

const toolRegistry = {
  calculator: runCalculator,
  web_search: runWebSearch,
};

export default toolRegistry;
