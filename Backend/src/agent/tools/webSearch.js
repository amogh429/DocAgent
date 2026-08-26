import fetchWithRetry from "../fetchWithRetry.js";

async function runWebSearch({ query }) {
  const data = await fetchWithRetry("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  const results = data.results.map(
    ({ title, url, content, published_date }) => ({
      title,
      url,
      content,
      published_date,
    }),
  );

  return results;
}

export default runWebSearch;
