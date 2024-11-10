// src/app.tsx
import React, { useEffect, useState } from 'react';
import { fetchEvents } from './api';

const App: React.FC = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Define the input for the API call
        const runInput = {
          startUrls: ["https://www.facebook.com/events/search?q=brampton&filters=eyJycF9ldmVudHNfbG9jYXRpb246MCI6IntcIm5hbWVcIjpcImZpbHRlcl9ldmVudHNfbG9jYXRpb25cIixcImFyZ3NcIjpcIjExMDE4NTA4NTY2ODcwMlwifSIsImZpbHRlcl9ldmVudHNfZGF0ZV9yYW5nZTowIjoie1wibmFtZVwiOlwiZmlsdGVyX2V2ZW50c19kYXRlXCIsXCJhcmdzXCI6XCIyMDI0LTExLTA0fjIwMjQtMTEtMTBcIn0ifQ%3D%3D"],
          maxEvents: 10,
        };

        // Fetch data from the backend
        const data = await fetchEvents(runInput);
        console.log("Fetched Events:", data); // Debugging: log fetched data
        setEvents(data);
      } catch (err) {
        setError(err.message);
      }
    };

    loadEvents();
  }, []);

  return (
    <div>
      <h1>Event Data</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <ul>
        {events.map((event, index) => (
          <li key={index}>
            <p><strong>Event Name:</strong> {event.name}</p>
            <p><strong>Location:</strong> {event.location_name}</p>
            <p><strong>Latitude:</strong> {event.latitude}</p>
            <p><strong>Longitude:</strong> {event.longitude}</p>
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
};




export default App;
<<<<<<< HEAD
=======




const root = createRoot(document.getElementById('app'));
root.render(<App />);
>>>>>>> f71f2d527926d8ad3884fb12928420142b125aff
