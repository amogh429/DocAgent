async function fetchWithRetry(url, options) {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, options);
    const data = await res.json();

    if (res.status >= 200 && res.status < 300) {
      return data;
    } else if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      const waitTime = 2 ** attempt * 1000;
      console.log(
        `Retryable error (${res.status}). Retrying in ${waitTime}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } else {
      throw new Error(
        `API error (${res.status}): ${data.error?.message || "Unknown error"}`,
      );
    }
  }
  throw new Error(`Request failed after ${MAX_RETRIES} attempts`);
}

export default fetchWithRetry;
