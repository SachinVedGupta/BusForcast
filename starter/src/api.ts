export async function fetchEvents(runInput: object) {
  const response = await fetch("http://localhost:5000/api/fetch-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ run_input: runInput }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
