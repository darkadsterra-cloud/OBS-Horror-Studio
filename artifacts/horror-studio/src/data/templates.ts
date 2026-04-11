export interface TemplateData {
  id: string;
  name: string;
  category: string;
  font: string;
  animation: string;
  colors: string[];
  glow: boolean;
  shadowEffect: boolean;
  backgroundStyle: string;
  motionBehavior: string;
  isPreset: boolean;
}

export const PRESET_TEMPLATES: TemplateData[] = [
  // ===== GAMING (25) =====
  { id: "g1", name: "Neon Kill Feed", category: "Gaming", font: "Rajdhani", animation: "glitch", colors: ["#00fff0", "#ff00ff"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "slide-left", isPreset: true },
  { id: "g2", name: "Esports Intro", category: "Gaming", font: "Rajdhani", animation: "zoom-pulse", colors: ["#ff6600", "#ffcc00"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "g3", name: "Victory Royale", category: "Gaming", font: "Bebas Neue", animation: "neon-pulse", colors: ["#ffd700", "#ff8c00"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "g4", name: "Defeat Screen", category: "Gaming", font: "Rajdhani", animation: "flicker", colors: ["#ff0000", "#8b0000"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "g5", name: "Cyber Kill", category: "Gaming", font: "Orbitron", animation: "glitch", colors: ["#00ff41", "#00cc33"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "slide-right", isPreset: true },
  { id: "g6", name: "Pro Gamer", category: "Gaming", font: "Exo 2", animation: "zoom-pulse", colors: ["#0066ff", "#00ccff"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "g7", name: "Headshot", category: "Gaming", font: "Rajdhani", animation: "shake", colors: ["#ff3300", "#ff6600"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "shake", isPreset: true },
  { id: "g8", name: "Clutch Play", category: "Gaming", font: "Bebas Neue", animation: "fire-glow", colors: ["#ff4500", "#ff8c00", "#ffd700"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "g9", name: "GG EZ", category: "Gaming", font: "Orbitron", animation: "bounce", colors: ["#7cfc00", "#32cd32"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "g10", name: "Ultra Kill", category: "Gaming", font: "Rajdhani", animation: "glitch", colors: ["#ff0066", "#cc0044"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "spin-reveal", isPreset: true },
  { id: "g11", name: "First Blood", category: "Gaming", font: "Bebas Neue", animation: "blood-drip", colors: ["#cc0000", "#ff0000"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "drip", isPreset: true },
  { id: "g12", name: "Ranked Up", category: "Gaming", font: "Exo 2", animation: "zoom-pulse", colors: ["#9400d3", "#cc00ff"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "g13", name: "Team Wipe", category: "Gaming", font: "Rajdhani", animation: "neon-pulse", colors: ["#ff1493", "#ff69b4"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "slide-left", isPreset: true },
  { id: "g14", name: "ACE", category: "Gaming", font: "Bebas Neue", animation: "fire-glow", colors: ["#ffd700", "#ff8c00", "#ff4500"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "g15", name: "No Scope", category: "Gaming", font: "Orbitron", animation: "glitch", colors: ["#00e5ff", "#00b4d8"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "slide-right", isPreset: true },
  { id: "g16", name: "Speed Run", category: "Gaming", font: "Exo 2", animation: "zoom-pulse", colors: ["#76ff03", "#00e676"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "slide-left", isPreset: true },
  { id: "g17", name: "Rage Quit", category: "Gaming", font: "Rajdhani", animation: "shake", colors: ["#ff1744", "#d50000"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "shake", isPreset: true },
  { id: "g18", name: "Combo Breaker", category: "Gaming", font: "Bebas Neue", animation: "neon-pulse", colors: ["#7c4dff", "#651fff"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "g19", name: "Game Over", category: "Gaming", font: "Orbitron", animation: "flicker", colors: ["#ff0000", "#330000"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "g20", name: "New Record", category: "Gaming", font: "Exo 2", animation: "zoom-pulse", colors: ["#ffd600", "#ff6d00"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "g21", name: "Toxic", category: "Gaming", font: "Rajdhani", animation: "glitch", colors: ["#64dd17", "#00c853"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "slide-left", isPreset: true },
  { id: "g22", name: "MVP", category: "Gaming", font: "Bebas Neue", animation: "fire-glow", colors: ["#ffd700", "#ffab00", "#ff6d00"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "spin-reveal", isPreset: true },
  { id: "g23", name: "Carry", category: "Gaming", font: "Exo 2", animation: "neon-pulse", colors: ["#00e5ff", "#00b0ff"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "g24", name: "Lag Spike", category: "Gaming", font: "Orbitron", animation: "glitch", colors: ["#ff9100", "#ff6d00"], glow: false, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "shake", isPreset: true },
  { id: "g25", name: "PentaKill", category: "Gaming", font: "Bebas Neue", animation: "fire-glow", colors: ["#ffea00", "#ff6d00", "#e040fb"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },

  // ===== HORROR (25) =====
  { id: "h1", name: "Blood Drip", category: "Horror", font: "Creepster", animation: "blood-drip", colors: ["#cc0000", "#8b0000"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "drip", isPreset: true },
  { id: "h2", name: "Glitch Flicker", category: "Horror", font: "Creepster", animation: "glitch", colors: ["#ff0000", "#ffffff"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "glitch", isPreset: true },
  { id: "h3", name: "Haunted Glow", category: "Horror", font: "Cinzel", animation: "neon-pulse", colors: ["#8b00ff", "#4b0082"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "float", isPreset: true },
  { id: "h4", name: "Dark Fade In", category: "Horror", font: "Cinzel", animation: "cinematic-fade", colors: ["#ffffff", "#cccccc"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "h5", name: "Evil Whisper", category: "Horror", font: "Creepster", animation: "flicker", colors: ["#880000", "#440000"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "shake", isPreset: true },
  { id: "h6", name: "Demonic Text", category: "Horror", font: "UnifrakturMaguntia", animation: "glitch", colors: ["#cc0000", "#ff0000"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "glitch", isPreset: true },
  { id: "h7", name: "Ghost Light", category: "Horror", font: "Cinzel", animation: "neon-pulse", colors: ["#b0e0e6", "#add8e6"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "float", isPreset: true },
  { id: "h8", name: "Ritual", category: "Horror", font: "UnifrakturMaguntia", animation: "cinematic-fade", colors: ["#8b0000", "#4b0082"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "h9", name: "They Watch", category: "Horror", font: "Creepster", animation: "flicker", colors: ["#ff0000", "#cc0000"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "glitch", isPreset: true },
  { id: "h10", name: "Possessed", category: "Horror", font: "UnifrakturMaguntia", animation: "shake", colors: ["#8b00ff", "#cc0000"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "shake", isPreset: true },
  { id: "h11", name: "Tombstone", category: "Horror", font: "Cinzel", animation: "cinematic-fade", colors: ["#696969", "#808080"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "h12", name: "Cursed", category: "Horror", font: "Creepster", animation: "glitch", colors: ["#006400", "#004d00"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "glitch", isPreset: true },
  { id: "h13", name: "Nightmare", category: "Horror", font: "UnifrakturMaguntia", animation: "neon-pulse", colors: ["#8b00ff", "#4b0082"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "float", isPreset: true },
  { id: "h14", name: "Rot", category: "Horror", font: "Creepster", animation: "blood-drip", colors: ["#556b2f", "#8b8000"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "drip", isPreset: true },
  { id: "h15", name: "Hell Gate", category: "Horror", font: "UnifrakturMaguntia", animation: "fire-glow", colors: ["#ff4500", "#ff0000", "#8b0000"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "h16", name: "Asylum", category: "Horror", font: "Cinzel", animation: "flicker", colors: ["#f5f5dc", "#dcdcdc"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "shake", isPreset: true },
  { id: "h17", name: "Banshee", category: "Horror", font: "Creepster", animation: "shake", colors: ["#e0e0e0", "#b0b0b0"], glow: true, shadowEffect: false, backgroundStyle: "dark-gradient", motionBehavior: "shake", isPreset: true },
  { id: "h18", name: "Infernal", category: "Horror", font: "UnifrakturMaguntia", animation: "fire-glow", colors: ["#ff6600", "#cc3300", "#ff0000"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "h19", name: "Cryptic", category: "Horror", font: "Cinzel", animation: "cinematic-fade", colors: ["#6a0dad", "#8b00ff"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "fade", isPreset: true },
  { id: "h20", name: "Wither", category: "Horror", font: "Creepster", animation: "glitch", colors: ["#8b7355", "#a0522d"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "glitch", isPreset: true },
  { id: "h21", name: "Specter", category: "Horror", font: "Cinzel", animation: "neon-pulse", colors: ["#dcdcdc", "#c0c0c0"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "float", isPreset: true },
  { id: "h22", name: "Bone Rattle", category: "Horror", font: "UnifrakturMaguntia", animation: "shake", colors: ["#f5f5f5", "#d3d3d3"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "shake", isPreset: true },
  { id: "h23", name: "Voodoo", category: "Horror", font: "Creepster", animation: "glitch", colors: ["#8b008b", "#9400d3"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "glitch", isPreset: true },
  { id: "h24", name: "Zombie Walk", category: "Horror", font: "UnifrakturMaguntia", animation: "blood-drip", colors: ["#556b2f", "#8b0000"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "drip", isPreset: true },
  { id: "h25", name: "Death Toll", category: "Horror", font: "Cinzel", animation: "cinematic-fade", colors: ["#dc143c", "#8b0000"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },

  // ===== CINEMATIC (20) =====
  { id: "c1", name: "Movie Title", category: "Cinematic", font: "Cinzel", animation: "cinematic-fade", colors: ["#ffffff", "#e0e0e0"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c2", name: "Trailer Intro", category: "Cinematic", font: "Bebas Neue", animation: "zoom-pulse", colors: ["#ffffff", "#f0f0f0"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "c3", name: "Slow Reveal", category: "Cinematic", font: "Cinzel", animation: "cinematic-fade", colors: ["#d4af37", "#c5a028"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c4", name: "Epic Scene", category: "Cinematic", font: "Cinzel", animation: "zoom-pulse", colors: ["#ffffff", "#c0c0c0"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "c5", name: "Blockbuster", category: "Cinematic", font: "Bebas Neue", animation: "cinematic-fade", colors: ["#ff8c00", "#ffd700"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c6", name: "Dramatic Title", category: "Cinematic", font: "Cinzel", animation: "cinematic-fade", colors: ["#b8860b", "#daa520"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c7", name: "Award Show", category: "Cinematic", font: "Bebas Neue", animation: "zoom-pulse", colors: ["#ffd700", "#ffb700"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "c8", name: "Film Noir", category: "Cinematic", font: "Cinzel", animation: "cinematic-fade", colors: ["#ffffff", "#f5f5f5"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c9", name: "Epic Conclusion", category: "Cinematic", font: "Cinzel", animation: "zoom-pulse", colors: ["#dc143c", "#8b0000"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "c10", name: "Suspense", category: "Cinematic", font: "Cinzel", animation: "flicker", colors: ["#dcdcdc", "#c0c0c0"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "fade", isPreset: true },
  { id: "c11", name: "Directors Cut", category: "Cinematic", font: "Bebas Neue", animation: "cinematic-fade", colors: ["#b8860b", "#ffd700"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c12", name: "Credits Roll", category: "Cinematic", font: "Cinzel", animation: "fade", colors: ["#f0e68c", "#daa520"], glow: false, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "fade", isPreset: true },
  { id: "c13", name: "Opening Scene", category: "Cinematic", font: "Cinzel", animation: "cinematic-fade", colors: ["#ffffff", "#e8e8e8"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c14", name: "Plot Twist", category: "Cinematic", font: "Bebas Neue", animation: "zoom-pulse", colors: ["#ff4500", "#ff6347"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "c15", name: "Climax", category: "Cinematic", font: "Cinzel", animation: "neon-pulse", colors: ["#ffd700", "#ff8c00", "#ff4500"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "c16", name: "Noir Detective", category: "Cinematic", font: "Cinzel", animation: "cinematic-fade", colors: ["#f5f5f5", "#dcdcdc"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c17", name: "Sci-Fi Reveal", category: "Cinematic", font: "Orbitron", animation: "zoom-pulse", colors: ["#00e5ff", "#00b0ff"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "c18", name: "Fantasy Scroll", category: "Cinematic", font: "Cinzel", animation: "cinematic-fade", colors: ["#daa520", "#b8860b"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "fade", isPreset: true },
  { id: "c19", name: "War Drama", category: "Cinematic", font: "Bebas Neue", animation: "cinematic-fade", colors: ["#8b4513", "#a0522d"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "c20", name: "Thriller", category: "Cinematic", font: "Cinzel", animation: "flicker", colors: ["#dc143c", "#b22222"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },

  // ===== STREAMING ALERTS (15) =====
  { id: "s1", name: "Starting Soon", category: "Streaming", font: "Exo 2", animation: "neon-pulse", colors: ["#00ff87", "#00cc6a"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "s2", name: "Be Right Back", category: "Streaming", font: "Exo 2", animation: "fade", colors: ["#4fc3f7", "#29b6f6"], glow: true, shadowEffect: false, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "s3", name: "Stream Ending", category: "Streaming", font: "Bebas Neue", animation: "cinematic-fade", colors: ["#ef5350", "#e53935"], glow: false, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "fade", isPreset: true },
  { id: "s4", name: "New Subscriber", category: "Streaming", font: "Exo 2", animation: "bounce", colors: ["#e040fb", "#ce93d8"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "s5", name: "Follow Alert", category: "Streaming", font: "Exo 2", animation: "zoom-pulse", colors: ["#ff4081", "#f50057"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "s6", name: "Donation Alert", category: "Streaming", font: "Bebas Neue", animation: "fire-glow", colors: ["#ffd700", "#ffa500", "#ff6347"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "s7", name: "Hosting Alert", category: "Streaming", font: "Exo 2", animation: "neon-pulse", colors: ["#4caf50", "#66bb6a"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "slide-right", isPreset: true },
  { id: "s8", name: "Raid Alert", category: "Streaming", font: "Bebas Neue", animation: "shake", colors: ["#7c4dff", "#651fff"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "shake", isPreset: true },
  { id: "s9", name: "Clip It", category: "Streaming", font: "Exo 2", animation: "zoom-pulse", colors: ["#00bcd4", "#0097a7"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "s10", name: "Goal Reached", category: "Streaming", font: "Bebas Neue", animation: "fire-glow", colors: ["#ffd700", "#ff8c00"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "s11", name: "Welcome Back", category: "Streaming", font: "Exo 2", animation: "bounce", colors: ["#81c784", "#4caf50"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "s12", name: "Hype Train", category: "Streaming", font: "Bebas Neue", animation: "fire-glow", colors: ["#ff6d00", "#ff9100", "#ffd600"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "s13", name: "Channel Point", category: "Streaming", font: "Exo 2", animation: "neon-pulse", colors: ["#9c27b0", "#ba68c8"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "spin-reveal", isPreset: true },
  { id: "s14", name: "Gifted Sub", category: "Streaming", font: "Bebas Neue", animation: "zoom-pulse", colors: ["#e040fb", "#aa00ff", "#ea80fc"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "scale-up", isPreset: true },
  { id: "s15", name: "Super Chat", category: "Streaming", font: "Exo 2", animation: "bounce", colors: ["#ffd600", "#ffab00"], glow: true, shadowEffect: true, backgroundStyle: "dark-gradient", motionBehavior: "bounce", isPreset: true },

  // ===== SOCIAL MEDIA (15) =====
  { id: "m1", name: "TikTok Bold", category: "Social", font: "Bebas Neue", animation: "bounce", colors: ["#ff0050", "#ffffff"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "m2", name: "Meme Classic", category: "Social", font: "Impact", animation: "zoom-pulse", colors: ["#ffffff", "#000000"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "m3", name: "Viral Pop", category: "Social", font: "Bebas Neue", animation: "bounce", colors: ["#ff6b35", "#f7931e"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "m4", name: "Trending", category: "Social", font: "Exo 2", animation: "neon-pulse", colors: ["#ff4757", "#ff6b81"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "m5", name: "Reacts", category: "Social", font: "Bebas Neue", animation: "bounce", colors: ["#feca57", "#ff9f43"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "m6", name: "POV:", category: "Social", font: "Exo 2", animation: "zoom-pulse", colors: ["#ff6b6b", "#ee5a24"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "m7", name: "Wait For It", category: "Social", font: "Bebas Neue", animation: "flicker", colors: ["#a29bfe", "#6c5ce7"], glow: true, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "fade", isPreset: true },
  { id: "m8", name: "Plot Twist!", category: "Social", font: "Exo 2", animation: "shake", colors: ["#fd79a8", "#e84393"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "shake", isPreset: true },
  { id: "m9", name: "Bestie", category: "Social", font: "Bebas Neue", animation: "bounce", colors: ["#fdcb6e", "#e17055"], glow: false, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "m10", name: "No Cap", category: "Social", font: "Impact", animation: "zoom-pulse", colors: ["#00b894", "#00cec9"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
  { id: "m11", name: "Slay", category: "Social", font: "Bebas Neue", animation: "neon-pulse", colors: ["#e84393", "#fd79a8"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "m12", name: "GRWM", category: "Social", font: "Exo 2", animation: "fade", colors: ["#f8a5c2", "#f78fb3"], glow: false, shadowEffect: false, backgroundStyle: "transparent", motionBehavior: "fade", isPreset: true },
  { id: "m13", name: "Day In Life", category: "Social", font: "Exo 2", animation: "cinematic-fade", colors: ["#74b9ff", "#0984e3"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "fade", isPreset: true },
  { id: "m14", name: "Spill Tea", category: "Social", font: "Bebas Neue", animation: "bounce", colors: ["#fdcb6e", "#e17055"], glow: false, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "bounce", isPreset: true },
  { id: "m15", name: "Fire Take", category: "Social", font: "Impact", animation: "fire-glow", colors: ["#ff4500", "#ff8c00", "#ffd700"], glow: true, shadowEffect: true, backgroundStyle: "transparent", motionBehavior: "scale-up", isPreset: true },
];

export const TEMPLATE_CATEGORIES = ["Gaming", "Horror", "Cinematic", "Streaming", "Social"];
