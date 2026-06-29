import React, { useState, useEffect } from "react";
import {
  Compass,
  Map,
  BarChart3,
  Bot,
  Trophy,
  AlertOctagon,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MessageSquare,
  FileText,
  Sparkles,
  RefreshCw,
  PlusCircle,
  LogOut,
  ChevronRight,
  Send,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  X
} from "lucide-react";
import { Issue, UserRole, DisasterAlert } from "./types";
import InteractiveMap from "./components/InteractiveMap";
import AICityAssistant from "./components/AICityAssistant";
import IssueReportForm from "./components/IssueReportForm";
import DashboardStats from "./components/DashboardStats";
import Leaderboard from "./components/Leaderboard";
import LoginPage from "./components/LoginPage";

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "complaint" | "stats" | "chat" | "leaderboard">("map");
  const [disasterAlerts, setDisasterAlerts] = useState<DisasterAlert[]>([]);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [isReportingMode, setIsReportingMode] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // User Authentication state
  const [user, setUser] = useState<{ email: string; name: string; role: UserRole } | null>(() => {
    const saved = localStorage.getItem("samved_user");
    return saved ? JSON.parse(saved) : null;
  });

  const userEmail = user?.email || "raginitelange052@gmail.com";
  const userName = user?.name || "Ragini Verma";
  const userRole = user?.role || "Citizen";

  const handleLogin = (email: string, name: string, role: UserRole) => {
    const newUser = { email, name, role };
    setUser(newUser);
    localStorage.setItem("samved_user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("samved_user");
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem("samved_user", JSON.stringify(updatedUser));
    }
  };

  // New Comment & Status updates states
  const [commentText, setCommentText] = useState("");
  const [officialLogText, setOfficialLogText] = useState("");
  const [selectedNewStatus, setSelectedNewStatus] = useState<"Reported" | "Verified" | "In Progress" | "Resolved">("Verified");

  // Complaint letter state
  const [draftedLetter, setDraftedLetter] = useState<string | null>(null);
  const [draftingLetter, setDraftingLetter] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Gamification tracking for active user session with per-user persistent storage
  const [addedPoints, setAddedPoints] = useState<number>(0);

  // Load points when userEmail changes
  useEffect(() => {
    if (userEmail) {
      const savedPoints = localStorage.getItem(`samved_user_points_${userEmail}`);
      setAddedPoints(savedPoints ? parseInt(savedPoints, 10) : 0);
    } else {
      setAddedPoints(0);
    }
  }, [userEmail]);

  // Handler to earn points and sync instantly to localStorage
  const handleEarnPoints = (pts: number) => {
    setAddedPoints(prev => {
      const nextPoints = prev + pts;
      if (userEmail) {
        localStorage.setItem(`samved_user_points_${userEmail}`, nextPoints.toString());
      }
      return nextPoints;
    });
  };

  // Handler to reset points for current user
  const handleResetPoints = () => {
    setAddedPoints(0);
    if (userEmail) {
      localStorage.setItem(`samved_user_points_${userEmail}`, "0");
    }
  };

  // Load issues and alerts on boot
  const fetchIssues = async () => {
    setLoadingIssues(true);
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
        // Default select the first issue for initial drawer preview
        if (data.length > 0 && !selectedIssue) {
          setSelectedIssue(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load issues:", error);
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/disaster-alerts");
      if (res.ok) {
        const data = await res.json();
        setDisasterAlerts(data);
      }
    } catch (error) {
      console.error("Failed to load disaster alerts:", error);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchAlerts();
  }, []);

  // Handle upvote/community verification
  const handleVote = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(issues.map(i => i.id === id ? updated : i));
        setSelectedIssue(updated);
        // Award points to active user
        handleEarnPoints(10);
      }
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  // Handle comment submit
  const handleAddComment = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`/api/issues/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: userName, text: commentText.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(issues.map(i => i.id === id ? updated : i));
        setSelectedIssue(updated);
        setCommentText("");
        handleEarnPoints(15);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle Municipal Officer status update
  const handleStatusUpdate = async (id: string) => {
    if (!officialLogText.trim()) return;

    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedNewStatus,
          officer: userRole === "Admin" ? "Chief Commissioner" : "Officer Deshmukh",
          text: officialLogText.trim()
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(issues.map(i => i.id === id ? updated : i));
        setSelectedIssue(updated);
        setOfficialLogText("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusUpdateDirect = async (id: string, status: string, text: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          officer: userRole === "Admin" ? "Chief Commissioner" : "Officer Deshmukh",
          text: text.trim()
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(issues.map(i => i.id === id ? updated : i));
        setSelectedIssue(updated);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle formal complaint letter drafting
  const handleDraftLetter = async (id: string) => {
    setDraftingLetter(true);
    setDraftedLetter(null);
    try {
      const res = await fetch("/api/gemini/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId: id })
      });
      if (res.ok) {
        const data = await res.json();
        setDraftedLetter(data.letter);
      }
    } catch (error) {
      console.error("Failed to draft letter:", error);
    } finally {
      setDraftingLetter(false);
    }
  };

  const handleResetDemo = async () => {
    if (confirm("Are you sure you want to reset all reports back to the default demo seed?")) {
      try {
        const res = await fetch("/api/issues/reset", { method: "POST" });
        if (res.ok) {
          fetchIssues();
          setSelectedIssue(null);
          handleResetPoints();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSelectLocation = (lat: number, lng: number, address: string, ward: string) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setSelectedAddress(address);
    setSelectedWard(ward);
    setActiveTab("complaint");
  };

  const handleClearLocation = () => {
    setSelectedLat(null);
    setSelectedLng(null);
    setSelectedAddress("");
    setSelectedWard("");
  };

  const handleIssueAdded = (newIssue: Issue) => {
    setIssues([newIssue, ...issues]);
    setSelectedIssue(newIssue);
    setIsReportingMode(false);
    handleEarnPoints(50); // Massive reward for registering issue
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#0A0B0E] font-sans text-[#E0E0E0] overflow-hidden">
      {/* 1. Left HUD Sidebar Nav */}
      <div className="w-64 shrink-0 bg-[#0D0F13] border-r border-white/10 flex flex-col justify-between">
        <div>
          {/* Branded Logo Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded font-bold text-white italic">
                सं
              </div>
              <div>
                <h1 className="text-sm font-medium tracking-tight uppercase text-white">SAMVED <span className="text-blue-400 italic">AI</span></h1>
                <p className="text-[10px] text-white/30 tracking-widest uppercase">संवेद • {userRole}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links based on role */}
          <nav className="p-4 space-y-1.5">
            {userRole === "Admin" ? (
              <>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "map"
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-extrabold shadow-md shadow-blue-500/5"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Map className="w-4 h-4 text-blue-400" /> Admin Command Center
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "stats"
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-extrabold"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Predictive Analytics
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "chat"
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-extrabold"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Bot className="w-4 h-4" /> AI City Assistant
                </button>
              </>
            ) : userRole === "Officer" ? (
              <>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "map"
                      ? "bg-amber-600/10 text-amber-500 border border-amber-500/20 font-extrabold shadow-md"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-500" /> Officer Workdesk
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "stats"
                      ? "bg-amber-600/10 text-amber-500 border border-amber-500/20 font-extrabold"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-amber-500" /> Predictive Analytics
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "chat"
                      ? "bg-amber-600/10 text-amber-500 border border-amber-500/20 font-extrabold"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Bot className="w-4 h-4" /> AI Assistant Advisor
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "map"
                      ? "bg-white/5 text-white border border-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Map className="w-4 h-4 text-blue-400" /> Digital Twin Map
                </button>
                <button
                  onClick={() => setActiveTab("complaint")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "complaint"
                      ? "bg-white/5 text-white border border-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" /> File Complaint
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "stats"
                      ? "bg-white/5 text-white border border-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Predictive Analytics
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "chat"
                      ? "bg-white/5 text-white border border-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Bot className="w-4 h-4" /> Chat With Your City
                </button>
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer uppercase tracking-widest ${
                    activeTab === "leaderboard"
                      ? "bg-white/5 text-white border border-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400" /> Hero Gamification
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Session Profile with strict Logout */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-[#0A0B0E]/40">
          <div className="flex items-center gap-2.5">
            <div className="text-2xl">
              {userRole === "Admin" ? "🛡️" : userRole === "Officer" ? "👮" : "👩‍💼"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{userName}</p>
              <p className="text-[9px] text-white/40 truncate font-mono">{userRole} • Active</p>
            </div>
          </div>

          <div className="flex gap-2">
            {userRole === "Admin" && (
              <button
                onClick={handleResetDemo}
                className="flex-1 flex items-center justify-center gap-1 py-1 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded text-[8px] text-white/50 hover:text-white transition cursor-pointer font-bold uppercase tracking-wider"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Reset Seed
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-rose-900/30 hover:border-rose-500/50 hover:bg-rose-950/20 rounded text-[8px] text-rose-400 hover:text-rose-200 transition cursor-pointer font-bold uppercase tracking-wider"
            >
              <LogOut className="w-3 h-3" /> LOG OUT
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Center Content View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Hub Header */}
        <header className="h-16 bg-[#0F1116] border-b border-white/10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" />
              <h2 className="font-serif italic text-base tracking-wide text-white mr-4">
                {userRole === "Admin" && activeTab === "map" && "Administrative Command Center"}
                {userRole === "Officer" && activeTab === "map" && "Municipal Officer Workdesk"}
                {userRole === "Citizen" && activeTab === "map" && "Digital Twin Map"}
                {activeTab === "complaint" && "File New Complaint"}
                {activeTab === "stats" && "Predictive Ward Analytics"}
                {activeTab === "chat" && "Samved AI Coprocessor"}
                {activeTab === "leaderboard" && "Gamification & Community Trust"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userRole === "Citizen" && (
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-lg text-[10px] font-bold animate-pulse flex items-center gap-1 shrink-0 uppercase tracking-widest">
                ★ {2560 + addedPoints} PTS (Level 5)
              </span>
            )}
            <div className="flex items-center gap-2 bg-[#0A0B0E] border border-white/5 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] text-white/40 font-bold font-mono uppercase tracking-widest">SAMVED CLOUD ONLINE</span>
            </div>
          </div>
        </header>

        {/* View Switcher Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0A0B0E]">
          {activeTab === "map" && (
            <>
              {/* ================= ADMIN PORTAL SCREEN ================= */}
              {userRole === "Admin" && (
                <div className="space-y-6">
                  {/* Admin summary stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#0D0F13] border border-white/5 p-4 rounded-xl">
                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Total Active Hazards</p>
                      <p className="text-2xl font-bold text-white mt-1">{issues.length}</p>
                    </div>
                    <div className="bg-[#0D0F13] border border-amber-500/10 p-4 rounded-xl">
                      <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">Pending Verification</p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        {issues.filter(i => i.status === "Reported").length}
                      </p>
                    </div>
                    <div className="bg-[#0D0F13] border border-blue-500/10 p-4 rounded-xl">
                      <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">In Progress</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">
                        {issues.filter(i => i.status === "In Progress").length}
                      </p>
                    </div>
                    <div className="bg-[#0D0F13] border border-emerald-500/10 p-4 rounded-xl">
                      <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Resolved & Secured</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {issues.filter(i => i.status === "Resolved").length}
                      </p>
                    </div>
                  </div>

                  {/* Layout split */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-[#0D0F13] border border-white/10 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-500" /> Pending Citizen Complaints & Verification
                        </h3>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Admin Authorization Required
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {issues.filter(i => i.status === "Reported").length === 0 ? (
                          <div className="text-center py-12 text-white/30 text-xs uppercase tracking-widest font-semibold">
                            ✓ No pending complaints. All citizen hazard reports have been verified & routed!
                          </div>
                        ) : (
                          issues.filter(i => i.status === "Reported").map(issue => (
                            <div
                              key={issue.id}
                              onClick={() => setSelectedIssue(issue)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                selectedIssue?.id === issue.id
                                  ? "bg-gradient-to-r from-amber-600/10 to-transparent border-amber-500/30"
                                  : "bg-[#0A0B0E] border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div className="flex gap-3 min-w-0">
                                {issue.imageUrl && (
                                  <img src={issue.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-white/10 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-black text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border border-white/5">{issue.type}</span>
                                    <span className="text-red-400 font-bold text-[9px] font-mono">Severity: {issue.severity}/10</span>
                                  </div>
                                  <h4 className="font-bold text-xs text-white mt-1 truncate">{issue.title}</h4>
                                  <p className="text-[10px] text-white/40 truncate">{issue.location.address}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[9px] bg-red-950/20 border border-red-900/40 text-rose-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  Pending Approval
                                </span>
                                <p className="text-[9px] text-white/30 mt-1.5 font-mono">{new Date(issue.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* General system log panel */}
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Platform Seed & Control System</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-3">
                          To reset the application state back to the original database defaults for evaluation, use the system reset below.
                        </p>
                        <button
                          onClick={handleResetDemo}
                          className="flex items-center justify-center gap-2 px-3.5 py-2 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-[10px] text-white/80 hover:text-white transition cursor-pointer font-bold uppercase tracking-wider"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Reset System Seed Database
                        </button>
                      </div>
                    </div>

                    {/* Right column Selected complaint detailed panel */}
                    <div className="bg-[#0D0F13] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                      {selectedIssue ? (
                        <div className="space-y-4">
                          <div className="border-b border-white/5 pb-3">
                            <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest">Currently Inspecting</span>
                            <h3 className="text-sm font-bold text-white mt-1">{selectedIssue.title}</h3>
                            <p className="text-[10px] text-white/40 mt-1">{selectedIssue.location.address}</p>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-[#0A0B0E] p-3 rounded-lg border border-white/5 text-[11px] text-white/80">
                              <p className="font-bold uppercase text-[9px] text-white/40 mb-1">Citizen Description</p>
                              <p className="leading-relaxed">"{selectedIssue.description}"</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-[#0A0B0E] p-2.5 rounded border border-white/5">
                                <p className="text-white/40 font-bold uppercase tracking-wider">Sector Route</p>
                                <p className="text-white font-semibold mt-0.5 truncate">{selectedIssue.assignedDepartment}</p>
                              </div>
                              <div className="bg-[#0A0B0E] p-2.5 rounded border border-white/5">
                                <p className="text-white/40 font-bold uppercase tracking-wider">AI Confidence</p>
                                <p className="text-white font-semibold mt-0.5">{selectedIssue.evidenceConfidence}%</p>
                              </div>
                            </div>
                          </div>

                          {selectedIssue.status === "Reported" ? (
                            <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-xl space-y-3">
                              <p className="text-[10.5px] text-amber-200 leading-relaxed font-sans">
                                <strong>Action Required:</strong> Verify that this complaint complies with civic standards. Approving it will verify the hazard and dispatch it to Officer Deshmukh's work workbench immediately.
                              </p>
                              <button
                                onClick={() => handleStatusUpdateDirect(selectedIssue.id, "Verified", "Approved and verified by Administrative Hub. Assigned to local Ward Officer for immediate repair.")}
                                className="w-full bg-amber-500 hover:bg-amber-400 text-[#0D0F13] font-black py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Approve & Route Complaint
                              </button>
                            </div>
                          ) : (
                            <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl text-center">
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                APPROVED & VERIFIED
                              </span>
                              <p className="text-[10.5px] text-blue-200 mt-2 leading-relaxed">
                                This complaint was approved and assigned. Current state: <strong>{selectedIssue.status}</strong>.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-24 text-white/30 text-xs uppercase tracking-widest font-semibold flex flex-col items-center justify-center gap-2">
                          <Compass className="w-8 h-8 text-white/20 animate-spin-slow" />
                          Select a pending report to inspect & authorize
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= OFFICER PORTAL SCREEN ================= */}
              {userRole === "Officer" && (
                <div className="space-y-6">
                  {/* Summary counts */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0D0F13] border border-[#0D0F13] p-4 rounded-xl">
                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Total Assigned Tasks</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {issues.filter(i => i.status !== "Reported").length}
                      </p>
                    </div>
                    <div className="bg-[#0D0F13] border border-amber-500/15 p-4 rounded-xl">
                      <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">My Active Work Queue (Pending/In Progress)</p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        {issues.filter(i => i.status === "Verified" || i.status === "In Progress").length}
                      </p>
                    </div>
                    <div className="bg-[#0D0F13] border border-emerald-500/15 p-4 rounded-xl">
                      <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest font-sans">Successfully Resolved By Me</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {issues.filter(i => i.status === "Resolved").length}
                      </p>
                    </div>
                  </div>

                  {/* Main Workdesk Grid */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* Left Work list */}
                    <div className="col-span-2 bg-[#0D0F13] border border-white/10 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> My Active Resolution Requests
                        </h3>
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 font-bold px-2.5 py-1 rounded font-mono uppercase tracking-widest">
                          Ward Engineering Queue
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {issues.filter(i => i.status === "Verified" || i.status === "In Progress").length === 0 ? (
                          <div className="text-center py-16 text-white/30 text-xs uppercase tracking-widest font-semibold">
                            ✓ No active assignments! All assigned hazards have been successfully resolved.
                          </div>
                        ) : (
                          issues.filter(i => i.status === "Verified" || i.status === "In Progress").map(issue => (
                            <div
                              key={issue.id}
                              onClick={() => {
                                setSelectedIssue(issue);
                                setOfficialLogText("");
                              }}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                selectedIssue?.id === issue.id
                                  ? "bg-gradient-to-r from-amber-600/10 to-transparent border-amber-500/30 shadow-lg"
                                  : "bg-[#0A0B0E] border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div className="flex gap-3 min-w-0">
                                {issue.imageUrl && (
                                  <img src={issue.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-white/10 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 text-[8px]">
                                    <span className="bg-black text-amber-400 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">{issue.type}</span>
                                    <span className="text-red-400 font-bold font-mono">Severity: {issue.severity}/10</span>
                                  </div>
                                  <h4 className="font-bold text-xs text-white mt-1 truncate">{issue.title}</h4>
                                  <p className="text-[10px] text-white/40 truncate">{issue.location.address}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                  issue.status === "In Progress"
                                    ? "bg-blue-950/40 border border-blue-900/40 text-blue-400"
                                    : "bg-amber-950/20 border border-amber-900/30 text-amber-400"
                                }`}>
                                  {issue.status}
                                </span>
                                <p className="text-[9px] text-white/30 mt-1.5 font-mono">{issue.location.ward}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right interactive resolution console */}
                    <div className="bg-[#0D0F13] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                      {selectedIssue ? (
                        <div className="space-y-4">
                          <div className="border-b border-white/5 pb-3">
                            <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest">Active Task Sheet</span>
                            <h3 className="text-sm font-bold text-white mt-1">{selectedIssue.title}</h3>
                            <p className="text-[10px] text-white/40 mt-1">{selectedIssue.location.address}</p>
                          </div>

                          <div className="space-y-3.5">
                            <div className="bg-[#0A0B0E] p-3 rounded-lg border border-white/5 text-[10.5px] text-white/70">
                              <p className="font-bold uppercase text-[9px] text-white/40 mb-1">Citizen Complaint Description</p>
                              <p className="leading-relaxed">"{selectedIssue.description}"</p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[9.5px] text-white/40 font-bold uppercase tracking-wider">Log Update / Resolution Note</p>
                              <textarea
                                value={officialLogText}
                                onChange={(e) => setOfficialLogText(e.target.value)}
                                placeholder="Describe inspection details, material used, or contractor status..."
                                rows={2.5}
                                className="w-full bg-[#0A0B0E] border border-white/10 focus:border-white/30 focus:outline-none rounded-lg text-xs p-2.5 text-white/80 transition"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                disabled={!officialLogText.trim()}
                                onClick={() => {
                                  handleStatusUpdateDirect(selectedIssue.id, "In Progress", officialLogText);
                                  setOfficialLogText("");
                                }}
                                className="bg-[#0A0B0E] hover:bg-white/5 border border-white/10 text-white font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
                              >
                                Mark as In Progress
                              </button>
                              <button
                                type="button"
                                disabled={!officialLogText.trim()}
                                onClick={() => {
                                  handleStatusUpdateDirect(selectedIssue.id, "Resolved", officialLogText);
                                  setOfficialLogText("");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-600/25"
                              >
                                Mark as Resolved
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-24 text-white/30 text-xs uppercase tracking-widest font-semibold flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-white/20 animate-pulse" />
                          Select an assigned job request from the list to update its status & resolve
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= CITIZEN PORTAL SCREEN ================= */}
              {userRole === "Citizen" && (
                <div className="grid grid-cols-3 gap-6">
                  {/* Map & List block (Span 2) */}
                  <div className="col-span-2 space-y-6">
                    <InteractiveMap
                      issues={issues}
                      selectedIssue={selectedIssue}
                      onSelectIssue={(issue) => setSelectedIssue(issue)}
                      onSelectLocation={handleSelectLocation}
                      isReportingMode={isReportingMode}
                      setIsReportingMode={setIsReportingMode}
                    />

                    {/* List Summary Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Recent Reported Wards Concerns ({issues.length})</h3>
                        <div className="flex gap-1.5 text-[9px] font-mono">
                          <span className="bg-[#0D0F13] border border-white/10 px-2 py-0.5 rounded text-white/40 uppercase tracking-wider">Order: Newest</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {issues.map(issue => {
                          const isSelected = selectedIssue?.id === issue.id;
                          return (
                            <div
                              key={issue.id}
                              onClick={() => setSelectedIssue(issue)}
                              className={`p-3.5 rounded-lg border transition-all cursor-pointer flex gap-3 ${
                                isSelected
                                  ? "bg-gradient-to-br from-white/10 to-transparent border-white/20 shadow-xl shadow-black/40"
                                  : "bg-[#0D0F13]/60 border-white/5 hover:border-white/10"
                              }`}
                            >
                              {issue.imageUrl && (
                                <img src={issue.imageUrl} alt={issue.title} className="w-16 h-16 object-cover rounded-lg shrink-0 border border-white/10" />
                              )}
                              <div className="min-w-0 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-2 text-[9px]">
                                    <span className="bg-black/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-blue-400">{issue.type}</span>
                                    <span className="text-red-400 font-bold font-mono uppercase tracking-wider">Sev: {issue.severity}/10</span>
                                  </div>
                                  <h4 className="font-semibold text-xs mt-1 text-white/80 truncate">{issue.title}</h4>
                                </div>
                                <p className="text-[10px] text-white/30 truncate">{issue.location.address}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Intake Form Block (Span 1) */}
                  <div>
                    <IssueReportForm
                      onIssueAdded={handleIssueAdded}
                      selectedLat={selectedLat}
                      selectedLng={selectedLng}
                      selectedAddress={selectedAddress}
                      selectedWard={selectedWard}
                      onClearLocation={handleClearLocation}
                      onSelectLocation={handleSelectLocation}
                      userEmail={userEmail}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "complaint" && (
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <IssueReportForm
                onIssueAdded={(newIssue) => {
                  handleIssueAdded(newIssue);
                  setActiveTab("map");
                }}
                selectedLat={selectedLat}
                selectedLng={selectedLng}
                selectedAddress={selectedAddress}
                selectedWard={selectedWard}
                onClearLocation={handleClearLocation}
                onSelectLocation={handleSelectLocation}
                userEmail={userEmail}
              />
            </div>
          )}

          {activeTab === "stats" && <DashboardStats issues={issues} />}

          {activeTab === "chat" && (
            <div className="max-w-4xl mx-auto">
              <AICityAssistant onPointsEarned={handleEarnPoints} />
            </div>
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard
              userName={userName}
              userEmail={userEmail}
              userPoints={addedPoints}
            />
          )}
        </div>
      </div>

      {/* 3. Floating Detail Sidebar Drawer (Always shown for selected issue if open) */}
      {selectedIssue && (
        <div className="w-96 shrink-0 bg-[#0D0F13] border-l border-white/10 flex flex-col justify-between h-full overflow-hidden animate-slideIn">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0F1116]">
            <div className="flex items-center gap-2">
              <span className="bg-black/40 text-blue-400 text-[10px] px-2 py-0.5 rounded font-black uppercase border border-white/5">
                {selectedIssue.type}
              </span>
              <span className="text-[10px] text-white/30 font-mono font-bold">
                ID: {selectedIssue.id}
              </span>
            </div>
            <button
              onClick={() => setSelectedIssue(null)}
              className="text-white/40 hover:text-white transition text-xs p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Visual Photo preview */}
            {selectedIssue.imageUrl && (
              <div className="relative h-44 rounded-lg border border-white/10 overflow-hidden shrink-0 select-none">
                <img src={selectedIssue.imageUrl} alt={selectedIssue.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[9px] font-bold text-red-400">
                  SEVERITY: {selectedIssue.severity}/10
                </div>
              </div>
            )}

            {/* Title & description */}
            <div>
              <h3 className="font-serif italic text-base text-white leading-snug">{selectedIssue.title}</h3>
              <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">{selectedIssue.description}</p>
            </div>

            {/* Location address */}
            <div className="bg-[#0A0B0E] border border-white/5 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-white/60">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold">{selectedIssue.location.address}</p>
                <p className="text-[9px] text-white/30 mt-0.5 uppercase tracking-wider">{selectedIssue.location.ward}</p>
              </div>
            </div>

            {/* AI suggestions / predictions HUD */}
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-lg p-3.5 space-y-2">
              <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Samved AI Diagnostics
              </span>

              <div className="text-[10px]">
                <p className="text-white/40 font-bold uppercase tracking-wider">Assigned Sector Routing</p>
                <p className="text-white font-semibold mt-0.5">{selectedIssue.assignedDepartment}</p>
              </div>

              <div className="text-[10px]">
                <p className="text-white/40 font-bold uppercase tracking-wider">Predicted Impact (30 Days)</p>
                <p className="text-white/70 italic mt-0.5 leading-relaxed">"{selectedIssue.impactPrediction}"</p>
              </div>

              {selectedIssue.resolutionSuggestions && selectedIssue.resolutionSuggestions.length > 0 && (
                <div className="text-[10px] pt-1">
                  <p className="text-white/40 font-bold uppercase tracking-wider mb-1">AI Action Suggestions</p>
                  <ul className="space-y-1">
                    {selectedIssue.resolutionSuggestions.map((s, idx) => (
                      <li key={idx} className="flex gap-1.5 text-[9.5px] text-white/80">
                        <span className="text-blue-400 font-bold">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Disaster vulnerability alert */}
            {selectedIssue.disasterAlert && (
              <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg flex gap-2 items-start">
                <span className="text-amber-400 text-xs font-bold mt-0.5">⚠️</span>
                <div>
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Monsoon Flood Hazard</p>
                  <p className="text-[9.5px] text-amber-200/90 mt-0.5 leading-normal">{selectedIssue.disasterAlert}</p>
                </div>
              </div>
            )}

            {/* Official municipal timeline & log */}
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Municipal Timeline ({selectedIssue.officialUpdates?.length || 0})
              </label>

              <div className="bg-[#0A0B0E] border border-white/5 rounded-lg p-3 space-y-3.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/60 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-white/30" /> Current State:
                  </span>
                  <span className="bg-white/5 border border-white/10 text-white font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                    {selectedIssue.status}
                  </span>
                </div>

                {selectedIssue.officialUpdates && selectedIssue.officialUpdates.length > 0 ? (
                  <div className="space-y-3 border-l border-white/10 pl-3 ml-1.5">
                    {selectedIssue.officialUpdates.map((update, idx) => (
                      <div key={idx} className="text-[10px] relative">
                        <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-blue-500 border border-[#0D0F13]" />
                        <div className="flex justify-between text-[8px] text-white/40">
                          <span className="font-bold uppercase tracking-wider text-blue-400">{update.officer}</span>
                          <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-white/80 mt-1 font-medium">{update.text}</p>
                        <span className="inline-block bg-[#0D0F13] border border-white/5 text-white/40 px-1 py-0.5 rounded text-[8px] uppercase mt-1">
                          ↳ Status: {update.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-white/30 italic text-center py-2">No official municipal updates posted yet.</p>
                )}
              </div>
            </div>

            {/* Public comments */}
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Public Discussion ({selectedIssue.comments?.length || 0})
              </label>

              <div className="space-y-2">
                {selectedIssue.comments && selectedIssue.comments.map((c, idx) => (
                  <div key={idx} className="bg-[#0A0B0E] border border-white/5 p-2.5 rounded-lg text-[10px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white/80">{c.author}</span>
                      <span className="text-[8px] text-white/30">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-white/60 leading-normal">"{c.text}"</p>
                  </div>
                ))}
              </div>

              {/* Add comment input */}
              <form onSubmit={(e) => handleAddComment(e, selectedIssue.id)} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Join ward discussion..."
                  className="flex-1 bg-[#0A0B0E] border border-white/10 focus:border-white/30 focus:outline-none rounded-lg text-[10px] px-2.5 py-1.5 transition text-white/80"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="p-4 border-t border-white/10 space-y-3 bg-[#0A0B0E]/60">
            {/* Citizen Vote & AI Letter draft section */}
            {userRole === "Citizen" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(selectedIssue.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-[11px] font-bold transition cursor-pointer uppercase tracking-wider ${
                      selectedIssue.votedUsers?.includes(userEmail)
                        ? "bg-emerald-600/15 border-emerald-500/30 text-emerald-400"
                        : "bg-[#0A0B0E] hover:bg-white/5 border-white/10 hover:border-white/20 text-white/80"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {selectedIssue.votedUsers?.includes(userEmail) ? "Verified" : "Upvote"} ({selectedIssue.votes})
                  </button>

                  <button
                    onClick={() => handleDraftLetter(selectedIssue.id)}
                    disabled={draftingLetter}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] rounded-lg transition font-bold cursor-pointer uppercase tracking-wider"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    {draftingLetter ? "Drafting..." : "AI Complaint"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    const reportText = `===================================================
SAMVED AI CITIZEN COMPLAINT REPORT
===================================================
Reference ID: ${selectedIssue.id}
Status: ${selectedIssue.status}
Category: ${selectedIssue.type}
Severity Rating: ${selectedIssue.severity}/10
Votes/Endorsements: ${selectedIssue.votes}

Title: ${selectedIssue.title}
Date Filed: ${new Date(selectedIssue.createdAt).toLocaleDateString()}

Location Address:
${selectedIssue.location.address}
Ward Area: ${selectedIssue.location.ward}
Coordinates: Latitude ${selectedIssue.location.lat}, Longitude ${selectedIssue.location.lng}

Description of Issue:
${selectedIssue.description}

AI-Predicted Localized Impact & Risks:
- ${selectedIssue.impactPrediction}
- Assigned Department: ${selectedIssue.assignedDepartment}
- Evidence Confidence Rating: ${selectedIssue.evidenceConfidence}%
${selectedIssue.disasterAlert ? `- Monsoon Warning: ${selectedIssue.disasterAlert}` : ''}

AI Action Recommendations:
${selectedIssue.resolutionSuggestions?.map((s, idx) => `${idx + 1}. ${s}`).join("\n") || "N/A"}

Official Timeline Updates:
${selectedIssue.officialUpdates?.map(u => `[${new Date(u.createdAt).toLocaleDateString()} - ${u.status}] ${u.text} (${u.officer})`).join("\n") || "No updates posted yet."}

Comments & Public Discussion:
${selectedIssue.comments?.map(c => `[${new Date(c.createdAt).toLocaleDateString()}] ${c.author}: ${c.text}`).join("\n") || "No community comments."}

===================================================
This document serves as an official citizen verification record downloaded from Samved AI Digital Twin portal.
`;
                    const element = document.createElement("a");
                    const file = new Blob([reportText], { type: "text/plain" });
                    element.href = URL.createObjectURL(file);
                    element.download = `Samved_Complaint_Report_${selectedIssue.id}.txt`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0D0F13] border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-[11px] rounded-lg transition font-bold cursor-pointer uppercase tracking-wider animate-fadeIn"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Download Citizen Report (.txt)
                </button>
              </div>
            )}

            {/* Municipal Officer State Controller panel */}
            {(userRole === "Officer" || userRole === "Admin") && (
              <div className="bg-[#0A0B0E] border border-white/5 p-3 rounded-lg space-y-3">
                <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  🛡️ OFFICER CONTROL GATE
                </span>

                <div className="space-y-1 text-[10px]">
                  <p className="text-white/40 font-bold uppercase tracking-wider">Update Status State</p>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#0D0F13] border border-white/5 rounded-lg">
                    {(["Reported", "Verified", "In Progress", "Resolved"] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedNewStatus(st)}
                        className={`text-[8px] py-1 rounded font-bold transition cursor-pointer ${
                          selectedNewStatus === st ? "bg-amber-600 text-white" : "text-white/40 hover:text-white/80"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Action Log / Official Update Message</p>
                  <textarea
                    value={officialLogText}
                    onChange={(e) => setOfficialLogText(e.target.value)}
                    placeholder="Describe inspection, truck dispatch, contractor assignment, etc..."
                    rows={1.5}
                    className="w-full bg-[#0D0F13] border border-white/10 focus:border-white/30 focus:outline-none rounded-lg text-[10px] p-2 text-white/80 transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedIssue.id)}
                  disabled={!officialLogText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition cursor-pointer uppercase tracking-wider"
                >
                  Post Official Timeline Update
                </button>
              </div>
            )}

            {/* Generated Official Complaint Letter popup */}
            {draftedLetter && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
                <div className="bg-[#0D0F13] border border-white/10 max-w-2xl w-full rounded-lg p-6 shadow-2xl flex flex-col justify-between max-h-[85vh] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-xs text-white font-bold uppercase tracking-wider">Official Complaint Letter Draft</p>
                        <p className="text-[10px] text-white/40">Auto-generated by Gemini 3.5 Coprocessor</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDraftedLetter(null)}
                      className="bg-black/40 hover:bg-white/5 border border-white/10 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer uppercase tracking-wider"
                    >
                      Close Preview
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-white text-slate-900 rounded p-6 font-serif text-xs leading-relaxed border border-slate-200 shadow-inner select-text">
                    {draftedLetter.split("\n").map((line, i) => (
                      <p key={i} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="flex gap-2.5 mt-4 pt-3 border-t border-white/10 justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(draftedLetter);
                        setCopiedLetter(true);
                        setTimeout(() => setCopiedLetter(false), 2500);
                      }}
                      className="bg-black/40 hover:bg-white/5 border border-white/10 text-white text-xs px-4 py-2 rounded font-bold cursor-pointer transition uppercase tracking-wider"
                    >
                      {copiedLetter ? "✓ Copied!" : "Copy Letter text"}
                    </button>
                    <button
                      onClick={() => {
                        // Create a clean TXT file download
                        const element = document.createElement("a");
                        const file = new Blob([draftedLetter], { type: "text/plain" });
                        element.href = URL.createObjectURL(file);
                        element.download = `Pune_Municipal_Complaint_${selectedIssue.id}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded font-bold cursor-pointer transition uppercase tracking-wider"
                    >
                      Download Letter (.txt)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
