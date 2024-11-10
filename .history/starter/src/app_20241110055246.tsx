// src/app.tsx
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

// Helper functions for distance calculations
const toRadians = (degrees: number) => degrees * (Math.PI / 180);
const toDegrees = (radians: number) => radians * (180 / Math.PI);

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c;
  return d; // in meters
};

const bearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
};

const crossTrackDistance = (
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
  latP: number,
  lonP: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const δ13 = haversineDistance(latA, lonA, latP, lonP) / R;
  const θ13 = toRadians(bearing(latA, lonA, latP, lonP));
  const θ12 = toRadians(bearing(latA, lonA, latB, lonB));
  const d_xt = Math.asin(
    Math.sin(δ13) * Math.sin(θ13 - θ12)
  ) * R;
  return Math.abs(d_xt); // absolute distance in meters
};

const isPointOnSegment = (
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
  latP: number,
  lonP: number
): boolean => {
  // Check if the projection falls on the segment AB
  const d13 = haversineDistance(latA, lonA, latP, lonP);
  const d12 = haversineDistance(latA, lonA, latB, lonB);
  const d23 = haversineDistance(latB, lonB, latP, lonP);
  return d13 + d23 <= d12 + 1e-6; // allow small epsilon
};

const distancePointToLine = (
  point: google.maps.LatLngLiteral,
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral
): number => {
  const { lat: latA, lng: lonA } = start;
  const { lat: latB, lng: lonB } = end;
  const { lat: latP, lng: lonP } = point;

  const d_xt = crossTrackDistance(
    latA,
    lonA,
    latB,
    lonB,
    latP,
    lonP
  );

  if (
    isPointOnSegment(latA, lonA, latB, lonB, latP, lonP)
  ) {
    return d_xt;
  } else {
    // Return the minimum distance to the endpoints
    const d1 = haversineDistance(
      latA,
      lonA,
      latP,
      lonP
    );
    const d2 = haversineDistance(
      latB,
      lonB,
      latP,
      lonP
    );
    return Math.min(d1, d2);
  }
};

const App: React.FC = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState<string | null>(null);
  type Poi = { key: string; location: google.maps.LatLngLiteral };
  const [locations, setLocations] = useState<Poi[]>([]);

  // State to store highlighted routes (indices as strings)
  const [highlightedRoutes, setHighlightedRoutes] = useState<Set<string>>(new Set());

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

        // Map the response to the `Poi` type
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
        setError("Failed to fetch events.");
      }
    };

    fetchLocations();
  }, []);

  // Define bus routes
  const routeCoordinates = [
    {
      start: { lat: 43.676851, lng: -79.794655 },
      end: { lat: 43.740525, lng: -79.692873 },
    },
    // ... (all other routes)
    {
      start: { lat: 43.686943, lng: -79.763086 },
      end: { lat: 43.674737, lng: -79.822793 },
    },
  ];

  // Effect to calculate highlighted routes based on events
  useEffect(() => {
    const newHighlightedRoutes = new Set<string>();

    locations.forEach((event) => {
      let minDistance = Infinity;
      let closestRouteIndex = -1;

      routeCoordinates.forEach((route, index) => {
        const distance = distancePointToLine(
          event.location,
          route.start,
          route.end
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestRouteIndex = index;
        }
      });

      if (closestRouteIndex !== -1) {
        newHighlightedRoutes.add(closestRouteIndex.toString());
      }
    });

    setHighlightedRoutes(newHighlightedRoutes);
  }, [locations, routeCoordinates]);

  const TheMap = () => (
    <div style={{ width: "100vw", height: "100vh" }}>
      <APIProvider
        apiKey={"YOUR_GOOGLE_MAPS_API_KEY"} // Replace with your actual API key
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <Map
          defaultZoom={13}
          defaultCenter={{ lat: 43.6529, lng: -79.3849 }} // Centered on Brampton
          onCameraChanged={(ev: MapCameraChangedEvent) =>
            console.log(
              "camera changed:",
              ev.detail.center,
              "zoom:",
              ev.detail.zoom
            )
          }
          mapId="YOUR_MAP_ID"
        >
          <PoiMarkers
            pois={locations}
            routeCoordinates={routeCoordinates}
            highlightedRoutes={highlightedRoutes}
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
    highlightedRoutes: Set<string>;
  }) => {
    const map = useMap();
    const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
    const clusterer = useRef<MarkerClusterer | null>(null);
    const [circleCenter, setCircleCenter] = useState<google.maps.LatLng | null>(
      null
    );

    const handleClick = useCallback((ev: google.maps.MapMouseEvent) => {
      if (!map) return;
      if (!ev.latLng) return;
      console.log("marker clicked: ", ev.latLng.toString());
      map.panTo(ev.latLng);
      setCircleCenter(ev.latLng);
    }, [map]);

    // Initialize MarkerClusterer, if the map has changed
    useEffect(() => {
      if (!map) return;
      if (!clusterer.current) {
        clusterer.current = new MarkerClusterer({ map });
      }
    }, [map]);

    // Update markers, if the markers array has changed
    useEffect(() => {
      clusterer.current?.clearMarkers();
      clusterer.current?.addMarkers(Object.values(markers));
    }, [markers]);

    const setMarkerRef = (marker: Marker | null, key: string) => {
      if (marker && markers[key]) return;
      if (!marker && !markers[key]) return;
      setMarkers((prev) => {
        if (marker) {
          return { ...prev, [key]: marker };
        } else {
          const newMarkers = { ...prev };
          delete newMarkers[key];
          return newMarkers;
        }
      });
    };

    // Draw multiple routes with dynamic colors based on highlightedRoutes
    useEffect(() => {
      if (map) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderers: google.maps.DirectionsRenderer[] = [];

        // Loop through the provided routes and calculate each one
        props.routeCoordinates.forEach((route, index) => {
          const request = {
            origin: route.start,
            destination: route.end,
            travelMode: google.maps.TravelMode.DRIVING, // Change to WALKING, BICYCLING, etc. as needed
          };
          directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              const polylineOptions = {
                strokeColor: props.highlightedRoutes.has(index.toString())
                  ? "#FF0000" // Red for highlighted routes
                  : "#3357FF", // Blue for default routes
                strokeOpacity: 0.7,
                strokeWeight: 5,
              };
              const routeRenderer = new google.maps.DirectionsRenderer({
                polylineOptions: polylineOptions,
                suppressMarkers: true, // This prevents start/end markers from showing
              });
              routeRenderer.setMap(map);
              routeRenderer.setDirections(result);
              directionsRenderers.push(routeRenderer);
            } else {
              console.error("Error fetching directions: ", status);
            }
          });
        });

        // Cleanup function to remove route renderers when component unmounts or updates
        return () => {
          directionsRenderers.forEach((renderer) => renderer.setMap(null));
        };
      }
    }, [map, props.routeCoordinates, props.highlightedRoutes]);

    return (
      <>
        <Circle
          radius={800}
          center={circleCenter}
          strokeColor={"#0c4cb3"}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={"#3b82f6"}
          fillOpacity={0.3}
        />
        {props.pois.map((poi: Poi) => (
          <AdvancedMarker
            key={poi.key}
            position={poi.location}
            ref={(marker) => setMarkerRef(marker, poi.key)}
            clickable={true}
            onClick={handleClick}
          >
            <Pin
              background={"#FBBC04"}
              glyphColor={"#000"}
              borderColor={"#000"}
            />
          </AdvancedMarker>
        ))}
      </>
    );
  };

  const root = createRoot(document.getElementById("app")!);
  root.render(<TheMap />);

  return <div>{error && <p style={{ color: "red" }}>Error: {error}</p>}</div>;
};

export default App;
