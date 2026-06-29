import React, { useState, useRef, useEffect } from "react";
import { MapPin, Plus, ShieldAlert, Compass, Navigation, ZoomIn, ZoomOut, Check, Sparkles, Search, Loader2 } from "lucide-react";
import { Issue } from "../types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface InteractiveMapProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  onSelectLocation?: (lat: number, lng: number, address: string, ward: string) => void;
  isReportingMode: boolean;
  setIsReportingMode: (val: boolean) => void;
}

export default function InteractiveMap({
  issues,
  selectedIssue,
  onSelectIssue,
  onSelectLocation,
  isReportingMode,
  setIsReportingMode
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingText, setGeocodingText] = useState("");

  const [tempPin, setTempPin] = useState<{ lat: number; lng: number; address: string; ward: string } | null>(null);

  // Map layer toggles states
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite">("dark");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centering on broader coordinates (India center) to accommodate multiple cities
    const mapInstance = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([20.5937, 78.9629], 5);

    // Dark-themed CartoDB tile layer matching our layout theme
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(mapInstance);

    tileLayerRef.current = tileLayer;
    mapRef.current = mapInstance;

    // Initialize Heatmap Layer Group
    const heatmapGroup = L.layerGroup().addTo(mapInstance);
    heatmapLayerGroupRef.current = heatmapGroup;

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Map Base Style dynamically (Dark Base vs Satellite Hybrid)
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();

    let newUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '';

    if (mapStyle === "satellite") {
      newUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }

    const newTileLayer = L.tileLayer(newUrl, {
      maxZoom: 20,
      attribution: attribution
    }).addTo(mapRef.current);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Render Risk Heatmap circles dynamically when showHeatmap toggled
  useEffect(() => {
    if (!mapRef.current || !heatmapLayerGroupRef.current) return;

    heatmapLayerGroupRef.current.clearLayers();

    if (showHeatmap) {
      issues.forEach(issue => {
        const { lat, lng } = issue.location;
        if (isNaN(lat) || isNaN(lng)) return;

        // Draw overlapping transparent orange/red circle for glowing risk overlay
        const radius = Math.max(200, (issue.severity || 5) * 85); // meters
        const intensity = (issue.severity || 5) / 10;
        
        const circle = L.circle([lat, lng], {
          radius: radius,
          fillColor: issue.severity >= 8 ? "#f43f5e" : "#f97316",
          fillOpacity: 0.12 + intensity * 0.14,
          color: "transparent",
          interactive: false
        });

        circle.addTo(heatmapLayerGroupRef.current!);
      });
    }
  }, [showHeatmap, issues]);

  // 2. Render Active Issue Markers on the Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    issues.forEach((issue) => {
      const { lat, lng } = issue.location;
      if (isNaN(lat) || isNaN(lng)) return;

      // Color pins by status/type
      let colorClass = "bg-rose-500 text-rose-500 border-rose-400";
      if (issue.type === "Garbage") colorClass = "bg-amber-500 text-amber-500 border-amber-400";
      if (issue.type === "Water Leakage") colorClass = "bg-blue-500 text-blue-500 border-blue-400";
      if (issue.type === "Streetlight") colorClass = "bg-purple-500 text-purple-500 border-purple-400";

      const isSelected = selectedIssue?.id === issue.id;
      const pulseHtml = (issue.severity >= 8 || isSelected)
        ? `<span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-25 ${colorClass}"></span>`
        : "";
      const borderStyle = isSelected
        ? "border-white bg-white scale-125 text-slate-950"
        : `${colorClass} text-white`;

      const markerIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center w-6 h-6 rounded-full border shadow-lg cursor-pointer transition-all ${borderStyle}">
                 ${pulseHtml}
                 <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                 </svg>
               </div>`,
        className: "custom-marker-wrapper",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(mapRef.current!);

      marker.on("click", () => {
        onSelectIssue(issue);
      });

      markersRef.current.push(marker);
    });
  }, [issues, selectedIssue]);

  // 3. Smooth Fly to Selected Issue
  useEffect(() => {
    if (selectedIssue && mapRef.current) {
      const { lat, lng } = selectedIssue.location;
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.flyTo([lat, lng], 15, {
          animate: true,
          duration: 1.2
        });
      }
    }
  }, [selectedIssue]);

  // 4. Handle Map Clicks for Reporting (Places pin, reverse geocodes)
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (!isReportingMode) return;

      const { lat, lng } = e.latlng;
      setGeocodingText("Resolving real address...");

      setTempPin({
        lat,
        lng,
        address: "Resolving address...",
        ward: "Geocoding location details..."
      });

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: {
            "Accept-Language": "en"
          }
        });
        if (res.ok) {
          const data = await res.json();
          const address = data.display_name || `Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          const addr = data.address || {};
          const wardName = addr.suburb || addr.neighbourhood || addr.village || addr.city_district || addr.subdistrict || addr.county || "Global Sector";
          const city = addr.city || addr.town || addr.state || "Active Sector";
          const fullWard = `${wardName} (${city})`;

          setTempPin({ lat, lng, address, ward: fullWard });
          setGeocodingText("");

          if (onSelectLocation) {
            onSelectLocation(lat, lng, address, fullWard);
          }
        } else {
          throw new Error("Nominatim offline");
        }
      } catch (err) {
        const fallbackAddress = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        const fallbackWard = "Global Sector";
        setTempPin({ lat, lng, address: fallbackAddress, ward: fallbackWard });
        setGeocodingText("");
        if (onSelectLocation) {
          onSelectLocation(lat, lng, fallbackAddress, fallbackWard);
        }
      }
    };

    mapRef.current.on("click", handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
      }
    };
  }, [isReportingMode, onSelectLocation]);

  // 5. Manage Temporary Pin Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    if (tempPin) {
      const tempIcon = L.divIcon({
        html: `<div class="relative flex flex-col items-center">
                 <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white border-2 border-white shadow-xl animate-bounce">
                   <svg class="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                   </svg>
                 </div>
               </div>`,
        className: "temp-pin-wrapper",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([tempPin.lat, tempPin.lng], { icon: tempIcon }).addTo(mapRef.current);
      
      marker.bindPopup(`
        <div class="p-1 min-w-[150px]">
          <span class="text-[9px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">PIN PLACED</span>
          <p class="text-[10px] text-white/90 font-medium leading-normal">${tempPin.address}</p>
          <p class="text-[9px] text-white/40 uppercase tracking-widest font-extrabold mt-1">📍 ${tempPin.ward}</p>
        </div>
      `, {
        closeButton: false,
        className: "custom-leaflet-popup"
      }).openPopup();

      tempMarkerRef.current = marker;
    }
  }, [tempPin]);

  // 6. City / Address search query
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: {
          "Accept-Language": "en"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);

          mapRef.current.setView([latitude, longitude], 13);

          if (isReportingMode) {
            const address = data[0].display_name;
            const pieces = address.split(", ");
            const cityPiece = pieces[Math.max(0, pieces.length - 3)] || "Active Region";
            const districtPiece = pieces[Math.max(0, pieces.length - 4)] || "Sector";
            const fullWard = `${districtPiece} (${cityPiece})`;

            setTempPin({ lat: latitude, lng: longitude, address, ward: fullWard });
            if (onSelectLocation) {
              onSelectLocation(latitude, longitude, address, fullWard);
            }
          }
        } else {
          alert("City or location not found. Try a different search!");
        }
      }
    } catch (err) {
      console.error("Geocoding lookup error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearTempPin = () => {
    setTempPin(null);
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded bg-[#0A0B0E] border border-white/10 overflow-hidden shadow-xl shadow-black/40">
      
      {/* HUD Header & Search Bar combo */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Indicator Badge */}
        <div className="flex items-center gap-3 bg-[#0D0F13]/95 backdrop-blur-md px-3.5 py-2 rounded border border-white/10 shadow-lg pointer-events-auto shrink-0">
          <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
          <div className="flex flex-col">
            <span className="font-sans font-extrabold text-[9px] text-white/90 tracking-widest uppercase">REAL-TIME GLOBAL CIVIC GRID</span>
            <span className="text-[8px] text-white/30 uppercase tracking-wider">CartoDB Live Digital Twin</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Global Search Bar (Real-Time City Navigation) */}
        <form onSubmit={handleSearch} className="flex items-center flex-1 max-w-md bg-[#0D0F13]/95 backdrop-blur-md rounded border border-white/10 overflow-hidden shadow-lg pointer-events-auto">
          <span className="pl-3 text-white/40">
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city, street, or address globally..."
            className="w-full bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-2 border-l border-white/10 cursor-pointer transition"
          >
            Go
          </button>
        </form>

        {/* Reporting Mode Status Badge */}
        <div className="shrink-0 pointer-events-auto">
          {isReportingMode ? (
            <div className="bg-amber-950/95 border border-amber-800/80 backdrop-blur-md px-3 py-1.5 rounded shadow-lg flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-amber-200 font-extrabold uppercase tracking-widest">PLACING PIN MODE</span>
                <span className="text-[8px] text-amber-400/80 uppercase tracking-wider">Click anywhere to load coordinates</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsReportingMode(false); clearTempPin(); }}
                className="text-white/40 hover:text-white font-bold text-xs pl-1.5"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsReportingMode(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3.5 py-2.5 rounded shadow-lg font-bold transition uppercase tracking-widest cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Report Hazard Here
            </button>
          )}
        </div>
      </div>

      {/* Actual Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-10"
      />

      {/* Geocoding notification panel */}
      {geocodingText && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-[1000] bg-blue-950/90 border border-blue-800/50 backdrop-blur-md px-4 py-1.5 rounded text-[10px] text-blue-300 uppercase tracking-widest font-bold flex items-center gap-2 shadow-xl animate-bounce">
          <Loader2 className="w-3 h-3 animate-spin" /> {geocodingText}
        </div>
      )}

      {/* Map Control Overlay Panel */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="bg-[#0D0F13]/90 hover:bg-white/5 border border-white/10 text-white p-2 rounded shadow-lg transition hover:scale-105 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="bg-[#0D0F13]/90 hover:bg-white/5 border border-white/10 text-white p-2 rounded shadow-lg transition hover:scale-105 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {/* Quick City Presets Hotbar */}
        <div className="flex gap-1 bg-[#0D0F13]/90 border border-white/10 p-1 rounded shadow-lg overflow-x-auto max-w-[160px] md:max-w-none">
          {[
            { name: "PUNE", coords: [18.5204, 73.8567] },
            { name: "MUMBAI", coords: [19.0760, 72.8777] },
            { name: "BLR", coords: [12.9716, 77.5946] },
            { name: "DELHI", coords: [28.6139, 77.2090] }
          ].map(city => (
            <button
              key={city.name}
              onClick={() => {
                mapRef.current?.setView(city.coords as [number, number], 12);
                clearTempPin();
              }}
              className="bg-white/5 hover:bg-white/15 text-white/80 hover:text-white px-1.5 py-1 rounded text-[8px] font-bold uppercase tracking-wider transition cursor-pointer"
            >
              {city.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (mapRef.current && issues.length > 0) {
              const validPoints = issues
                .map(i => [i.location.lat, i.location.lng] as [number, number])
                .filter(p => !isNaN(p[0]) && !isNaN(p[1]));
              if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints);
                mapRef.current.fitBounds(bounds, { padding: [40, 40] });
              }
            } else {
              mapRef.current?.setView([20.5937, 78.9629], 5);
            }
            clearTempPin();
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded shadow-lg transition hover:scale-105 text-[8px] font-bold uppercase tracking-widest cursor-pointer text-center"
        >
          🔍 FIT ALL ISSUES
        </button>
      </div>

      {/* Map Layer HUD & Legend in bottom-left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0D0F13]/95 backdrop-blur-md border border-white/10 px-3 py-2.5 rounded shadow-lg flex flex-col gap-2 text-white/50 text-[9px] w-48 pointer-events-auto">
        <span className="font-bold text-white/80 uppercase tracking-widest text-[9px] flex items-center gap-1.5 border-b border-white/5 pb-1">
          <Sparkles className="w-3 h-3 text-blue-400" /> Layer Configuration
        </span>

        {/* Map style toggle */}
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-white/30 uppercase tracking-widest font-extrabold">Base Imagery</span>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setMapStyle("dark")}
              className={`py-1 rounded text-[8px] font-bold uppercase transition cursor-pointer text-center border ${
                mapStyle === "dark" 
                  ? "bg-blue-600/25 border-blue-500 text-blue-400" 
                  : "bg-white/5 hover:bg-white/10 text-white/60 border-transparent"
              }`}
            >
              Vector Dark
            </button>
            <button
              onClick={() => setMapStyle("satellite")}
              className={`py-1 rounded text-[8px] font-bold uppercase transition cursor-pointer text-center border ${
                mapStyle === "satellite" 
                  ? "bg-blue-600/25 border-blue-500 text-blue-400" 
                  : "bg-white/5 hover:bg-white/10 text-white/60 border-transparent"
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* Overlay toggle */}
        <div className="flex flex-col gap-1 mb-1">
          <span className="text-[8px] text-white/30 uppercase tracking-widest font-extrabold">Analytic Overlays</span>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`w-full py-1.5 rounded text-[8px] font-bold uppercase transition cursor-pointer text-center flex items-center justify-center gap-1.5 border ${
              showHeatmap 
                ? "bg-rose-600/20 border-rose-500 text-rose-400" 
                : "bg-white/5 hover:bg-white/10 text-white/60 border-transparent"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-rose-500 ${showHeatmap ? "animate-ping" : ""}`} />
            {showHeatmap ? "Risk Heatmap: ON" : "Risk Heatmap: OFF"}
          </button>
        </div>

        <span className="font-bold text-white/70 uppercase tracking-widest text-[8px] border-t border-white/5 pt-1">LEGEND</span>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400 shrink-0" />
          <span>Road Potholes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400 shrink-0" />
          <span>Garbage / Litter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400 shrink-0" />
          <span>Water Leak / Flood</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-400 shrink-0" />
          <span>Streetlight Failure</span>
        </div>
      </div>
    </div>
  );
}
