export async function fetchEvents(runInput: object) {
  const response = await fetch("https://bus-forcast-backend.vercel.app/api/fetch-events", {
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
