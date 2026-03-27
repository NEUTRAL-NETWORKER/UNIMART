/**
 * UNIMART Landing.jsx v6.0
 * - Pitch black background
 * - No Marvel intro — loads directly to main content
 * - RGB glow cycling animation on title (rainbow spectrum)
 * - Social icon footer (Telegram, Mail, YouTube, Facebook, Twitter, GitLab)
 * - All cards & buttons: fully transparent, outline only
 * - Tube cursor follows mouse (click to randomize colors)
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";
import { initTubesCursor, destroyTubesCursor } from "../components/TubesCursor";

// -- UPDATE THESE HREFS WITH YOUR ACTUAL LINKS --
const SOCIAL_LINKS = [
  {
    label: "Telegram",
    href: "https://t.me/your_channel",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.376l-2.967-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.183z"/></svg>,
  },
  {
    label: "Email",
    href: "mailto:unimart@yourdomain.com",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@yourchannel",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/yourpage",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    label: "Twitter",
    href: "https://twitter.com/yourhandle",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    label: "GitLab",
    href: "https://gitlab.com/yourgroup",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/></svg>,
  },
];

const FEATURE_CARDS = [
  { icon: "🎓", title: "Verified Students Only",   desc: "Only students in the official university registry can register. Every buyer and seller is a confirmed peer." },
  { icon: "🔐", title: "OTP-Secured Deliveries",   desc: "Every delivery uses a physical OTP handshake. The buyer confirms receipt before the transaction completes." },
  { icon: "🏪", title: "Campus Marketplace",       desc: "Textbooks, electronics, lab equipment, and notes — everything you need for university life, traded on campus." },
  { icon: "🔒", title: "Trust-First Ecosystem",    desc: "A closed, invite-only marketplace. No anonymous sellers. No unverified buyers. Safety by design." },
];

// -- PORTAL BUTTON — transparent, outline + glow only --
function PortalButton({ label, icon, sublabel, color, onClick, animDelay="0s" }) {
  const [ring, setRing] = useState(false);
  return (
    <button className="lnd-portal-btn" onClick={onClick}
      onMouseEnter={() => setRing(true)} onMouseLeave={() => setRing(false)}
      style={{
        "--pc": color, "--pc-dim": `${color}22`,
        position:"relative",
        width:"clamp(140px,18vw,210px)", height:"clamp(140px,18vw,210px)",
        borderRadius:16, border:`2px solid ${color}88`,
        background:"transparent",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:7,
        animation:`lnd-portal-glow 3s ease-in-out ${animDelay} infinite, lnd-fade-up 0.6s ease ${animDelay} both`,
        backdropFilter:"blur(2px)", overflow:"visible",
      }}>
      {ring && <div style={{ position:"absolute",inset:-10,borderRadius:24, border:`2px solid ${color}44`, animation:"lnd-ring 0.85s ease-out infinite", pointerEvents:"none" }} />}
      {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
        <div key={`${v}${h}`} style={{ position:"absolute",[v]:9,[h]:9,width:15,height:15, borderTop:v==="top"?`2px solid ${color}`:"none", borderBottom:v==="bottom"?`2px solid ${color}`:"none", borderLeft:h==="left"?`2px solid ${color}`:"none", borderRight:h==="right"?`2px solid ${color}`:"none" }} />
      ))}
      <span style={{ fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:"clamp(16px,2.6vw,25px)",color:"#fff",letterSpacing:"0.1em",textShadow:`0 0 14px ${color},0 0 32px ${color}88` }}>{label}</span>
      <span style={{ fontSize:"clamp(26px,3.8vw,44px)",animation:"lnd-icon-float 2.4s ease-in-out infinite",filter:`drop-shadow(0 0 10px ${color})` }}>{icon}</span>
      <span style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:"clamp(8px,0.95vw,11px)",color:`${color}bb`,letterSpacing:"0.17em",textTransform:"uppercase" }}>{sublabel}</span>
      <div className="lnd-scanlines" style={{ position:"absolute",inset:0,borderRadius:14 }} />
    </button>
  );
}

// -- FEATURE CARD — transparent, border outline only --
function FeatureCard({ icon, title, desc, animDelay="0s" }) {
  return (
    <div className="lnd-card" style={{ flex:"1 1 0",minWidth:200, borderRadius:14,padding:"24px 20px", display:"flex",flexDirection:"column",gap:12, animation:`lnd-card-in 0.55s ease ${animDelay} both` }}>
      <div style={{ width:48,height:48, background:"transparent", border:"1px solid rgba(255,255,255,0.22)", borderRadius:12, display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>{icon}</div>
      <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:"clamp(15px,1.8vw,18px)",color:"#fff",lineHeight:1.25 }}>{title}</div>
      <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:400,fontSize:"clamp(13px,1.4vw,15px)",color:"rgba(255,255,255,0.52)",lineHeight:1.65 }}>{desc}</div>
    </div>
  );
}

// -- SOCIAL FOOTER --
function SocialFooter() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14, animation:"lnd-fade-up 0.7s ease 0.4s both" }}>
      <div className="lnd-social-row" style={{ display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center" }}>
        {SOCIAL_LINKS.map(({ label, href, icon }, i) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="lnd-social-btn" title={label}
            style={{
              width:46,height:46,borderRadius:12,
              background:"transparent",
              border:"1px solid rgba(0,212,255,0.38)",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"rgba(0,212,255,0.82)", textDecoration:"none",
              animation:`lnd-social-in 0.4s cubic-bezier(0.34,1.4,0.64,1) ${1.2+i*0.07}s both`,
            }}>{icon}</a>
        ))}
      </div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:"clamp(9px,1vw,11px)",color:"rgba(255,255,255,0.18)",letterSpacing:"0.14em",textAlign:"center" }}>
        © 2026 UNIMART. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
}

// -- TUBE CANVAS -- cursor effect
function TubeCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    // Set touch-action: none on body — matches original style.css
    const prev = document.body.style.touchAction;
    document.body.style.touchAction = "none";

    initTubesCursor(ref.current);

    return () => {
      document.body.style.touchAction = prev;
      destroyTubesCursor();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position:      "fixed",
        top:           0,
        right:         0,
        bottom:        0,
        left:          0,
        width:         "100%",
        height:        "100%",
        overflow:      "hidden",
        zIndex:        0,
        pointerEvents: "none",
        display:       "block",
        willChange:    "transform",      // GPU compositing layer
        transform:     "translateZ(0)",  // force hardware acceleration
      }}
    />
  );
}

// -- MAIN LANDING --
function MainLanding() {
  const navigate = useNavigate();
  return (
    <div className="lnd" style={{
      position:"relative",minHeight:"100vh",width:"100%",
      overflowX:"hidden",display:"flex",flexDirection:"column",
      alignItems:"center",
      paddingTop:"clamp(60px,10vh,110px)",paddingBottom:60,
      paddingLeft:"clamp(16px,4vw,48px)",paddingRight:"clamp(16px,4vw,48px)",
      opacity:1,
      pointerEvents:"auto",
      gap:"clamp(32px,5vh,56px)",zIndex:1,
    }}>

{/* SECTION 1 — UNIMART TITLE — RGB glow, static, no animation */}
<div style={{ textAlign: "center", position: "relative" }}>
  <h1
    style={{
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: 900,
      fontSize: "clamp(52px, 11vw, 140px)",
      lineHeight: 1,
      letterSpacing: "-2px",
      margin: 0,
      padding: 0,
      color: "transparent",
      backgroundImage: "linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000)",
      backgroundSize: "400% 100%",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      display: "block",
      animation: "lnd-rgb-cycle 4s linear infinite",
    }}
  >
    UNIMART
  </h1>
</div>

      {/* 2. Built for University Students */}
      <div style={{ textAlign:"center", animation:"lnd-fade-up 0.6s ease 0.1s both" }}>
        <h2 style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:"clamp(26px,4.5vw,52px)",color:"#fff",letterSpacing:"-0.5px",margin:0,lineHeight:1.15 }}>Built for University Students</h2>
      </div>

      {/* 3. Description */}
      <div style={{ textAlign:"center",maxWidth:560, animation:"lnd-fade-up 0.6s ease 0.2s both" }}>
        <p style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:400,fontSize:"clamp(14px,1.8vw,18px)",color:"rgba(255,255,255,0.52)",lineHeight:1.7,margin:0 }}>
          A closed-ecosystem marketplace where every buyer and seller is a verified student from your campus.
        </p>
      </div>

      {/* 4. Social footer links */}
      <SocialFooter />

      {/* 5. USER + ADMIN buttons — transparent */}
      <div className="lnd-buttons-row" style={{ display:"flex",gap:"clamp(18px,4vw,52px)",flexWrap:"wrap",justifyContent:"center" }}>
        <PortalButton label="USER"  icon="🎓" sublabel="Student Portal"  color="#00d4ff" animDelay="1.1s" onClick={() => navigate("/login")} />
        <PortalButton label="ADMIN" icon="🛡️" sublabel="Control Center" color="#ff2d55" animDelay="1.2s" onClick={() => navigate("/admin")} />
      </div>

      {/* 6. Feature cards — fully transparent, outline only */}
      <div className="lnd-cards-row" style={{ display:"flex",gap:"clamp(12px,2vw,20px)",width:"100%",maxWidth:1100,flexWrap:"wrap",justifyContent:"center" }}>
        {FEATURE_CARDS.map((c,i) => <FeatureCard key={c.title} icon={c.icon} title={c.title} desc={c.desc} animDelay={`${1.3+i*0.1}s`} />)}
      </div>
    </div>
  );
}

// -- ROOT --
export default function Landing() {
  return (
    <div className="lnd-cursor-hidden" style={{ minHeight: "100vh" }}>
      {/* Pitch black background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "#000000" }} />
      {/* Tube cursor canvas */}
      <TubeCanvas />
      {/* Main landing — no intro, loads directly */}
      <MainLanding />
    </div>
  );
}
