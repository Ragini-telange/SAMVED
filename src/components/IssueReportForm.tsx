import React, { useState, useRef } from "react";
import { Camera, Upload, Mic, RefreshCw, Send, Sparkles, ShieldCheck, MapPin, MicOff } from "lucide-react";
import { Issue } from "../types";

interface IssueReportFormProps {
  onIssueAdded: (newIssue: Issue) => void;
  selectedLat: number | null;
  selectedLng: number | null;
  selectedAddress: string;
  selectedWard: string;
  onClearLocation: () => void;
  onSelectLocation?: (lat: number, lng: number, address: string, ward: string) => void;
  userEmail: string;
}

export default function IssueReportForm({
  onIssueAdded,
  selectedLat,
  selectedLng,
  selectedAddress,
  selectedWard,
  onClearLocation,
  onSelectLocation,
  userEmail
}: IssueReportFormProps) {
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Other");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState(5);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  
  // AI analysis results preview before submission
  const [aiAnalysis, setAiAnalysis] = useState<{
    detectedObjects?: string[];
    evidenceConfidence?: number;
    assignedDepartment?: string;
    impactPrediction?: string;
    disasterAlert?: string;
    duplicateDetected?: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        // Automatically start AI extraction once image is loaded
        triggerAIAnalysis(reader.result as string, description, type, selectedAddress);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        triggerAIAnalysis(reader.result as string, description, type, selectedAddress);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Gemini Vision & Text analysis
  const triggerAIAnalysis = async (imgData: string | null, desc: string, catType: string, addr: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imgData,
          description: desc,
          type: catType,
          address: addr
        })
      });

      if (!res.ok) throw new Error("AI analysis failed");
      const data = await res.json();

      setTitle(data.title || "AI Detected Issue");
      setType(data.type || catType);
      setSeverity(data.severity || 5);
      
      setAiAnalysis({
        detectedObjects: data.detectedObjects || [],
        evidenceConfidence: data.evidenceConfidence || 92,
        assignedDepartment: data.assignedDepartment || "General Administration",
        impactPrediction: data.impactPrediction || "",
        disasterAlert: data.disasterAlert || "",
        duplicateDetected: data.duplicateDetected || false
      });
    } catch (error) {
      console.error("Failed to run Gemini analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Regional Voice Recording simulation
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate calling voice endpoint with regional language inputs (Marathi/Hindi)
      const simulatedVoices = [
        "इथे रस्त्यावर खूप मोठा खड्डा पडला आहे, काल रात्री एका दुचाकीस्वाराचा अपघात झाला।", // Marathi Pothole
        "कचराकुंडी पूर्ण भरली आहे, आजूबाजूला घाण वास येत आहे आणि कुत्रे कचरा पसरवत आहेत।", // Marathi Garbage
        "पानी की पाइपलाइन टूट गई है, कल शाम से पानी बह रहा है और पूरी सड़क पर बाढ़ आ गई है।" // Hindi Water leakage
      ];
      const randomText = simulatedVoices[Math.floor(Math.random() * simulatedVoices.length)];
      setVoiceText(randomText);

      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/gemini/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceText: randomText })
        });
        const data = await res.json();

        setDescription(data.translated || "");
        setType(data.type || "Other");
        setTitle(data.title || "");
        setSeverity(data.severity || 5);

        // Run full analysis mapping to simulate image & address combinations
        triggerAIAnalysis(image, data.translated, data.type, selectedAddress);
      } catch (error) {
        console.error("Voice processing failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setVoiceText("");
      setIsRecording(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fallback to Pune location if user didn't select on map
    const lat = selectedLat || 18.5204;
    const lng = selectedLng || 73.8567;
    const address = selectedAddress || "12, Karve Road, Erandwane, Pune, Maharashtra 411004";
    const ward = selectedWard || "Kothrud Ward";

    const finalTitle = title.trim() || `Unresolved ${type} Issue`;

    const payload = {
      title: finalTitle,
      type,
      description: description || "Reported with photo. Pending officer action.",
      severity,
      location: {
        lat,
        lng,
        address,
        ward
      },
      imageUrl: image || "https://images.unsplash.com/photo-1594498653385-d527259017ef?auto=format&fit=crop&w=800&q=80",
      reportedBy: userEmail,
      assignedDepartment: aiAnalysis?.assignedDepartment || "Ward Management Dept",
      impactPrediction: aiAnalysis?.impactPrediction || "Awaiting physical municipal inspection.",
      evidenceConfidence: aiAnalysis?.evidenceConfidence || 85,
      detectedObjects: aiAnalysis?.detectedObjects || [type.toLowerCase()],
      resolutionSuggestions: aiAnalysis?.disasterAlert ? ["Secure the immediate vicinity.", "Avoid parking near underpasses."] : ["Submit to ward office."],
      disasterAlert: aiAnalysis?.disasterAlert || ""
    };

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to report issue");
      const createdIssue = await res.json();
      onIssueAdded(createdIssue);
      
      // Reset form
      setDescription("");
      setType("Other");
      setTitle("");
      setSeverity(5);
      setImage(null);
      setAiAnalysis(null);
      setVoiceText("");
      onClearLocation();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-[#0D0F13] border border-white/10 rounded-lg p-6 shadow-xl shadow-black/40">
      <div className="border-b border-white/10 pb-4 mb-5">
        <h2 className="font-serif italic text-lg text-white font-bold">File Local Community Complaint</h2>
        <p className="text-[10px] text-white/50 mt-1">Submit water leaks, garbage, or road hazards. Click anywhere on the dashboard map to grab exact coordinates.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Title, Category, Description */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Complaint Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deep asphalt pothole near bypass"
                  className="w-full bg-[#0A0B0E] border border-white/10 focus:border-white/30 focus:outline-none rounded-lg p-2 text-[10px] text-white/80 transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Issue Category *</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    triggerAIAnalysis(image, description, e.target.value, selectedAddress);
                  }}
                  className="w-full bg-[#0A0B0E] border border-white/10 focus:border-white/30 focus:outline-none rounded-lg p-2 text-[10px] text-white/80 transition"
                >
                  <option value="Pothole">Pothole</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Streetlight">Streetlight</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Detailed Description *</label>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    isRecording
                      ? "bg-red-600/20 text-red-400 border-red-500 animate-pulse"
                      : "bg-[#0A0B0E] hover:bg-white/5 border-white/10 hover:border-white/20 text-white/80"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-rose-500" />
                  {isRecording ? "Stop Recording" : "Speak (Regional voice report)"}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the hazard... specify landmarks, length of time the problem has persisted, and potential safety risks."
                rows={5}
                className="w-full bg-[#0A0B0E] border border-white/10 focus:border-white/30 focus:outline-none rounded-lg text-[10px] text-white p-3 transition leading-normal"
                required
              />
            </div>

            {voiceText && (
              <div className="bg-[#0A0B0E] border border-white/10 rounded-lg p-3">
                <p className="text-[9px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Mic className="w-3 h-3 animate-pulse" /> Regional Voice Transcribed:
                </p>
                <p className="text-[10px] text-white/80 italic mt-1 font-semibold">"{voiceText}"</p>
                <p className="text-[9px] text-emerald-400 mt-1 uppercase tracking-wider">✓ Translated and auto-filled above!</p>
              </div>
            )}
          </div>

          {/* Column 2: Location and Photos */}
          <div className="space-y-4">
            <div className="bg-[#0A0B0E] border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Incident Location & Coordinates</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectLocation) {
                      onSelectLocation(18.5204, 73.8567, "12, Karve Road, Erandwane, Pune, Maharashtra 411004", "Kothrud Ward");
                    }
                  }}
                  className="flex items-center gap-1 text-[9px] text-amber-500 hover:text-amber-400 border border-amber-500/30 hover:border-amber-500/50 bg-[#0A0B0E] hover:bg-white/5 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  <MapPin className="w-3 h-3 animate-pulse" /> Use Live GPS Location
                </button>
              </div>

              {selectedLat && selectedLng ? (
                <div className="grid grid-cols-3 gap-3 text-[10px]">
                  <div>
                    <p className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Latitude</p>
                    <p className="text-emerald-400 font-mono font-bold mt-1">📍 {selectedLat.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Longitude</p>
                    <p className="text-emerald-400 font-mono font-bold mt-1">📍 {selectedLng.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Detected Area / Ward</p>
                    <p className="text-white font-bold mt-1 truncate">{selectedWard || "General Area"}</p>
                  </div>
                  <div className="col-span-3 pt-1 border-t border-white/5 text-[9px]">
                    <p className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Verifiable Address</p>
                    <p className="text-white/80 font-semibold mt-0.5 truncate">{selectedAddress}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-amber-950/10 rounded-lg border border-amber-900/10">
                  <p className="text-[10px] text-amber-200/90 font-bold uppercase tracking-wider">📍 Map Pin Required</p>
                  <p className="text-[8px] text-amber-400/80 mt-1 uppercase tracking-wider">Please tap on the Digital Twin Map first, or click "Use Live GPS Location" above!</p>
                </div>
              )}
            </div>

            {/* Photo Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Attach Incident Photo</label>
              <div className="grid grid-cols-4 gap-3">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video rounded-lg border border-dashed border-white/10 hover:border-white/30 bg-[#0A0B0E] flex flex-col items-center justify-center gap-1 transition group cursor-pointer overflow-hidden select-none"
                >
                  {image && !image.includes("unsplash.com") ? (
                    <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white/30 group-hover:text-blue-400" />
                      <span className="text-[8px] text-white/50 font-bold uppercase tracking-wider text-center">Upload Photo</span>
                    </>
                  )}
                </div>

                {[
                  { id: "pothole_preset", label: "Standard Pothole", url: "https://images.unsplash.com/photo-1594498653385-d527259017ef?auto=format&fit=crop&w=400&q=80" },
                  { id: "pipeline_preset", label: "Pipeline Leak", url: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80" },
                  { id: "garbage_preset", label: "Garbage Pile", url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80" }
                ].map((preset) => {
                  const isSelected = image === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setImage(preset.url);
                        triggerAIAnalysis(preset.url, description, type, selectedAddress);
                      }}
                      className={`relative aspect-video rounded-lg border overflow-hidden cursor-pointer group transition ${
                        isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
                        <span className="text-[8px] font-bold text-white uppercase tracking-wider leading-tight">{preset.label}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5 z-10">
                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* AI Analyzed HUD Section */}
        {aiAnalysis && (
          <div className="bg-[#0A0B0E] border border-white/10 rounded-lg p-3.5 space-y-2.5 animate-fadeIn text-[10px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Gemini Coprocessor Output
              </span>
              <span className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Auth: {aiAnalysis.evidenceConfidence}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-white/40 font-bold uppercase tracking-wider">Assigned Department</p>
                <p className="text-white/80 font-bold mt-0.5">{aiAnalysis.assignedDepartment}</p>
              </div>
              <div>
                <p className="text-white/40 font-bold uppercase tracking-wider">AI Extracted Severity</p>
                <p className="text-amber-500 font-bold mt-0.5">★ {severity}/10</p>
              </div>
            </div>

            <div>
              <p className="text-white/40 font-bold uppercase tracking-wider">Localized Impact Prediction</p>
              <p className="text-white/70 mt-0.5 bg-[#0D0F13] p-2 rounded-lg border border-white/5 italic font-medium">"{aiAnalysis.impactPrediction}"</p>
            </div>

            {aiAnalysis.detectedObjects && aiAnalysis.detectedObjects.length > 0 && (
              <div>
                <p className="text-white/40 font-bold uppercase tracking-wider">Computer Vision Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiAnalysis.detectedObjects.map((obj, i) => (
                    <span key={i} className="bg-[#0D0F13] border border-white/5 text-white/40 text-[9px] px-2 py-0.5 rounded-lg font-mono uppercase tracking-widest">
                      #{obj}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.disasterAlert && (
              <div className="bg-amber-950/30 border border-amber-800/15 p-2.5 rounded-lg flex gap-2 items-start">
                <span className="text-amber-400 font-bold text-xs mt-0.5">⚠️</span>
                <div>
                  <p className="text-amber-400 font-bold uppercase tracking-wider">Monsoon Vulnerability Warning</p>
                  <p className="text-amber-200/80 mt-0.5">{aiAnalysis.disasterAlert}</p>
                </div>
              </div>
            )}

            {aiAnalysis.duplicateDetected && (
              <div className="bg-rose-950/30 border border-rose-900/15 p-2 rounded-lg flex gap-2 items-start">
                <span className="text-rose-400 font-bold text-xs mt-0.5">⚡</span>
                <div>
                  <p className="text-rose-400 font-bold uppercase tracking-wider">Potential Duplicate Issue</p>
                  <p className="text-rose-200/80 mt-0.5">An issue of the same category has already been reported nearby. Submitting will merge endorsements!</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => triggerAIAnalysis(image, description, type, selectedAddress)}
            disabled={isAnalyzing || (!image && !description)}
            className="flex items-center gap-1.5 py-2 px-4 bg-[#0D0F13] hover:bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold rounded-lg transition disabled:opacity-50 cursor-pointer text-[10px] uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isAnalyzing ? "Analyzing..." : "Run AI Assessment"}
          </button>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-[10px] uppercase tracking-wider disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            File Complaint
          </button>
        </div>
      </form>
    </div>
  );
}
