async function runWebSearch({ query }) {
  // console.log("Tavily Key:", process.env.TAVILY_API_KEY);
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
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
