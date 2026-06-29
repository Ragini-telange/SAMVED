import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, BarChart3, CloudRain, ShieldCheck, ThermometerSun, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { Issue, Prediction } from "../types";

interface DashboardStatsProps {
  issues: Issue[];
}

export default function DashboardStats({ issues }: DashboardStatsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingPredict, setLoadingPredict] = useState(false);

  // Calculate stats
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === "Resolved").length;
  const inProgressIssues = issues.filter(i => i.status === "In Progress").length;
  const openIssues = issues.filter(i => i.status === "Reported" || i.status === "Verified").length;

  // Calculate overall Health Score
  // Max score is 100. Each open high-severity issue (>7) subtracts 8 points, medium (4-7) subtracts 4 points, low (<4) subtracts 2 points.
  let healthScore = 100;
  issues.forEach(i => {
    if (i.status !== "Resolved") {
      if (i.severity >= 8) healthScore -= 8;
      else if (i.severity >= 4) healthScore -= 4;
      else healthScore -= 2;
    }
  });
  healthScore = Math.max(10, Math.min(100, healthScore));

  // Issues by Ward
  const wardCounts: { [key: string]: number } = {};
  issues.forEach(i => {
    const ward = i.location.ward.split(" (")[0];
    wardCounts[ward] = (wardCounts[ward] || 0) + 1;
  });

  // Issues by Category
  const catCounts: { [key: string]: number } = { Pothole: 0, Garbage: 0, "Water Leakage": 0, Streetlight: 0, Other: 0 };
  issues.forEach(i => {
    if (catCounts[i.type] !== undefined) {
      catCounts[i.type]++;
    } else {
      catCounts["Other"]++;
    }
  });

  // Fetch AI predictive insights
  useEffect(() => {
    const fetchPredictions = async () => {
      setLoadingPredict(true);
      try {
        const res = await fetch("/api/gemini/predict-future", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          setPredictions(data);
        }
      } catch (error) {
        console.error("Failed to load AI predictions:", error);
      } finally {
        setLoadingPredict(false);
      }
    };
    fetchPredictions();
  }, [issues]);

  // Color mappings
  let scoreColor = "text-emerald-500 stroke-emerald-500";
  let scoreBg = "bg-emerald-500/10 border-emerald-500/20";
  if (healthScore < 60) {
    scoreColor = "text-rose-500 stroke-rose-500";
    scoreBg = "bg-rose-500/10 border-rose-500/20";
  } else if (healthScore < 85) {
    scoreColor = "text-amber-500 stroke-amber-500";
    scoreBg = "bg-amber-500/10 border-amber-500/20";
  }

  // Calculate arc for visual health gauge SVG
  // Circumference is 2 * PI * r = 2 * 3.14159 * 36 = 226
  // We want a half/three-quarter circle arc.
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Cards Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0D0F13] border border-white/10 rounded p-4 flex flex-col justify-between shadow-lg shadow-black/20">
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest">Total Reports</span>
          <p className="text-2xl font-bold font-sans text-white/90 mt-2">{totalIssues}</p>
          <span className="text-[9px] text-blue-400 mt-1 font-bold uppercase tracking-wider">↑ Citizen Loaded</span>
        </div>
        <div className="bg-[#0D0F13] border border-white/10 rounded p-4 flex flex-col justify-between shadow-lg shadow-black/20">
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest">Resolved Issues</span>
          <p className="text-2xl font-bold font-sans text-emerald-400 mt-2">{resolvedIssues}</p>
          <span className="text-[9px] text-emerald-500 mt-1 font-bold uppercase tracking-wider">✓ PMC Handled</span>
        </div>
        <div className="bg-[#0D0F13] border border-white/10 rounded p-4 flex flex-col justify-between shadow-lg shadow-black/20">
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest">In Progress</span>
          <p className="text-2xl font-bold font-sans text-amber-400 mt-2">{inProgressIssues}</p>
          <span className="text-[9px] text-amber-500 mt-1 font-bold uppercase tracking-wider">⟳ Dispatch Sent</span>
        </div>
        <div className="bg-[#0D0F13] border border-white/10 rounded p-4 flex flex-col justify-between shadow-lg shadow-black/20">
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest">Pending Verification</span>
          <p className="text-2xl font-bold font-sans text-rose-400 mt-2">{openIssues}</p>
          <span className="text-[9px] text-rose-500 mt-1 font-bold uppercase tracking-wider">⚠ Audit Required</span>
        </div>
      </div>

      {/* Main Stats Panel Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Health Score Gauge */}
        <div className="bg-[#0D0F13] border border-white/10 rounded p-5 flex flex-col items-center justify-center text-center shadow-lg shadow-black/20">
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest mb-4 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-blue-400" /> Community Health Score</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-white/5 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`fill-none transition-all duration-1000 ease-out ${scoreColor}`}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-white/90 font-sans tracking-tight">{healthScore}</span>
              <span className="text-[9px] text-white/30 font-extrabold">/100 PTS</span>
            </div>
          </div>

          <div className={`mt-4 px-3 py-1.5 rounded text-[10px] font-extrabold uppercase tracking-widest border text-center ${scoreBg}`}>
            {healthScore >= 85 ? "🟢 SECURE WARD PROFILE" : healthScore >= 60 ? "🟡 STABILIZING SECTOR STATUS" : "🔴 ACTION REQUIRED IMMEDIATE"}
          </div>
          <p className="text-[10px] text-white/40 mt-3 text-center leading-normal uppercase tracking-wider">
            Points decline on active hazards. Resolve reports to lift points.
          </p>
        </div>

        {/* Ward Comparisons SVG Chart */}
        <div className="bg-[#0D0F13] border border-white/10 rounded p-5 flex flex-col justify-between shadow-lg shadow-black/20">
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Ward-wise Active Issues</span>

          <div className="space-y-2.5 my-4">
            {Object.keys(wardCounts).length === 0 ? (
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider text-center py-8">No issues logged yet.</p>
            ) : (
              Object.entries(wardCounts).map(([ward, count], idx) => {
                const maxVal = Math.max(...Object.values(wardCounts));
                const widthPercent = (count / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/80 font-semibold truncate w-32 uppercase tracking-wide">{ward}</span>
                      <span className="text-white/40 font-mono font-bold">{count} reports</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded transition-all duration-1000"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Live ward aggregates comparison</span>
        </div>

        {/* Issues by Category Chart */}
        <div className="bg-[#0D0F13] border border-white/10 rounded p-5 flex flex-col justify-between shadow-lg shadow-black/20">
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Category Distribution</span>

          <div className="space-y-2.5 my-3">
            {Object.entries(catCounts).map(([cat, count], idx) => {
              const total = Math.max(1, totalIssues);
              const percent = Math.round((count / total) * 100);
              let barColor = "bg-rose-500";
              if (cat === "Garbage") barColor = "bg-amber-500";
              if (cat === "Water Leakage") barColor = "bg-blue-500";
              if (cat === "Streetlight") barColor = "bg-purple-500";
              if (cat === "Other") barColor = "bg-white/10";

              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-[10px] text-white/80 w-20 truncate font-semibold uppercase tracking-wider">{cat}</span>
                  <div className="flex-1 h-2 bg-black/40 rounded overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded transition-all duration-1000`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40 font-mono font-bold w-8 text-right">{percent}%</span>
                </div>
              );
            })}
          </div>

          <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Breakdown of city hazards</span>
        </div>
      </div>

      {/* AI Predictive Intelligence Section */}
      <div className="bg-[#0D0F13] border border-white/10 rounded p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-400 animate-pulse" />
            <div>
              <h3 className="font-serif italic text-base text-white flex items-center gap-1">
                AI Predictive Vulnerability Model <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Simulation of regional monsoon precipitation (150mm expected next 7 days across active sectors)</p>
            </div>
          </div>
          <div className="bg-blue-950/40 border border-blue-900/60 px-2.5 py-0.5 rounded text-[9px] text-blue-400 font-bold uppercase tracking-wider">
            GEMINI FLASH FORECAST MODEL
          </div>
        </div>

        {loadingPredict ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-xs text-white/40">Computing physical models, weather triggers, and historical erosion profiles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {predictions.map((p, idx) => (
              <div key={idx} className="bg-[#0A0B0E] border border-white/5 rounded p-3.5 flex flex-col justify-between hover:border-white/20 transition gap-2 shadow-inner">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-white/90 uppercase tracking-wider line-clamp-1">{p.title}</span>
                    <span className="text-[8px] bg-rose-950/40 border border-rose-900/60 text-rose-400 px-1.5 py-0.5 rounded font-bold font-mono shrink-0">
                      SEV: {p.severity}
                    </span>
                  </div>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-1">📍 Sector: {p.area}</p>
                  
                  <div className="bg-[#0D0F13]/40 p-2.5 rounded border border-white/5 mt-2 text-[10px] text-white/70 space-y-1">
                    <p className="line-clamp-2"><span className="text-amber-500 font-extrabold uppercase tracking-wide">Pre-existing:</span> {p.vulnerability}</p>
                    <p className="line-clamp-2"><span className="text-blue-400 font-extrabold uppercase tracking-wide">Trigger:</span> {p.trigger}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-2.5 mt-1 bg-blue-950/10 px-2 py-1.5 rounded border border-blue-900/10">
                  <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-0.5"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Ward mitigation mandate:</p>
                  <p className="text-[10px] text-white/80 italic font-medium mt-0.5 leading-normal">"{p.mitigation}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
