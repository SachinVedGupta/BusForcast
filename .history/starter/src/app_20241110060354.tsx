import { fetchEvents } from "./api";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  APIProvider,
  Map,
  useMap,
  AdvancedMarker,
  MapCameraChangedEvent,
  Pin,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { Circle } from "./components/circle";
import Input from "./components/input";

const App: React.FC = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState<string | null>(null);
  type Poi = { key: string; location: google.maps.LatLngLiteral };
  const [locations, setLocations] = useState<Poi[]>([]);

  useEffect(() => {
    console.log("USE EFFECT RAN");
    const fetchLocations = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/fetch-events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const data = await response.json();

        const fetchedLocations: Poi[] = data.map((event: any) => ({
          key: event.name,
          location: {
            lat: parseFloat(event.latitude),
            lng: parseFloat(event.longitude),
          },
        }));

        setLocations(fetchedLocations);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchLocations();
  }, []);

  const routeCoordinates = [
    // Example bus route coordinates
    { start: { lat: 43.676851, lng: -79.794655 }, end: { lat: 43.740525, lng: -79.692873 } },
    { start: { lat: 43.676851, lng: -79.794655 }, end: { lat: 43.686702, lng: -79.762946 } },
    // Add other routes here
  ];

  const TheMap = () => (
    <div style={{ width: "100vw", height: "100vh" }}>
      <APIProvider
        apiKey={"YOUR_GOOGLE_MAPS_API_KEY"}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <Map
          defaultZoom={13}
          defaultCenter={{ lat: 43.7, lng: -79.8 }} // Center near Brampton
          onCameraChanged={(ev: MapCameraChangedEvent) =>
            console.log("camera changed:", ev.detail.center, "zoom:", ev.detail.zoom)
          }
        >
          <PoiMarkers
            pois={locations}
            routeCoordinates={routeCoordinates}
          />
        </Map>
      </APIProvider>
      <Input style={{ zIndex: 1 }} />
    </div>
  );

  const PoiMarkers = (props: {
    pois: Poi[];
    routeCoordinates: {
      start: google.maps.LatLngLiteral;
      end: google.maps.LatLngLiteral;
    }[];
  }) => {
    const map = useMap();
    const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
    const clusterer = useRef<MarkerClusterer | null>(null);
    
    useEffect(() => {
      if (map) {
        // Draw routes and highlight closest routes to each event
        props.routeCoordinates.forEach((route, index) => {
          drawRoute(route.start, route.end, "#3357FF", map);
        });

        props.pois.forEach((poi) => {
          const closestRoute = findClosestRoute(poi.location, props.routeCoordinates);
          drawRoute(closestRoute.start, closestRoute.end, "#FF0000", map);
        });
      }
    }, [map, props.pois, props.routeCoordinates]);

    const drawRoute = (
      start: google.maps.LatLngLiteral,
      end: google.maps.LatLngLiteral,
      color: string,
      map: google.maps.Map
    ) => {
      const routePath = new google.maps.Polyline({
        path: [start, end],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });
      routePath.setMap(map);
    };

    const calculateDistance = (point1: google.maps.LatLngLiteral, point2: google.maps.LatLngLiteral) => {
      const R = 6371; // Radius of the Earth in km
      const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
      const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.lat * Math.PI) / 180) * Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };

    const findClosestRoute = (
      eventLocation: google.maps.LatLngLiteral,
      routes: { start: google.maps.LatLngLiteral; end: google.maps.LatLngLiteral }[]
    ) => {
      let closestRoute = routes[0];
      let minDistance = calculateDistance(eventLocation, routes[0].start);

      routes.forEach((route) => {
        const startDistance = calculateDistance(eventLocation, route.start);
        const endDistance = calculateDistance(eventLocation, route.end);

        const routeDistance = Math.min(startDistance, endDistance);
        if (routeDistance < minDistance) {
          minDistance = routeDistance;
          closestRoute = route;
        }
      });

      return closestRoute;
    };

    return (
      <>
        {props.pois.map((poi) => (
          <AdvancedMarker
            key={poi.key}
            position={poi.location}
            map={map}
          />
        ))}
      </>
    );
  };

  return <TheMap />;
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
