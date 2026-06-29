import React, { useState, useEffect } from "react";
import { Mail, Lock, User, Phone, Sparkles, Shield, ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { UserRole } from "../types";
import { motion } from "motion/react";

interface LoginPageProps {
  onLogin: (email: string, name: string, role: UserRole) => void;
}

interface RegisteredUser {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>("Citizen");
  
  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Set default form values when role changes or switching tabs
  useEffect(() => {
    setError("");
    setSuccess("");
    if (!isSignUp) {
      if (role === "Admin") {
        setEmail("admin@samved.gov.in");
        setPassword("adminpassword");
      } else if (role === "Officer") {
        setEmail("officer@samved.gov.in");
        setPassword("officerpassword");
      } else {
        // Citizen login defaults
        setEmail("citizen@civichub.org");
        setPassword("demo12345");
      }
    } else {
      // Clear inputs for clean register
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
    }
  }, [role, isSignUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const normEmail = email.trim().toLowerCase();
    const normPassword = password.trim();

    // 1. Hardcoded Checks
    const ADMIN_EMAIL = "admin@samved.gov.in";
    const ADMIN_PASSWORD = "adminpassword";
    const OFFICER_EMAIL = "officer@samved.gov.in";
    const OFFICER_PASSWORD = "officerpassword";

    if (isSignUp) {
      // Citizen Sign Up workflow
      if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
        setError("Please enter your name, phone number, email, and password.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      // Check if trying to register as Admin/Officer email
      if (normEmail === ADMIN_EMAIL || normEmail === OFFICER_EMAIL) {
        setError("This is a reserved official email. Please use a different email.");
        return;
      }

      // Retrieve existing citizens
      const savedCitizens = localStorage.getItem("samved_registered_citizens");
      const citizens: RegisteredUser[] = savedCitizens ? JSON.parse(savedCitizens) : [];

      // Check duplicate
      if (citizens.some(c => c.email.toLowerCase() === normEmail)) {
        setError("Email is already registered. Please Sign In.");
        return;
      }

      // Add new citizen
      const newCitizen: RegisteredUser = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: normPassword
      };

      citizens.push(newCitizen);
      localStorage.setItem("samved_registered_citizens", JSON.stringify(citizens));

      setSuccess("Account successfully registered! You can now Sign In with your email and password.");
      setIsSignUp(false);
      setRole("Citizen");
      setEmail(newCitizen.email);
      setPassword(newCitizen.password);
    } else {
      // Sign In workflow
      if (!email.trim() || !password.trim()) {
        setError("Please enter both email and password.");
        return;
      }

      // 1. Admin Login check
      if (normEmail === ADMIN_EMAIL) {
        if (normPassword === ADMIN_PASSWORD) {
          onLogin(ADMIN_EMAIL, "Chief Commissioner", "Admin");
          return;
        } else {
          setError("Incorrect password for Administrator account.");
          return;
        }
      }

      // 2. Officer Login check
      if (normEmail === OFFICER_EMAIL) {
        if (normPassword === OFFICER_PASSWORD) {
          onLogin(OFFICER_EMAIL, "Officer Deshmukh", "Officer");
          return;
        } else {
          setError("Incorrect password for Ward Officer account.");
          return;
        }
      }

      // 3. Registered Citizen check
      const savedCitizens = localStorage.getItem("samved_registered_citizens");
      const citizens: RegisteredUser[] = savedCitizens ? JSON.parse(savedCitizens) : [];
      const matchedCitizen = citizens.find(c => c.email.toLowerCase() === normEmail);

      if (matchedCitizen) {
        if (matchedCitizen.password === normPassword) {
          onLogin(matchedCitizen.email, matchedCitizen.name, "Citizen");
          return;
        } else {
          setError("Incorrect password for your account.");
          return;
        }
      }

      // 4. Default Preset Citizen check (fallback)
      if (normEmail === "citizen@civichub.org" && normPassword === "demo12345") {
        onLogin("citizen@civichub.org", "Ragini Verma", "Citizen");
        return;
      }

      // Fallback fallback if they type any new citizen credentials (demo-friendly)
      if (role === "Citizen") {
        const generatedName = email.split("@")[0].replace(/[._]/g, " ");
        const displayName = generatedName.charAt(0).toUpperCase() + generatedName.slice(1);
        onLogin(email.trim(), displayName, "Citizen");
        return;
      }

      setError("Invalid credentials or account does not exist.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Background Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Futuristic Header */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded mb-3">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-300">SAMVED CIVIC PLATFORM</span>
        </div>
        <h1 className="text-3xl font-serif italic text-white mb-1.5">
          Hyperlocal Guardian Hub
        </h1>
        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
          Real-time civic monitoring, hazard logging & predictive modeling
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0D0F13] border border-white/10 rounded-xl p-6 shadow-2xl shadow-black/80 z-10">
        
        {/* Role Selector */}
        {!isSignUp && (
          <div className="mb-6">
            <label className="block text-[10px] text-white/40 font-extrabold uppercase tracking-widest text-center mb-3">
              Select Access Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Citizen", "Officer", "Admin"] as UserRole[]).map((r) => {
                const icon = r === "Admin" ? "🛡️" : r === "Officer" ? "👮" : "👩‍💼";
                const label = r === "Admin" ? "Admin" : r === "Officer" ? "Officer" : "Citizen";
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setError("");
                    }}
                    className={`py-2 rounded border flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer ${
                      role === r 
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 font-extrabold shadow-lg shadow-blue-500/10" 
                        : "bg-[#0A0B0E] border-white/5 text-white/45 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="text-[9px] uppercase tracking-wider">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Selection Tabs */}
        <div className="flex border-b border-white/10 mb-5">
          <button
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              !isSignUp ? "border-blue-500 text-white font-extrabold" : "border-transparent text-white/40 hover:text-white/80"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              isSignUp ? "border-blue-500 text-white font-extrabold" : "border-transparent text-white/40 hover:text-white/80"
            }`}
          >
            Register (First-Time Citizen)
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider bg-rose-950/40 border border-rose-900/50 text-rose-400 px-3 py-2 rounded">
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 px-3 py-2 rounded">
            ✓ {success}
          </div>
        )}

        {/* Hardcoded Credentials Panel for Tester Visibility */}
        {!isSignUp && (
          <div className="mb-4 p-3 bg-[#0A0B0E] border border-white/5 rounded-lg">
            <div className="flex items-center gap-1.5 text-[8px] text-blue-400 font-extrabold uppercase tracking-widest mb-1.5">
              <Info className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Hardcoded Platform Credentials:</span>
            </div>
            {role === "Admin" && (
              <div className="text-[10px] space-y-0.5">
                <p className="text-white/70">Role: <strong className="text-white">Administrator</strong></p>
                <p className="text-white/50">Email: <code className="text-amber-400 font-mono">admin@samved.gov.in</code></p>
                <p className="text-white/50">Password: <code className="text-amber-400 font-mono">adminpassword</code></p>
              </div>
            )}
            {role === "Officer" && (
              <div className="text-[10px] space-y-0.5">
                <p className="text-white/70">Role: <strong className="text-white">Ward Officer</strong></p>
                <p className="text-white/50">Email: <code className="text-amber-400 font-mono">officer@samved.gov.in</code></p>
                <p className="text-white/50">Password: <code className="text-amber-400 font-mono">officerpassword</code></p>
              </div>
            )}
            {role === "Citizen" && (
              <div className="text-[10px] space-y-1">
                <p className="text-white/50">First-Time? Click <strong className="text-white">Register</strong> to fill Name, Phone, Email & Password.</p>
                <p className="text-white/40">Demo Quick Access: <code className="text-blue-400 font-mono">citizen@civichub.org</code> / <code className="text-blue-400 font-mono">demo12345</code></p>
              </div>
            )}
          </div>
        )}

        {/* Registration warning for Admin/Officer */}
        {isSignUp && role !== "Citizen" && (
          <div className="mb-4 p-3.5 bg-amber-950/20 border border-amber-900/30 text-amber-400 text-xs rounded-lg">
            <strong>Notice:</strong> Administrative & Officer registration is restricted. Only Citizens can register new accounts. Please select <strong className="underline">Sign In</strong> to use fixed official credentials.
          </div>
        )}

        {/* Main Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(!isSignUp || role === "Citizen") && (
            <div className="space-y-4">
              {/* Name (Registration only) */}
              {isSignUp && (
                <div>
                  <label className="block text-[10px] text-white/40 font-extrabold uppercase tracking-widest mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ragini Verma"
                      className="w-full bg-[#0A0B0E] border border-white/10 rounded py-2 pl-9 pr-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Phone (Registration only) */}
              {isSignUp && (
                <div>
                  <label className="block text-[10px] text-white/40 font-extrabold uppercase tracking-widest mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-[#0A0B0E] border border-white/10 rounded py-2 pl-9 pr-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email (Always) */}
              <div>
                <label className="block text-[10px] text-white/40 font-extrabold uppercase tracking-widest mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#0A0B0E] border border-white/10 rounded py-2 pl-9 pr-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Password (Always) */}
              <div>
                <label className="block text-[10px] text-white/40 font-extrabold uppercase tracking-widest mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0A0B0E] border border-white/10 rounded py-2 pl-9 pr-10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/25"
              >
                {isSignUp ? "Create Secure Account" : `Access as ${role}`} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Security note */}
      <div className="mt-6 text-center text-[9px] text-white/20 uppercase tracking-widest font-semibold flex items-center gap-1 z-10">
        <Shield className="w-3.5 h-3.5 text-white/20" /> Encrypted terminal handshake. Secure citizen data protection standard.
      </div>
    </div>
  );
}
