// TextAnimator.tsx — Complete Merged Version
// Location: artifacts/horror-studio/src/pages/TextAnimator.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import { useListTemplates } from "@workspace/api-client-react";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";
import {
  OVERLAY_DEFS, OVERLAY_CATEGORIES, OVERLAY_BY_ID,
  tickParticles, drawCustomOverlay, initCustomParticles,
  type OverlayDef, type OverlayParticle, type OverlayParams, type CustomOverlay, DEFAULT_PARAMS
} from "@/data/overlays";

// NEW IMPORTS — Add these after existing imports
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

// Remove these imports — causing circular dependency
// import { useDebounce, useThrottle } from "@/hooks/use-debounce";

// Canvas Sizes
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
  "none","fade-in","fade-out","zoom-in","zoom-out","zoom-pulse",
  "slide-left","slide-right","slide-up","slide-down",
  "bounce","drop-in","elastic","swing","pendulum","rubber-band",
  "spin","spin-reveal","flip-x","flip-y","roll-in",
  "glitch","blood-drip","flicker","static","possessed","demonic","shadow-pulse",
  "cursed","void","hellfire","phantom","decay",
  "Neon-pulse","fire-glow","rainbow","color-cycle","ice-glow","gold-shine",
  "toxic-glow","plasma","hologram","disco","lava-glow","chroma","aurora",
  "cinematic-fade","typewriter","dramatic-zoom","split-reveal","curtain",
  "matrix","scan-line","hack","terminal","pixel-reveal","binary","circuit","laser",
  "float","wobble","jello","heartbeat","tada","wiggle",
  "flash","breathe","levitate","shake","jack-in-box","back-in-up","back-in-down",
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
  "Great Vibes","Kaushan Script","Cookie",
  "Inter","Poppins","Nunito","Montserrat","Raleway","Ubuntu","Lato","Open Sans",
  "Roboto Condensed","Barlow","Karla","DM Sans","Manrope",
  "Courier New","IBM Plex Mono","Fira Code","Space Mono","Roboto Mono","Inconsolata",
  "Impact","Arial Black","Georgia","Verdana","Tahoma","Trebuchet MS",
];

// Text Layer Interface
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

function MakeLayer(p:Partial<TextLayer>={}):TextLayer {
  return {id:Math.random().toString(36).slice(2),text:"STARTING SOON",x:0.5,y:0.5,fontSize:120,fontFamily:"Creepster",color:"#cc0000",bold:false,italic:false,underline:false,align:"center",opacity:1,rotation:0,strokeColor:"#000000",strokeWidth:4,shadowEnabled:true,shadowColor:"#000000",shadowBlur:20,glowEnabled:false,glowColor:"#ff0000",letterSpacing:0,animation:"none",_w:0,_h:0,...p};
}

// Active Overlay Instance
interface ActiveOverlay {
  instanceId: string;
  defId: string;
  label: string;
  emoji: string;
  params: OverlayParams;
  posX: number;
  posY: number;
  scale: number;
  rotation: number;
  opacity: number;
}

// Audio Library
interface AudioLibraryItem {
  id: string;
  name: string;
  type: "horror" | "nature" | "music" | "tts" | "uploaded";
  url: string;
  duration?: number;
}

// Project State
interface ProjectState {
  version: number;
  canvasPreset: { w:number; h:number; label:string };
  layers: Omit<TextLayer, "_w"|"_h">[];
  activeOverlays: ActiveOverlay[];
  customOverlays: CustomOverlay[];
  bgColor: string;
  audioLibrary: AudioLibraryItem[];
  textTransition: string;
  textTransitionParams: TransitionParams;
  bgTransform: MediaTransform;
  mediaTransition: string;
}

function TemplatePreview({ template, text }:{ template:TemplateData; text:string }) {
  const bg = template.backgroundStyle==="dark-gradient" ? "linear-gradient(135deg,#0a0808 0%,#150a1a 100%)" : "#080810";
  return (
    <div className="h-full flex items-center justify-center overflow-hidden" style={{background:bg}}>
      <span className="text-sm font-bold block text-center px-2 leading-tight" style={{fontFamily:`'${template.font}',sans-serif`,color:template.colors[0],textShadow:template.glow?`0 0 10px ${template.colors[0]}`:"none"}}>
        {text||template.name.toUpperCase()}
      </span>
    </div>
  );
}

function TemplateCard({template,selected,onClick,text}:{template:TemplateData;selected:boolean;onClick:()=>void;text:string}) {
  return (
    <div onClick={onClick} className={`rounded border cursor-pointer transition-all overflow-hidden ${selected?"border-red-600/60 ring-1 ring-red-500/30":"border-zinc-800/40 hover:border-zinc-600/40"}`} style={selected?{boxShadow:"0 0 12px rgba(220,20,60,0.25)"}:{}}>
      <div className="h-16 bg-[#08080f]"><TemplatePreview template={template} text={text}/></div>
      <div className="px-2 py-1 bg-[#0a0a14] border-t border-zinc-800/30">
        <div className="text-[9px] font-medium text-zinc-400 truncate">{template.name}</div>
        <div className="text-[8px] text-zinc-600">{template.animation}</div>
      </div>
    </div>
  );
}

function fmt(s:number){return`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;}

function hitTest(l:TextLayer,cx:number,cy:number,W:number,H:number):boolean {
  const lx=l.x*W,ly=l.y*H,hw=l._w/2+10,hh=l._h/2+10;
  const cos=Math.cos(-l.rotation),sin=Math.sin(-l.rotation);
  const dx=cx-lx,dy=cy-ly;
  return Math.abs(dx*cos-dy*sin)<=hw && Math.abs(dx*sin+dy*cos)<=hh;
}

function hitTestOverlay(ov: ActiveOverlay, cx: number, cy: number, W: number, H: number): boolean {
  const ox = ov.posX * W;
  const oy = ov.posY * H;
  const size = Math.min(W, H) * ov.scale * 0.3;
  return Math.abs(cx - ox) < size && Math.abs(cy - oy) < size;
}

export default function TextAnimator() {
  // States
  const [selectedTemplate,setSelectedTemplate] = useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory,setActiveCategory]     = useState("All");
  const [searchQuery,setSearchQuery]           = useState("");
  const [canvasPreset,setCanvasPreset]         = useState(CANVAS_PRESETS[0]);
  const [showSizeMenu,setShowSizeMenu]         = useState(false);

  // BG
  const [bgImage,setBgImage]     = useState<HTMLImageElement|null>(null);
  const [bgVideo,setBgVideo]     = useState<HTMLVideoElement|null>(null);
  const [bgObjectFit,setBgObjectFit]  = useState<"cover"|"contain"|"fill">("cover");
  const bgFileRef = useRef<HTMLInputElement>(null);
  const bgVidRef  = useRef<HTMLInputElement>(null);

  // Media Transform State
  const [bgTransform, setBgTransform] = useState<MediaTransform>(DEFAULT_MEDIA_TRANSFORM);
  const [selectedMedia, setSelectedMedia] = useState<"bg-image" | "bg-video" | null>(null);

  // Layers
  const [layers,setLayers]                 = useState<TextLayer[]>([MakeLayer()]);
  const [selectedLayerId,setSelectedLayerId]  = useState<string|null>(null);
  const [newText,setNewText]               = useState("STARTING SOON");
  const sl = layers.find(l=>l.id===selectedLayerId)??null;
  const UpdateLayer = useCallback((id:string,patch:Partial<TextLayer>)=>{
    setLayers(prev=>prev.map(l=>l.id===id?{...l,...patch}:l));
  },[]);

  // Overlays
  const [activeOverlays,setActiveOverlays]         = useState<ActiveOverlay[]>([]);
  const [selectedOverlayInstance,setSelectedOverlayInstance]  = useState<string|null>(null);
  const [showOverlayPanel,setShowOverlayPanel]     = useState(false);
  const [overlayCategory,setOverlayCategory]       = useState("All");
  const [editingOverlay,setEditingOverlay]         = useState<string|null>(null);
  const [customOverlays,setCustomOverlays]         = useState<CustomOverlay[]>([]);
  const [showAddCustom,setShowAddCustom]           = useState(false);
  const [newCustomName,setNewCustomName]           = useState("");
  const [newCustomCategory,setNewCustomCategory]   = useState("Custom");
  const customUploadRef = useRef<HTMLInputElement>(null);
  const overlayParticlesRef = useRef<Record<string,OverlayParticle[]>>({});
  
  const [pendingCustomFile,setPendingCustomFile] = useState<string|null>(null);
  const [pendingIsGif,setPendingIsGif]           = useState(false);
  const [pendingIsVideo,setPendingIsVideo]       = useState(false);

  // Transitions
  const [textTransition, setTextTransition] = useState<string>("none");
  const [textTransitionParams, setTextTransitionParams] = useState<TransitionParams>(DEFAULT_TRANSITION);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [mediaTransition, setMediaTransition] = useState<string>("none");
  const [mediaTransitionParams, setMediaTransitionParams] = useState<TransitionParams>(DEFAULT_TRANSITION);

  // Audio Library
  const [audioLibrary, setAudioLibrary] = useState<AudioLibraryItem[]>([
    { id: "1", name: "Horror Ambience", type: "horror", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 120 },
    { id: "2", name: "Rain Storm", type: "nature", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: 180 },
    { id: "3", name: "Dark Piano", type: "music", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: 240 },
  ]);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsText, setTtsText]  = useState("");
  const [selectedVoice, setSelectedVoice]  = useState("default");
  const [ttsRate, setTtsRate]  = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const audioUploadRef = useRef<HTMLInputElement>(null);

  // Recording
  const [recording,setRecording]     = useState(false);
  const [recordingTime,setRecordingTime] = useState(0);
  const [recordings,setRecordings]   = useState<Array<{name:string;url:string;size:number}>>([]);
  const [showRecordings,setShowRecordings]  = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const recTimerRef      = useRef<ReturnType<typeof setInterval>|null>(null);
  const audioCtxRef      = useRef<AudioContext|null>(null);
  const audioDestRef     = useRef<MediaStreamAudioDestinationNode|null>(null);
  const audioSourceRef   = useRef<MediaElementAudioSourceNode|null>(null);

  // Performance
  const fpsControllerRef = useRef(new FrameRateController(60));
  const videoManagerRef = useRef(new VideoBufferManager(3));
  const memoryMonitorRef = useRef<MemoryMonitor | null>(null);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  // Canvas / Render
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const AnimFrameRef = useRef<number>(0);
  const layersRef    = useRef(layers);
  useEffect(()=>{LayersRef.current=layers;},[layers]);
  const selectedIdRef = useRef(selectedLayerId);
  useEffect(()=>{selectedIdRef.current=selectedLayerId;},[selectedLayerId]);
  const activeOverlaysRef = useRef(activeOverlays);
  useEffect(()=>{activeOverlaysRef.current=activeOverlays;},[activeOverlays]);
  const customOverlaysRef = useRef(customOverlays);
  useEffect(()=>{customOverlaysRef.current=customOverlays;},[customOverlays]);
  const bgImageRef = useRef(bgImage); useEffect(()=>{bgImageRef.current=bgImage;},[bgImage]);
  const bgVideoRef = useRef(bgVideo); useEffect(()=>{bgVideoRef.current=bgVideo;},[bgVideo]);
  const bgFitRef   = useRef(bgObjectFit); useEffect(()=>{bgFitRef.current=bgObjectFit;},[bgObjectFit]);
  const presetRef  = useRef(canvasPreset); useEffect(()=>{presetRef.current=canvasPreset;},[canvasPreset]);
  const templateRef= useRef(selectedTemplate); useEffect(()=>{templateRef.current=selectedTemplate;},[selectedTemplate]);
  const selOvRef   = useRef(selectedOverlayInstance); useEffect(()=>{selOvRef.current=selectedOverlayInstance;},[selectedOverlayInstance]);
  const bgTransformRef = useRef(bgTransform); useEffect(()=>{bgTransformRef.current=bgTransform;},[bgTransform]);

  // Auto Save
  const getProjectData = useCallback(() => ({
    version: 2,
    canvasPreset,
    layers: layers.map(({_w, _h, ...rest}) => rest),
    activeOverlays,
    customOverlays,
    bgColor: "#000000",
    audioLibrary,
    textTransition,
    textTransitionParams,
    bgTransform,
    mediaTransition,
    thumbnail: canvasRef.current?.toDataURL("Image/jpeg", 0.3)
  }), [canvasPreset, layers, activeOverlays, customOverlays, audioLibrary, textTransition, textTransitionParams, bgTransform, mediaTransition]);

  const { lastSaved, isSaving, saveNow } = useAutoSave(getProjectData, 30000);

  // Templates
  const {data:dbTemplatesRaw=[]} = useListTemplates();
  const dbTemplates = Array.isArray(dbTemplatesRaw) ? dbTemplatesRaw : [];
  const allTemplates:TemplateData[] = [
    ...PRESET_TEMPLATES,
    ...dbTemplates.map(t=>({id:t.id,name:t.name,category:t.category,font:t.font,animation:t.animation,colors:t.colors as string[],glow:t.glow,shadowEffect:t.shadowEffect,backgroundStyle:t.backgroundStyle,motionBehavior:t.motionBehavior,isPreset:t.isPreset})),
  ];
  const categories = ["All", ...(Array.isArray(TEMPLATE_CATEGORIES) ? TEMPLATE_CATEGORIES : [])];
  const filtered = (Array.isArray(allTemplates) ? allTemplates : []).filter(t=>{
    const catMatch = activeCategory==="All"||t.category===ActiveCategory;
    const searchMatch = !SearchQuery||t.Name.toLowerCase().includes(SearchQuery.toLowerCase());
    return CatMatch&&SearchMatch;
  });

  const selectTemplate = (tpl:TemplateData) => {
    setSelectedTemplate(tpl);
    if(selectedLayerId) UpdateLayer(selectedLayerId,{color:tpl.colors[0],fontFamily:Tpl.font,Animation:Tpl.animation,glowEnabled:Tpl.glow,shadowEnabled:Tpl.shadowEffect});
  };

  // Performance Init
  useEffect(() => {
    setLowPowerMode(detectLowPowerMode());
    
    memoryMonitorRef.current = new MemoryMonitor(
      () => {
        console.warn("Memory warning - reducing quality");
        fpsControllerRef.current.setTargetFPS(30);
      },
      () => {
        console.error("Critical memory - emergency cleanup");
        videoManagerRef.current.clear();
        cleanupResources(VideoManagerRef.current, [], [canvasRef.current!]);
      }
    );
    memoryMonitorRef.current.start();
    
    if (CanvasRef.current) {
      optimizeCanvas(CanvasRef.current);
    }
    
    return () => {
      memoryMonitorRef.current?.stop();
      cleanupResources(VideoManagerRef.current, [], [canvasRef.current!]);
    };
  }, []);

  // Draft Restoration
  useEffect(() => {
    const url = new URL(window.location.href);
    const restoreId = url.searchParams.get("restore");
    
    if (restoreId) {
      loadDraft(restoreId).then(data => {
        if (data) {
          setCanvasPreset(data.canvasPreset || CANVAS_PRESETS[0]);
          setLayers(data.layers?.map((l: any) => ({...l, _w: 0, _h: 0})) || [MakeLayer()]);
          setSelectedLayerId(data.layers[0]?.id || null);
          setActiveOverlays(data.activeOverlays || []);
          setCustomOverlays(data.customOverlays || []);
          setAudioLibrary(data.audioLibrary || []);
          setTextTransition(data.textTransition || "none");
          setTextTransitionParams(data.TextTransitionParams || DEFAULT_TRANSITION);
          setBgTransform(data.BgTransform || DEFAULT_MEDIA_TRANSFORM);
          setMediaTransition(data.MediaTransition || "none");
          
          url.searchParams.delete("restore");
          window.history.replaceState({}, "", url.toString());
        }
      });
    }
  }, []);

  // BG Upload
  const handleBgUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        setBgImage(img);
        setBgVideo(null);
        setBgTransform(DEFAULT_MEDIA_TRANSFORM);
      };
      img.src=ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const url=URL.createObjectURL(file);
    if(bgVideo)bgVideo.pause();
    const Vid=document.createElement("video");
    Vid.src=url;
    Vid.loop=true;
    Vid.muted=false;
    Vid.playsInline=true;
    Vid.play().catch(()=>{Vid.muted=true;Vid.play();});
    setBgVideo(Vid);
    setBgImage(null);
    setBgTransform(DEFAULT_MEDIA_TRANSFORM);
  };

  const clearBg = () => {
    if(bgVideo) bgVideo.pause();
    setBgImage(null);
    SetBgVideo(null);
    SetBgTransform(DEFAULT_MEDIA_TRANSFORM);
    if(bgFileRef.current) bgFileRef.current.value="";
    if(bgVidRef.current) bgVidRef.current.value="";
  };

  // Transition Functions
  const triggerTransition = useCallback((transitionId: string, params: TransitionParams = DEFAULT_TRANSITION) => {
    if(transitionId==="None") return;
    
    setIsTransitioning(true);
    setTransitionProgress(0);
    
    const startTime = performance.now();
    const duration = params.duration * 1000;
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setTransitionProgress(progress);
      
      If(Progress < 1) {
        requestAnimationFrame(animate);
      } Else {
        setTimeout(() => {
          setIsTransitioning(false);
          setTransitionProgress(0);
        }, 100);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  // Overlay Management
  const addOverlay = (defId:string) => {
    const def = OVERLAY_BY_ID[defId]; If(!Def) Return;
    const instanceId = Math.random().toString(36).slice(2);
    const newOv:ActiveOverlay = {
      instanceId, defId, label:def.label, emoji:Def.emoji, 
      params:{...Def.params}, 
      posX:0.5, posY:0.5, scale:1, rotation: 0, opacity: 1
    };
    overlayParticlesRef.current[instanceId] = Def.initParticles(presetRef.current.w,presetRef.current.h,def.params);
    setActiveOverlays(prev=>[...prev,newOv]);
    setEditingOverlay(instanceId);
    setSelectedOverlayInstance(instanceId);
  };
  
  const addCustomOverlay = (co:CustomOverlay) => {
    const instanceId = Math.random().toString(36).slice(2);
    const newOv:ActiveOverlay = {
      instanceId, defId:`custom:${co.id}`, label:Co.name, Emoji:Co.isVideo?"🎬":"🖼️", 
      params:{
        count:Co.count, direction:Co.direction, 
        sizeMin:Co.sizeMin, SizeMax:Co.sizeMax,
        SpeedMin:Co.speedMin, SpeedMax:Co.speedMax,
        AlphaMin:Co.alphaMin, AlphaMax:Co.alphaMax,
        Rotate:Co.rotate, opacity: Co.opacity || 1
      },
      posX:0.5, posY:0.5, scale:1, rotation: 0, opacity: Co.opacity || 1
    };
    overlayParticlesRef.current[instanceId] = initCustomParticles(presetRef.current.w,presetRef.current.h,Co);
    setActiveOverlays(prev=>[...prev,newOv]);
    setEditingOverlay(instanceId);
    SetSelectedOverlayInstance(instanceId);
  };
  
  const removeOverlay = (instanceId:string) => {
    delete overlayParticlesRef.current[instanceId];
    setActiveOverlays(prev=>prev.filter(o=>o.instanceId!==instanceId));
    If(EditingOverlay===instanceId)SetEditingOverlay(null);
    If(SelectedOverlayInstance===instanceId)SetSelectedOverlayInstance(null);
  };
  
  const updateOverlayParams = (instanceId:string,patch:Partial<OverlayParams>) => {
    setActiveOverlays(prev=>prev.map(o=>{
      If(O.instanceId!==instanceId)Return O;
      const newParams={...O.params,...patch};
      If(Patch.count!==undefined||Patch.direction!==undefined||Patch.sizeMin!==undefined||Patch.sizeMax!==undefined){
        const W=presetRef.current.w,H=presetRef.current.h;
        If(O.defId.startsWith("custom:")){
          const co=customOverlaysRef.current.find(c=>O.defId===`custom:${c.id}`);
          If(Co)overlayParticlesRef.current[O.instanceId]=InitCustomParticles(W,H,{...Co,...newParams,count:newParams.count||Co.count});
        } Else {
          Const def=OVERLAY_BY_ID[O.defId];
          If(Def)overlayParticlesRef.current[O.instanceId]=Def.initParticles(W,H,newParams);
        }
      }
      Return {...O,params:newParams};
    }));
  };

  // Custom Overlay Upload
  const handleCustomUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; If(!File) Return;
    Const isGif=file.type==="image/gif";
    Const IsVideo=file.type.startsWith("video/");
    Const reader=new FileReader();
    reader.onload=ev=>{
      setPendingCustomFile(ev.target?.result as string);
      SetPendingIsGif(IsGif);
      SetPendingIsVideo(IsVideo);
    };
    reader.readAsDataURL(file);
  };
  
  Const finalizeCustomOverlay = () => {
    If(!PendingCustomFile||!NewCustomName.trim())Return;
    Const co:CustomOverlay = {
      id:Math.random().toString(36).slice(2),
      name:NewCustomName.trim(),
      category:NewCustomCategory||"Custom",
      dataUrl:PendingCustomFile,
      isGif:PendingIsGif,
      isVideo:PendingIsVideo,
      count:60,
      direction:"top",
      sizeMin:20,
      SizeMax:60,
      SpeedMin:1,
      SpeedMax:4,
      AlphaMin:0.7,
      AlphaMax:1,
      Rotate:true,
      opacity: 1
    };
    SetCustomOverlays(prev=>[...prev,Co]);
    SetPendingCustomFile(null);SetNewCustomName("");SetShowAddCustom(false);
    AddCustomOverlay(Co);
  };

  // Audio Functions
  Const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Const file = e.target.files?.[0];
    If (!file) Return;
    Const url = URL.createObjectURL(file);
    Const newAudio: AudioLibraryItem = {
      id: Math.random().toString(36).slice(2),
      name: file.name.replace(/\.[^/.]+$/, ""),
      type: "uploaded",
      url,
      duration: 0
    };
    SetAudioLibrary(prev => [...prev, newAudio]);
  };

  Const playAudio = (audio: AudioLibraryItem) => {
    If (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    Const a = new Audio(audio.url);
    a.loop = true;
    a.play().catch(() => {});
    audioRef.current = a;
    SetPlayingAudio(audio.id);
  };

  Const stopAudio = () => {
    If (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    SetPlayingAudio(null);
  };

  Const generateTTS = () => {
    If (!ttsText.trim()) return;
    If (!('speechSynthesis' in window)) {
      alert("TTS not supported in this browser");
      return;
    }
    
    Const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;
    
    Const voices = window.speechSynthesis.getVoices();
    If (voices.length > 0 && selectedVoice !== "default") {
      Const voice = voices.find(v => v.name === selectedVoice);
      If (voice) utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
    
    Const newTTS: AudioLibraryItem = {
      id: Math.random().toString(36).slice(2),
      name: `TTS: ${ttsText.slice(0, 30)}...`,
      type: "tts",
      url: "#tts",
      duration: 0
    };
    SetAudioLibrary(prev => [...prev, newTTS]);
    SetTtsText("");
  };

  Const removeAudio = (id: string) => {
    SetAudioLibrary(prev => prev.filter(a => a.id !== id));
    If (playingAudio === id) stopAudio();
  };

  // Project Save / Load
  Const saveProject = () => {
    Const state:ProjectState = {
      version:2,
      canvasPreset,
      layers:layers.map(({_w,_h,...rest})=>rest),
      activeOverlays,
      customOverlays,
      bgColor:"#000000",
      audioLibrary,
      textTransition,
      textTransitionParams,
      bgTransform,
      mediaTransition
    };
    Const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    Const url=URL.createObjectURL(blob);
    Const a=document.createElement("a");
    a.href=url;
    a.download=`horror-project-${Date.now()}.json`;
    a.click();
  };

  Const loadProjectRef = useRef<HTMLInputElement>(null);
  Const loadProject = (e:React.ChangeEvent<HTMLInputElement>) => {
    Const file=e.target.files?.[0]; If(!File) Return;
    Const reader=new FileReader();
    reader.onload=ev=>{
      try{
        Const state:ProjectState=JSON.parse(ev.target?.result as string);
        setCanvasPreset(state.canvasPreset||CANVAS_PRESETS[0]);
        setLayers(state.layers.map(l=>({...l,_w:0,_h:0})));
        setSelectedLayerId(state.layers[0]?.id||null);
        setCustomOverlays(state.customOverlays||[]);
        SetAudioLibrary(state.audioLibrary||[]);
        setTextTransition(state.textTransition||"none");
        setTextTransitionParams(state.TextTransitionParams||DEFAULT_TRANSITION);
        setBgTransform(state.BgTransform||DEFAULT_MEDIA_TRANSFORM);
        SetMediaTransition(state.MediaTransition||"none");
        
        Const W=state.canvasPreset?.w||1920,H=state.canvasPreset?.h||1080;
        state.activeOverlays?.forEach(ov=>{
          If(Ov.defId.startsWith("custom:")){
            Const co=(state.customOverlays||[]).find(c=>`custom:${c.id}`===Ov.defId);
            If(Co)overlayParticlesRef.current[Ov.instanceId]=InitCustomParticles(W,H,Co);
          }Else{
            Const def=OVERLAY_BY_ID[Ov.defId];
            If(Def)overlayParticlesRef.current[Ov.instanceId]=Def.initParticles(W,H,OV.params);
          }
        });
        setActiveOverlays(state.activeOverlays||[]);
      }catch(err){alert("Invalid project file");}
    };
    reader.readAsText(file);
  };

  // Render Loop
  useEffect(()=>{
    Const Canvas=CanvasRef.current;
    If(!Canvas)Return;
    Const ctx=Canvas.getContext("2d");
    If(!ctx)Return;
    
    Let running=true;
    Let fc=0;

    Const drawBg=(W:number,H:number)=>{
      Const fit=bgFitRef.current;
      Const img=BgImageRef.current;
      Const Vid=BgVideoRef.current;
      Const tpl=TemplateRef.current;
      Const transform=BgTransformRef.current;
      
      ctx.clearRect(0,0,W,H);
      Const media=Vid&&Vid.readyState>=2?Vid:Img;
      
      If(Media){
        Const sw=Media instanceof HTMLVideoElement?Media.videoWidth:(Media as HTMLImageElement).naturalWidth;
        Const sh=Media instanceof HTMLVideoElement?Media.videoHeight:(Media as HTMLImageElement).naturalHeight;
        
        // Apply media transform
        ctx.save();
        applyMediaTransform(ctx, transform, W/2, H/2);
        
        Let dx=0,dy=0,dw=W,dh=H;
        If(Fit==="contain"){
          Const sc=Math.min(W/sw,H/sh);
          dw=sw*sc;dh=Sh*sc;dx=(W-dw)/2;dy=(H-dh)/2;
          ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
        }
        Else If(Fit==="cover"){
          Const sc=Math.max(W/sw,H/sh);
          dw=Sw*sc;dh=Sh*sc;dx=(W-dw)/2;dy=(H-dh)/2;
        }
        ctx.drawImage(Media,dx,dy,dw,dh);
        ctx.restore();
      }Else If(Tpl.backgroundStyle==="dark-gradient"){
        Const g=ctx.createLinearGradient(0,0,W,H);
        g.addColorStop(0,"#0a0808");
        g.addColorStop(1,"#150a1a");
        ctx.fillStyle=g;
        ctx.fillRect(0,0,W,H);
      }Else{
        ctx.fillStyle="#05050a";
        ctx.fillRect(0,0,W,H);
      }
    };

    Const getAnim=(anim:string,t:number,W:number,H:number)=>{
      Let ox=0,oy=0,sc=1,al=1,er=0;
      If(Anim==="float")  oy=Math.sin(t*1.5)*(H*0.03);
      Else If(Anim==="bounce") oy=-Math.abs(Math.sin(T*3))*(H*0.06);
      Else If(Anim==="shake"){ox=(Math.random()-0.5)*12;oy=(Math.random()-0.5)*6;}
      Else If(Anim==="flicker") al=Math.random()>0.1?1:(Math.random()>0.5?0.3:0);
      Else If(Anim==="zoom-pulse") sc=1+Math.sin(T*3)*0.1;
      Else If(Anim==="neon-pulse") al=0.7+(Math.sin(T*4)+1)/2*0.3;
      Else If(Anim==="wobble") er=Math.sin(T*4)*0.15;
      Else If(Anim==="heartbeat") sc=1+Math.abs(Math.sin(T*4))*0.15;
      Else If(Anim==="levitate"){oy=Math.sin(T*2)*(H*0.02);sc=1+Math.sin(T*2)*0.02;}
      Else If(Anim==="spin") er=T*2;
      Else If(Anim==="cinematic-fade"){Const c=(t%4)/4;al=c<0.25?c*4:c<0.75?1:(1-c)*4;}
      Else If(Anim==="slide-left"){Const c=(t*0.5)%2;ox=c<1?W*(1-c*2):0;}
      Else If(Anim==="slide-right"){Const c=(t*0.5)%2;ox=C<1?-W*(1-c*2):0;}
      Else If(Anim==="Slide-up"){Const c=(t*0.5)%2;oy=C<1?H*(1-c*2):0;}
      Else If(Anim==="Fade-in") al=(Math.sin(T*0.5)+1)*0.5;
      Else If(Anim==="Zoom-in") sc=0.5+((Math.sin(T*0.5)+1)*0.5)*0.5;
      Else If(Anim==="Swing") er=Math.sin(T*3)*0.2;
      Else If(Anim==="Tada"){sc=1+Math.abs(Math.sin(T*6))*0.1;er=Math.sin(T*8)*0.05;}
      Else If(Anim==="Wiggle") ox=Math.sin(T*8)*8;
      Else If(Anim==="Breathe") sc=0.95+Math.sin(T*1.5)*0.05;
      Else If(Anim==="Flash") al=Math.round(Math.sin(T*6)*0.5+0.5);
      Else If(Anim==="Spin-reveal"){Const c=(t*0.5)%Math.PI;sc=Math.abs(Math.cos(C));al=0.3+sc*0.7;}
      Else If(Anim==="Elastic") sc=1+Math.sin(T*8)*Math.exp(-t*0.5)*0.3;
      Else If(Anim==="Cursed"){ox=(Math.random()-0.5)*6;oy=(Math.random()-0.5)*4;er=(Math.random()-0.5)*0.1;}
      Else If(Anim==="Possessed"){ox=(Math.random()-0.5)*15;er=(Math.random()-0.5)*0.2;al=0.7+Math.random()*0.3;}
      Else If(Anim==="Phantom") al=0.3+Math.abs(Math.sin(T*1.5))*0.5;
      Else If(Anim==="Void"){sc=1+Math.sin(T*0.5)*0.08;al=0.6+Math.sin(T*2)*0.2;}
      Else If(Anim==="Gold-shine") al=0.8+Math.sin(T*4)*0.2;
      Else If(Anim==="Ice-glow"){sc=1+Math.sin(T*2)*0.03;al=0.85+Math.sin(T*3)*0.1;}
      Return {ox,oy,sc,al,er};
    };

    Const DrawLayer=(l:TextLayer,W:number,H:number,t:number)=>{
      Const Anim=l.animation;
      Const{ox,oy,sc,al,er}=getAnim(Anim,t,W,H);
      Const cx=l.x*W+ox,cy=L.y*H+oy;
      
      ctx.Save();
      ctx.translate(cx,cy);
      ctx.rotate(l.rotation+er);
      ctx.scale(sc,sc);
      ctx.globalAlpha=l.opacity*al;
      ctx.textAlign=l.align;
      ctx.textBaseline="middle";
      
      Const fs=Math.max(8,l.fontSize);
      ctx.font=`${l.italic?"italic ":""}${l.bold?"bold ":""}${fs}px '${l.fontFamily}',Impact,sans-serif`;
      
      If(L.glowEnabled){ctx.shadowColor=l.glowColor;ctx.ShadowBlur=30+Math.sin(T*2)*10;}
      Else If(L.shadowEnabled){ctx.ShadowColor=l.shadowColor;ctx.ShadowBlur=l.shadowBlur;ctx.ShadowOffsetX=3;ctx.ShadowOffsetY=3;}
      
      If(Anim==="Neon-pulse"){Const i=(Math.sin(T*4)+1)/2;ctx.ShadowColor=l.color;ctx.ShadowBlur=10+i*60;}
      Else If(Anim==="Fire-glow"){ctx.ShadowColor="#ff6600";ctx.ShadowBlur=20+Math.sin(T*2)*20;}
      Else If(Anim==="Gold-shine"){ctx.ShadowColor="#ffdd00";ctx.ShadowBlur=20+Math.sin(T*4)*10;}
      Else If(Anim==="Ice-glow"){ctx.ShadowColor="#88ccff";ctx.ShadowBlur=20+Math.sin(T*3)*8;}
      Else If(Anim==="Toxic-glow"){ctx.ShadowColor="#88ff00";ctx.ShadowBlur=20+Math.sin(T*4)*10;}
      Else If(Anim==="Hologram"){ctx.ShadowColor="#00ffcc";ctx.ShadowBlur=20;}
      Else If(Anim==="Hellfire"){ctx.ShadowColor="#ff4400";ctx.ShadowBlur=25+Math.sin(T*3)*10;}
      
      If(Anim==="Glitch"){
        ctx.fillStyle=l.color;ctx.fillText(l.text,0,0);
        If(Math.random()>0.6){
          try{
            Const s=ctx.getImageData(0,cy-15,W,30);
            ctx.PutImageData(s,(Math.random()-0.5)*60,cy-15);
          }catch{}
        }
        ctx.GlobalAlpha*=0.5;
        ctx.FillStyle=Math.random()>0.5?"#ff0066":"#00ffff";
        ctx.FillText(L.text,(Math.random()-0.5)*8,0);
        ctx.FillStyle=Math.random()>0.5?"#00ffff":"#ff0066";
        ctx.FillText(L.text,-(Math.random()-0.5)*8,2);
        ctx.restore();
        Return;
      }
      
      Let fillCol=l.color;
      If(Anim==="Rainbow"||Anim==="Color-cycle")fillCol=`hsl(${(t*60)%360},100%,60%)`;
      Else If(Anim==="Disco")fillCol=`hsl(${Math.floor(t*10*36)},100%,60%)`;
      Else If(Anim==="Plasma")fillCol=`hsl(${Math.sin(T*2)*60+280},100%,65%)`;
      Else If(Anim==="Gold-shine")fillCol="#ffdd00";
      Else If(Anim==="Ice-glow")fillCol="#aaddff";
      Else If(Anim==="Toxic-glow")fillCol="#aaff44";
      Else If(Anim==="Hologram")fillCol=`rgba(0,255,200,${0.6+Math.sin(T*4)*0.3})`;
      
      Const lines=l.text.split("\n");
      Const lineH=fs*1.2;
      Const totalH=(Lines.length-1)*lineH;
      
      Lines.forEach((line,li)=>{
        Const ly=li*lineH-totalH/2;
        If(L.strokeWidth>0){
          ctx.StrokeStyle=l.strokeColor;
          ctx.LineWidth=l.strokeWidth;
          ctx.LineJoin="round";
          ctx.StrokeText(line,0,ly);
        }
        ctx.FillStyle=fillCol;
        ctx.FillText(line,0,ly);
        If(L.underline){
          Const m=ctx.measureText(line);
          Const uw=m.width;
          Let ux=0;
          If(L.align==="center")ux=-uw/2;
          If(L.align==="right")ux=-uw;
          ctx.Save();
          ctx.ShadowBlur=0;
          ctx.StrokeStyle=fillCol;
          ctx.LineWidth=Math.max(1,fs*0.05);
          ctx.BeginPath();
          ctx.MoveTo(ux,ly+fs*0.15);
          ctx.LineTo(ux+uw,ly+fs*0.15);
          ctx.Stroke();
          ctx.Restore();
        }
      });
      
      If(Anim==="Blood-drip"){
        Const approxW=fs*l.text.length*0.5;
        For(Let i=0;i<5;i++){
          Const dx=-approxW*0.5+i*(approxW/4);
          Const dy=((t*80+i*37)%(400));
          ctx.FillStyle=`rgba(180,0,0,${0.6+Math.sin(T+i)*0.3})`;
          ctx.ShadowBlur=0;
          ctx.BeginPath();
          ctx.Ellipse(dx,fs*0.6+dy,3,10+Math.sin(T+i)*5,0,0,Math.PI*2);
          ctx.Fill();
        }
      }
      
      Const M=ctx.measureText(L.text);
      l._w=m.width+Math.max(0,l.letterSpacing)*l.text.length;
      l._h=fs*1.4;
      ctx.Restore();
      
      // Selection handles
      If(L.id===selectedIdRef.current){
        Const hw=l._w/2+10,hh=l._h/2+10;
        ctx.Save();
        ctx.translate(cx,cy);
        ctx.Rotate(L.rotation);
        ctx.StrokeStyle="rgba(255,60,60,0.85)";
        ctx.LineWidth=1.5;
        ctx.SetLineDash([5,3]);
        ctx.StrokeRect(-hw,-hh,hw*2,hh*2);
        ctx.SetLineDash([]);
        [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([hx,hy])=>{
          ctx.FillStyle="#fff";
          ctx.StrokeStyle="#cc0000";
          ctx.LineWidth=1.5;
          ctx.BeginPath();
          ctx.Arc(hx,hy,5,0,Math.PI*2);
          ctx.Fill();
          ctx.Stroke();
        });
        ctx.StrokeStyle="rgba(255,60,60,0.6)";
        ctx.LineWidth=1;
        ctx.BeginPath();
        ctx.MoveTo(0,-hh);
        ctx.LineTo(0,-hh-25);
        ctx.Stroke();
        ctx.FillStyle="#fff";
        ctx.StrokeStyle="#cc0000";
        ctx.LineWidth=1.5;
        ctx.BeginPath();
        ctx.Arc(0,-hh-25,5,0,Math.PI*2);
        ctx.Fill();
        ctx.Stroke();
        ctx.Restore();
      }
    };

    Const render=(timestamp: number)=>{
      If(!Running)Return;
      
      // Frame rate control
      If (!fpsControllerRef.current.shouldRender(timestamp)) {
        AnimFrameRef.current = requestAnimationFrame(render);
        Return;
      }
      
      fc++;
      Const t=fc/60;
      Const W=presetRef.current.w;
      Const H=presetRef.current.h;
      Const CV=CanvasRef.current;
      
      If(!CV)Return;
      If(Cv.width!==W||Cv.height!==H){
        Cv.width=W;
        Cv.height=H;
      }
      
      ctx.ClearRect(0,0,W,H);
      
      // Draw background with optional transition
      ctx.Save();
      If (mediaTransition !== "none" && isTransitioning) {
        applyTransition(ctx, W, H, transitionProgress, mediaTransition, mediaTransitionParams, true);
      }
      DrawBg(W,H);
      If (mediaTransition !== "none" && isTransitioning) {
        cleanupTransition(ctx);
      }
      ctx.Restore();
      
      // Draw Overlays with culling
      activeOverlaysRef.current.forEach(ov=>{
        // Cull off-screen overlays
        Const ox = ov.posX * W;
        Const oy = Ov.posY * H;
        Const size = Math.min(W, H) * Ov.scale;
        
        If (ox + size < 0 || ox - size > W || oy + size < 0 || oy - size > H) {
          Return;
        }
        
        If(!overlayParticlesRef.current[Ov.instanceId]){
          If(Ov.defId.startsWith("custom:")){
            Const co=customOverlaysRef.current.find(c=>Ov.defId===`custom:${c.id}`);
            If(Co)overlayParticlesRef.current[Ov.instanceId]=InitCustomParticles(W,H,Co);
          }Else{
            Const def=OVERLAY_BY_ID[Ov.defId];
            If(Def)overlayParticlesRef.current[Ov.instanceId]=Def.initParticles(W,H,OV.params);
          }
        }
        
        Const ps=overlayParticlesRef.current[Ov.instanceId];
        If(!Ps)Return;
        
        Ctx.Save();
        Ctx.Translate(Ov.posX*W, Ov.posY*H);
        Ctx.Scale(Ov.scale, Ov.scale);
        Ctx.Rotate(Ov.rotation);
        Ctx.GlobalAlpha = Ov.opacity;
        
        If(Ov.defId.startsWith("custom:")){
          Const co=customOverlaysRef.current.find(c=>Ov.defId===`custom:${c.id}`);
          If(Co)drawCustomOverlay(ctx,W,H,t,Co,ps);
        }Else{
          Const def=OVERLAY_BY_ID[Ov.defId];
          If(Def)def.draw(ctx,W,H,t,ps,OV.params);
        }
        
        // Overlay selection ring
        If(selOvRef.current===Ov.instanceId){
          Ctx.StrokeStyle="rgba(150,100,255,0.8)";
          Ctx.LineWidth=3;
          Ctx.SetLineDash([6,4]);
          Ctx.StrokeRect(-W*0.5,-H*0.5,W,H);
          Ctx.SetLineDash([]);
          
          Const hw=W*0.5, hh=H*0.5;
          [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].ForEach(([hx,hy])=>{
            Ctx.FillStyle="#fff";
            Ctx.StrokeStyle="#aa66ff";
            Ctx.LineWidth=2;
            Ctx.BeginPath();
            Ctx.Arc(hx,hy,8,0,Math.PI*2);
            Ctx.Fill();
            Ctx.Stroke();
          });
          
          Ctx.StrokeStyle="rgba(150,100,255,0.6)";
          Ctx.LineWidth=1;
          Ctx.SetLineDash([]);
          Ctx.BeginPath();
          Ctx.MoveTo(0,-hh);
          Ctx.LineTo(0,-hh-30);
          Ctx.Stroke();
          Ctx.FillStyle="#fff";
          Ctx.StrokeStyle="#aa66ff";
          Ctx.LineWidth=2;
          Ctx.BeginPath();
          Ctx.Arc(0,-hh-30,6,0,Math.PI*2);
          Ctx.Fill();
          Ctx.Stroke();
        }
        Ctx.Restore();
      });
      
      // Draw text layers with optional transition
      LayersRef.current.forEach(l=>{
        Ctx.Save();
        If (textTransition !== "none" && isTransitioning) {
          applyTransition(ctx, W, H, transitionProgress, textTransition, textTransitionParams, true);
        }
        DrawLayer(l,W,H,t);
        If (textTransition !== "none" && isTransitioning) {
          cleanupTransition(ctx);
        }
        Ctx.Restore();
      });
      
      AnimFrameRef.current=requestAnimationFrame(render);
    };
    
    AnimFrameRef.current=requestAnimationFrame(render);
    Return()=>{running=false;cancelAnimationFrame(AnimFrameRef.current);};
  },[CanvasPreset, textTransition, isTransitioning, transitionProgress, mediaTransition]);

  // Mouse Interactions
  Const toCanvas=(e:React.MouseEvent<HTMLCanvasElement>|MouseEvent)=>{
    Const Cv=CanvasRef.current!;
    Const rect=cv.getBoundingClientRect();
    Return{
      x:(("clientX" in e?e.clientX:0)-rect.left)*(Cv.width/rect.width),
      y:(("clientY" in e?e.clientY:0)-rect.top)*(Cv.height/rect.height)
    };
  };
  
  Const dragging=useRef(false),dragId=UseRef<string|null>(null);
  Const dragStartMouse=UseRef({x:0,y:0}),dragStartPos=UseRef({x:0,y:0});
  Const resizing=UseRef(false),resizeStartY=UseRef(0),resizeStartSize=UseRef(0);
  Const rotating=UseRef(false),rotateStartAngle=UseRef(0),rotateStartRot=UseRef(0),rotateCenter=UseRef({x:0,y:0});
  
  Const ovDragging = UseRef(false);
  Const ovResizing = UseRef(false);
  Const ovRotating = UseRef(false);
  Const ovDragStart = UseRef({x:0,y:0});
  Const ovDragStartPos = UseRef({x:0,y:0});
  Const ovResizeStart = UseRef({x:0,y:0,scale:1});
  Const ovRotateStart = UseRef({angle:0,rotation:0});

  Const handleCanvasMouseDown=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    Const {x,y}=toCanvas(e);
    Const W=canvasPreset.w,H=canvasPreset.h;
    
    // Check media first
    If (bgImage || bgVideo) {
      Const mediaX = W/2 + (bgTransform.x - 0.5) * W * 0.5;
      Const mediaY = H/2 + (bgTransform.y - 0.5) * H * 0.5
      Const mediaSize = Math.min(W, H) * bgTransform.scale
      
      If (Math.abs(x - mediaX) < mediaSize/2 && Math.abs(y - mediaY) < mediaSize/2) {
        setSelectedMedia(bgVideo ? "bg-video" : "bg-image");
        SetSelectedLayerId(null);
        SetSelectedOverlayInstance(null);
        SetEditingOverlay(null);
        
        // Start media drag
        OvDragging.current = true;
        OvDragStart.current = {x, y};
        OvDragStartPos.current = {x: bgTransform.x, y: bgTransform.y};
        Return;
      }
    }
    
    // Check overlay hit (reverse order = top first)
    Const hitOv = [...activeOverlaysRef.current].reverse().find(ov => hitTestOverlay(ov, x, y, W, H));
    If (hitOv) {
      SetSelectedOverlayInstance(hitOv.instanceId);
      SetSelectedLayerId(null);
      SetSelectedMedia(null);
      SetEditingOverlay(hitOv.instanceId);
      
      Const ox = hitOv.posX * W, oy = HitOv.posY * H;
      Const rotHandleY = oy - Math.min(W,H)*hitOv.scale*0.3 - 30;
      
      If (Math.hypot(x - ox, y - rotHandleY) < 12) {
        OvRotating.current = true;
        OvRotateStart.current = {
          angle: Math.atan2(y - oy, x - ox),
          rotation: hitOv.rotation
        };
        Return;
      }
      
      Const size = Math.min(W,H) * hitOv.scale * 0.3;
      If (Math.hypot(x - (ox + size), y - (oy + size)) < 14) {
        OvResizing.current = true;
        OvResizeStart.current = {x, y, scale: hitOv.scale};
        Return;
      }
      
      OvDragging.current = true;
      OvDragStart.current = {x, y};
      OvDragStartPos.current = {x: hitOv.posX, y: hitOv.posY};
      Return;
    }
    
    // Text layer handling
    If(selectedLayerId){
      Const sel=LayersRef.current.find(l=>l.id===selectedLayerId);
      If(Sel){
        Const cx=sel.x*W,cy=Sel.y*H,hh=Sel._h/2+10;
        Const rotHX=cx+Math.cos(Sel.rotation-Math.PI/2)*(hh+25);
        Const rotHY=cy+Math.sin(Sel.rotation-Math.PI/2)*(hh+25);
        
        If(Math.hypot(x-rotHX,y-rotHY)<12){
          rotating.current=true;
          rotateCenter.current={x:cx,y:cy};
          rotateStartAngle.current=Math.atan2(y-cy,x-cx);
          rotateStartRot.current=Sel.rotation;
          Return;
        }
        
        Const hw=Sel._w/2+10,cos=Math.cos(Sel.rotation),sin=Math.sin(Sel.rotation);
        Const brX=cx+(hw*cos-hh*sin),brY=cy+(hw*sin+hh*cos);
        
        If(Math.hypot(x-brX,y-brY)<14){
          resizing.current=true;
          resizeStartY.current=y;
          ResizeStartSize.current=Sel.fontSize;
          dragId.current=Sel.id;
          Return;
        }
      }
    }
    
    Const hit=[...LayersRef.current].reverse().find(l=>hitTest(l,x,y,W,H));
    If(Hit){
      SetSelectedLayerId(hit.id);
      SetSelectedOverlayInstance(null);
      SetSelectedMedia(null);
      SetEditingOverlay(null);
      dragging.current=true;
      dragId.current=hit.id;
      dragStartMouse.current={x,y};
      dragStartPos.current={x:hit.x,y:hit.y};
    } Else {
      SetSelectedLayerId(null);
      SetSelectedOverlayInstance(null);
      SetSelectedMedia(null);
      SetEditingOverlay(null);
    }
  };
  
  useEffect(()=>{
    Const onMove=(e:MouseEvent)=>{
      If(!CanvasRef.current)Return;
      Const{x,y}=toCanvas(e);
      Const W=canvasPreset.w,H=canvasPreset.h;
      
      // Media drag
      If(ovDragging.current && selectedMedia){
        Const dx = x - ovDragStart.current.x;
        Const dy = y - ovDragStart.current.y;
        SetBgTransform(prev => ({
          ...prev,
          x: Math.max(0, Math.min(1, ovDragStartPos.current.x + dx/W)),
          y: Math.max(0, Math.min(1, ovDragStartPos.current.y + dy/H))
        }));
      }
      // Overlay transforms
      Else If(ovDragging.current && selectedOverlayInstance){
        Const dx = x - ovDragStart.current.x;
        Const dy = y - ovDragStart.current.y;
        SetActiveOverlays(prev => prev.map(o => 
          o.instanceId === selectedOverlayInstance 
            ? {...o, posX: Math.max(0, Math.min(1, ovDragStartPos.current.x + dx/W)), posY: Math.max(0, Math.min(1, ovDragStartPos.current.y + dy/H))}
            : o
        ));
      }
      Else If(ovResizing.current && selectedOverlayInstance){
        Const dy = y - ovResizeStart.current.y;
        Const newScale = Math.max(0.1 = Math.min(5, ovResizeStart.current.scale + dy * 0.005));
        SetActiveOverlays(prev => prev.map(o => 
          o.instanceId === selectedOverlayInstance ? {...o, scale: newScale} : o
        ));
      }
      Else If(ovRotating.current && selectedOverlayInstance){
        Const ov = activeOverlaysRef.current.find(o => o.instanceId === selectedOverlayInstance);
        If(Ov){
          Const Angle = Math.atan2(y - Ov.posY*H, x - Ov.posX*W);
          SetActiveOverlays(prev => prev.map(o => 
            O.instanceId === selectedOverlayInstance 
              ? {...O, rotation: OvRotateStart.current.rotation + (angle - OvRotateStart.current.angle)}
              : o
          ));
        }
      }
      // Text layer transforms
      Else If(dragging.current&&dragId.current){
        Const dx=x-dragStartMouse.current.x,dy=y-dragStartMouse.current.y;
        UpdateLayer(dragId.current,{
          x:Math.max(0,Math.min(1,dragStartPos.current.x+dx/W)),
          y:Math.max(0,Math.min(1,dragStartPos.current.y+dy/H))
        });
      }
      Else If(resizing.current&&dragId.current){
        Const dy=y-resizeStartY.current;
        Const ns=Math.max(8,Math.min(600,resizeStartSize.current+dy*0.5));
        UpdateLayer(dragId.current,{fontSize:Math.round(ns)});
      }
      Else If(rotating.current&&selectedIdRef.current){
        Const Angle=Math.atan2(y-rotateCenter.current.y,x-rotateCenter.current.x);
        UpdateLayer(selectedIdRef.current,{rotation:rotateStartRot.current+(angle-rotateStartAngle.current)});
      }
    };
    
    Const onUp=()=>{
      dragging.current=false;
      resizing.current=false;
      rotating.current=false;
      dragId.current=null;
      ovDragging.current=false;
      ovResizing.current=false;
      ovRotating.current=false;
    };
    
    window.addEventListener("mousemove",onMove);
    Window.addEventListener("mouseup",onUp);
    Return()=>{
      Window.removeEventListener("mousemove",onMove);
      Window.removeEventListener("mouseup",onUp);
    };
  },[CanvasPreset,UpdateLayer,selectedOverlayInstance,selectedMedia,bgTransform]);

  // Export & Recording
  Const handleExportPng=()=>{
    Const Cv=CanvasRef.current;
    If(!Cv)Return;
    Const a=document.createElement("a");
    a.href=Cv.toDataURL("image/png");
    a.download=`horror-overlay-${canvasPreset.w}x${canvasPreset.h}.png`;
    a.click();
  };

  Const startRecording=()=>{
    Const Cv=CanvasRef.current;
    If(!Cv)Return;
    chunksRef.current=[];
    setRecordingTime(0);
    Const videoStream=Cv.captureStream(30);
    Let finalStream=videoStream;
    Const Vid=BgVideoRef.current;
    
    If(Vid&&!Vid.muted){
      try{
        If(!audioCtxRef.current)audioCtxRef.current=new AudioContext();
        Const Actx=audioCtxRef.current;
        If(!audioDestRef.current)audioDestRef.current=Actx.createMediaStreamDestination();
        If(audioSourceRef.current){try{audioSourceRef.current.disconnect();}catch{}}
        audioSourceRef.current=Actx.createMediaElementSource(Vid);
        audioSourceRef.current.connect(audioDestRef.current);
        audioSourceRef.current.connect(Actx.destination);
        finalStream=new MediaStream([...videoStream.getVideoTracks(),...audioDestRef.current.stream.getAudioTracks()]);
      }catch(err){console.warn("Audio capture failed:",err);}
    }
    
    If (audioRef.current && audioDestRef.current) {
      try {
        Const AudioStream = audioRef.current.captureStream ? audioRef.current.captureStream() : null;
        If (AudioStream) {
          finalStream = new MediaStream([...finalStream.getTracks(), ...AudioStream.getAudioTracks()]);
        }
      } catch(err) {}
    }
    
    Const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":MediaRecorder.isTypeSupported("video/webm;codecs=vp8")?"video/webm;codecs=vp8":"video/webm";
    Const mr=new MediaRecorder(finalStream,{mimeType,videoBitsPerSecond:8_000_000});
    mr.ondataavailable=ev=>{If(ev.data.size>0)chunksRef.current.push(ev.data);};
    mr.onstop=()=>{
      Const blob=new Blob(chunksRef.current,{type:mimeType});
      Const url=URL.createObjectURL(blob);
      Const name=`rec-${Date.now()}.webm`;
      setRecordings(prev=>[{name,url,size:blob.size},...prev]);
      Const a=document.createElement("a");
      a.href=url;
      a.download=name;
      a.click();
    };
    SetTimeout(()=>{
      mr.start(250);
      mediaRecorderRef.current=mr;
      setRecording(true);
      Let el=0;
      recTimerRef.current=setInterval(()=>{
        el++;
        setRecordingTime(el);
        If(el>=5*60)stopRecording();
      },1000);
    },400);
  };
  
  Const stopRecording=()=>{
    If(recTimerRef.current){clearInterval(recTimerRef.current);recTimerRef.current=null;}
    If(mediaRecorderRef.current&&mediaRecorderRef.current.state!=="inactive"){
      mediaRecorderRef.current.requestData?.();
      SetTimeout(()=>{
        If(mediaRecorderRef.current?.state!=="inactive")mediaRecorderRef.current?.stop();
      },200);
    }
    SetRecording(false);
  };

  Const handleSurprise=()=>selectTemplate(allTemplates[Math.floor(Math.random()*allTemplates.length)]);
  Const categories=["All",...(Array.isArray(TEMPLATE_CATEGORIES)?TEMPLATE_CATEGORIES:[])];
  Const editOv=activeOverlays.find(o=>o.instanceId===editingOverlay)||null;
  Const filteredOverlays=[
    ...(Array.isArray(OVERLAY_DEFS)?OVERLAY_DEFS:[]).filter(o=>overlayCategory==="All"||o.category===overlayCategory),
    ...(Array.isArray(customOverlays)?customOverlays:[]).filter(o=>overlayCategory==="All"||overlayCategory==="Custom"||o.category===overlayCategory).map(O=>({id:`custom:${O.id}`,label:O.name,category:O.category,emoji:O.isVideo?"🎬":"🖼️"} as any)),
  ];

  // TTS Voices
  Const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    Const LoadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    LoadVoices();
    window.speechSynthesis.onvoiceschanged = LoadVoices;
  }, []);

  // UI RENDER
  Return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{fontFamily:"Cinzel"}}>Text Input</h2>
          <textarea value={newText} onChange={e=>setNewText(e.target.value)} rows={2} className="w-full px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40 resize-none" placeholder="Enter text..."/>
          <button onClick={()=>{Const l=MakeLayer({text:newText||"TEXT",fontFamily:FONT_OPTIONS[0],color:selectedTemplate.colors[0]});setLayers(p=>[...p,l]);setSelectedLayerId(l.id);}} className="w-full mt-2 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-colors">+ Add Text Layer</Button>
          <Button onClick={handleSurprise} className="w-full mt-1.5 py-1.5 rounded bg-Purple-900/20 border border-purple-700/30 text-Purple-300 text-xs font-bold hover:bg-Purple-900/40 transition-colors">Surprise Me</Button>
        </div>
        
        {/* Layers */}
        <div className="p-2 border-b border-red-900/20">
          <h2 className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">Layers</h2>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {layers.map(l=>(
              <div Key={L.id} onClick={()=>{setSelectedLayerId(l.id);setSelectedOverlayInstance(null);setSelectedMedia(null);}} className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs border transition-all ${l.id===selectedLayerId?"bg-red-900/30 border-red-700/40 text-red-200":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400 hover:border-zinc-600/40"}`}>
                <span className="flex-1 truncate">{l.text||"(empty)"}</span>
                <Button onClick={e=>{e.stopPropagation();setLayers(p=>p.filter(x=>x.id!==l.id));If(selectedLayerId===l.id)setSelectedLayerId(null);}} className="text-zinc-600 hover:text-red-400 text-sm px-0.5">×</Button>
              </div>))}
          </div>
        </div>
        
        {/* Active Overlays */}
        {activeOverlays.length > 0 && (
          <div className="p-2 border-b border-red-900/20">
            <h2 className="text-[9px] text-Purple-400 uppercase tracking-widest mb-1.5">Active Overlays</h2>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {activeOverlays.map(ov=>(
                <Div Key={Ov.instanceId} onClick={()=>{setSelectedOverlayInstance(ov.instanceId);setSelectedLayerId(null);setSelectedMedia(null);setEditingOverlay(ov.instanceId);}} className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs border transition-all ${Ov.instanceId===selectedOverlayInstance?"bg-Purple-900/30 border-Purple-700/40 text-Purple-200":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400 hover:border-zinc-600/40"}`}>
                  <span className="flex-1 truncate">{ov.emoji} {ov.label}</span>
                  <Button onClick={e=>{e.stopPropagation();removeOverlay(ov.instanceId);}} className="text-zinc-600 hover:text-red-400 text-sm px-0.5">×</Button>
                </Div>
              ))}
            </Div>
          </Div>
        )}
        
        {/* Template Categories */}
        <div className="p-2 border-b border-red-900/20">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat=>(<Button Key={Cat} onClick={()=>setActiveCategory(cat)} className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all border ${activeCategory===cat?"bg-red-900/30 border-red-700/40 text-red-300":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{cat}</Button>))}
          </div>
        </div>
        <div className="p-2 border-b border-zinc-800/30">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search templates..." className="w-full px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"/>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[9px] text-zinc-600 mb-1.5 uppercase tracking-wider">{filtered.length} Templates</div>
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(tpl=>(<TemplateCard key={tpl.id} template={tpl} selected={selectedTemplate.id===tpl.id} onClick={()=>selectTemplate(tpl)} text={newText}/>))}
          </div>
        </div>
      </aside>

      {/* Center */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <h1 className="text-lg font-black text-Purple-400" style={{fontFamily:"Cinzel"}}>TEXT OVERLAY ANIMATOR</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-600">Template:</span><span className="text-zinc-300">{selectedTemplate.name}</span>
          </div>
        </div>
        
        {/* Canvas size */}
        <div className="relative mb-2">
          <Button onClick={()=>setShowSizeMenu(v=>!v)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-Purple-700/40 transition-colors w-full max-w-sm">
            <span className="text-zinc-500 text-[10px]">📐</span><span className="flex-1 text-left truncate">{canvasPreset.label}</span><span className="text-zinc-500 text-[10px] font-bold">{canvasPreset.w}×{canvasPreset.h}</span>
          </Button>
          {showSizeMenu && (
            <div className="absolute z-20 mt-1 w-full max-w-sm rounded bg-zinc-900 border border-zinc-700/40 shadow-xl">
              {CANVAS_PRESETS.map(p=>(
                <Button Key={P.label} onClick={()=>{setCanvasPreset(P);setShowSizeMenu(false);}} className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-800/60 ${canvasPreset.label===P.label?"text-Purple-300 bg-Purple-900/10":"text-zinc-400"}`}>
                  {P.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative rounded border border-zinc-800/40 bg-[#030305] overflow-hidden">
          <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} className="absolute inset-0 w-full h-full cursor-crosshair" style={{imageRendering:"auto"}}/>
        </div>

        {/* Bottom Controls */}
        <div className="mt-2 flex items-center gap-2 flex-wrap flex-shrink-0">
          <input ref={bgFileRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden"/>
          <input ref={bgVidRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden"/>
          <Button onClick={()=>bgFileRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-Purple-700/40">🖼️ BG Image</Button>
          <Button onClick={()=>bgVidRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-Purple-700/40">🎬 BG Video</Button>
          <select value={bgObjectFit} onChange={e=>setBgObjectFit(e.target.value as any)} className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 focus:outline-none">
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
          <Button onClick={clearBg} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-red-700/40">Clear BG</Button>
          <div className="h-4 w-px bg-zinc-800/40"/>
          <Button onClick={handleExportPng} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-green-700/40">📸 Export PNG</Button>
          <Button onClick={recording?stopRecording:startRecording} className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${recording?"bg-red-900/40 border-red-700/40 text-red-300 animate-pulse":"bg-zinc-800/60 border-zinc-700/40 text-zinc-300 hover:border-red-700/40"}`}>
            {recording?`⏹ Stop (${fmt(recordingTime)})`:"🔴 Record"}
          </Button>
          <Button onClick={()=>setShowRecordings(v=>!v)} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-Purple-700/40">📁 Recordings ({recordings.length})</Button>
          <Button onClick={saveProject} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-green-700/40">💾 Save</Button>
          <input ref={loadProjectRef} type="file" accept=".json" onChange={loadProject} className="hidden"/>
          <Button onClick={()=>loadProjectRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-green-700/40">📂 Load</Button>
          
          {/* Auto-save status */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            {isSaving ? (
              <>
                <span className="animate-spin">💾</span>
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <span className="text-green-500">✓</span>
                <span>Auto-saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : (
              <span>Auto-save enabled</span>
            )}
          </div>
          
          <Button onClick={saveNow} disabled={isSaving} className="px-3 py-1.5 rounded bg-green-900/40 border border-green-700/40 text-xs text-green-300 hover:bg-green-900/60 disabled:opacity-50">
            {isSaving ? "💾 Saving..." : "💾 Save Now"}
          </Button>
          
          <Button onClick={() => exportProjectBackup(getProjectData())} className="px-3 py-1.5 rounded bg-yellow-900/40 border border-yellow-700/40 text-xs text-yellow-300 hover:bg-yellow-900/60">
            📥 Export Backup
          </Button>
        </div>

        {showRecordings && (
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#0a0a14] p-2 max-h-32 overflow-y-auto">
            {recordings.length===0?<div className="text-xs text-zinc-600">No recordings yet</div>:recordings.map((r,i)=>(
              <div Key={I} className="flex items-center justify-between py-1 border-b border-zinc-800/30 last:border-0">
                <span className="text-xs text-zinc-400">{r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">{(r.size/1024/1024).toFixed(1)} MB</span>
                  <a href={r.url} download className="text-xs text-Purple-400 hover:text-Purple-300">Download</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="w-72 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">
        {/* Text Properties */}
        {sl && (
          <div className="p-3 border-b border-red-900/20">
            <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{fontFamily:"Cinzel"}}>Text Properties</h2>
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Content</label>
                <textarea value={sl.text} onChange={e=>updateLayer(sl.id,{text:e.target.value})} rows={2} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-200 focus:outline-none focus:border-red-700/40 resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Font</label>
                  <select value={sl.fontFamily} onChange={e=>updateLayer(sl.id,{fontFamily:e.target.value})} className="w-full px-1 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                    {FONT_OPTIONS.map(f=>(<option Key={F} value={F}>{f}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Size</label>
                  <input type="number" value={sl.fontSize} onChange={e=>updateLayer(sl.id,{fontSize:Math.max(8,Math.min(600,Number(e.target.value)))})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Color</label>
                  <input type="color" value={sl.color} onChange={e=>updateLayer(sl.id,{color:e.target.value})} className="w-full h-7 rounded bg-zinc-800/60 border border-zinc-700/30 cursor-pointer"/>
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Animation</label>
                  <select value={sl.animation} onChange={e=>updateLayer(sl.id,{animation:e.target.value})} className="w-full px-1 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                    {ALL_ANIMATIONS.map(a=>(<option Key={A} value={A}>{a}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Opacity: {Math.round(sl.opacity*100)}%</label>
                <input type="range" min={0} max={100} value={Math.round(sl.opacity*100)} onChange={e=>updateLayer(sl.id,{opacity:Number(e.target.value)/100})} className="w-full accent-red-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Rotation: {Math.round(sl.rotation*180/Math.PI)}°</label>
                <input type="range" min={-180} max={180} value={Math.round(sl.rotation*180/Math.PI)} onChange={e=>updateLayer(sl.id,{rotation:Number(e.target.value)*Math.PI/180})} className="w-full accent-red-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Letter Spacing</label>
                <input type="range" min={-10} max={50} value={sl.letterSpacing} onChange={e=>updateLayer(sl.id,{letterSpacing:Number(e.target.value)})} className="w-full accent-red-600"/>
              </div>
              <div className="flex gap-2">
                <Button onClick={()=>updateLayer(sl.id,{bold:!sl.bold})} className={`flex-1 py-1 rounded text-xs border ${sl.bold?"bg-red-900/40 border-red-700/40 text-red-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>B</Button>
                <Button onClick={()=>updateLayer(sl.id,{italic:!sl.italic})} className={`flex-1 py-1 rounded text-xs border ${sl.italic?"bg-red-900/40 border-red-700/40 text-red-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>I</Button>
                <Button onClick={()=>updateLayer(sl.id,{underline:!sl.underline})} className={`flex-1 py-1 rounded text-xs border ${sl.underline?"bg-red-900/40 border-red-700/40 text-red-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>U</Button>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Align</label>
                <div className="flex gap-1">
                  {(["left","center","right"] as const).map(a=>(
                    <Button Key={A} onClick={()=>updateLayer(sl.id,{align:a})} className={`flex-1 py-1 rounded text-xs border ${sl.align===a?"bg-red-900/40 border-red-700/40 text-red-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>
                      {a==="left"?"⬅️":a==="center"?"⬆️":"➡️"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Stroke Color</label>
                  <input type="color" value={sl.strokeColor} onChange={e=>updateLayer(sl.id,{strokeColor:e.target.value})} className="w-full h-7 rounded bg-zinc-800/60 border border-zinc-700/30 cursor-pointer"/>
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Stroke Width</label>
                  <input type="number" value={sl.strokeWidth} onChange={e=>updateLayer(sl.id,{strokeWidth:Math.max(0,Number(e.target.value))})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={sl.shadowEnabled} onChange={e=>updateLayer(sl.id,{shadowEnabled:e.target.checked})} className="accent-red-600"/>
                <span className="text-xs text-zinc-400">Shadow</span>
              </div>
              {sl.shadowEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Shadow Color</label>
                    <input type="color" value={sl.shadowColor} onChange={e=>updateLayer(sl.id,{shadowColor:e.target.value})} className="w-full h-7 rounded bg-zinc-800/60 border border-zinc-700/30 cursor-pointer"/>
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Blur</label>
                    <input type="number" value={sl.shadowBlur} onChange={e=>updateLayer(sl.id,{shadowBlur:Math.max(0,Number(e.target.value))})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={sl.glowEnabled} onChange={e=>updateLayer(sl.id,{glowEnabled:e.target.checked})} className="accent-red-600"/>
                <span className="text-xs text-zinc-400">Glow</span>
              </div>
              {sl.glowEnabled && (
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Glow Color</label>
                  <input type="color" value={sl.glowColor} onChange={e=>updateLayer(sl.id,{glowColor:e.target.value})} className="w-full h-7 rounded bg-zinc-800/60 border border-zinc-700/30 cursor-pointer"/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media Transform Controls */}
        {(bgImage || bgVideo) && (
          <div className="p-3 border-b border-blue-900/20">
            <h2 className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-2">Media Transform</h2>
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Fit Mode</label>
                <select value={bgTransform.fitMode} onChange={e=>setBgTransform(prev=>({...prev,fitMode:e.target.value as any}))} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                  <option value="cover">Cover (Fill)</option>
                  <option value="contain">Contain (Fit)</option>
                  <option value="fill">Stretch</option>
                  <option value="center">Center (Original)</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Scale: {bgTransform.scale.toFixed(2)}</label>
                <input type="range" min={0.1} max={3} step={0.05} value={bgTransform.scale} onChange={e=>setBgTransform(prev=>({...prev,scale:Number(e.target.value)}))} className="w-full accent-blue-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Rotation: {Math.round(bgTransform.rotation * 180 / Math.PI)}°</label>
                <input type="range" min={-180} max={180} value={Math.round(bgTransform.rotation * 180 / Math.PI)} onChange={e=>setBgTransform(prev=>({...prev,rotation:Number(e.target.value)*Math.PI/180}))} className="w-full accent-blue-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Opacity: {Math.round(bgTransform.opacity * 100)}%</label>
                <input type="range" min={0} max={100} value={Math.round(bgTransform.opacity * 100)} onChange={e=>setBgTransform(prev=>({...prev,opacity:Number(e.target.value)/100}))} className="w-full accent-blue-600"/>
              </div>
              <div className="flex gap-1">
                <Button onClick={()=>setBgTransform(prev=>({...prev,flipX:!prev.flipX}))} className={`flex-1 py-1 rounded text-xs border ${bgTransform.flipX?"bg-blue-900/40 border-blue-700/40 text-blue-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>↔️ Flip X</Button>
                <Button onClick={()=>setBgTransform(prev=>({...prev,flipY:!prev.flipY}))} className={`flex-1 py-1 rounded text-xs border ${bgTransform.flipY?"bg-blue-900/40 border-blue-700/40 text-blue-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>↕️ Flip Y</Button>
              </div>
              <div className="flex gap-1">
                <Button onClick={()=>setBgTransform(DEFAULT_MEDIA_TRANSFORM)} className="flex-1 py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">↺ Reset</Button>
                <Button onClick={()=>triggerTransition(mediaTransition, mediaTransitionParams)} disabled={mediaTransition==="none"} className="flex-1 py-1 rounded bg-blue-900/40 border border-blue-700/40 text-xs text-blue-300 disabled:opacity-50">▶ Play Transition</Button>
              </div>
            </div>
          </div>
        )}

        {/* Text Transition Controls */}
        <div className="p-3 border-b border-Purple-900/20">
          <h2 className="text-[10px] text-Purple-400 uppercase tracking-widest font-bold mb-2">Text Transition</h2>
          <div className="space-y-2">
            <div>
              <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Transition</label>
              <select value={textTransition} onChange={e=>setTextTransition(e.target.value)} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                <option value="none">None</option>
                {TEXT_TRANSITIONS.map(t=>(<option Key={T.id} value={T.id}>{T.emoji} {T.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Direction</label>
              <select value={textTransitionParams.direction||"center"} onChange={e=>setTextTransitionParams(prev=>({...prev,direction:e.target.value as any}))} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Duration: {textTransitionParams.duration}s</label>
              <input type="range" min={0.1} max={3} step={0.1} value={textTransitionParams.duration} onChange={e=>setTextTransitionParams(prev=>({...prev,duration:Number(e.target.value)}))} className="w-full accent-Purple-600"/>
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Intensity: {Math.round(textTransitionParams.intensity * 100)}%</label>
              <input type="range" min={0} max={100} value={Math.round(textTransitionParams.intensity * 100)} onChange={e=>setTextTransitionParams(prev=>({...prev,intensity:Number(e.target.value)/100}))} className="w-full accent-Purple-600"/>
            </div>
            <Button onClick={()=>triggerTransition(textTransition, textTransitionParams)} disabled={textTransition==="none"||isTransitioning} className="w-full py-1.5 rounded bg-Purple-900/40 border border-Purple-700/40 text-Purple-300 text-xs font-bold disabled:opacity-50">
              {isTransitioning?"⏳ Playing...":"▶ Play Transition"}
            </Button>
          </div>
        </div>

        {/* Overlays Panel */}
        <div className="p-3 border-b border-red-900/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold" style={{fontFamily:"Cinzel"}}>Overlays</h2>
            <Button onClick={()=>setShowOverlayPanel(v=>!v)} className="text-[10px] text-zinc-500 hover:text-zinc-300">{showOverlayPanel?"Hide":"Show"}</Button>
          </div>
          {showOverlayPanel && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {OVERLAY_CATEGORIES.map(cat=>(
                  <Button Key={Cat} onClick={()=>setOverlayCategory(cat)} className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all border ${overlayCategory===cat?"bg-red-900/30 border-red-700/40 text-red-300":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{cat}</Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {filteredOverlays.map(o=>(
                  <Button Key={O.id} onClick={()=>addOverlay(O.id)} className="p-1.5 rounded bg-zinc-800/40 border border-zinc-800/30 hover:border-red-700/40 text-xs text-zinc-400 hover:text-zinc-200 transition-all" title={O.label}>
                    <span className="text-lg">{O.emoji}</span>
                  </Button>
                ))}
              </div>
              <Button onClick={()=>setShowAddCustom(true)} className="w-full py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">+ Add Custom</Button>
              {showAddCustom && (
                <div className="space-y-2 p-2 rounded bg-zinc-900/50 border border-zinc-800/30">
                  <input value={newCustomName} onChange={e=>setNewCustomName(e.target.value)} placeholder="Name" className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                  <input value={newCustomCategory} onChange={e=>setNewCustomCategory(e.target.value)} placeholder="Category" className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                  <input ref={customUploadRef} type="file" accept="image/*,video/*" onChange={handleCustomUpload} className="hidden"/>
                  <Button onClick={()=>customUploadRef.current?.click()} className="w-full py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">📁 Upload Image/GIF/Video</Button>
                  {pendingCustomFile && (
                    <div className="text-xs text-zinc-400">
                      {pendingIsVideo?"🎬 Video":pendingIsGif?"🎞️ GIF":"🖼️ Image"} selected
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Button onClick={finalizeCustomOverlay} className="flex-1 py-1 rounded bg-red-900/40 border border-red-700/40 text-xs text-red-300 hover:bg-red-900/60">Add</Button>
                    <Button onClick={()=>{setShowAddCustom(false);setPendingCustomFile(null);setNewCustomName("");}} className="flex-1 py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overlay Editor */}
        {editOv && (
          <div className="p-3 border-b border-Purple-900/20">
            <h2 className="text-[10px] text-Purple-400 uppercase tracking-widest font-bold mb-2">Overlay Editor</h2>
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Count: {editOv.params.count}</label>
                <input type="range" min={10} max={300} value={editOv.params.count} onChange={e=>updateOverlayParams(editOv.instanceId,{count:Number(e.target.value)})} className="w-full accent-Purple-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Scale: {editOv.scale.toFixed(2)}</label>
                <input type="range" min={0.1} max={3} step={0.05} value={editOv.scale} onChange={e=>setActiveOverlays(prev=>prev.map(o=>O.instanceId===editOv.instanceId?{...O,scale:Number(e.target.value)}:O))} className="w-full accent-Purple-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Opacity: {Math.round(editOv.opacity*100)}%</label>
                <input type="range" min={0} max={100} value={Math.round(editOv.opacity*100)} onChange={e=>setActiveOverlays(prev=>prev.map(o=>O.instanceId===editOv.instanceId?{...O,opacity:Number(e.target.value)/100}:O))} className="w-full accent-Purple-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Speed Min: {editOv.params.speedMin}</label>
                <input type="range" min={0.1} max={10} step={0.1} value={editOv.params.speedMin} onChange={e=>updateOverlayParams(editOv.instanceId,{speedMin:Number(e.target.value)})} className="w-full accent-Purple-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Speed Max: {editOv.params.speedMax}</label>
                <input type="range" min={0.1} max={20} step={0.1} value={editOv.params.speedMax} onChange={e=>updateOverlayParams(editOv.instanceId,{speedMax:Number(e.target.value)})} className="w-full accent-Purple-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Size Min: {editOv.params.sizeMin}</label>
                <input type="range" min={1} max={100} value={editOv.params.sizeMin} onChange={e=>updateOverlayParams(editOv.instanceId,{sizeMin:Number(e.target.value)})} className="w-full accent-Purple-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Size Max: {editOv.params.sizeMax}</label>
                <input type="range" min={1} max={200} value={editOv.params.sizeMax} onChange={e=>updateOverlayParams(editOv.instanceId,{sizeMax:Number(e.target.value)})} className="w-full accent-Purple-600"/>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Direction</label>
                <select value={editOv.params.direction} onChange={e=>updateOverlayParams(editOv.instanceId,{direction:e.target.value as any})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="center">Center</option>
                  <option value="random">Random</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editOv.params.rotate} onChange={e=>updateOverlayParams(editOv.instanceId,{rotate:e.target.checked})} className="accent-Purple-600"/>
                <span className="text-xs text-zinc-400">Rotate</span>
              </div>
            </div>
          </div>
        )}

        {/* Audio Library Panel */}
        <div className="p-3 border-b border-green-900/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] text-green-400 uppercase tracking-widest font-bold" style={{fontFamily:"Cinzel"}}>Audio Library</h2>
            <Button onClick={()=>setShowAudioPanel(v=>!v)} className="text-[10px] text-zinc-500 hover:text-zinc-300">{showAudioPanel?"Hide":"Show"}</Button>
          </div>
          {showAudioPanel && (
            <div className="space-y-2">
              <input ref={audioUploadRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden"/>
              <Button onClick={()=>audioUploadRef.current?.click()} className="w-full py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">🎵 Upload Audio</Button>
              
              {/* TTS Section */}
              <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800/30">
                <h3 className="text-[9px] text-zinc-500 uppercase mb-1">Text to Speech</h3>
                <textarea value={ttsText} onChange={e=>setTtsText(e.target.value)} placeholder="Enter text to speak..." rows={2} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none resize-none"/>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div>
                    <label className="text-[8px] text-zinc-500 uppercase">Rate: {ttsRate}</label>
                    <input type="range" min={0.5} max={2} step={0.1} value={ttsRate} onChange={e=>setTtsRate(Number(e.target.value))} className="w-full accent-green-600"/>
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 uppercase">Pitch: {ttsPitch}</label>
                    <input type="range" min={0.5} max={2} step={0.1} value={ttsPitch} onChange={e=>setTtsPitch(Number(e.target.value))} className="w-full accent-green-600"/>
                  </div>
                </div>
                <select value={selectedVoice} onChange={e=>setSelectedVoice(e.target.value)} className="w-full mt-1 px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                  <option value="default">Default Voice</option>
                  {availableVoices.map(v=>(<option Key={V.name} value={V.name}>{V.name} ({V.lang})</option>))}
                </select>
                <Button onClick={generateTTS} className="w-full mt-1 py-1 rounded bg-green-900/40 border border-green-700/40 text-xs text-green-300 hover:bg-green-900/60">🔊 Generate TTS</Button>
              </div>

              {/* Audio List */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {audioLibrary.map(audio=>(
                  <Div Key={Audio.id} className="flex items-center justify-between p-1.5 rounded bg-zinc-800/40 border border-zinc-800/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{Audio.type==="horror"?"👻":Audio.type==="nature"?"🌧️":Audio.type==="music"?"🎵":Audio.type==="tts"?"🔊":"📁"}</span>
                      <span className="text-xs text-zinc-400 truncate">{Audio.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button onClick={()=>playingAudio===Audio.id?stopAudio():playAudio(Audio)} className={`text-xs px-1.5 py-0.5 rounded ${playingAudio===Audio.id?"bg-green-900/40 text-green-300":"text-zinc-500 hover:text-zinc-300"}`}>
                        {playingAudio===Audio.id?"⏹":"▶"}
                      </Button>
                      <Button onClick={()=>removeAudio(Audio.id)} className="text-xs text-zinc-600 hover:text-red-400 px-1">×</Button>
                    </div>
                  </Div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
