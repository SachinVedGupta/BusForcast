import { fetchEvents } from "./api";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  APIProvider,
  Map,
  useMap,
  AdvancedMarker,
  MapCameraChangedEvent,
  Polyline,
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
    { start: { lat: 43.676851, lng: -79.794655 }, end: { lat: 43.740525, lng: -79.692873 } },
    { start: { lat: 43.676851, lng: -79.794655 }, end: { lat: 43.686702, lng: -79.762946 } },
    // Add remaining routes
  ];

  const lineColors = { default: "#3357FF", highlight: "#FF3357" };

  const calculateDistance = (loc1: google.maps.LatLngLiteral, loc2: google.maps.LatLngLiteral) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLng = toRad(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.lat)) *
        Math.cos(toRad(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findClosestRoute = (event: Poi) => {
    let closestRouteIndex = 0;
    let shortestDistance = Infinity;

    routeCoordinates.forEach((route, index) => {
      const startDistance = calculateDistance(event.location, route.start);
      const endDistance = calculateDistance(event.location, route.end);
      const minDistance = Math.min(startDistance, endDistance);

      if (minDistance < shortestDistance) {
        shortestDistance = minDistance;
        closestRouteIndex = index;
      }
    });

    return closestRouteIndex;
  };

  const TheMap = () => (
    <div style={{ width: "100vw", height: "100vh" }}>
      <APIProvider
        apiKey={"YOUR_API_KEY"}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <Map
          defaultZoom={13}
          defaultCenter={{ lat: 43.70011, lng: -79.4163 }}
          onCameraChanged={(ev: MapCameraChangedEvent) =>
            console.log(
              "camera changed:",
              ev.detail.center,
              "zoom:",
              ev.detail.zoom
            )
          }
        >
          <PoiMarkers pois={locations} routeCoordinates={routeCoordinates} />
        </Map>
      </APIProvider>
      <Input style={{ zindex: 1 }} />
    </div>
  );

  const PoiMarkers = (props: {
    pois: Poi[];
    routeCoordinates: { start: google.maps.LatLngLiteral; end: google.maps.LatLngLiteral }[];
  }) => {
    const [highlightedRoutes, setHighlightedRoutes] = useState(new Set<number>());

    useEffect(() => {
      const newHighlightedRoutes = new Set<number>();

      props.pois.forEach((poi) => {
        const closestRouteIndex = findClosestRoute(poi);
        newHighlightedRoutes.add(closestRouteIndex);
      });

      setHighlightedRoutes(newHighlightedRoutes);
    }, [props.pois]);

    return (
      <>
        {props.pois.map((poi) => (
          <AdvancedMarker key={poi.key} position={poi.location} />
        ))}
        {props.routeCoordinates.map((route, index) => (
          <Polyline
            key={index}
            path={[route.start, route.end]}
            options={{
              strokeColor: highlightedRoutes.has(index)
                ? lineColors.highlight
                : lineColors.default,
              strokeOpacity: 1.0,
              strokeWeight: 4,
            }}
          />
        ))}
      </>
    );
  };

  return <TheMap />;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
