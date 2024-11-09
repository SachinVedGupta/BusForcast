import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
 APIProvider,
 Map,
 useMap,
 AdvancedMarker,
 MapCameraChangedEvent,
 Pin
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import { Circle } from './components/circle';


type Poi = { key: string, location: google.maps.LatLngLiteral }
const locations: Poi[] = [
 { key: 'operaHouse', location: { lat: -33.8567844, lng: 151.213108 } },
 { key: 'tarongaZoo', location: { lat: -33.8472767, lng: 151.2188164 } },
 { key: 'manlyBeach', location: { lat: -33.8209738, lng: 151.2563253 } },
 // Add other locations...
];


// Example of start and end points that you want to connect
const routeCoordinates = [
 { start: { lat: -33.8567844, lng: 151.213108 }, end: { lat: -33.8472767, lng: 151.2188164 } },
 { start: { lat: -33.8209738, lng: 151.2563253 }, end: { lat: -33.860664, lng: 151.208138 } },
 // Add more start-end coordinates as needed
];


const lineColors = [
 '#FF5733', // Red
 '#33FF57', // Green
 '#3357FF', // Blue
 '#FFFF33', // Yellow
 '#FF33FF', // Pink
 '#33FFFF', // Cyan
 '#FF8C00', // Orange
 // Add more colors if you have more routes
];


const App = () => (
 <APIProvider apiKey={'AIzaSyB3nBgYHz5t3vyrCFNVEMveFwW4SoLVhjs'} onLoad={() => console.log('Maps API has loaded.')}>
   <Map
     defaultZoom={13}
     defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
     onCameraChanged={(ev: MapCameraChangedEvent) =>
       console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
     }
     mapId='YOUR_MAP_ID'
     options={{styles: [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] },
     { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
     { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
     {
       featureType: "administrative.locality",
       elementType: "labels.text.fill",
       stylers: [{ color: "#d59563" }],
     },
     {
       featureType: "poi",
       elementType: "labels.text.fill",
       stylers: [{ color: "#d59563" }],
     },
     {
       featureType: "poi.park",
       elementType: "geometry",
       stylers: [{ color: "#263c3f" }],
     },
     {
       featureType: "poi.park",
       elementType: "labels.text.fill",
       stylers: [{ color: "#6b9a76" }],
     },
     {
       featureType: "road",
       elementType: "geometry",
       stylers: [{ color: "#38414e" }],
     },
     {
       featureType: "road",
       elementType: "geometry.stroke",
       stylers: [{ color: "#212a37" }],
     },
     {
       featureType: "road",
       elementType: "labels.text.fill",
       stylers: [{ color: "#9ca5b3" }],
     },
     {
       featureType: "road.highway",
       elementType: "geometry",
       stylers: [{ color: "#746855" }],
     },
     {
       featureType: "road.highway",
       elementType: "geometry.stroke",
       stylers: [{ color: "#1f2835" }],
     },
     {
       featureType: "road.highway",
       elementType: "labels.text.fill",
       stylers: [{ color: "#f3d19c" }],
     },
     {
       featureType: "transit",
       elementType: "geometry",
       stylers: [{ color: "#2f3948" }],
     },
     {
       featureType: "transit.station",
       elementType: "labels.text.fill",
       stylers: [{ color: "#d59563" }],
     },
     {
       featureType: "water",
       elementType: "geometry",
       stylers: [{ color: "#17263c" }],
     },
     {
       featureType: "water",
       elementType: "labels.text.fill",
       stylers: [{ color: "#515c6d" }],
     },
     {
       featureType: "water",
       elementType: "labels.text.stroke",
       stylers: [{ color: "#17263c" }],
     },]}}
   >
     <PoiMarkers pois={locations} routeCoordinates={routeCoordinates} lineColors={lineColors} />
   </Map>
 </APIProvider>
);


const PoiMarkers = (props: { pois: Poi[], routeCoordinates: { start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral }[], lineColors: string[] }) => {
 const map = useMap();
 const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
 const clusterer = useRef<MarkerClusterer | null>(null);
 const [circleCenter, setCircleCenter] = useState<google.maps.LatLng | null>(null);


 const handleClick = useCallback((ev: google.maps.MapMouseEvent) => {
   if (!map) return;
   if (!ev.latLng) return;
   console.log('marker clicked: ', ev.latLng.toString());
   map.panTo(ev.latLng);
   setCircleCenter(ev.latLng);
 });


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


   setMarkers(prev => {
     if (marker) {
       return { ...prev, [key]: marker };
     } else {
       const newMarkers = { ...prev };
       delete newMarkers[key];
       return newMarkers;
     }
   });
 };


 // Draw multiple routes with different colors based on the routeCoordinates array
 useEffect(() => {
   if (map) {
     const directionsService = new google.maps.DirectionsService();
     const directionsRenderer = new google.maps.DirectionsRenderer();
     directionsRenderer.setMap(map);


     // Loop through the provided routes and calculate each one
     props.routeCoordinates.forEach((route, index) => {
       const request = {
         origin: route.start,
         destination: route.end,
         travelMode: google.maps.TravelMode.DRIVING, // Change to WALKING, BICYCLING, etc. as needed
       };


       directionsService.route(request, (result, status) => {
         if (status === google.maps.DirectionsStatus.OK) {
           const polylineOptions = {
             strokeColor: props.lineColors[index % props.lineColors.length], // Assign color to the route
             strokeOpacity: 0.7,
             strokeWeight: 5,
           };
           const routeRenderer = new google.maps.DirectionsRenderer({
             polylineOptions: polylineOptions,
           });
           routeRenderer.setMap(map);
           routeRenderer.setDirections(result);
         } else {
           console.error('Error fetching directions: ', status);
         }
       });
     });
   }
 }, [map, props.routeCoordinates, props.lineColors]);


 return (
   <>
     <Circle
       radius={800}
       center={circleCenter}
       strokeColor={'#0c4cb3'}
       strokeOpacity={1}
       strokeWeight={3}
       fillColor={'#3b82f6'}
       fillOpacity={0.3}
     />
     {props.pois.map((poi: Poi) => (
       <AdvancedMarker
         key={poi.key}
         position={poi.location}
         ref={marker => setMarkerRef(marker, poi.key)}
         clickable={true}
         onClick={handleClick}
       >
         <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
       </AdvancedMarker>
     ))}
   </>
 );
};


export default App;


const root = createRoot(document.getElementById('app'));
root.render(<App />);
