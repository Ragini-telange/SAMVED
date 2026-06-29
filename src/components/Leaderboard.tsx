import React, { useState } from "react";
import { Trophy, Award, Star, ShieldAlert, Sparkles, User, ShieldCheck, Heart } from "lucide-react";

interface LeaderboardProps {
  userName: string;
  userEmail: string;
  userPoints: number;
}

export default function Leaderboard({ userName, userEmail, userPoints }: LeaderboardProps) {
  const [claimedReward, setClaimedReward] = useState<string | null>(null);

  const citizenLeaderboard = [
    { name: userName, email: userEmail, points: 2560 + userPoints, badge: "Gold Hero", rank: 1, avatar: "👩‍💼" },
    { name: "Amit Joshi", email: "amit.joshi@gmail.com", points: 2110, badge: "Gold Hero", rank: 2, avatar: "👨‍💻" },
    { name: "Suresh Patil", email: "suresh.p@yahoo.com", points: 1850, badge: "Silver Guardian", rank: 3, avatar: "👴" },
    { name: "Ketan Mehta", email: "ketan@gmail.com", points: 1420, badge: "Silver Guardian", rank: 4, avatar: "👦" },
    { name: "Sunita G.", email: "sunita.g@outlook.com", points: 940, badge: "Bronze Citizen", rank: 5, avatar: "👩" }
  ];

  const badgesList = [
    { title: "Civic Watchdog", desc: "Report 3 active community issues with high AI authenticity scores.", points: "150 PTS", unlocked: userPoints >= 50 },
    { title: "Monsoon Vanguard", desc: "Report a high-severity flood/collapse vulnerability before storm peaks.", points: "300 PTS", unlocked: false },
    { title: "Public Endorser", desc: "Upvote and verify 10 genuine community reports in your ward.", points: "100 PTS", unlocked: true },
    { title: "Community Hero", desc: "Reach over 2,500 total points and get officially recognized by the Municipal Commissioner.", points: "GOLD BADGE", unlocked: true }
  ];

  const handleClaimReward = (reward: string) => {
    setClaimedReward(reward);
    setTimeout(() => {
      setClaimedReward(null);
    }, 4000);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* User Profile Card */}
      <div className="bg-[#0D0F13] border border-white/10 rounded p-5 flex flex-col justify-between shadow-lg shadow-black/20">
        <div>
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest mb-3 block flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-400" /> YOUR COMMUNITY ID</span>
          
          <div className="flex items-center gap-3 bg-[#0A0B0E] border border-white/10 p-4 rounded mt-2 relative overflow-hidden">
            {/* Ambient visual badge */}
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-blue-500/10 rounded-full blur-md" />
            <div className="text-3xl">👩‍💼</div>
            <div>
              <p className="text-xs font-bold text-white/90 uppercase tracking-wider">{userName}</p>
              <p className="text-[9px] text-white/40 font-mono">{userEmail}</p>
              <span className="inline-block bg-blue-500/15 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase mt-1.5 tracking-widest">
                ★ Gold Hero (Top 5%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-[#0A0B0E]/50 border border-white/5 p-3 rounded">
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Impact Score</span>
              <p className="text-lg font-bold text-blue-400 font-sans mt-0.5">{2560 + userPoints} <span className="text-[9px] text-white/30">PTS</span></p>
            </div>
            <div className="bg-[#0A0B0E]/50 border border-white/5 p-3 rounded">
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Global Rank</span>
              <p className="text-lg font-bold text-amber-400 font-sans mt-0.5">#1 <span className="text-[9px] text-white/30">WARD</span></p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <button
            onClick={() => handleClaimReward("Municipal Commissioner E-Certificate of Merit")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded transition flex items-center justify-center gap-1.5 cursor-pointer text-[10px] uppercase tracking-widest"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Claim Civic Reward
          </button>
          
          {claimedReward && (
            <div className="mt-2 text-center text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 py-1.5 rounded font-bold animate-pulse uppercase tracking-wider">
              ✓ {claimedReward} successfully mailed! Check your registered inbox.
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#0D0F13] border border-white/10 rounded p-5 flex flex-col justify-between shadow-lg shadow-black/20">
        <div>
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest mb-3 block flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-blue-400" /> WARD LEADERBOARD</span>

          <div className="space-y-2 mt-2">
            {citizenLeaderboard.map((citizen, idx) => {
              const isCurrentUser = citizen.email === userEmail;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded border text-xs transition ${
                    isCurrentUser 
                      ? "bg-blue-950/20 border-blue-500/30" 
                      : "bg-[#0A0B0E]/40 border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-[10px] w-4 text-white/30">#{citizen.rank}</span>
                    <span className="text-sm shrink-0">{citizen.avatar}</span>
                    <div className="min-w-0">
                      <p className={`font-semibold truncate uppercase tracking-wider ${isCurrentUser ? "text-blue-300" : "text-white/80"}`}>{citizen.name}</p>
                      <p className="text-[8px] text-white/30 truncate uppercase tracking-widest">{citizen.badge}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-white/90 shrink-0 ml-2">{citizen.points} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Rankings updated daily at 00:00 UTC</span>
      </div>

      {/* Badges Collection */}
      <div className="bg-[#0D0F13] border border-white/10 rounded p-5 flex flex-col justify-between shadow-lg shadow-black/20">
        <div>
          <span className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest mb-3 block flex items-center gap-1"><Award className="w-3.5 h-3.5 text-blue-400" /> BADGES & REWARDS ENGINE</span>

          <div className="space-y-2.5 mt-2">
            {badgesList.map((badge, idx) => {
              return (
                <div key={idx} className="flex gap-2.5 items-start bg-[#0A0B0E]/40 border border-white/5 p-2 rounded">
                  <div className={`flex items-center justify-center w-7 h-7 rounded shrink-0 border ${
                    badge.unlocked 
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                      : "bg-[#0A0B0E] border-white/10 text-white/20"
                  }`}>
                    {badge.title === "Community Hero" ? <Star className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold text-white/80 truncate uppercase tracking-wider">{badge.title}</p>
                      <span className="text-[8px] font-mono font-extrabold text-blue-400 shrink-0">{badge.points}</span>
                    </div>
                    <p className="text-[9px] text-white/40 line-clamp-1 mt-0.5 uppercase tracking-wide">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold flex items-center gap-1 mt-3"><Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" /> Active civic engagement builds better, safer wards.</span>
      </div>
    </div>
  );
}
