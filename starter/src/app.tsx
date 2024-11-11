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

const App = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState<string | null>(null);
  type Poi = { key: string; location: google.maps.LatLngLiteral };
  const [locations, setLocations] = useState<Poi[]>([]);

  useEffect(() => {
    console.log("USE EFFECT RAN");
    const fetchLocations = async () => {
      try {
        const response = await fetch("https://bus-forcast-backend.vercel.app/api/fetch-events", {
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
        findNearest();
      } catch (error) {
        console.error("Error fetching events:", error);
        console.error("Will now use previous already inputted data for the event locations")

        const data = [
          {
              "imageUrl": "https://scontent-vie1-1.xx.fbcdn.net/v/t39.30808-6/447620249_1337942804151253_3454994074549777002_n.jpg?stp=c206.0.1508.1005a_dst-jpg_s168x128&_nc_cat=109&ccb=1-7&_nc_sid=75d36f&_nc_ohc=MR67YpyfifoQ7kNvgFsS4V6&_nc_zt=23&_nc_ht=scontent-vie1-1.xx&_nc_gid=ANE1bVXTWfhRy3ZEheREsiR&oh=00_AYAXP7hS5uULabbIaj3hX7mwTuPkG16yUIxS80rPOta0rg&oe=67384C82",
              "name": "We Will Rock You by Brampton Music Theatre",
              "utcStartDate": "2024-11-01T23:30:00.000Z",
              "duration": "9 days",
              "usersGoing": 0,
              "usersInterested": 0,
              "organizedBy": "Event by Brampton On Stage",
              "location.name": "The Rose Mainstage",
              "location.city": null,
              "location.countryCode": "CA",
              "url": "https://www.facebook.com/events/1245433933099761/"
          },
          {
              "imageUrl": "https://scontent-vie1-1.xx.fbcdn.net/v/t39.30808-6/438077650_835187341981849_1715461667672574476_n.jpg?stp=c200.0.600.400a_dst-jpg_s168x128&_nc_cat=110&ccb=1-7&_nc_sid=75d36f&_nc_ohc=IX96w1w9leoQ7kNvgGL1BQc&_nc_zt=23&_nc_ht=scontent-vie1-1.xx&_nc_gid=ANE1bVXTWfhRy3ZEheREsiR&oh=00_AYBT4TI3aOkzVzFPXHljBrOlH-H9ssS42xYaLG7N4d34yg&oe=67386879",
              "name": "Brampton Celebrity Hockey Classic",
              "utcStartDate": "2024-11-07T13:00:00.000Z",
              "duration": null,
              "usersGoing": 4,
              "usersInterested": 5,
              "organizedBy": "Event by Easter Seals Ontario and Jenn Ashley",
              "location.name": "Susan Fennell Sportsplex 500 Ray Lawson Blvd",
              "location.city": null,
              "location.countryCode": "CA",
              "url": "https://www.facebook.com/events/1392318574816143/"
          },
          {
              "imageUrl": "https://scontent-vie1-1.xx.fbcdn.net/v/t39.30808-6/458644623_8573423782701987_4807666067697848691_n.jpg?stp=c160.0.1728.1152a_dst-jpg_s168x128&_nc_cat=109&ccb=1-7&_nc_sid=75d36f&_nc_ohc=3Zum-U81fGoQ7kNvgE8w6-y&_nc_zt=23&_nc_ht=scontent-vie1-1.xx&_nc_gid=ANE1bVXTWfhRy3ZEheREsiR&oh=00_AYCQLcTSzr9oh5kfyBDsCyYG00AZeH8CMSZHSxmYMUQ8Dg&oe=673835BE",
              "name": "Wednesday Trivia in Brampton",
              "utcStartDate": "2024-09-26T00:00:00.000Z",
              "duration": "1.5 hours",
              "usersGoing": 1,
              "usersInterested": 0,
              "organizedBy": "Event by Donny Lovering",
              "location.name": "Bovaird Fionn MacCool's (120 Great Lakes Drive, Brampton, ON, Canada)",
              "location.city": null,
              "location.countryCode": "CA",
              "url": "https://www.facebook.com/events/1662146337961516/"
          },
          {
              "imageUrl": "https://scontent-lga3-2.xx.fbcdn.net/v/t39.30808-6/438097205_862804562530296_9178317081029100763_n.jpg?stp=c66.0.164.110a_cp6_dst-jpg_p296x100&_nc_cat=107&ccb=1-7&_nc_sid=75d36f&_nc_ohc=MiQj32Z0nFQQ7kNvgG1-bBC&_nc_zt=23&_nc_ht=scontent-lga3-2.xx&_nc_gid=AAw_sqRWHQwYt_wxpaQ9Afo&oh=00_AYCyJnR2S9C-DmnDEyptdPkaKR9i-r6zhztRL0mnsueTLg&oe=67383325",
              "name": "Pokemon League Standard Sundays",
              "utcStartDate": "2024-05-05T17:00:00.000Z",
              "duration": "3 hours",
              "usersGoing": 1,
              "usersInterested": 58,
              "organizedBy": "Event by Dragon World - Cards Games and Collectibles",
              "location.name": "22 Main St. S. 2nd Floor, Brampton, ON, Canada, Ontario L6W 2C3",
              "location.city": null,
              "location.countryCode": "CA",
              "url": "https://www.facebook.com/events/957704562348507/"
          },
          {
              "imageUrl": "https://scontent-lga3-1.xx.fbcdn.net/v/t39.30808-6/450926756_978188087649046_4113896046274285283_n.png?stp=c179.0.654.436a_dst-jpg_s168x128&_nc_cat=106&ccb=1-7&_nc_sid=75d36f&_nc_ohc=ysYtM5TPHeUQ7kNvgG3jFX3&_nc_zt=23&_nc_ht=scontent-lga3-1.xx&_nc_gid=AAw_sqRWHQwYt_wxpaQ9Afo&oh=00_AYCcE_pqtckwaA41wwzj5CbBuv4R8KBPAENiJoGlgKjPmg&oe=673832EE",
              "name": "Brampton – Pet Valu - (905) 866-6802",
              "utcStartDate": "2024-11-07T15:00:00.000Z",
              "duration": null,
              "usersGoing": 1,
              "usersInterested": 0,
              "organizedBy": "Event by Kissable K9",
              "location.name": "9445 Mississauga Rd, Brampton, ON L6X 0Z8, Canada",
              "location.city": null,
              "location.countryCode": "CA",
              "url": "https://www.facebook.com/events/464175772919963/"
          },
          {
              "imageUrl": "https://scontent-lga3-2.xx.fbcdn.net/v/t39.30808-6/416927712_758180089680504_2054335978133328099_n.jpg?stp=c78.0.585.390a_dst-jpg_s168x128&_nc_cat=107&ccb=1-7&_nc_sid=75d36f&_nc_ohc=HFtCqjUM6R4Q7kNvgESUGcY&_nc_zt=23&_nc_ht=scontent-lga3-2.xx&_nc_gid=AAw_sqRWHQwYt_wxpaQ9Afo&oh=00_AYCppHLSK3GCq3JlpvX6DYuKEic4o-dRjmbxrEvWayhSYg&oe=67385276",
              "name": "Sit 'n' Stitch",
              "utcStartDate": "2024-01-11T18:00:00.000Z",
              "duration": "3 hours",
              "usersGoing": 1,
              "usersInterested": 46,
              "organizedBy": "Event by Brampton Library",
              "location.name": "Brampton Library (Four Corners Branch)",
              "location.city": "Brampton",
              "location.countryCode": "CA",
              "url": "https://www.facebook.com/events/1564901844294019/"
          }
        ]

        const fetchedLocations: Poi[] = data.map((event: any) => ({
          key: event.name,
          location: {
            lat: parseFloat(event.latitude),
            lng: parseFloat(event.longitude),
          },
        }));

      }
    };

    fetchLocations();
  }, []);

  // Example of start and end points that you want to connect
  const routeCoordinates = [
    {
      start: { lat: 43.676851, lng: -79.794655 },
      end: { lat: 43.740525, lng: -79.692873 },
    },
    {
      start: { lat: 43.676851, lng: -79.794655 },
      end: { lat: 43.686702, lng: -79.762946 },
    },
    {
      start: { lat: 43.686702, lng: -79.762946 },
      end: { lat: 43.777974, lng: -79.654701 },
    },
    {
      start: { lat: 43.718739, lng: -79.720777 },
      end: { lat: 43.777974, lng: -79.654701 },
    },
    {
      start: { lat: 43.674737, lng: -79.822793 },
      end: { lat: 43.777974, lng: -79.654701 },
    },
    {
      start: { lat: 43.674737, lng: -79.822793 },
      end: { lat: 43.686702, lng: -79.762946 },
    },
    {
      start: { lat: 43.674737, lng: -79.822793 },
      end: { lat: 43.718739, lng: -79.720777 },
    },
    {
      start: { lat: 43.719094, lng: -79.720392 },
      end: { lat: 43.674737, lng: -79.822793 },
    },
    {
      start: { lat: 43.777974, lng: -79.654701 },
      end: { lat: 43.719094, lng: -79.720392 },
    },
    {
      start: { lat: 43.651989, lng: -79.711352 },
      end: { lat: 43.727947, lng: -79.798084 },
    },
    {
      start: { lat: 43.666276, lng: -79.733498 },
      end: { lat: 43.651989, lng: -79.711352 },
    },
    {
      start: { lat: 43.728082, lng: -79.797984 },
      end: { lat: 43.665468, lng: -79.734258 },
    },
    {
      start: { lat: 43.696507, lng: -79.822308 },
      end: { lat: 43.674585, lng: -79.821932 },
    },
    {
      start: { lat: 43.66502, lng: -79.734721 },
      end: { lat: 43.674585, lng: -79.821932 },
    },
    {
      start: { lat: 43.676691, lng: -79.795365 },
      end: { lat: 43.66502, lng: -79.734721 },
    },
    {
      start: { lat: 43.655796, lng: -79.741789 },
      end: { lat: 43.674585, lng: -79.821932 },
    },
    {
      start: { lat: 43.73057, lng: -79.764199 },
      end: { lat: 43.674763, lng: -79.822727 },
    },
    {
      start: { lat: 43.674763, lng: -79.822727 },
      end: { lat: 43.721569, lng: -79.6401 },
    },
    {
      start: { lat: 43.732765, lng: -79.657551 },
      end: { lat: 43.674763, lng: -79.822727 },
    },
    {
      start: { lat: 43.675536, lng: -79.82212 },
      end: { lat: 43.651989, lng: -79.711352 },
    },
    {
      start: { lat: 43.733389, lng: -79.82448 },
      end: { lat: 43.727889, lng: -79.798129 },
    },
    {
      start: { lat: 43.656535, lng: -79.696231 },
      end: { lat: 43.727947, lng: -79.798084 },
    },
    {
      start: { lat: 43.719085, lng: -79.720236 },
      end: { lat: 43.665146, lng: -79.734583 },
    },
    {
      start: { lat: 43.674552, lng: -79.822441 },
      end: { lat: 43.760031, lng: -79.699036 },
    },
    {
      start: { lat: 43.754126, lng: -79.707914 },
      end: { lat: 43.674552, lng: -79.822441 },
    },
    {
      start: { lat: 43.718668, lng: -79.720436 },
      end: { lat: 43.673192, lng: -79.718561 },
    },
    {
      start: { lat: 43.665344, lng: -79.733943 },
      end: { lat: 43.591842, lng: -79.788366 },
    },
    {
      start: { lat: 43.665659, lng: -79.734095 },
      end: { lat: 43.72895, lng: -79.604968 },
    },
    {
      start: { lat: 43.613971, lng: -79.806453 },
      end: { lat: 43.72895, lng: -79.604968 },
    },
    {
      start: { lat: 43.718949, lng: -79.720119 },
      end: { lat: 43.763925, lng: -79.770587 },
    },
    {
      start: { lat: 43.701915, lng: -79.691069 },
      end: { lat: 43.719008, lng: -79.720322 },
    },
    {
      start: { lat: 43.7707, lng: -79.756031 },
      end: { lat: 43.721276, lng: -79.640421 },
    },
    {
      start: { lat: 43.733573, lng: -79.706074 },
      end: { lat: 43.7707, lng: -79.756031 },
    },
    {
      start: { lat: 43.719306, lng: -79.720544 },
      end: { lat: 43.77173, lng: -79.778835 },
    },
    {
      start: { lat: 43.753872, lng: -79.756999 },
      end: { lat: 43.763835, lng: -79.771361 },
    },
    {
      start: { lat: 43.701745, lng: -79.69187 },
      end: { lat: 43.763835, lng: -79.771361 },
    },
    {
      start: { lat: 43.68089, lng: -79.670226 },
      end: { lat: 43.77173, lng: -79.778835 },
    },
    {
      start: { lat: 43.764522, lng: -79.771397 },
      end: { lat: 43.68089, lng: -79.670226 },
    },
    {
      start: { lat: 43.763835, lng: -79.771361 },
      end: { lat: 43.760865, lng: -79.76645 },
    },
    {
      start: { lat: 43.718766, lng: -79.720326 },
      end: { lat: 43.73057, lng: -79.764199 },
    },
    {
      start: { lat: 43.719076, lng: -79.720799 },
      end: { lat: 43.660408, lng: -79.654196 },
    },
    {
      start: { lat: 43.660408, lng: -79.654196 },
      end: { lat: 43.76208, lng: -79.791876 },
    },
    {
      start: { lat: 43.744719, lng: -79.768254 },
      end: { lat: 43.660408, lng: -79.654196 },
    },
    {
      start: { lat: 43.744943, lng: -79.768555 },
      end: { lat: 43.76208, lng: -79.791876 },
    },
    {
      start: { lat: 43.768207, lng: -79.800322 },
      end: { lat: 43.660408, lng: -79.654196 },
    },
    {
      start: { lat: 43.76208, lng: -79.791876 },
      end: { lat: 43.744719, lng: -79.768254 },
    },
    {
      start: { lat: 43.752469, lng: -79.783801 },
      end: { lat: 43.718866, lng: -79.720213 },
    },
    {
      start: { lat: 43.719008, lng: -79.720322 },
      end: { lat: 43.731797, lng: -79.677719 },
    },
    {
      start: { lat: 43.721024, lng: -79.664752 },
      end: { lat: 43.718668, lng: -79.720436 },
    },
    {
      start: { lat: 43.766834, lng: -79.650262 },
      end: { lat: 43.675579, lng: -79.82191 },
    },
    {
      start: { lat: 43.691082, lng: -79.752441 },
      end: { lat: 43.732597, lng: -79.823411 },
    },
    {
      start: { lat: 43.691004, lng: -79.752311 },
      end: { lat: 43.720761, lng: -79.838824 },
    },
    {
      start: { lat: 43.675308, lng: -79.823192 },
      end: { lat: 43.713032, lng: -79.842251 },
    },
    {
      start: { lat: 43.698197, lng: -79.848935 },
      end: { lat: 43.675641, lng: -79.821608 },
    },
    {
      start: { lat: 43.720705, lng: -79.80912 },
      end: { lat: 43.755943, lng: -79.826627 },
    },
    {
      start: { lat: 43.697076, lng: -79.823102 },
      end: { lat: 43.66502, lng: -79.734721 },
    },
    {
      start: { lat: 43.68206, lng: -79.612848 },
      end: { lat: 43.718741, lng: -79.720618 },
    },
    {
      start: { lat: 43.547755, lng: -79.664804 },
      end: { lat: 43.666633, lng: -79.734681 },
    },
    {
      start: { lat: 43.673192, lng: -79.718561 },
      end: { lat: 43.666409, lng: -79.734376 },
    },
    {
      start: { lat: 43.662813, lng: -79.72606 },
      end: { lat: 43.658371, lng: -79.76624 },
    },
    {
      start: { lat: 43.658257, lng: -79.766273 },
      end: { lat: 43.664347, lng: -79.723718 },
    },
    {
      start: { lat: 43.736743, lng: -79.727047 },
      end: { lat: 43.772428, lng: -79.711635 },
    },
    {
      start: { lat: 43.672212, lng: -79.805429 },
      end: { lat: 43.693184, lng: -79.829604 },
    },
    {
      start: { lat: 43.694234, lng: -79.828955 },
      end: { lat: 43.724497, lng: -79.817042 },
    },
    {
      start: { lat: 43.788025, lng: -79.681905 },
      end: { lat: 43.763767, lng: -79.721879 },
    },
    {
      start: { lat: 43.764298, lng: -79.721202 },
      end: { lat: 43.791682, lng: -79.689545 },
    },
    {
      start: { lat: 43.687338, lng: -79.761893 },
      end: { lat: 43.670463, lng: -79.78688 },
    },
    {
      start: { lat: 43.718114, lng: -79.788425 },
      end: { lat: 43.727803, lng: -79.798196 },
    },
    {
      start: { lat: 43.727803, lng: -79.798196 },
      end: { lat: 43.717085, lng: -79.787974 },
    },
    {
      start: { lat: 43.747853, lng: -79.796461 },
      end: { lat: 43.73135, lng: -79.763297 },
    },
    {
      start: { lat: 43.686853, lng: -79.76249 },
      end: { lat: 43.797409, lng: -79.527716 },
    },
    {
      start: { lat: 43.59406, lng: -79.647416 },
      end: { lat: 43.720859, lng: -79.808876 },
    },
    {
      start: { lat: 43.717416, lng: -79.80253 },
      end: { lat: 43.593487, lng: -79.64804 },
    },
    {
      start: { lat: 43.674763, lng: -79.822727 },
      end: { lat: 43.70527, lng: -79.638296 },
    },
    {
      start: { lat: 43.706558, lng: -79.785961 },
      end: { lat: 43.70527, lng: -79.638296 },
    },
    {
      start: { lat: 43.730822, lng: -79.763908 },
      end: { lat: 43.689518, lng: -79.615327 },
    },
    {
      start: { lat: 43.665853, lng: -79.734043 },
      end: { lat: 43.729082, lng: -79.60533 },
    },
    {
      start: { lat: 43.65606, lng: -79.74149 },
      end: { lat: 43.729082, lng: -79.60533 },
    },
    {
      start: { lat: 43.617829, lng: -79.787204 },
      end: { lat: 43.729082, lng: -79.60533 },
    },
    {
      start: { lat: 43.686943, lng: -79.763086 },
      end: { lat: 43.674737, lng: -79.822793 },
    },
  ];

  const findNearest = () => {
    console.log("COORDS COMPARISION");

    var closestStPoint = [
      {
        lat: 0,
        lng: 0,
      },
    ];

    var closestEnPoint = [
      {
        lat: 0,
        lng: 0,
      },
    ];

    var tempDistStart = 100;
    var minWidthStart = 100;
    var minWidthEnd = 100;
    var tempDistEnd = 100;

    for (var j = 0; j < locations.length; j++) {
      console.log(locations[j]);
      console.log("in");
      for (var i = 0; i < routeCoordinates.length; i++) {
        tempDistStart =
          Math.pow(
            locations[j].location.lat - routeCoordinates[i].start.lat,
            2
          ) +
          Math.pow(
            locations[j].location.lng - routeCoordinates[i].start.lng,
            2
          );
        tempDistEnd =
          Math.pow(locations[j].location.lat - routeCoordinates[i].end.lat, 2) +
          Math.pow(locations[j].location.lat - routeCoordinates[i].end.lng, 2);

        if (tempDistStart < minWidthStart) {
          console.log(routeCoordinates[i]);
          minWidthStart = tempDistStart;
          closestStPoint[0].lat = routeCoordinates[i].start.lat;
          closestStPoint[0].lng = routeCoordinates[i].start.lng;
        }

        if (tempDistEnd < minWidthEnd) {
          console.log(routeCoordinates[i]);
          minWidthEnd = tempDistEnd;
          closestEnPoint[0].lat = routeCoordinates[i].start.lat;
          closestEnPoint[0].lng = routeCoordinates[i].start.lng;
        }
      }
    }

    if (minWidthEnd < minWidthStart) {
      console.log(closestEnPoint);
    } else {
      console.log(closestStPoint);
    }
  };

  const lineColors = [
    "#FF5733", // Red
    "#3357FF", // Blue
    "#3357FF", // Blue
    "#3357FF", // Blue
    "#3357FF", // Blue
    "#3357FF", // Blue
    // Add more colors if you have more routes
  ];

  // const TheMap = () => (
  //   <div style={{ width: "80rem", height: "100vh" }}>
  //     <APIProvider
  //       apiKey={"AIzaSyB3nBgYHz5t3vyrCFNVEMveFwW4SoLVhjs"}
  //       onLoad={() => console.log("Maps API has loaded.")}
  //     >
  //       <Map
  //         defaultZoom={13}
  //         defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
  //         mapId="YOUR_MAP_ID"
  //       >
  //         <PoiMarkers
  //           pois={locations}
  //           routeCoordinates={routeCoordinates}
  //           lineColors={lineColors}
  //         />
  //       </Map>
  //     </APIProvider>
  //   </div>
  // );

  const PoiMarkers = (props: {
    pois: Poi[];
    routeCoordinates: {
      start: google.maps.LatLngLiteral;
      end: google.maps.LatLngLiteral;
    }[];
    lineColors: string[];
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
                suppressMarkers: true, // This prevents start/end markers from showing
              });
              routeRenderer.setMap(map);
              routeRenderer.setDirections(result);
            } else {
              console.error("Error fetching directions: ", status);
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
          strokeColor={"#0c4cb3"}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={"#3b82f6"}
          fillOpacity={0.3}
        />
        {locations.map((poi: Poi) => (
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

  // const root = createRoot(document.getElementById("root"));
  // root.render(<TheMap />);

  return (
    <div
      style={{
        display: "flex",
        marginLeft: "auto",
        marginRight: "auto",
        width: "65rem",
        height: "40rem",
        border: "2px solid black",
        justify: "space-between",
      }}
    >
      <div
        style={{
          width: "60rem",
          height: "100%",
          border: "4px solid grey",
          borderRadius: "20px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <APIProvider
          apiKey={"AIzaSyAXbKCAfstjaqeiE3kiBkvG89zksVXAIMA"}
          onLoad={() => console.log("Maps API has loaded.")}
        >
          <Map
            defaultZoom={13}
            defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
            mapId="YOUR_MAP_ID"
          >
            <PoiMarkers
              pois={locations}
              routeCoordinates={routeCoordinates}
              lineColors={lineColors}
            />
          </Map>
        </APIProvider>
      </div>
      <div style={{ width: "400px", height: "100px" }}>
        <button
          type="submit"
          onClick={(e) => {
            location.reload();
          }}
          style={{ width: "30%", height: "30%", borderRadius: "20px" }}
        >
          Next Week
        </button>
      </div>
    </div>
  );
};

export default App;
