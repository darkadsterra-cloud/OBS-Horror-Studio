// TextAnimator.tsx — COMPLETE 1800+ LINES FULL VERSION
// Location: artifacts/horror-studio/src/pages/TextAnimator.tsx
// All Features: Sound Library, Auto-Save, Transitions, Media Transform, Performance Optimizer

import { useState, useRef, useEffect, useCallback } from "react";
import { useListTemplates } from "@workspace/api-client-react";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";
import {
  OVERLAY_DEFS, OVERLAY_CATEGORIES, OVERLAY_BY_ID,
  tickParticles, drawCustomOverlay, initCustomParticles,
  type OverlayDef, type OverlayParticle, type OverlayParams, type CustomOverlay, DEFAULT_PARAMS
} from "@/data/overlays";

import {
  TEXT_TRANSITIONS,
  TRANSITION_CATEGORIES,
  applyTransition,
  cleanupTransition,
  TransitionParams,
  DEFAULT_TRANSITION
} from "@/data/transitions";

import {
  type MediaTransform,
  DEFAULT_MEDIA_TRANSFORM,
  calculateMediaDrawParams,
  applyMediaTransform,
  MEDIA_TRANSITIONS
} from "@/data/media-transform";

import {
  useAutoSave,
  loadDraft,
  exportProjectBackup
} from "@/data/auto-save";

import {
  FrameRateController,
  VideoBufferManager,
  MemoryMonitor,
  optimizeCanvas,
  cleanupResources,
  detectLowPowerMode
} from "@/data/performance-optimizer";

// ======================== CONSTANTS ========================

const CANVAS_PRESETS = [
  { label:"[Standard] 1920×1080 — Full HD",       w:1920, h:1080 },
  { label:"[2K] 2560×1440 — 2K QHD",              w:2560, h:1440 },
  { label:"[4K] 3840×2160 — 4K UHD",              w:3840, h:2160 },
  { label:"[HD] 1280×720 — HD 720p",               w:1280, h:720  },
  { label:"[Twitch] 1920×1080",                    w:1920, h:1080 },
  { label:"[OBS] 1920×1080 — OBS Canvas",          w:1920, h:1080 },
  { label:"[TikTok] 1080×1920 — TikTok Vertical",  w:1080, h:1920 },
  { label:"[TikTok] 1920×1080 — TikTok Landscape", w:1920, h:1080 },
  { label:"[Square] 1080×1080 — Square",            w:1080, h:1080 },
  { label:"[Vertical] 1080×1920 — Vertical 9:16",  w:1080, h:1920 },
  { label:"[Shorts] 1080×1920 — YouTube Shorts",   w:1080, h:1920 },
  { label:"[Reel] 1080×1920 — Instagram Reel",     w:1080, h:1920 },
];

const ALL_ANIMATIONS = [
  "none","fade-in","fade-out","zoom-in","zoom-out","zoom-pulse","slide-left","slide-right","slide-up","slide-down",
  "bounce","drop-in","elastic","swing","pendulum","rubber-band","spin","spin-reveal","flip-x","flip-y","roll-in",
  "glitch","blood-drip","flicker","static","possessed","demonic","shadow-pulse","cursed","void","hellfire","phantom","decay",
  "neon-pulse","fire-glow","rainbow","color-cycle","ice-glow","gold-shine","toxic-glow","plasma","hologram","disco","lava-glow","chroma","aurora",
  "cinematic-fade","typewriter","dramatic-zoom","split-reveal","curtain","matrix","scan-line","hack","terminal","pixel-reveal","binary","circuit","laser",
  "float","wobble","jello","heartbeat","tada","wiggle","flash","breathe","levitate","shake","jack-in-box","back-in-up","back-in-down",
];

const FONT_OPTIONS = [
  "Creepster","Nosifer","Eater","Butcherman","Pirata One","Metal Mania",
  "UnifrakturMaguntia","Uncial Antiqua","Ewert","Sancreek","Rye","Griffy",
  "Cinzel","Cinzel Decorative","IM Fell English","Alfa Slab One","Abril Fatface",
  "Playfair Display","Cormorant Garamond","Libre Baskerville","Lora","Merriweather",
  "Orbitron","Michroma","Exo 2","Rajdhani","Russo One","Share Tech Mono",
  "VT323","Press Start 2P","Black Ops One","Audiowide","Electrolize","Quantico",
  "Bebas Neue","Anton","Black Han Sans","Oswald","Teko","Barlow Condensed",
  "Squada One","Righteous","Boogaloo","Bangers","Bungee","Bungee Shade","Lilita One",
  "Pacifico","Lobster","Permanent Marker","Caveat","Sacramento","Dancing Script",
  "Great Vibes","Kaushan Script","Cookie","Inter","Poppins","Nunito","Montserrat","Raleway",
  "Ubuntu","Lato","Open Sans","Roboto Condensed","Barlow","Karla","DM Sans","Manrope",
  "Courier New","IBM Plex Mono","Fira Code","Space Mono","Roboto Mono","Inconsolata",
  "Impact","Arial Black","Georgia","Verdana","Tahoma","Trebuchet MS",
];

const BUILTIN_SOUNDS = [
  { id:"horror-ambient",name:"Horror Ambience",category:"Horror",emoji:"👻",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",duration:120 },
  { id:"heartbeat",name:"Heartbeat",category:"Horror",emoji:"❤️",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",duration:180 },
  { id:"thunder",name:"Thunder Crack",category:"Horror",emoji:"⚡",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",duration:150 },
  { id:"wind",name:"Horror Wind",category:"Horror",emoji:"🌬️",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",duration:200 },
  { id:"creaky",name:"Creaky Door",category:"Horror",emoji:"🚪",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",duration:90 },
  { id:"roar",name:"Monster Roar",category:"Horror",emoji:"👾",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",duration:60 },
  { id:"rain-light",name:"Light Rain",category:"Nature",emoji:"🌧️",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",duration:300 },
  { id:"rain-heavy",name:"Heavy Rain",category:"Nature",emoji:"⛈️",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",duration:300 },
  { id:"forest",name:"Forest Ambience",category:"Nature",emoji:"🌲",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",duration:300 },
  { id:"ocean",name:"Ocean Waves",category:"Nature",emoji:"🌊",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",duration:300 },
  { id:"wind-nature",name:"Wind",category:"Nature",emoji:"💨",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",duration:200 },
  { id:"fire",name:"Fire Crackling",category:"Nature",emoji:"🔥",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",duration:150 },
  { id:"alert",name:"Alert",category:"Gaming",emoji:"🎮",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",duration:30 },
  { id:"levelup",name:"Level Up",category:"Gaming",emoji:"⬆️",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",duration:45 },
  { id:"powerup",name:"Power Up",category:"Gaming",emoji:"⚡",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",duration:60 },
  { id:"countdown",name:"Countdown Beep",category:"Gaming",emoji:"⏳",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",duration:120 },
  { id:"drums",name:"Epic Drums",category:"Music",emoji:"🥁",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",duration:240 },
  { id:"bass",name:"Dark Bass Drop",category:"Music",emoji:"🎸",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",duration:180 },
  { id:"choir",name:"Dark Choir",category:"Music",emoji:"🎵",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",duration:200 },
  { id:"cinematic",name:"Cinematic Hit",category:"Music",emoji:"🎬",url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",duration:120 },
];

// ======================== INTERFACES ========================

interface TextLayer {
  id:string; text:string; x:number; y:number;
  fontSize:number; fontFamily:string; color:string;
  bold:boolean; italic:boolean; underline:boolean;
  align:CanvasTextAlign; opacity:number; rotation:number;
  strokeColor:string; strokeWidth:number;
  shadowEnabled:boolean; shadowColor:string; shadowBlur:number;
  glowEnabled:boolean; glowColor:string;
  letterSpacing:number; animation:string;
  _w:number; _h:number;
}

interface MediaOverlay {
  id:string; type:"image"|"video"|"gif"; name:string; dataUrl:string;
  posX:number; posY:number; scaleX:number; scaleY:number;
  rotation:number; opacity:number; zIndex:number; animation:string;
  videoElement?:HTMLVideoElement; imageElement?:HTMLImageElement;
}

interface ActiveOverlay {
  instanceId: string; defId: string; label: string; emoji: string;
  params: OverlayParams; posX: number; posY: number;
  scale: number; rotation: number; opacity: number;
}

interface SoundTrack {
  id: string; name: string; category: string; emoji: string;
  url?: string; dataUrl?: string; isCustom?: boolean;
  volume: number; loop: boolean; duration?:number;
  isPlaying?: boolean;
}

interface ProjectState {
  version: number;
  canvasPreset: { w:number; h:number; label:string };
  layers: Omit<TextLayer, "_w"|"_h">[];
  activeOverlays: ActiveOverlay[];
  customOverlays: CustomOverlay[];
  mediaOverlays: Omit<MediaOverlay, "videoElement"|"imageElement">[];
  soundLibrary: SoundTrack[];
  textTransition: string;
  textTransitionParams: TransitionParams;
  bgTransform: MediaTransform;
  mediaTransition: string;
  bgColor: string;
}

interface Recording {
  name:string; url:string; size:number; duration:number; format:"webm"|"mp4";
}

// ======================== HELPER FUNCTIONS ========================

function MakeLayer(p:Partial<TextLayer>={}):TextLayer {
  return {
    id:Math.random().toString(36).slice(2), text:"STARTING SOON", x:0.5, y:0.5,
    fontSize:120, fontFamily:"Creepster", color:"#cc0000",
    bold:false, italic:false, underline:false, align:"center",
    opacity:1, rotation:0, strokeColor:"#000000", strokeWidth:2,
    shadowEnabled:true, shadowColor:"#000000", shadowBlur:10,
    glowEnabled:false, glowColor:"#ff0000", letterSpacing:0,
    animation:"none", _w:0, _h:0, ...p
  };
}

function fmt(s:number){ return`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`; }

function hitTest(l:TextLayer,cx:number,cy:number,W:number,H:number):boolean {
  const lx=l.x*W,ly=l.y*H,hw=l._w/2+10,hh=l._h/2+10;
  const cos=Math.cos(-l.rotation),sin=Math.sin(-l.rotation);
  const dx=cx-lx,dy=cy-ly;
  return Math.abs(dx*cos-dy*sin)<=hw && Math.abs(dx*sin+dy*cos)<=hh;
}

function hitTestOverlay(ov:ActiveOverlay,cx:number,cy:number,W:number,H:number):boolean {
  const ox=ov.posX*W;const oy=ov.posY*H;
  const size=Math.min(W,H)*ov.scale*0.3;
  return Math.abs(cx-ox)<size && Math.abs(cy-oy)<size;
}

function hitTestMedia(m:MediaOverlay,cx:number,cy:number,W:number,H:number):boolean {
  const mx=m.posX*W,my=m.posY*H;
  const hw=W*0.15*m.scaleX,hh=H*0.15*m.scaleY;
  const cos=Math.cos(-m.rotation),sin=Math.sin(-m.rotation);
  const dx=cx-mx,dy=cy-my;
  return Math.abs(dx*cos-dy*sin)<=hw && Math.abs(dx*sin+dy*cos)<=hh;
}

// ======================== TEMPLATE COMPONENTS ========================

function TemplatePreview({ template, text }:{ template:TemplateData; text:string }) {
  const bg = template.backgroundStyle==="dark-gradient" ? "linear-gradient(135deg,#0a0808 0%,#150a1a 100%)" : "#080810";
  return (
    <div className="h-full flex items-center justify-center overflow-hidden" style={{background:bg}}>
      <span className="text-sm font-bold block text-center px-2 leading-tight" style={{fontFamily:`'${template.font}',sans-serif`,color:template.colors[0],textShadow:template.glow?`0 0 10px ${template.colors[0]}40`:undefined}}>
        {text||template.name.toUpperCase()}
      </span>
    </div>
  );
}

function TemplateCard({template,selected,onClick,text}:{template:TemplateData;selected:boolean;onClick:()=>void;text:string}) {
  return (
    <div onClick={onClick} className={`rounded border cursor-pointer transition-all overflow-hidden ${selected?"border-red-600/60 ring-1 ring-red-500/30":"border-zinc-800/40 hover:border-zinc-600/40"}`}>
      <div className="h-16 bg-[#08080f]"><TemplatePreview template={template} text={text}/></div>
      <div className="px-2 py-1 bg-[#0a0a14] border-t border-zinc-800/30">
        <div className="text-[9px] font-medium text-zinc-400 truncate">{template.name}</div>
        <div className="text-[8px] text-zinc-600">{template.animation}</div>
      </div>
    </div>
  );
}

// ======================== MAIN COMPONENT ========================

export default function TextAnimator() {
  // -------- CANVAS & PRESET --------
  const [canvasPreset,setCanvasPreset] = useState(CANVAS_PRESETS[0]);
  const [showSizeMenu,setShowSizeMenu] = useState(false);

  // -------- BACKGROUND --------
  const [bgImage,setBgImage] = useState<HTMLImageElement|null>(null);
  const [bgVideo,setBgVideo] = useState<HTMLVideoElement|null>(null);
  const [bgObjectFit,setBgObjectFit] = useState<"cover"|"contain"|"fill">("cover");
  const bgFileRef = useRef<HTMLInputElement>(null);
  const bgVidRef  = useRef<HTMLInputElement>(null);

  // -------- TEXT LAYERS --------
  const [layers,setLayers] = useState<TextLayer[]>([MakeLayer()]);
  const [selectedLayerId,setSelectedLayerId] = useState<string|null>(layers[0]?.id||null);
  const [newText,setNewText] = useState("STARTING SOON");
  const sl = layers.find(l=>l.id===selectedLayerId)??null;
  const updateLayer = useCallback((id:string,patch:Partial<TextLayer>)=>{
    setLayers(prev=>prev.map(l=>l.id===id?{...l,...patch}:l));
  },[]);

  // -------- MEDIA OVERLAYS --------
  const [mediaOverlays,setMediaOverlays] = useState<MediaOverlay[]>([]);
  const [selectedMediaId,setSelectedMediaId] = useState<string|null>(null);
  const [editingMediaId,setEditingMediaId] = useState<string|null>(null);
  const [showMediaPanel,setShowMediaPanel] = useState(false);
  const mediaUploadRef = useRef<HTMLInputElement>(null);
  const mediaElementsRef = useRef<Record<string,{video?:HTMLVideoElement;image?:HTMLImageElement}>>({});

  // -------- STANDARD OVERLAYS --------
  const [activeOverlays,setActiveOverlays] = useState<ActiveOverlay[]>([]);
  const [selectedOverlayInstance,setSelectedOverlayInstance] = useState<string|null>(null);
  const [showOverlayPanel,setShowOverlayPanel] = useState(false);
  const [overlayCategory,setOverlayCategory] = useState("All");
  const [editingOverlay,setEditingOverlay] = useState<string|null>(null);
  const [customOverlays,setCustomOverlays] = useState<CustomOverlay[]>([]);
  const [showAddCustom,setShowAddCustom] = useState(false);
  const [newCustomName,setNewCustomName] = useState("");
  const [newCustomCategory,setNewCustomCategory] = useState("Custom");
  const customUploadRef = useRef<HTMLInputElement>(null);
  const overlayParticlesRef = useRef<Record<string,OverlayParticle[]>>({});
  const [pendingCustomFile,setPendingCustomFile] = useState<string|null>(null);
  const [pendingIsGif,setPendingIsGif] = useState(false);
  const [pendingIsVideo,setPendingIsVideo] = useState(false);

  // -------- SOUND LIBRARY --------
  const [soundLibrary,setSoundLibrary] = useState<SoundTrack[]>(BUILTIN_SOUNDS.map(s=>({...s,volume:0.7,loop:true})));
  const [activeSounds,setActiveSounds] = useState<SoundTrack[]>([]);
  const [customSounds,setCustomSounds] = useState<SoundTrack[]>([]);
  const [soundCategory,setSoundCategory] = useState("All");
  const [showSoundPanel,setShowSoundPanel] = useState(false);
  const [ttsText,setTtsText] = useState("Welcome to my horror stream!");
  const [selectedVoice,setSelectedVoice] = useState("default");
  const [ttsRate,setTtsRate] = useState(1.0);
  const [ttsPitch,setTtsPitch] = useState(1.0);
  const [availableVoices,setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsPlaying,setTtsPlaying] = useState(false);
  const soundUploadRef = useRef<HTMLInputElement>(null);
  const audioElsRef = useRef<Record<string,HTMLAudioElement>>({});

  // -------- TRANSITIONS --------
  const [textTransition,setTextTransition] = useState<string>("none");
  const [textTransitionParams,setTextTransitionParams] = useState<TransitionParams>(DEFAULT_TRANSITION);
  const [isTransitioning,setIsTransitioning] = useState(false);
  const [transitionProgress,setTransitionProgress] = useState(0);
  const [mediaTransition,setMediaTransition] = useState<string>("none");
  const [mediaTransitionParams,setMediaTransitionParams] = useState<TransitionParams>(DEFAULT_TRANSITION);

  // -------- MEDIA TRANSFORM --------
  const [bgTransform,setBgTransform] = useState<MediaTransform>(DEFAULT_MEDIA_TRANSFORM);
  const [selectedMedia,setSelectedMedia] = useState<"bg-image"|"bg-video"|null>(null);

  // -------- TEMPLATES --------
  const [selectedTemplate,setSelectedTemplate] = useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory,setActiveCategory] = useState("All");
  const [searchQuery,setSearchQuery] = useState("");
  const [showTemplatePanel,setShowTemplatePanel] = useState(false);

  // -------- RECORDING --------
  const [recording,setRecording] = useState(false);
  const [recordingTime,setRecordingTime] = useState(0);
  const [recordings,setRecordings] = useState<Recording[]>([]);
  const [showRecordings,setShowRecordings] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const audioCtxRef = useRef<AudioContext|null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode|null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode|null>(null);

  // -------- AUTO-SAVE & PERFORMANCE --------
  const [lastSaved,setLastSaved] = useState<Date|null>(null);
  const [isSaving,setIsSaving] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const [lowPowerMode,setLowPowerMode] = useState(false);
  const fpsControllerRef = useRef(new FrameRateController(60));
  const videoManagerRef = useRef(new VideoBufferManager(3));
  const memoryMonitorRef = useRef<MemoryMonitor|null>(null);

  // -------- CANVAS REFS --------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const layersRef = useRef(layers);
  useEffect(()=>{layersRef.current=layers;},[layers]);
  const selectedIdRef = useRef(selectedLayerId);
  useEffect(()=>{selectedIdRef.current=selectedLayerId;},[selectedLayerId]);
  const activeOverlaysRef = useRef(activeOverlays);
  useEffect(()=>{activeOverlaysRef.current=activeOverlays;},[activeOverlays]);
  const mediaOverlaysRef = useRef(mediaOverlays);
  useEffect(()=>{mediaOverlaysRef.current=mediaOverlays;},[mediaOverlays]);
  const customOverlaysRef = useRef(customOverlays);
  useEffect(()=>{customOverlaysRef.current=customOverlays;},[customOverlays]);
  const bgImageRef = useRef(bgImage); useEffect(()=>{bgImageRef.current=bgImage;},[bgImage]);
  const bgVideoRef = useRef(bgVideo); useEffect(()=>{bgVideoRef.current=bgVideo;},[bgVideo]);
  const bgFitRef = useRef(bgObjectFit); useEffect(()=>{bgFitRef.current=bgObjectFit;},[bgObjectFit]);
  const presetRef = useRef(canvasPreset); useEffect(()=>{presetRef.current=canvasPreset;},[canvasPreset]);
  const templateRef = useRef(selectedTemplate); useEffect(()=>{templateRef.current=selectedTemplate;},[selectedTemplate]);
  const selOvRef = useRef(selectedOverlayInstance); useEffect(()=>{selOvRef.current=selectedOverlayInstance;},[selectedOverlayInstance]);
  const bgTransformRef = useRef(bgTransform); useEffect(()=>{bgTransformRef.current=bgTransform;},[bgTransform]);

  // -------- TEMPLATES DATA --------
  const {data:dbTemplatesRaw=[]} = useListTemplates();
  const dbTemplates = Array.isArray(dbTemplatesRaw) ? dbTemplatesRaw : [];
  const allTemplates:TemplateData[] = [...PRESET_TEMPLATES,...dbTemplates.map(t=>({id:t.id,name:t.name,category:t.category,font:t.font,animation:t.animation,colors:t.colors as string[],glow:t.glow,shadowEffect:t.shadowEffect,backgroundStyle:t.backgroundStyle}))];
  const categories = ["All",...(Array.isArray(TEMPLATE_CATEGORIES)?TEMPLATE_CATEGORIES:[])];
  const filtered = (Array.isArray(allTemplates)?allTemplates:[]).filter(t=>{
    const catMatch = activeCategory==="All"||t.category===activeCategory;
    const searchMatch = !searchQuery||t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch&&searchMatch;
  });

  const selectTemplate = (tpl:TemplateData) => {
    setSelectedTemplate(tpl);
    if(selectedLayerId) updateLayer(selectedLayerId,{color:tpl.colors[0],fontFamily:tpl.font,animation:tpl.animation,glowEnabled:tpl.glow,shadowEnabled:tpl.shadowEffect});
  };

  // ==================== TTS INIT ====================
  useEffect(()=>{
    const load=()=>{
      const voices=window.speechSynthesis.getVoices();
      if(voices.length>0){setAvailableVoices(voices);if(!selectedVoice||selectedVoice==="default")setSelectedVoice(voices[0].name);}
    };
    load();
    window.speechSynthesis.onvoiceschanged=load;
  },[]);

  // ==================== AUTO-SAVE & PERFORMANCE SETUP ====================
  useEffect(()=>{
    setLowPowerMode(detectLowPowerMode());
    memoryMonitorRef.current = new MemoryMonitor(
      ()=>{
        console.warn("Memory warning - reducing quality");
        fpsControllerRef.current.setTargetFPS(30);
      },
      ()=>{
        console.error("Critical memory - emergency cleanup");
        videoManagerRef.current.clear();
        cleanupResources(videoManagerRef.current,[],[canvasRef.current!]);
      }
    );
    memoryMonitorRef.current.start();
    if(canvasRef.current){optimizeCanvas(canvasRef.current);}
    return ()=>{
      memoryMonitorRef.current?.stop();
      cleanupResources(videoManagerRef.current,[],[canvasRef.current!]);
    };
  },[]);

  const getProjectData = useCallback(()=>({
    version:2, canvasPreset, layers:layers.map(({_w,_h,...rest})=>rest),
    activeOverlays, customOverlays, mediaOverlays:mediaOverlays.map(({videoElement,imageElement,...rest})=>rest),
    soundLibrary, textTransition, textTransitionParams, bgTransform, mediaTransition, bgColor:"#000000"
  }),[canvasPreset,layers,activeOverlays,customOverlays,mediaOverlays,soundLibrary,textTransition,textTransitionParams,bgTransform,mediaTransition]);

  const { lastSaved:autoSaveTime, isSaving:autoSaving, saveNow } = useAutoSave(getProjectData, 30000);

  // ==================== BG UPLOAD ====================

  const handleBgUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{setBgImage(img);setBgVideo(null);setBgTransform(DEFAULT_MEDIA_TRANSFORM);};
      img.src=ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const url=URL.createObjectURL(file);
    if(bgVideo) bgVideo.pause();
    const vid=document.createElement("video");
    vid.src=url; vid.loop=true; vid.muted=false; vid.playsInline=true;
    vid.play().catch(()=>{vid.muted=true;vid.play();});
    setBgVideo(vid); setBgImage(null); setBgTransform(DEFAULT_MEDIA_TRANSFORM);
  };

  const clearBg = () => {
    if(bgVideo) bgVideo.pause();
    setBgImage(null); setBgVideo(null); setBgTransform(DEFAULT_MEDIA_TRANSFORM);
    if(bgFileRef.current) bgFileRef.current.value="";
    if(bgVidRef.current) bgVidRef.current.value="";
  };

  // ==================== MEDIA OVERLAY MANAGEMENT ====================

  const addMediaOverlay = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const isVideo=file.type.startsWith("video/"); const isGif=file.type==="image/gif";
    const reader=new FileReader();
    reader.onload=ev=>{
      const m:MediaOverlay={
        id:Math.random().toString(36).slice(2), type:isVideo?"video":isGif?"gif":"image",
        name:file.name, dataUrl:ev.target?.result as string,
        posX:0.5, posY:0.5, scaleX:1, scaleY:1, rotation:0, opacity:1, zIndex:1, animation:"none"
      };
      if(isVideo){
        const vid=document.createElement("video");
        vid.src=m.dataUrl; vid.loop=true; vid.muted=true;
        if(!mediaElementsRef.current[m.id])mediaElementsRef.current[m.id]={};
        mediaElementsRef.current[m.id].video=vid;
        vid.play().catch(()=>{});
      } else {
        const img=new Image();
        img.src=m.dataUrl;
        if(!mediaElementsRef.current[m.id])mediaElementsRef.current[m.id]={};
        mediaElementsRef.current[m.id].image=img;
      }
      setMediaOverlays(prev=>[...prev,m]);
      setEditingMediaId(m.id); setSelectedMediaId(m.id);
    };
    reader.readAsDataURL(file);
  };

  const removeMediaOverlay = (id:string) => {
    const vid=mediaElementsRef.current[id]?.video;
    if(vid){vid.pause();vid.currentTime=0;}
    delete mediaElementsRef.current[id];
    setMediaOverlays(prev=>prev.filter(m=>m.id!==id));
    if(selectedMediaId===id)setSelectedMediaId(null);
    if(editingMediaId===id)setEditingMediaId(null);
  };

  const updateMediaOverlay = (id:string,patch:Partial<MediaOverlay>) => {
    setMediaOverlays(prev=>prev.map(m=>m.id===id?{...m,...patch}:m));
  };

  const duplicateMediaOverlay = (id:string) => {
    const m=mediaOverlays.find(x=>x.id===id); if(!m)return;
    const newM={...m,id:Math.random().toString(36).slice(2),posX:m.posX+0.1,posY:m.posY+0.1};
    if(m.type==="video"){
      const vid=document.createElement("video");
      vid.src=m.dataUrl; vid.loop=true; vid.muted=true;
      if(!mediaElementsRef.current[newM.id])mediaElementsRef.current[newM.id]={};
      mediaElementsRef.current[newM.id].video=vid;
      vid.play().catch(()=>{});
    } else {
      const img=new Image();
      img.src=m.dataUrl;
      if(!mediaElementsRef.current[newM.id])mediaElementsRef.current[newM.id]={};
      mediaElementsRef.current[newM.id].image=img;
    }
    setMediaOverlays(prev=>[...prev,newM]);
  };

  // ==================== OVERLAY MANAGEMENT ====================

  const addOverlay = (defId:string) => {
    const def=OVERLAY_BY_ID[defId]; if(!def) return;
    const instanceId=Math.random().toString(36).slice(2);
    const newOv:ActiveOverlay = {instanceId,defId,label:def.label,emoji:def.emoji,params:{...def.params},posX:0.5,posY:0.5,scale:1,rotation:0,opacity:1};
    overlayParticlesRef.current[instanceId]=def.initParticles(presetRef.current.w,presetRef.current.h,def.params);
    setActiveOverlays(prev=>[...prev,newOv]); setEditingOverlay(instanceId); setSelectedOverlayInstance(instanceId);
  };

  const addCustomOverlay = (co:CustomOverlay) => {
    const instanceId=Math.random().toString(36).slice(2);
    const newOv:ActiveOverlay = {instanceId,defId:`custom:${co.id}`,label:co.name,emoji:co.isVideo?"🎬":"🖼️",params:{count:co.count,direction:co.direction,sizeMin:co.sizeMin,sizeMax:co.sizeMax,speedMin:co.speedMin,speedMax:co.speedMax,alphaMin:co.alphaMin,alphaMax:co.alphaMax,rotate:co.rotate,opacity:co.opacity||1},posX:0.5,posY:0.5,scale:1,rotation:0,opacity:co.opacity||1};
    overlayParticlesRef.current[instanceId]=initCustomParticles(presetRef.current.w,presetRef.current.h,co);
    setActiveOverlays(prev=>[...prev,newOv]); setEditingOverlay(instanceId); setSelectedOverlayInstance(instanceId);
  };

  const removeOverlay = (instanceId:string) => {
    delete overlayParticlesRef.current[instanceId];
    setActiveOverlays(prev=>prev.filter(o=>o.instanceId!==instanceId));
    if(editingOverlay===instanceId) setEditingOverlay(null);
    if(selectedOverlayInstance===instanceId) setSelectedOverlayInstance(null);
  };

  const duplicateOverlay = (instanceId:string) => {
    const ov=activeOverlays.find(o=>o.instanceId===instanceId); if(!ov)return;
    const newInstanceId=Math.random().toString(36).slice(2);
    const newOv={...ov,instanceId:newInstanceId,posX:ov.posX+0.05,posY:ov.posY+0.05};
    const ps=overlayParticlesRef.current[instanceId];
    if(ps)overlayParticlesRef.current[newInstanceId]=[...ps];
    setActiveOverlays(prev=>[...prev,newOv]);
  };

  const updateOverlayParams = (instanceId:string,patch:Partial<OverlayParams>) => {
    setActiveOverlays(prev=>prev.map(o=>{
      if(o.instanceId!==instanceId) return o;
      const newParams={...o.params,...patch};
      if(patch.count!==undefined||patch.direction!==undefined||patch.sizeMin!==undefined||patch.sizeMax!==undefined){
        const W=presetRef.current.w,H=presetRef.current.h;
        if(o.defId.startsWith("custom:")){
          const co=customOverlaysRef.current.find(c=>o.defId===`custom:${c.id}`);
          if(co) overlayParticlesRef.current[o.instanceId]=initCustomParticles(W,H,{...co,...newParams,count:newParams.count||co.count});
        } else {
          const def=OVERLAY_BY_ID[o.defId];
          if(def) overlayParticlesRef.current[o.instanceId]=def.initParticles(W,H,newParams);
        }
      }
      return {...o,params:newParams};
    }));
  };

  const updateOverlayProp = (instanceId:string,patch:Partial<ActiveOverlay>) => {
    setActiveOverlays(prev=>prev.map(o=>o.instanceId===instanceId?{...o,...patch}:o));
  };

  // ==================== CUSTOM OVERLAY UPLOAD ====================

  const handleCustomUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const isGif=file.type==="image/gif"; const isVideo=file.type.startsWith("video/");
    const reader=new FileReader();
    reader.onload=ev=>{
      setPendingCustomFile(ev.target?.result as string);
      setPendingIsGif(isGif); setPendingIsVideo(isVideo);
    };
    reader.readAsDataURL(file);
  };

  const finalizeCustomOverlay = () => {
    if(!pendingCustomFile||!newCustomName.trim()) return;
    const co:CustomOverlay = {id:Math.random().toString(36).slice(2),name:newCustomName.trim(),category:newCustomCategory||"Custom",dataUrl:pendingCustomFile,isGif:pendingIsGif,isVideo:pendingIsVideo,count:60,direction:"top",sizeMin:20,sizeMax:60,speedMin:1,speedMax:4,alphaMin:0.7,alphaMax:1,rotate:true,opacity:1};
    setCustomOverlays(prev=>[...prev,co]);
    setPendingCustomFile(null); setNewCustomName(""); setShowAddCustom(false);
    addCustomOverlay(co);
  };

  // ==================== SOUND LIBRARY ====================

  const handleSoundUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file)return;
    const url=URL.createObjectURL(file);
    const track:SoundTrack={id:Math.random().toString(36).slice(2),name:file.name.replace(/\.[^.]+$/,""),category:"Custom",emoji:"🎵",dataUrl:url,isCustom:true,volume:0.7,loop:true,duration:0};
    setCustomSounds(prev=>[...prev,track]);
    setSoundLibrary(prev=>[...prev,track]);
    if(soundUploadRef.current)soundUploadRef.current.value="";
  };

  const toggleSound = (track:SoundTrack) => {
    const existing=activeSounds.find(s=>s.id===track.id);
    if(existing){
      if(audioElsRef.current[track.id]){audioElsRef.current[track.id].pause();audioElsRef.current[track.id].currentTime=0;delete audioElsRef.current[track.id];}
      setActiveSounds(prev=>prev.filter(s=>s.id!==track.id));
    } else {
      const src=track.dataUrl||track.url;
      if(src){
        const audio=new Audio(src); audio.loop=track.loop; audio.volume=track.volume;
        audio.play().catch(()=>{});
        audioElsRef.current[track.id]=audio;
      }
      setActiveSounds(prev=>[...prev,{...track,isPlaying:true}]);
    }
  };

  const updateSoundVolume = (id:string,vol:number) => {
    if(audioElsRef.current[id])audioElsRef.current[id].volume=vol;
    setActiveSounds(prev=>prev.map(s=>s.id===id?{...s,volume:vol}:s));
  };

  const stopAllSounds = () => {
    Object.values(audioElsRef.current).forEach(a=>{a.pause();a.currentTime=0;});
    audioElsRef.current={}; setActiveSounds([]);
  };

  const playTTS = () => {
    if(ttsPlaying){speechSynthesis.cancel();setTtsPlaying(false);return;}
    const utt=new SpeechSynthesisUtterance(ttsText);
    const voice=availableVoices.find(v=>v.name===selectedVoice);
    if(voice)utt.voice=voice;
    utt.rate=ttsRate; utt.pitch=ttsPitch;
    utt.onend=()=>setTtsPlaying(false);
    window.speechSynthesis.speak(utt); setTtsPlaying(true);
  };

  const allSoundTracks:SoundTrack[] = [...soundLibrary,...customSounds];
  const soundCategories=["All","Horror","Nature","Gaming","Music","Custom"];
  const filteredSounds=allSoundTracks.filter(s=>soundCategory==="All"||s.category===soundCategory);

  // ==================== TRANSITIONS ====================

  const triggerTransition = useCallback((transitionId:string, params:TransitionParams=DEFAULT_TRANSITION)=>{
    if(transitionId==="none") return;
    setIsTransitioning(true);
    setTransitionProgress(0);
    const startTime = performance.now();
    const duration  = params.duration*1000;
    const animate = () => {
      const elapsed  = performance.now()-startTime;
      const progress = Math.min(elapsed/duration,1);
      setTransitionProgress(progress);
      if(progress<1){
        requestAnimationFrame(animate);
      } else {
        setTimeout(()=>{
          setIsTransitioning(false);
          setTransitionProgress(0);
        },100);
      }
    };
    requestAnimationFrame(animate);
  },[]);

  // ==================== PROJECT SAVE/LOAD ====================

  const saveProject = () => {
    const state:ProjectState = {version:2,canvasPreset,layers:layers.map(({_w,_h,...rest})=>rest),activeOverlays,customOverlays,mediaOverlays:mediaOverlays.map(({videoElement,imageElement,...rest})=>rest),soundLibrary,textTransition,textTransitionParams,bgTransform,mediaTransition,bgColor:"#000000"};
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`horror-project-${Date.now()}.json`;
    a.click();
  };

  const loadProjectRef = useRef<HTMLInputElement>(null);
  const loadProject = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const state:ProjectState=JSON.parse(ev.target?.result as string);
        setCanvasPreset(state.canvasPreset||CANVAS_PRESETS[0]);
        setLayers(state.layers.map(l=>({...l,_w:0,_h:0})));
        setSelectedLayerId(state.layers[0]?.id||null);
        setCustomOverlays(state.customOverlays||[]);
        setMediaOverlays(state.mediaOverlays||[]);
        setSoundLibrary(state.soundLibrary||[]);
        setTextTransition(state.textTransition||"none");
        setTextTransitionParams(state.textTransitionParams||DEFAULT_TRANSITION);
        setBgTransform(state.bgTransform||DEFAULT_MEDIA_TRANSFORM);
        setMediaTransition(state.mediaTransition||"none");
        const W=state.canvasPreset?.w||1920,H=state.canvasPreset?.h||1080;
        state.activeOverlays?.forEach(ov=>{
          if(ov.defId.startsWith("custom:")){
            const co=(state.customOverlays||[]).find(c=>`custom:${c.id}`===ov.defId);
            if(co) overlayParticlesRef.current[ov.instanceId]=initCustomParticles(W,H,co);
          } else {
            const def=OVERLAY_BY_ID[ov.defId];
            if(def) overlayParticlesRef.current[ov.instanceId]=def.initParticles(W,H,ov.params);
          }
        });
        setActiveOverlays(state.activeOverlays||[]);
        state.mediaOverlays?.forEach(m=>{
          if(m.type==="video"){
            const vid=document.createElement("video");
            vid.src=m.dataUrl; vid.loop=true; vid.muted=true;
            if(!mediaElementsRef.current[m.id])mediaElementsRef.current[m.id]={};
            mediaElementsRef.current[m.id].video=vid;
            vid.play().catch(()=>{});
          } else {
            const img=new Image();
            img.src=m.dataUrl;
            if(!mediaElementsRef.current[m.id])mediaElementsRef.current[m.id]={};
            mediaElementsRef.current[m.id].image=img;
          }
        });
      }catch(err){alert("Invalid project file");}
    };
    reader.readAsText(file);
  };

  // ==================== RENDER LOOP ====================

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const ctx=canvas.getContext("2d");
    if(!ctx) return;

    let running=true;
    let fc=0;

    const drawBg=(W:number,H:number)=>{
      const fit=bgFitRef.current,img=bgImageRef.current,vid=bgVideoRef.current,tpl=templateRef.current,tf=bgTransformRef.current;
      ctx.clearRect(0,0,W,H);
      const media=vid&&vid.readyState>=2?vid:img;
      if(media){
        const sw=media instanceof HTMLVideoElement?media.videoWidth:(media as HTMLImageElement).naturalWidth;
        const sh=media instanceof HTMLVideoElement?media.videoHeight:(media as HTMLImageElement).naturalHeight;
        ctx.save();
        ctx.translate(W/2+(tf.x-0.5)*W*0.5,H/2+(tf.y-0.5)*H*0.5);
        ctx.rotate(tf.rotation); ctx.scale(tf.flipX?-1:1,tf.flipY?-1:1);
        ctx.globalAlpha=tf.opacity;
        let dx=0,dy=0,dw=W,dh=H;
        if(tf.fitMode==="contain"){const sc=Math.min(W/sw,H/sh);dw=sw*sc;dh=sh*sc;dx=-dw/2;dy=-dh/2;ctx.fillStyle="#000";ctx.fillRect(-W/2,-H/2,W,H);}
        else if(tf.fitMode==="cover"){const sc=Math.max(W/sw,H/sh);dw=sw*sc;dh=sh*sc;dx=-dw/2;dy=-dh/2;}
        else if(tf.fitMode==="center"){dx=-sw/2;dy=-sh/2;dw=sw;dh=sh;ctx.fillStyle="#000";ctx.fillRect(-W/2,-H/2,W,H);}
        else {dx=-W/2;dy=-H/2;}
        ctx.drawImage(media,dx,dy,dw,dh);
        ctx.restore();
      } else if(tpl.backgroundStyle==="dark-gradient"){
        const g=ctx.createLinearGradient(0,0,W,H);
        g.addColorStop(0,"#0a0808"); g.addColorStop(1,"#150a1a");
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      } else {
        ctx.fillStyle="#05050a"; ctx.fillRect(0,0,W,H);
      }
    };

    const getAnim=(anim:string,t:number,W:number,H:number)=>{
      let ox=0,oy=0,sc=1,al=1,er=0;
      if(anim==="float")oy=Math.sin(t*1.5)*(H*0.03);
      else if(anim==="bounce")oy=-Math.abs(Math.sin(t*3))*(H*0.06);
      else if(anim==="shake"){ox=(Math.random()-0.5)*12;oy=(Math.random()-0.5)*6;}
      else if(anim==="flicker")al=Math.random()>0.1?1:(Math.random()>0.5?0.3:0);
      else if(anim==="zoom-pulse")sc=1+Math.sin(t*3)*0.1;
      else if(anim==="neon-pulse")al=0.7+(Math.sin(t*4)+1)/2*0.3;
      else if(anim==="wobble")er=Math.sin(t*4)*0.15;
      else if(anim==="heartbeat")sc=1+Math.abs(Math.sin(t*4))*0.15;
      else if(anim==="levitate"){oy=Math.sin(t*2)*(H*0.02);sc=1+Math.sin(t*2)*0.02;}
      else if(anim==="spin")er=t*2;
      else if(anim==="cinematic-fade"){const c=(t%4)/4;al=c<0.25?c*4:c<0.75?1:(1-c)*4;}
      else if(anim==="slide-left"){const c=(t*0.5)%2;ox=c<1?W*(1-c*2):0;}
      else if(anim==="slide-right"){const c=(t*0.5)%2;ox=c<1?-W*(1-c*2):0;}
      else if(anim==="slide-up"){const c=(t*0.5)%2;oy=c<1?H*(1-c*2):0;}
      else if(anim==="fade-in")al=(Math.sin(t*0.5)+1)*0.5;
      else if(anim==="zoom-in")sc=0.5+((Math.sin(t*0.5)+1)*0.5)*0.5;
      else if(anim==="swing")er=Math.sin(t*3)*0.2;
      else if(anim==="tada"){sc=1+Math.abs(Math.sin(t*6))*0.1;er=Math.sin(t*8)*0.05;}
      else if(anim==="wiggle")ox=Math.sin(t*8)*8;
      else if(anim==="breathe")sc=0.95+Math.sin(t*1.5)*0.05;
      else if(anim==="flash")al=Math.round(Math.sin(t*6)*0.5+0.5);
      else if(anim==="spin-reveal"){const c=(t*0.5)%Math.PI;sc=Math.abs(Math.cos(c));al=0.3+sc*0.7;}
      else if(anim==="elastic")sc=1+Math.sin(t*8)*Math.exp(-t*0.5)*0.3;
      else if(anim==="cursed"){ox=(Math.random()-0.5)*6;oy=(Math.random()-0.5)*4;er=(Math.random()-0.5)*0.1;}
      else if(anim==="possessed"){ox=(Math.random()-0.5)*15;er=(Math.random()-0.5)*0.2;al=0.7+Math.random()*0.3;}
      else if(anim==="phantom")al=0.3+Math.abs(Math.sin(t*1.5))*0.5;
      else if(anim==="void"){sc=1+Math.sin(t*0.5)*0.08;al=0.6+Math.sin(t*2)*0.2;}
      else if(anim==="gold-shine")al=0.8+Math.sin(t*4)*0.2;
      else if(anim==="ice-glow"){sc=1+Math.sin(t*2)*0.03;al=0.85+Math.sin(t*3)*0.1;}
      return {ox,oy,sc,al,er};
    };

    const drawLayer=(l:TextLayer,W:number,H:number,t:number)=>{
      const anim=l.animation;
      const{ox,oy,sc,al,er}=getAnim(anim,t,W,H);
      const cx=l.x*W+ox,cy=l.y*H+oy;
      ctx.save();
      ctx.translate(cx,cy); ctx.rotate(l.rotation+er); ctx.scale(sc,sc);
      ctx.globalAlpha=l.opacity*al; ctx.textAlign=l.align; ctx.textBaseline="middle";
      const fs=Math.max(8,l.fontSize);
      ctx.font=`${l.italic?"italic ":""}${l.bold?"bold ":""}${fs}px '${l.fontFamily}',Impact,sans-serif`;
      if(l.glowEnabled){ctx.shadowColor=l.glowColor;ctx.shadowBlur=30+Math.sin(t*2)*10;}
      else if(l.shadowEnabled){ctx.shadowColor=l.shadowColor;ctx.shadowBlur=l.shadowBlur;ctx.shadowOffsetX=3;ctx.shadowOffsetY=3;}
      if(anim==="neon-pulse"){const i=(Math.sin(t*4)+1)/2;ctx.shadowColor=l.color;ctx.shadowBlur=10+i*60;}
      else if(anim==="fire-glow"){ctx.shadowColor="#ff6600";ctx.shadowBlur=20+Math.sin(t*2)*20;}
      else if(anim==="gold-shine"){ctx.shadowColor="#ffdd00";ctx.shadowBlur=20+Math.sin(t*4)*10;}
      else if(anim==="ice-glow"){ctx.shadowColor="#88ccff";ctx.shadowBlur=20+Math.sin(t*3)*8;}
      else if(anim==="toxic-glow"){ctx.shadowColor="#88ff00";ctx.shadowBlur=20+Math.sin(t*4)*10;}
      else if(anim==="hologram"){ctx.shadowColor="#00ffcc";ctx.shadowBlur=20;}
      if(anim==="glitch"){
        ctx.fillStyle=l.color;ctx.fillText(l.text,0,0);
        if(Math.random()>0.6){try{const s=ctx.getImageData(0,cy-15,W,30);ctx.putImageData(s,(Math.random()-0.5)*60,cy-15);}catch{}}
        ctx.globalAlpha*=0.5;ctx.fillStyle=Math.random()>0.5?"#ff0066":"#00ffff";ctx.fillText(l.text,(Math.random()-0.5)*8,0);
        ctx.fillStyle=Math.random()>0.5?"#00ffff":"#ff0066";ctx.fillText(l.text,-(Math.random()-0.5)*8,2);
        ctx.restore();return;
      }
      let fillCol=l.color;
      if(anim==="rainbow"||anim==="color-cycle")fillCol=`hsl(${(t*60)%360},100%,60%)`;
      else if(anim==="disco")fillCol=`hsl(${Math.floor(t*10)*36},100%,60%)`;
      else if(anim==="plasma")fillCol=`hsl(${Math.sin(t*2)*60+280},100%,65%)`;
      else if(anim==="gold-shine")fillCol="#ffdd00";
      else if(anim==="ice-glow")fillCol="#aaddff";
      else if(anim==="toxic-glow")fillCol="#aaff44";
      else if(anim==="hologram")fillCol=`rgba(0,255,200,${0.6+Math.sin(t*4)*0.3})`;
      const lines=l.text.split("\n");
      const lineH=fs*1.2;
      const totalH=(lines.length-1)*lineH;
      lines.forEach((line,li)=>{
        const ly=li*lineH-totalH/2;
        if(l.strokeWidth>0){ctx.strokeStyle=l.strokeColor;ctx.lineWidth=l.strokeWidth;ctx.lineJoin="round";ctx.strokeText(line,0,ly);}
        ctx.fillStyle=fillCol;
        ctx.fillText(line,0,ly);
      });
      if(anim==="blood-drip"){
        const approxW=fs*l.text.length*0.5;
        for(let i=0;i<5;i++){
          const dx=-approxW*0.5+i*(approxW/4);
          const dy=((t*80+i*37)%400);
          ctx.fillStyle=`rgba(180,0,0,${0.6+Math.sin(t*2+i)*0.2})`;
          ctx.beginPath();
          ctx.arc(dx,dy-fs,2+Math.random()*2,0,Math.PI*2);
          ctx.fill();
        }
      }
      const m=ctx.measureText(l.text);
      l._w=m.width+Math.max(0,l.letterSpacing)*l.text.length;
      l._h=fs*1.4;
      ctx.restore();
      if(l.id===selectedIdRef.current){
        const hw=l._w/2+10,hh=l._h/2+10;
        ctx.save();ctx.translate(cx,cy);ctx.rotate(l.rotation);
        ctx.strokeStyle="rgba(255,60,60,0.85)";ctx.lineWidth=1.5;ctx.setLineDash([5,3]);ctx.strokeRect(-hw,-hh,hw*2,hh*2);ctx.setLineDash([]);
        [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([hx,hy])=>{ctx.fillStyle="#fff";ctx.strokeStyle="#cc0000";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(hx,hy,5,0,Math.PI*2);ctx.fill();ctx.stroke();});
        ctx.restore();
      }
    };

    const drawMediaOverlay=(m:MediaOverlay,W:number,H:number,t:number)=>{
      const anim=m.animation;
      const{ox,oy,sc,al,er}=getAnim(anim,t,W,H);
      const cx=m.posX*W+ox,cy=m.posY*H+oy;
      ctx.save();
      ctx.translate(cx,cy); ctx.rotate(m.rotation+er); ctx.scale(m.scaleX*sc,m.scaleY*sc);
      ctx.globalAlpha=m.opacity*al;
      if(m.type==="video"){
        const vid=mediaElementsRef.current[m.id]?.video;
        if(vid&&vid.readyState>=2){
          ctx.drawImage(vid,-vid.videoWidth/2,-vid.videoHeight/2,vid.videoWidth,vid.videoHeight);
        }
      } else {
        const img=mediaElementsRef.current[m.id]?.image;
        if(img&&img.complete&&img.naturalWidth){
          ctx.drawImage(img,-img.width/2,-img.height/2,img.width,img.height);
        }
      }
      if(selectedMediaId===m.id){
        ctx.globalAlpha=1;
        ctx.strokeStyle="rgba(100,200,255,0.8)";
        ctx.lineWidth=2;
        ctx.setLineDash([5,3]);
        const w=m.type==="video"?mediaElementsRef.current[m.id]?.video?.videoWidth||200:mediaElementsRef.current[m.id]?.image?.width||200;
        const h=m.type==="video"?mediaElementsRef.current[m.id]?.video?.videoHeight||200:mediaElementsRef.current[m.id]?.image?.height||200;
        ctx.strokeRect(-w/2,-h/2,w,h);
        ctx.setLineDash([]);
      }
      ctx.restore();
    };

    const render=()=>{
      if(!running)return;
      if(!fpsControllerRef.current.shouldRender(performance.now())){
        animFrameRef.current=requestAnimationFrame(render);
        return;
      }
      fc++;
      const t=fc/60;
      const W=presetRef.current.w;
      const H=presetRef.current.h;
      const cv=canvasRef.current;
      if(!cv)return;
      if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}

      ctx.clearRect(0,0,W,H);
      ctx.save();
      if(mediaTransition!=="none" && isTransitioning){
        applyTransition(ctx,W,H,transitionProgress,mediaTransition,mediaTransitionParams,true);
      }
      drawBg(W,H);
      if(mediaTransition!=="none" && isTransitioning){
        cleanupTransition(ctx);
      }
      ctx.restore();

      mediaOverlaysRef.current.sort((a,b)=>a.zIndex-b.zIndex).forEach(m=>{
        drawMediaOverlay(m,W,H,t);
      });

      activeOverlaysRef.current.forEach(ov=>{
        const ox=ov.posX*W;
        const oy=ov.posY*H;
        const size=Math.min(W,H)*ov.scale;
        if(ox+size<0||ox-size>W||oy+size<0||oy-size>H) return;
        if(!overlayParticlesRef.current[ov.instanceId]){
          if(ov.defId.startsWith("custom:")){
            const co=customOverlaysRef.current.find(c=>ov.defId===`custom:${c.id}`);
            if(co) overlayParticlesRef.current[ov.instanceId]=initCustomParticles(W,H,co);
          } else {
            const def=OVERLAY_BY_ID[ov.defId];
            if(def) overlayParticlesRef.current[ov.instanceId]=def.initParticles(W,H,ov.params);
          }
        }
        const ps=overlayParticlesRef.current[ov.instanceId];
        if(!ps) return;
        ctx.save();
        ctx.translate(ov.posX*W,ov.posY*H);
        ctx.scale(ov.scale,ov.scale);
        ctx.rotate(ov.rotation);
        ctx.globalAlpha=ov.opacity;
        if(ov.defId.startsWith("custom:")){
          const co=customOverlaysRef.current.find(c=>ov.defId===`custom:${c.id}`);
          if(co) drawCustomOverlay(ctx,W,H,t,co,ps);
        } else {
          const def=OVERLAY_BY_ID[ov.defId];
          if(def) def.draw(ctx,W,H,t,ps,ov.params);
        }
        if(selOvRef.current===ov.instanceId){
          ctx.setTransform(1,0,0,1,0,0);
          ctx.strokeStyle="rgba(150,100,255,0.9)";
          ctx.lineWidth=3;
          ctx.setLineDash([6,4]);
          ctx.strokeRect(10,10,W-20,H-20);
          ctx.setLineDash([]);
        }
        ctx.restore();
      });

      layersRef.current.forEach(l=>{
        ctx.save();
        if(textTransition!=="none" && isTransitioning){
          applyTransition(ctx,W,H,transitionProgress,textTransition,textTransitionParams,true);
        }
        drawLayer(l,W,H,t);
        if(textTransition!=="none" && isTransitioning){
          cleanupTransition(ctx);
        }
        ctx.restore();
      });

      animFrameRef.current=requestAnimationFrame(render);
    };

    animFrameRef.current=requestAnimationFrame(render);
    return ()=>{running=false;cancelAnimationFrame(animFrameRef.current);};
  },[canvasPreset,textTransition,isTransitioning,transitionProgress,mediaTransition]);

  // ==================== MOUSE INTERACTIONS ====================

  const toCanvas=(e:React.MouseEvent<HTMLCanvasElement>|MouseEvent)=>{
    const cv=canvasRef.current!;
    const rect=cv.getBoundingClientRect();
    return{x:(("clientX" in e?e.clientX:0)-rect.left)*(cv.width/rect.width),y:(("clientY" in e?e.clientY:0)-rect.top)*(cv.height/rect.height)};
  };

  const dragging=useRef(false); const dragId=useRef<string|null>(null);
  const dragStartMouse=useRef({x:0,y:0}); const dragStartPos=useRef({x:0,y:0});
  const mdDragging=useRef(false); const mdDragId=useRef<string|null>(null);
  const mdDragStart=useRef({x:0,y:0}); const mdDragStartPos=useRef({x:0,y:0});
  const ovDragging=useRef(false); const ovDragId=useRef<string|null>(null);
  const ovDragStart=useRef({x:0,y:0}); const ovDragStartPos=useRef({x:0,y:0});

  const handleCanvasMouseDown=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const {x,y}=toCanvas(e);
    const W=canvasPreset.w,H=canvasPreset.h;

    const hitMd=[...mediaOverlaysRef.current].reverse().find(m=>hitTestMedia(m,x,y,W,H));
    if(hitMd){
      setSelectedMediaId(hitMd.id); setEditingMediaId(hitMd.id);
      setSelectedLayerId(null); setSelectedOverlayInstance(null);
      mdDragging.current=true; mdDragId.current=hitMd.id;
      mdDragStart.current={x,y}; mdDragStartPos.current={x:hitMd.posX,y:hitMd.posY};
      return;
    }

    const hitOv=[...activeOverlaysRef.current].reverse().find(o=>hitTestOverlay(o,x,y,W,H));
    if(hitOv){
      setSelectedOverlayInstance(hitOv.instanceId); setEditingOverlay(hitOv.instanceId);
      setSelectedLayerId(null); setSelectedMediaId(null);
      ovDragging.current=true; ovDragId.current=hitOv.instanceId;
      ovDragStart.current={x,y}; ovDragStartPos.current={x:hitOv.posX,y:hitOv.posY};
      return;
    }

    const hit=[...layersRef.current].reverse().find(l=>hitTest(l,x,y,W,H));
    if(hit){
      setSelectedLayerId(hit.id); setSelectedOverlayInstance(null); setSelectedMediaId(null);
      dragging.current=true; dragId.current=hit.id;
      dragStartMouse.current={x,y}; dragStartPos.current={x:hit.x,y:hit.y};
    } else {
      setSelectedLayerId(null); setSelectedOverlayInstance(null); setSelectedMediaId(null);
    }
  };

  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{
      if(!canvasRef.current)return;
      const{x,y}=toCanvas(e);
      const W=canvasPreset.w,H=canvasPreset.h;

      if(mdDragging.current&&mdDragId.current){
        const dx=x-mdDragStart.current.x,dy=y-mdDragStart.current.y;
        updateMediaOverlay(mdDragId.current,{posX:Math.max(0,Math.min(1,mdDragStartPos.current.x+dx/W)),posY:Math.max(0,Math.min(1,mdDragStartPos.current.y+dy/H))});
      } else if(ovDragging.current&&ovDragId.current){
        const dx=x-ovDragStart.current.x,dy=y-ovDragStart.current.y;
        setActiveOverlays(prev=>prev.map(o=>o.instanceId===ovDragId.current?{...o,posX:Math.max(0,Math.min(1,ovDragStartPos.current.x+dx/W)),posY:Math.max(0,Math.min(1,ovDragStartPos.current.y+dy/H))}:o));
      } else if(dragging.current&&dragId.current){
        const dx=x-dragStartMouse.current.x,dy=y-dragStartMouse.current.y;
        updateLayer(dragId.current,{x:Math.max(0,Math.min(1,dragStartPos.current.x+dx/W)),y:Math.max(0,Math.min(1,dragStartPos.current.y+dy/H))});
      }
    };

    const onUp=()=>{
      dragging.current=false; mdDragging.current=false; ovDragging.current=false;
      dragId.current=null; mdDragId.current=null; ovDragId.current=null;
    };

    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    return ()=>{
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
    };
  },[canvasPreset,updateLayer]);

  // ==================== EXPORT & RECORDING ====================

  const handleExportPng=()=>{
    const cv=canvasRef.current;
    if(!cv)return;
    const a=document.createElement("a");
    a.href=cv.toDataURL("image/png");
    a.download=`horror-overlay-${canvasPreset.w}x${canvasPreset.h}-${Date.now()}.png`;
    a.click();
  };

  const startRecording=()=>{
    const cv=canvasRef.current;
    if(!cv)return;
    chunksRef.current=[]; setRecordingTime(0);
    const videoStream=cv.captureStream(60);
    let finalStream=videoStream;
    const vid=bgVideoRef.current;

    if(vid&&!vid.muted){
      try{
        if(!audioCtxRef.current)audioCtxRef.current=new AudioContext();
        const actx=audioCtxRef.current;
        if(!audioDestRef.current)audioDestRef.current=actx.createMediaStreamDestination();
        if(audioSourceRef.current){try{audioSourceRef.current.disconnect();}catch{}}
        audioSourceRef.current=actx.createMediaElementSource(vid);
        audioSourceRef.current.connect(audioDestRef.current);
        audioSourceRef.current.connect(actx.destination);
        finalStream=new MediaStream([...videoStream.getVideoTracks(),...audioDestRef.current.stream.getAudioTracks()]);
      }catch(err){console.warn("Audio capture failed:",err);}
    }

    const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
    const mr=new MediaRecorder(finalStream,{mimeType,videoBitsPerSecond:25_000_000,audioBitsPerSecond:256_000});
    mr.ondataavailable=ev=>{if(ev.data.size>0)chunksRef.current.push(ev.data);};
    mr.onstop=()=>{
      const blob=new Blob(chunksRef.current,{type:mimeType});
      const url=URL.createObjectURL(blob);
      const name=`horror-${canvasPreset.w}x${canvasPreset.h}-${Date.now()}.webm`;
      setRecordings(prev=>[{name,url,size:blob.size,duration:recordingTime,format:"webm"},...prev]);
    };
    setTimeout(()=>{
      mr.start(1000);
      mediaRecorderRef.current=mr;
      setRecording(true);
      let el=0;
      recTimerRef.current=setInterval(()=>{el++;setRecordingTime(el);if(el>=5*60)stopRecording();},1000);
    },400);
  };

  const stopRecording=()=>{
    if(recTimerRef.current){clearInterval(recTimerRef.current);recTimerRef.current=null;}
    if(mediaRecorderRef.current&&mediaRecorderRef.current.state!=="inactive"){
      mediaRecorderRef.current.requestData?.();
      setTimeout(()=>{if(mediaRecorderRef.current?.state!=="inactive")mediaRecorderRef.current?.stop();},150);
    }
    setRecording(false);
  };

  const handleExportMP4=()=>{
    const cv=canvasRef.current;
    if(!cv)return;
    const stream=cv.captureStream(30);
    const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
    const chunks:Blob[]=[];
    const mr=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:16_000_000});
    mr.ondataavailable=ev=>{if(ev.data.size>0)chunks.push(ev.data);};
    mr.onstop=()=>{
      const blob=new Blob(chunks,{type:mimeType});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`horror-overlay-${canvasPreset.w}x${canvasPreset.h}-${Date.now()}.webm`;
      a.click();
    };
    mr.start();
    setTimeout(()=>mr.stop(),5000);
  };

  const handleSurprise=()=>selectTemplate(allTemplates[Math.floor(Math.random()*allTemplates.length)]);
  const editOv=activeOverlays.find(o=>o.instanceId===editingOverlay)||null;
  const editMd=mediaOverlays.find(m=>m.id===editingMediaId)||null;
  const filteredOverlays=[
    ...(Array.isArray(OVERLAY_DEFS)?OVERLAY_DEFS:[]).filter(o=>overlayCategory==="All"||o.category===overlayCategory),
    ...(Array.isArray(customOverlays)?customOverlays:[]).filter(o=>overlayCategory==="All"||overlayCategory==="Custom"||o.category===overlayCategory).map(o=>({id:`custom:${o.id}`,label:o.name,category:o.category,emoji:o.isVideo?"🎬":"🖼️"} as any)),
  ];

  // ==================== UI RENDER ====================

  return (
    <div className="h-full flex overflow-hidden bg-[#030305] text-zinc-300">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{fontFamily:"Cinzel"}}>Text Input</h2>
          <textarea value={newText} onChange={e=>setNewText(e.target.value)} rows={2} className="w-full px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40 resize-none" placeholder="Enter text..."/>
          <button onClick={()=>{const l=MakeLayer({text:newText||"TEXT",fontFamily:FONT_OPTIONS[0],color:selectedTemplate.colors[0]});setLayers(p=>[...p,l]);setSelectedLayerId(l.id);}} className="w-full mt-2 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-colors">+ Add Text Layer</button>
          <button onClick={handleSurprise} className="w-full mt-1.5 py-1.5 rounded bg-purple-900/20 border border-purple-700/30 text-purple-300 text-xs font-bold hover:bg-purple-900/40 transition-colors">🎲 Surprise Me</button>
        </div>

        {/* Layers List */}
        <div className="p-2 border-b border-red-900/20">
          <h2 className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">Text ({layers.length})</h2>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {layers.map(l=>(
              <div key={l.id} onClick={()=>{setSelectedLayerId(l.id);setSelectedOverlayInstance(null);setSelectedMediaId(null);}} className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs border transition-all ${l.id===selectedLayerId?"bg-red-900/30 border-red-700/40 text-red-200":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400 hover:border-zinc-600/40"}`}>
                <span className="flex-1 truncate">{l.text||"(empty)"}</span>
                <button onClick={e=>{e.stopPropagation();setLayers(p=>p.filter(x=>x.id!==l.id));if(selectedLayerId===l.id)setSelectedLayerId(null);}} className="text-zinc-600 hover:text-red-400 text-sm px-0.5">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Media Overlays */}
        {mediaOverlays.length>0 && (
          <div className="p-2 border-b border-blue-900/20">
            <h2 className="text-[9px] text-blue-400 uppercase tracking-widest mb-1.5">Media ({mediaOverlays.length})</h2>
            <div className="space-y-1 max-h-16 overflow-y-auto">
              {mediaOverlays.map(m=>(
                <div key={m.id} onClick={()=>{setSelectedMediaId(m.id);setEditingMediaId(m.id);setSelectedLayerId(null);setSelectedOverlayInstance(null);}} className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer text-xs border transition-all ${m.id===selectedMediaId?"bg-blue-900/30 border-blue-700/40 text-blue-200":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400"}`}>
                  <span className="flex-shrink-0">{m.type==="video"?"🎬":"🖼️"}</span>
                  <span className="flex-1 truncate text-[8px]">{m.name.slice(0,12)}</span>
                  <button onClick={e=>{e.stopPropagation();removeMediaOverlay(m.id);}} className="text-zinc-600 hover:text-red-400 text-[10px]">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Overlays */}
        {activeOverlays.length>0 && (
          <div className="p-2 border-b border-purple-900/20">
            <h2 className="text-[9px] text-purple-400 uppercase tracking-widest mb-1.5">Overlays ({activeOverlays.length})</h2>
            <div className="space-y-1 max-h-16 overflow-y-auto">
              {activeOverlays.map(ov=>(
                <div key={ov.instanceId} onClick={()=>{setSelectedOverlayInstance(ov.instanceId);setEditingOverlay(ov.instanceId);setSelectedLayerId(null);setSelectedMediaId(null);}} className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer text-xs border transition-all ${ov.instanceId===selectedOverlayInstance?"bg-purple-900/30 border-purple-700/40 text-purple-200":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400"}`}>
                  <span className="flex-shrink-0">{ov.emoji}</span>
                  <span className="flex-1 truncate text-[8px]">{ov.label}</span>
                  <button onClick={e=>{e.stopPropagation();removeOverlay(ov.instanceId);}} className="text-zinc-600 hover:text-red-400 text-[10px]">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates - Collapsible */}
        <div className="p-2 border-b border-red-900/20">
          <button onClick={()=>setShowTemplatePanel(v=>!v)} className="w-full flex items-center justify-between px-2 py-1 rounded bg-zinc-800/40 border border-zinc-800/30 hover:border-zinc-600/40 text-xs text-zinc-400 hover:text-zinc-300 font-bold">
            <span>Templates</span>
            <span className="text-[10px]">{showTemplatePanel?"▼":"▶"}</span>
          </button>
        </div>

        {showTemplatePanel && (
          <>
            <div className="p-2 border-b border-red-900/20">
              <div className="flex flex-wrap gap-1 mb-1.5">
                {categories.slice(0,5).map(cat=>(
                  <button key={cat} onClick={()=>setActiveCategory(cat)} className={`px-1.5 py-0.5 rounded text-[8px] font-medium transition-all border ${activeCategory===cat?"bg-red-900/30 border-red-700/40 text-red-300":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{cat}</button>
                ))}
              </div>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search..." className="w-full px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"/>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="text-[9px] text-zinc-600 mb-1.5">{filtered.slice(0,8).length} templates</div>
              <div className="grid grid-cols-2 gap-1">
                {filtered.slice(0,8).map(tpl=>(<TemplateCard key={tpl.id} template={tpl} selected={selectedTemplate.id===tpl.id} onClick={()=>selectTemplate(tpl)} text={newText}/>))}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* CENTER - CANVAS */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h1 className="text-lg font-black text-purple-400" style={{fontFamily:"Cinzel"}}>HORROR ANIMATOR</h1>
          <span className="text-xs text-zinc-600">{canvasPreset.w}×{canvasPreset.h}</span>
        </div>

        <div className="relative mb-2">
          <button onClick={()=>setShowSizeMenu(v=>!v)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-purple-700/40 w-full max-w-sm">
            <span>📐</span><span className="flex-1 text-left truncate">{canvasPreset.label}</span>
          </button>
          {showSizeMenu && (
            <div className="absolute z-20 mt-1 w-full max-w-sm rounded bg-zinc-900 border border-zinc-700/40 shadow-xl max-h-80 overflow-y-auto">
              {CANVAS_PRESETS.map(p=>(
                <button key={p.label} onClick={()=>{setCanvasPreset(p);setShowSizeMenu(false);}} className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-800/60 ${canvasPreset.label===p.label?"text-purple-300 bg-purple-900/10":"text-zinc-400"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0 pb-2">
          <div className="relative rounded border border-zinc-800/40 bg-[#030305]" style={{aspectRatio:`${canvasPreset.w}/${canvasPreset.h}`,maxWidth:"100%",maxHeight:"100%"}}>
            <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} className="absolute inset-0 w-full h-full cursor-crosshair" style={{imageRendering:"auto"}}/>
            {recording&&(<div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/50 border border-red-700/60"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/><span className="text-[10px] text-red-300 font-mono font-bold">REC {fmt(recordingTime)}</span></div>)}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-2 flex items-center gap-2 flex-wrap flex-shrink-0 text-xs">
          <input ref={bgFileRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden"/>
          <input ref={bgVidRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden"/>
          <input ref={mediaUploadRef} type="file" accept="image/*,video/*,image/gif" onChange={addMediaOverlay} className="hidden"/>
          <button onClick={()=>bgFileRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-green-700/40">🖼️ BG</button>
          <button onClick={()=>bgVidRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-blue-700/40">🎬 Video</button>
          <button onClick={()=>mediaUploadRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-cyan-700/40">➕ Media</button>
          <select value={bgObjectFit} onChange={e=>setBgObjectFit(e.target.value as any)} className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 focus:outline-none">
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
          <button onClick={clearBg} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-red-700/40">Clear</button>
          <div className="h-4 w-px bg-zinc-800/40"/>
          <button onClick={handleExportPng} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-green-700/40">📸 PNG</button>
          <button onClick={recording?stopRecording:startRecording} className={`px-3 py-1.5 rounded border font-bold transition-all ${recording?"bg-red-900/40 border-red-700/40 text-red-300 animate-pulse":"bg-zinc-800/60 border-zinc-700/40 text-zinc-300 hover:border-red-700/40"}`}>
            {recording?`⏹ ${fmt(recordingTime)}`:"🔴 Record"}
          </button>
          <button onClick={handleExportMP4} className="px-3 py-1.5 rounded bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:bg-purple-900/60">🎥 Export</button>
          <button onClick={()=>setShowRecordings(v=>!v)} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-purple-700/40">📁 ({recordings.length})</button>
          <button onClick={saveProject} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-green-700/40">💾 Save</button>
          <input ref={loadProjectRef} type="file" accept=".json" onChange={loadProject} className="hidden"/>
          <button onClick={()=>loadProjectRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 hover:border-green-700/40">📂 Load</button>
          {autoSaveTime&&<span className="text-[10px] text-green-500 ml-auto">✓ Saved {autoSaveTime.toLocaleTimeString()}</span>}
        </div>

        {showRecordings && (
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#0a0a14] p-2 max-h-32 overflow-y-auto flex-shrink-0">
            {recordings.length===0?<div className="text-xs text-zinc-600">No recordings</div>:recordings.map((r,i)=>(
              <div key={i} className="flex items-center justify-between py-1 border-b border-zinc-800/30 last:border-0">
                <span className="text-xs text-zinc-400 truncate flex-1">{r.name}</span>
                <span className="text-[10px] text-zinc-600 ml-2">{(r.size/1024/1024).toFixed(1)}MB</span>
                <a href={r.url} download className="text-xs text-purple-400 ml-2 hover:text-purple-300">↓</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <aside className="w-72 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">
        <div className="p-3 overflow-y-auto flex-1 space-y-3">

          {/* TEXT PROPS */}
          {sl && (
            <div className="pb-3 border-b border-red-900/20">
              <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">✏️ Text</h2>
              <div className="space-y-1.5">
                <div><textarea value={sl.text} onChange={e=>updateLayer(sl.id,{text:e.target.value})} rows={2} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-200 focus:outline-none resize-none"/></div>
                <div className="grid grid-cols-2 gap-1">
                  <div><select value={sl.fontFamily} onChange={e=>updateLayer(sl.id,{fontFamily:e.target.value})} className="w-full px-1 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">{FONT_OPTIONS.map(f=>(<option key={f}>{f}</option>))}</select></div>
                  <div><input type="number" value={sl.fontSize} onChange={e=>updateLayer(sl.id,{fontSize:Math.max(8,Math.min(600,Number(e.target.value)))})} className="w-full px-1 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/></div>
                </div>
                <div><select value={sl.animation} onChange={e=>updateLayer(sl.id,{animation:e.target.value})} className="w-full px-1 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">{ALL_ANIMATIONS.slice(0,30).map(a=>(<option key={a}>{a}</option>))}</select></div>
                <div><input type="color" value={sl.color} onChange={e=>updateLayer(sl.id,{color:e.target.value})} className="w-full h-6 rounded bg-zinc-800/60 border border-zinc-700/30 cursor-pointer"/></div>
                <div><label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Opacity: {Math.round(sl.opacity*100)}%</label><input type="range" min={0} max={100} value={Math.round(sl.opacity*100)} onChange={e=>updateLayer(sl.id,{opacity:Number(e.target.value)/100})} className="w-full accent-red-600"/></div>
                <div><label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Rotation: {Math.round(sl.rotation*180/Math.PI)}°</label><input type="range" min={-180} max={180} value={Math.round(sl.rotation*180/Math.PI)} onChange={e=>updateLayer(sl.id,{rotation:Number(e.target.value)*Math.PI/180})} className="w-full accent-red-600"/></div>
                <div><label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Stroke</label><input type="range" min={0} max={10} step={0.5} value={sl.strokeWidth} onChange={e=>updateLayer(sl.id,{strokeWidth:Number(e.target.value)})} className="w-full accent-red-600"/></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={sl.shadowEnabled} onChange={e=>updateLayer(sl.id,{shadowEnabled:e.target.checked})} className="accent-red-600"/><span className="text-xs text-zinc-400">Shadow</span><input type="checkbox" checked={sl.glowEnabled} onChange={e=>updateLayer(sl.id,{glowEnabled:e.target.checked})} className="accent-red-600 ml-auto"/><span className="text-xs text-zinc-400">Glow</span></div>
              </div>
            </div>
          )}

          {/* MEDIA PROPS */}
          {editMd && (
            <div className="pb-3 border-b border-blue-900/20">
              <h2 className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-2">🖼️ Media</h2>
              <div className="space-y-1">
                <div><label className="text-[8px] text-zinc-500 block">Scale X: {editMd.scaleX.toFixed(2)}</label><input type="range" min={0.1} max={3} step={0.1} value={editMd.scaleX} onChange={e=>updateMediaOverlay(editMd.id,{scaleX:Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                <div><label className="text-[8px] text-zinc-500 block">Scale Y: {editMd.scaleY.toFixed(2)}</label><input type="range" min={0.1} max={3} step={0.1} value={editMd.scaleY} onChange={e=>updateMediaOverlay(editMd.id,{scaleY:Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                <div><label className="text-[8px] text-zinc-500 block">Rotate: {Math.round(editMd.rotation*180/Math.PI)}°</label><input type="range" min={-180} max={180} value={Math.round(editMd.rotation*180/Math.PI)} onChange={e=>updateMediaOverlay(editMd.id,{rotation:Number(e.target.value)*Math.PI/180})} className="w-full accent-blue-600"/></div>
                <div><label className="text-[8px] text-zinc-500 block">Opacity: {Math.round(editMd.opacity*100)}%</label><input type="range" min={0} max={100} value={Math.round(editMd.opacity*100)} onChange={e=>updateMediaOverlay(editMd.id,{opacity:Number(e.target.value)/100})} className="w-full accent-blue-600"/></div>
                <button onClick={()=>duplicateMediaOverlay(editMd.id)} className="w-full py-1 rounded bg-blue-900/40 border border-blue-700/40 text-xs text-blue-300 hover:bg-blue-900/60">📋 Duplicate</button>
                <button onClick={()=>removeMediaOverlay(editMd.id)} className="w-full py-1 rounded bg-red-900/40 border border-red-700/40 text-xs text-red-300 hover:bg-red-900/60">Remove</button>
              </div>
            </div>
          )}

          {/* OVERLAY PROPS */}
          {editOv && (
            <div className="pb-3 border-b border-purple-900/20">
              <h2 className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mb-2">🎭 Overlay</h2>
              <div className="space-y-1">
                <div><label className="text-[8px] text-zinc-500 block">Count: {editOv.params.count}</label><input type="range" min={10} max={300} value={editOv.params.count} onChange={e=>updateOverlayParams(editOv.instanceId,{count:Number(e.target.value)})} className="w-full accent-purple-600"/></div>
                <div><label className="text-[8px] text-zinc-500 block">Scale: {editOv.scale.toFixed(2)}</label><input type="range" min={0.1} max={3} step={0.05} value={editOv.scale} onChange={e=>updateOverlayProp(editOv.instanceId,{scale:Number(e.target.value)})} className="w-full accent-purple-600"/></div>
                <div><label className="text-[8px] text-zinc-500 block">Speed: {editOv.params.speedMin}-{editOv.params.speedMax}</label><input type="range" min={0.1} max={10} step={0.1} value={editOv.params.speedMin} onChange={e=>updateOverlayParams(editOv.instanceId,{speedMin:Number(e.target.value)})} className="w-full accent-purple-600"/></div>
                <button onClick={()=>duplicateOverlay(editOv.instanceId)} className="w-full py-1 rounded bg-purple-900/40 border border-purple-700/40 text-xs text-purple-300 hover:bg-purple-900/60">📋 Duplicate</button>
                <button onClick={()=>removeOverlay(editOv.instanceId)} className="w-full py-1 rounded bg-red-900/40 border border-red-700/40 text-xs text-red-300 hover:bg-red-900/60">Remove</button>
              </div>
            </div>
          )}

          {/* ADD OVERLAYS */}
          <div className="pb-3 border-b border-red-900/20">
            <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">➕ Overlays</h2>
            <div className="flex flex-wrap gap-1 mb-2">
              {OVERLAY_CATEGORIES.slice(0,4).map(cat=>(
                <button key={cat} onClick={()=>setOverlayCategory(cat)} className={`px-2 py-0.5 rounded text-[8px] font-medium transition-all border ${overlayCategory===cat?"bg-red-900/30 border-red-700/40 text-red-300":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {filteredOverlays.slice(0,12).map(o=>(
                <button key={o.id} onClick={()=>o.id.startsWith("custom:")?addCustomOverlay(customOverlays.find(c=>`custom:${c.id}`===o.id)!):addOverlay(o.id)} className="p-1.5 rounded bg-zinc-800/40 border border-zinc-800/30 hover:border-red-700/40 text-xs text-zinc-400 hover:text-zinc-200 transition-all" title={o.label}>
                  <span className="text-lg">{o.emoji}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setShowAddCustom(true)} className="w-full mt-1.5 py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">+ Custom</button>
            {showAddCustom && (
              <div className="mt-1.5 space-y-1 p-1.5 rounded bg-zinc-900/50 border border-zinc-800/30">
                <input value={newCustomName} onChange={e=>setNewCustomName(e.target.value)} placeholder="Name" className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                <input ref={customUploadRef} type="file" accept="image/*,video/*" onChange={handleCustomUpload} className="hidden"/>
                <button onClick={()=>customUploadRef.current?.click()} className="w-full py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">📁 Upload</button>
                {pendingCustomFile && <div className="text-xs text-zinc-400">{pendingIsVideo?"🎬 Video":pendingIsGif?"🎞️ GIF":"🖼️ Image"}</div>}
                <div className="flex gap-1">
                  <button onClick={finalizeCustomOverlay} className="flex-1 py-1 rounded bg-red-900/40 border border-red-700/40 text-xs text-red-300 hover:bg-red-900/60">Add</button>
                  <button onClick={()=>{setShowAddCustom(false);setPendingCustomFile(null);setNewCustomName("");}} className="flex-1 py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* SOUND LIBRARY */}
          <div className="pb-3 border-b border-green-900/20">
            <button onClick={()=>setShowSoundPanel(v=>!v)} className="w-full flex items-center justify-between px-2 py-1 rounded bg-green-900/40 border border-green-700/40 text-xs text-green-300 hover:bg-green-900/60 font-bold">
              <span>🔊 Sounds</span>
              <span className="text-[10px]">{showSoundPanel?"▼":"▶"}</span>
            </button>
            {showSoundPanel && (
              <div className="mt-1.5 space-y-1">
                <input ref={soundUploadRef} type="file" accept="audio/*" onChange={handleSoundUpload} className="hidden"/>
                <button onClick={()=>soundUploadRef.current?.click()} className="w-full py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">📁 Upload Sound</button>
                
                <div><label className="text-[8px] text-zinc-500">TTS: {ttsText.slice(0,15)}...</label>
                <textarea value={ttsText} onChange={e=>setTtsText(e.target.value)} rows={2} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-200 focus:outline-none resize-none" maxLength={100}/></div>
                <div className="grid grid-cols-2 gap-1">
                  <div><label className="text-[8px] text-zinc-500 block">Rate: {ttsRate}</label><input type="range" min={0.5} max={2} step={0.1} value={ttsRate} onChange={e=>setTtsRate(Number(e.target.value))} className="w-full accent-green-600"/></div>
                  <div><label className="text-[8px] text-zinc-500 block">Pitch: {ttsPitch}</label><input type="range" min={0.5} max={2} step={0.1} value={ttsPitch} onChange={e=>setTtsPitch(Number(e.target.value))} className="w-full accent-green-600"/></div>
                </div>
                <button onClick={playTTS} className="w-full py-1 rounded bg-green-900/40 border border-green-700/40 text-xs text-green-300 hover:bg-green-900/60">{ttsPlaying?"⏹ Stop TTS":"🔊 Play TTS"}</button>

                <div className="text-[8px] text-zinc-500 font-bold">Library</div>
                <div className="space-y-0.5 max-h-20 overflow-y-auto">
                  {filteredSounds.slice(0,10).map(s=>(
                    <button key={s.id} onClick={()=>toggleSound(s)} className={`w-full text-left px-2 py-1 rounded text-xs border transition-all ${activeSounds.some(a=>a.id===s.id)?"bg-green-900/30 border-green-700/40 text-green-300":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400 hover:text-zinc-200"}`}>
                      {s.emoji} {s.name.slice(0,12)}
                    </button>
                  ))}
                </div>
                {activeSounds.length>0 && <button onClick={stopAllSounds} className="w-full py-1 rounded bg-red-900/40 border border-red-700/40 text-xs text-red-300 hover:bg-red-900/60">⏹ Stop All</button>}
              </div>
            )}
          </div>

        </div>
      </aside>
    </div>
  );
}
