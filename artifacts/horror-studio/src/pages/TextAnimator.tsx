import { useState, useRef, useEffect, useCallback } from "react";
import { useListTemplates } from "@workspace/api-client-react";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";
import {
  OVERLAY_DEFS, OVERLAY_CATEGORIES, OVERLAY_BY_ID,
  tickParticles, drawCustomOverlay, initCustomParticles, getOrCreateVideo, removeVideoCache,
  type OverlayDef, type OverlayParticle, type OverlayParams, type CustomOverlay, DEFAULT_PARAMS
} from "@/data/overlays";

// ─── Canvas Sizes ─────────────────────────────────────────────────────────────
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
  "neon-pulse","fire-glow","rainbow","color-cycle","ice-glow","gold-shine",
  "toxic-glow","plasma","hologram","disco","lava-glow","chroma","aurora",
  "cinematic-fade","typewriter","dramatic-zoom","split-reveal","curtain",
  "matrix","scan-line","hack","terminal","pixel-reveal","binary","circuit","laser",
  "float","wobble","jello","heartbeat","tada","wiggle","flash","breathe","levitate",
  "shake","jack-in-box","back-in-up","back-in-down",
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

// ─── Sound Library ────────────────────────────────────────────────────────────
interface SoundTrack {
  id: string; name: string; category: string; emoji: string;
  url?: string; dataUrl?: string; isCustom?: boolean;
  volume: number; loop: boolean;
}

const BUILTIN_SOUNDS: Omit<SoundTrack,"volume"|"loop">[] = [
  {id:"horror-ambient",name:"Horror Ambient",category:"Horror",emoji:"👻",url:"https://www.soundjay.com/misc/sounds/fail-trombone-03.mp3"},
  {id:"heartbeat",name:"Heartbeat",category:"Horror",emoji:"❤️",url:"https://freesound.org/data/previews/23/23623_136145-lq.mp3"},
  {id:"thunder-crack",name:"Thunder Crack",category:"Horror",emoji:"⚡"},
  {id:"horror-wind",name:"Horror Wind",category:"Horror",emoji:"🌬️"},
  {id:"creaky-door",name:"Creaky Door",category:"Horror",emoji:"🚪"},
  {id:"monster-roar",name:"Monster Roar",category:"Horror",emoji:"👾"},
  {id:"rain-light",name:"Light Rain",category:"Nature",emoji:"🌧️"},
  {id:"rain-heavy",name:"Heavy Rain",category:"Nature",emoji:"⛈️"},
  {id:"forest",name:"Forest Ambience",category:"Nature",emoji:"🌲"},
  {id:"ocean-waves",name:"Ocean Waves",category:"Nature",emoji:"🌊"},
  {id:"wind-nature",name:"Wind",category:"Nature",emoji:"💨"},
  {id:"fire-crackle",name:"Fire Crackling",category:"Nature",emoji:"🔥"},
  {id:"game-alert",name:"Alert",category:"Gaming",emoji:"🎮"},
  {id:"level-up",name:"Level Up",category:"Gaming",emoji:"⬆️"},
  {id:"power-up",name:"Power Up",category:"Gaming",emoji:"⚡"},
  {id:"countdown",name:"Countdown Beep",category:"Gaming",emoji:"⏳"},
  {id:"epic-drums",name:"Epic Drums",category:"Music",emoji:"🥁"},
  {id:"dark-bass",name:"Dark Bass Drop",category:"Music",emoji:"🎸"},
  {id:"choir",name:"Dark Choir",category:"Music",emoji:"🎵"},
  {id:"cinematic-hit",name:"Cinematic Hit",category:"Music",emoji:"🎬"},
];

// ─── Text Layer ────────────────────────────────────────────────────────────────
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
function makeLayer(p:Partial<TextLayer>={}):TextLayer {
  return {id:Math.random().toString(36).slice(2),text:"STARTING SOON",x:0.5,y:0.5,fontSize:120,fontFamily:"Creepster",color:"#cc0000",bold:false,italic:false,underline:false,align:"center",opacity:1,rotation:0,strokeColor:"#000000",strokeWidth:4,shadowEnabled:true,shadowColor:"#000000",shadowBlur:20,glowEnabled:false,glowColor:"#ff0000",letterSpacing:0,animation:"none",_w:0,_h:0,...p};
}

// ─── Active Overlay Instance ───────────────────────────────────────────────────
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
  isVideo?: boolean;          // FIX: video vs image distinguish karne ke liye
  videoOpacity?: number;
  videoFit?: "cover"|"contain"|"fill";
  videoLoop?: boolean;
  videoMuted?: boolean;
}

// ─── Project State ────────────────────────────────────────────────────────────
interface ProjectState {
  version: number;
  canvasPreset: { w:number; h:number; label:string };
  layers: Omit<TextLayer, "_w"|"_h">[];
  activeOverlays: ActiveOverlay[];
  customOverlays: CustomOverlay[];
  bgColor: string;
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

function hitTestLayer(l:TextLayer,cx:number,cy:number,W:number,H:number):boolean {
  const lx=l.x*W,ly=l.y*H,hw=l._w/2+10,hh=l._h/2+10;
  const cos=Math.cos(-l.rotation),sin=Math.sin(-l.rotation);
  const dx=cx-lx,dy=cy-ly;
  return Math.abs(dx*cos-dy*sin)<=hw && Math.abs(dx*sin+dy*cos)<=hh;
}

// ─── FIX: Improved overlay hit test (video vs image distinguish) ──────────────
function hitTestOverlay(ov:ActiveOverlay,cx:number,cy:number,W:number,H:number):boolean {
  if(ov.defId.startsWith("custom:")) {
    if(ov.isVideo) {
      // Video: transformed canvas area check
      const ox=(ov.posX-0.5)*W, oy=(ov.posY-0.5)*H;
      const hw=(W*ov.scale)/2, hh=(H*ov.scale)/2;
      const cx2=cx-(W/2+ox), cy2=cy-(H/2+oy);
      const cos=Math.cos(-(ov.rotation||0)), sin=Math.sin(-(ov.rotation||0));
      return Math.abs(cx2*cos-cy2*sin)<=hw && Math.abs(cx2*sin+cy2*cos)<=hh;
    } else {
      // Image/GIF particle overlay — position + scale ke hisaab se bounds
      const ox=ov.posX*W, oy=ov.posY*H;
      const halfW=W*0.4*ov.scale, halfH=H*0.4*ov.scale;
      return cx>=ox-halfW&&cx<=ox+halfW&&cy>=oy-halfH&&cy<=oy+halfH;
    }
  }
  // Particle overlays
  const ox=ov.posX*W, oy=ov.posY*H;
  const halfW=W*0.45*ov.scale, halfH=H*0.45*ov.scale;
  return cx>=ox-halfW&&cx<=ox+halfW&&cy>=oy-halfH&&cy<=oy+halfH;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TextAnimator() {
  const [selectedTemplate,setSelectedTemplate] = useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory,setActiveCategory]     = useState("All");
  const [searchQuery,setSearchQuery]           = useState("");
  const [canvasPreset,setCanvasPreset]         = useState(CANVAS_PRESETS[0]);
  const [showSizeMenu,setShowSizeMenu]         = useState(false);

  // BG
  const [bgImage,setBgImage]     = useState<HTMLImageElement|null>(null);
  const [bgVideo,setBgVideo]     = useState<HTMLVideoElement|null>(null);
  const [bgObjectFit,setBgObjectFit] = useState<"cover"|"contain"|"fill">("cover");
  const bgFileRef = useRef<HTMLInputElement>(null);
  const bgVidRef  = useRef<HTMLInputElement>(null);

  // Layers
  const [layers,setLayers]                 = useState<TextLayer[]>([makeLayer()]);
  const [selectedLayerId,setSelectedLayerId] = useState<string|null>(layers[0].id);
  const [newText,setNewText]               = useState("STARTING SOON");
  const sl = layers.find(l=>l.id===selectedLayerId)??null;
  const updateLayer = useCallback((id:string,patch:Partial<TextLayer>)=>{
    setLayers(prev=>prev.map(l=>l.id===id?{...l,...patch}:l));
  },[]);

  const [rightTab, setRightTab] = useState<"text"|"overlay"|"sound">("text");

  // Multiple Overlays
  const [activeOverlays,setActiveOverlays]         = useState<ActiveOverlay[]>([]);
  const [selectedOverlayInstance,setSelectedOverlayInstance] = useState<string|null>(null);
  const [showOverlayPanel,setShowOverlayPanel]     = useState(false);
  const [overlayCategory,setOverlayCategory]       = useState("All");
  const [editingOverlay,setEditingOverlay]         = useState<string|null>(null);
  const [customOverlays,setCustomOverlays]         = useState<CustomOverlay[]>([]);
  const [showAddCustom,setShowAddCustom]           = useState(false);
  const [newCustomName,setNewCustomName]           = useState("");
  const [newCustomCategory,setNewCustomCategory]   = useState("Custom");
  const customUploadRef  = useRef<HTMLInputElement>(null);
  const customVideoRef   = useRef<HTMLInputElement>(null);
  const overlayParticlesRef = useRef<Record<string,OverlayParticle[]>>({});

  // Sound Library
  const [soundCategory, setSoundCategory]       = useState("All");
  const [activeSounds, setActiveSounds]         = useState<SoundTrack[]>([]);
  const [customSounds, setCustomSounds]         = useState<SoundTrack[]>([]);
  const [ttsText, setTtsText]                   = useState("Welcome to my stream!");
  const [ttsVoice, setTtsVoice]                 = useState<string>("");
  const [ttsRate, setTtsRate]                   = useState(1.0);
  const [ttsPitch, setTtsPitch]                 = useState(1.0);
  const [availableVoices, setAvailableVoices]   = useState<SpeechSynthesisVoice[]>([]);
  const [ttsPlaying, setTtsPlaying]             = useState(false);
  const soundUploadRef   = useRef<HTMLInputElement>(null);
  const audioElsRef      = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(()=>{
    const load=()=>{
      const voices=speechSynthesis.getVoices();
      if(voices.length>0){setAvailableVoices(voices);if(!ttsVoice&&voices[0])setTtsVoice(voices[0].name);}
    };
    load();
    speechSynthesis.onvoiceschanged=load;
    return()=>{speechSynthesis.onvoiceschanged=null;};
  },[]);

  useEffect(() => {
    const loadFfmpeg = async () => {
      try {
        const { FFmpeg } = await import("https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js" as any);
        const { toBlobURL } = await import("https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js" as any);
        const ff = new FFmpeg();
        const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
        await ff.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ff;
        setFfmpegLoaded(true);
      } catch (e) {
        console.warn("FFmpeg load failed:", e);
      }
    };
    loadFfmpeg();
  }, []);

  const playTTS=()=>{
    if(ttsPlaying){speechSynthesis.cancel();setTtsPlaying(false);return;}
    const utt=new SpeechSynthesisUtterance(ttsText);
    const voice=availableVoices.find(v=>v.name===ttsVoice);
    if(voice)utt.voice=voice;
    utt.rate=ttsRate;utt.pitch=ttsPitch;
    utt.onend=()=>setTtsPlaying(false);
    speechSynthesis.speak(utt);setTtsPlaying(true);
  };

  const handleSoundUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file);
    const track:SoundTrack={id:Math.random().toString(36).slice(2),name:file.name.replace(/\.[^.]+$/,""),category:"Custom",emoji:"🎵",dataUrl:url,isCustom:true,volume:0.7,loop:true};
    setCustomSounds(prev=>[...prev,track]);
    if(soundUploadRef.current)soundUploadRef.current.value="";
  };

  const toggleSound=(track:SoundTrack)=>{
    const existing=activeSounds.find(s=>s.id===track.id);
    if(existing){
      if(audioElsRef.current[track.id]){audioElsRef.current[track.id].pause();audioElsRef.current[track.id].currentTime=0;delete audioElsRef.current[track.id];}
      setActiveSounds(prev=>prev.filter(s=>s.id!==track.id));
    } else {
      const src=track.dataUrl||track.url;
      if(src){
        const audio=new Audio(src);audio.loop=track.loop;audio.volume=track.volume;
        audio.play().catch(()=>{});
        audioElsRef.current[track.id]=audio;
      }
      setActiveSounds(prev=>[...prev,{...track}]);
    }
  };

  const updateSoundVolume=(id:string,vol:number)=>{
    if(audioElsRef.current[id])audioElsRef.current[id].volume=vol;
    setActiveSounds(prev=>prev.map(s=>s.id===id?{...s,volume:vol}:s));
  };

  const stopAllSounds=()=>{
    Object.values(audioElsRef.current).forEach(a=>{a.pause();a.currentTime=0;});
    audioElsRef.current={};setActiveSounds([]);
  };

  const allSoundTracks: SoundTrack[] = [
    ...BUILTIN_SOUNDS.map(s=>({...s,volume:0.7,loop:true})),
    ...customSounds,
  ];
  const soundCategories=["All","Horror","Nature","Gaming","Music","Custom"];
  const filteredSounds=allSoundTracks.filter(s=>soundCategory==="All"||s.category===soundCategory);

  // Recording
  const [recording,setRecording]     = useState(false);
  const [recordingTime,setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Array<{name:string;url:string;size:number;webmBlob?:Blob}>>([]);
  const [showRecordings,setShowRecordings] = useState(false);
  const [convertingMp4, setConvertingMp4] = useState(false);
  const [mp4Progress, setMp4Progress]     = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded]   = useState(false);
  const ffmpegRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const recTimerRef      = useRef<ReturnType<typeof setInterval>|null>(null);
  const audioCtxRef      = useRef<AudioContext|null>(null);
  const audioDestRef     = useRef<MediaStreamAudioDestinationNode|null>(null);

  // Canvas / Render
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const layersRef    = useRef(layers);
  useEffect(()=>{layersRef.current=layers;},[layers]);
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

  // FIX 1: recordingRef — render loop ke andar recording state track karne ke liye
  const recordingRef = useRef(false);
  useEffect(()=>{recordingRef.current=recording;},[recording]);

  const {data:dbTemplates=[]} = useListTemplates();
  const allTemplates:TemplateData[] = [
    ...PRESET_TEMPLATES,
    ...dbTemplates.map(t=>({id:t.id,name:t.name,category:t.category,font:t.font,animation:t.animation,colors:t.colors as string[],glow:t.glow,shadowEffect:t.shadowEffect,backgroundStyle:t.backgroundStyle,motionBehavior:t.motionBehavior,isPreset:t.isPreset})),
  ];
  const filtered = allTemplates.filter(t=>{
    const catMatch = activeCategory==="All"||t.category===activeCategory;
    const searchMatch = !searchQuery||t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch&&searchMatch;
  });

  const selectTemplate = (tpl:TemplateData) => {
    setSelectedTemplate(tpl);
    if(selectedLayerId) updateLayer(selectedLayerId,{color:tpl.colors[0],fontFamily:tpl.font,animation:tpl.animation,glowEnabled:tpl.glow,shadowEnabled:tpl.shadowEffect});
  };

  const handleBgUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{const img=new Image();img.onload=()=>{setBgImage(img);setBgVideo(null);};img.src=ev.target?.result as string;};
    reader.readAsDataURL(file);
  };
  const handleVideoUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const url=URL.createObjectURL(file);
    if(bgVideo)bgVideo.pause();
    const vid=document.createElement("video");vid.src=url;vid.loop=true;vid.muted=false;vid.playsInline=true;
    vid.play().catch(()=>{vid.muted=true;vid.play();});
    setBgVideo(vid);setBgImage(null);
  };
  const clearBg = () => {
    if(bgVideo)bgVideo.pause();setBgImage(null);setBgVideo(null);
    if(bgFileRef.current)bgFileRef.current.value="";if(bgVidRef.current)bgVidRef.current.value="";
  };

  // Overlay management
  const addOverlay = (defId:string) => {
    const def = OVERLAY_BY_ID[defId]; if(!def) return;
    const instanceId = Math.random().toString(36).slice(2);
    const newOv:ActiveOverlay = {instanceId,defId,label:def.label,emoji:def.emoji,params:{...def.params},posX:0.5,posY:0.5,scale:1,rotation:0,opacity:1,isVideo:false};
    overlayParticlesRef.current[instanceId] = def.initParticles(presetRef.current.w,presetRef.current.h,def.params);
    setActiveOverlays(prev=>[...prev,newOv]);
    setEditingOverlay(instanceId);
  };

  // FIX 3: Multiple video overlays — har instance ka unique co ID
  const addCustomOverlay = (co:CustomOverlay) => {
    const instanceId = Math.random().toString(36).slice(2);
    const isVideo = co.isVideo;

    // FIX: Multiple video overlays ke liye unique instance copy
    const instanceCo = isVideo 
      ? {...co, id: co.id + "_" + instanceId}  // unique ID per video instance
      : co;

    const newOv:ActiveOverlay = {
      instanceId,
      defId:`custom:${instanceCo.id}`,
      label:co.name, emoji:isVideo?"🎬":"🖼️",
      params:{count:co.count,direction:co.direction,sizeMin:co.sizeMin,sizeMax:co.sizeMax,speedMin:co.speedMin,speedMax:co.speedMax,alphaMin:co.alphaMin,alphaMax:co.alphaMax,rotate:co.rotate},
      posX:0.5, posY:0.5, scale:1, rotation:0, opacity:1,
      isVideo: isVideo,   // FIX: isVideo flag set karo
      videoOpacity:co.videoOpacity??1,
      videoFit:co.videoFit??"cover",
      videoLoop:co.videoLoop!==false,
      videoMuted:co.videoMuted!==false,
    };
    overlayParticlesRef.current[instanceId] = isVideo ? [] : initCustomParticles(presetRef.current.w,presetRef.current.h,co);

    // Multiple videos ke liye instanceCo bhi customOverlays mein add karo
    if(isVideo) {
      setCustomOverlays(prev=>[...prev, instanceCo]);
    }

    setActiveOverlays(prev=>[...prev,newOv]);
    setEditingOverlay(instanceId);
  };

  const removeOverlay = (instanceId:string) => {
    const ov=activeOverlays.find(o=>o.instanceId===instanceId);
    if(ov?.defId.startsWith("custom:")){
      const coId=ov.defId.replace("custom:","");
      removeVideoCache(coId);
      // FIX: Video instance copies bhi remove karo
      if(ov.isVideo) {
        setCustomOverlays(prev=>prev.filter(c=>c.id!==coId));
      }
    }
    delete overlayParticlesRef.current[instanceId];
    setActiveOverlays(prev=>prev.filter(o=>o.instanceId!==instanceId));
    if(editingOverlay===instanceId)setEditingOverlay(null);
    if(selectedOverlayInstance===instanceId)setSelectedOverlayInstance(null);
  };

  const updateOverlayParams = (instanceId:string,patch:Partial<OverlayParams>) => {
    setActiveOverlays(prev=>prev.map(o=>{
      if(o.instanceId!==instanceId)return o;
      const newParams={...o.params,...patch};
      if(patch.count!==undefined||patch.direction!==undefined){
        const W=presetRef.current.w,H=presetRef.current.h;
        if(o.defId.startsWith("custom:")){
          const co=customOverlaysRef.current.find(c=>o.defId===`custom:${c.id}`);
          if(co&&!co.isVideo)overlayParticlesRef.current[instanceId]=initCustomParticles(W,H,{...co,...newParams,count:newParams.count});
        } else {
          const def=OVERLAY_BY_ID[o.defId];
          if(def)overlayParticlesRef.current[instanceId]=def.initParticles(W,H,newParams);
        }
      }
      return {...o,params:newParams};
    }));
  };

  const updateOverlayProp = (instanceId:string,patch:Partial<ActiveOverlay>)=>{
    setActiveOverlays(prev=>prev.map(o=>o.instanceId===instanceId?{...o,...patch}:o));
  };

  // Custom overlay upload
  const [pendingCustomFile,setPendingCustomFile] = useState<string|null>(null);
  const [pendingIsGif,setPendingIsGif]           = useState(false);
  const [pendingIsVideo,setPendingIsVideo]        = useState(false);

  const handleCustomUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const isGif=file.type==="image/gif";
    const isVideo=file.type.startsWith("video/");
    if(isVideo){
      const url=URL.createObjectURL(file);
      setPendingCustomFile(url);setPendingIsGif(false);setPendingIsVideo(true);
    } else {
      const reader=new FileReader();
      reader.onload=ev=>{setPendingCustomFile(ev.target?.result as string);setPendingIsGif(isGif);setPendingIsVideo(false);};
      reader.readAsDataURL(file);
    }
  };

  const handleCustomVideoUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file);
    setPendingCustomFile(url);setPendingIsGif(false);setPendingIsVideo(true);
    setNewCustomName(prev=>prev||file.name.replace(/\.[^.]+$/,""));
  };

  const finalizeCustomOverlay = () => {
    if(!pendingCustomFile||!newCustomName.trim())return;
    const co:CustomOverlay = {
      id:Math.random().toString(36).slice(2),
      name:newCustomName.trim(),
      category:newCustomCategory||"Custom",
      dataUrl:pendingCustomFile,
      isGif:pendingIsGif,
      isVideo:pendingIsVideo,
      count:60,direction:"top",
      sizeMin:20,sizeMax:60,speedMin:1,speedMax:4,
      alphaMin:0.7,alphaMax:1,rotate:true,
      videoOpacity:1,videoFit:"cover",videoLoop:true,videoMuted:true,
    };
    // Non-video overlays ko customOverlays mein add karo (videos addCustomOverlay mein handle karein)
    if(!pendingIsVideo) {
      setCustomOverlays(prev=>[...prev,co]);
    }
    setPendingCustomFile(null);setNewCustomName("");setShowAddCustom(false);setPendingIsVideo(false);
    addCustomOverlay(co);
  };

  // Project Save / Load
  const saveProject = () => {
    const state:ProjectState = {
      version:1,canvasPreset,
      layers:layers.map(({_w,_h,...rest})=>rest),
      activeOverlays,customOverlays,bgColor:"#000000",
    };
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`horror-project-${Date.now()}.json`;a.click();
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
        const W=state.canvasPreset?.w||1920,H=state.canvasPreset?.h||1080;
        state.activeOverlays?.forEach(ov=>{
          if(ov.defId.startsWith("custom:")){
            const co=(state.customOverlays||[]).find(c=>`custom:${c.id}`===ov.defId);
            if(co&&!co.isVideo)overlayParticlesRef.current[ov.instanceId]=initCustomParticles(W,H,co);
            else overlayParticlesRef.current[ov.instanceId]=[];
          }else{
            const def=OVERLAY_BY_ID[ov.defId];
            if(def)overlayParticlesRef.current[ov.instanceId]=def.initParticles(W,H,ov.params);
          }
        });
        setActiveOverlays(state.activeOverlays||[]);
      }catch(err){alert("Invalid project file");}
    };
    reader.readAsText(file);
  };

  // ─── Render loop ─────────────────────────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d")!;let running=true,fc=0;

    const drawBg=(W:number,H:number)=>{
      const fit=bgFitRef.current,img=bgImageRef.current,vid=bgVideoRef.current,tpl=templateRef.current;
      ctx.clearRect(0,0,W,H);
      const media=vid&&vid.readyState>=2?vid:img;
      if(media){
        const sw=media instanceof HTMLVideoElement?media.videoWidth:(media as HTMLImageElement).naturalWidth;
        const sh=media instanceof HTMLVideoElement?media.videoHeight:(media as HTMLImageElement).naturalHeight;
        let dx=0,dy=0,dw=W,dh=H;
        if(fit==="contain"){const sc=Math.min(W/sw,H/sh);dw=sw*sc;dh=sh*sc;dx=(W-dw)/2;dy=(H-dh)/2;ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);}
        else if(fit==="cover"){const sc=Math.max(W/sw,H/sh);dw=sw*sc;dh=sh*sc;dx=(W-dw)/2;dy=(H-dh)/2;}
        ctx.drawImage(media,dx,dy,dw,dh);
      }else if(tpl.backgroundStyle==="dark-gradient"){
        const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"#0a0808");g.addColorStop(1,"#150a1a");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      }else{ctx.fillStyle="#05050a";ctx.fillRect(0,0,W,H);}
    };

    const getAnim=(anim:string,t:number,W:number,H:number)=>{
      let ox=0,oy=0,sc=1,al=1,er=0;
      if(anim==="float")  oy=Math.sin(t*1.5)*(H*0.03);
      else if(anim==="bounce") oy=-Math.abs(Math.sin(t*3))*(H*0.06);
      else if(anim==="shake"){ox=(Math.random()-0.5)*12;oy=(Math.random()-0.5)*6;}
      else if(anim==="flicker") al=Math.random()>0.1?1:(Math.random()>0.5?0.3:0);
      else if(anim==="zoom-pulse") sc=1+Math.sin(t*3)*0.1;
      else if(anim==="neon-pulse") al=0.7+(Math.sin(t*4)+1)/2*0.3;
      else if(anim==="wobble") er=Math.sin(t*4)*0.15;
      else if(anim==="heartbeat") sc=1+Math.abs(Math.sin(t*4))*0.15;
      else if(anim==="levitate"){oy=Math.sin(t*2)*(H*0.02);sc=1+Math.sin(t*2)*0.02;}
      else if(anim==="spin") er=t*2;
      else if(anim==="cinematic-fade"){const c=(t%4)/4;al=c<0.25?c*4:c<0.75?1:(1-c)*4;}
      else if(anim==="slide-left"){const c=(t*0.5)%2;ox=c<1?W*(1-c*2):0;}
      else if(anim==="slide-right"){const c=(t*0.5)%2;ox=c<1?-W*(1-c*2):0;}
      else if(anim==="slide-up"){const c=(t*0.5)%2;oy=c<1?H*(1-c*2):0;}
      else if(anim==="fade-in") al=(Math.sin(t*0.5)+1)*0.5;
      else if(anim==="zoom-in") sc=0.5+((Math.sin(t*0.5)+1)*0.5)*0.5;
      else if(anim==="swing") er=Math.sin(t*3)*0.2;
      else if(anim==="tada"){sc=1+Math.abs(Math.sin(t*6))*0.1;er=Math.sin(t*8)*0.05;}
      else if(anim==="wiggle") ox=Math.sin(t*8)*8;
      else if(anim==="breathe") sc=0.95+Math.sin(t*1.5)*0.05;
      else if(anim==="flash") al=Math.round(Math.sin(t*6)*0.5+0.5);
      else if(anim==="spin-reveal"){const c=(t*0.5)%Math.PI;sc=Math.abs(Math.cos(c));al=0.3+sc*0.7;}
      else if(anim==="elastic") sc=1+Math.sin(t*8)*Math.exp(-t*0.5)*0.3;
      else if(anim==="cursed"){ox=(Math.random()-0.5)*6;oy=(Math.random()-0.5)*4;er=(Math.random()-0.5)*0.1;}
      else if(anim==="possessed"){ox=(Math.random()-0.5)*15;er=(Math.random()-0.5)*0.2;al=0.7+Math.random()*0.3;}
      else if(anim==="phantom") al=0.3+Math.abs(Math.sin(t*1.5))*0.5;
      else if(anim==="void"){sc=1+Math.sin(t*0.5)*0.08;al=0.6+Math.sin(t*2)*0.2;}
      else if(anim==="gold-shine") al=0.8+Math.sin(t*4)*0.2;
      else if(anim==="ice-glow"){sc=1+Math.sin(t*2)*0.03;al=0.85+Math.sin(t*3)*0.1;}
      return {ox,oy,sc,al,er};
    };

    const drawLayer=(l:TextLayer,W:number,H:number,t:number)=>{
      const anim=l.animation;const{ox,oy,sc,al,er}=getAnim(anim,t,W,H);
      const cx=l.x*W+ox,cy=l.y*H+oy;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(l.rotation+er);ctx.scale(sc,sc);
      ctx.globalAlpha=l.opacity*al;ctx.textAlign=l.align;ctx.textBaseline="middle";
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
      else if(anim==="hellfire"){ctx.shadowColor="#ff4400";ctx.shadowBlur=25+Math.sin(t*3)*10;}
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
      const lines=l.text.split("\n");const lineH=fs*1.2;const totalH=(lines.length-1)*lineH;
      lines.forEach((line,li)=>{
        const ly=li*lineH-totalH/2;
        if(l.strokeWidth>0){ctx.strokeStyle=l.strokeColor;ctx.lineWidth=l.strokeWidth;ctx.lineJoin="round";ctx.strokeText(line,0,ly);}
        ctx.fillStyle=fillCol;ctx.fillText(line,0,ly);
        if(l.underline){const m=ctx.measureText(line);const uw=m.width;let ux=0;if(l.align==="center")ux=-uw/2;if(l.align==="right")ux=-uw;ctx.save();ctx.shadowBlur=0;ctx.strokeStyle=fillCol;ctx.lineWidth=Math.max(1,fs*0.05);ctx.beginPath();ctx.moveTo(ux,ly+fs*0.15);ctx.lineTo(ux+uw,ly+fs*0.15);ctx.stroke();ctx.restore();}
      });
      if(anim==="blood-drip"){const approxW=fs*l.text.length*0.5;for(let i=0;i<5;i++){const dx=-approxW*0.5+i*(approxW/4);const dy=((t*80+i*37)%(400));ctx.fillStyle=`rgba(180,0,0,${0.6+Math.sin(t+i)*0.3})`;ctx.shadowBlur=0;ctx.beginPath();ctx.ellipse(dx,fs*0.6+dy,3,10+Math.sin(t+i)*5,0,0,Math.PI*2);ctx.fill();}}
      const m=ctx.measureText(l.text);l._w=m.width+Math.max(0,l.letterSpacing)*l.text.length;l._h=fs*1.4;
      ctx.restore();

      // FIX 1: Recording ke doran selection handles hide karo
      if(l.id===selectedIdRef.current && !recordingRef.current){
        const hw=l._w/2+10,hh=l._h/2+10;
        ctx.save();ctx.translate(cx,cy);ctx.rotate(l.rotation);
        ctx.strokeStyle="rgba(255,60,60,0.85)";ctx.lineWidth=1.5;ctx.setLineDash([5,3]);ctx.strokeRect(-hw,-hh,hw*2,hh*2);ctx.setLineDash([]);
        [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([hx,hy])=>{ctx.fillStyle="#fff";ctx.strokeStyle="#cc0000";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(hx,hy,5,0,Math.PI*2);ctx.fill();ctx.stroke();});
        ctx.strokeStyle="rgba(255,60,60,0.6)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-hh);ctx.lineTo(0,-hh-25);ctx.stroke();ctx.fillStyle="#fff";ctx.strokeStyle="#cc0000";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-hh-25,5,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.restore();
      }
    };

    const render=()=>{
      if(!running)return;fc++;const t=fc/60;
      const W=presetRef.current.w,H=presetRef.current.h,cv=canvasRef.current;
      if(!cv)return;if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
      drawBg(W,H);

      activeOverlaysRef.current.forEach(ov=>{
        if(!overlayParticlesRef.current[ov.instanceId]){
          if(ov.defId.startsWith("custom:")){
            const co=customOverlaysRef.current.find(c=>`custom:${c.id}`===ov.defId);
            if(co&&!co.isVideo)overlayParticlesRef.current[ov.instanceId]=initCustomParticles(W,H,co);
            else overlayParticlesRef.current[ov.instanceId]=[];
          }else{
            const def=OVERLAY_BY_ID[ov.defId];
            if(def)overlayParticlesRef.current[ov.instanceId]=def.initParticles(W,H,ov.params);
          }
        }
        const ps=overlayParticlesRef.current[ov.instanceId];
        if(!ps)return;
        ctx.save();
        ctx.globalAlpha=ov.opacity??1;

        if(ov.defId.startsWith("custom:")){
          const co=customOverlaysRef.current.find(c=>`custom:${c.id}`===ov.defId);
          if(!co){ctx.restore();return;}
          if(co.isVideo){
            const ox=(ov.posX-0.5)*W, oy2=(ov.posY-0.5)*H;
            if(ov.scale!==1||ox!==0||oy2!==0||ov.rotation!==0){
              ctx.translate(W/2+ox,H/2+oy2);
              ctx.rotate(ov.rotation||0);
              ctx.scale(ov.scale,ov.scale);
              ctx.translate(-W/2,-H/2);
            }
            const vidOpacity=ov.videoOpacity??1;
            ctx.globalAlpha=(ov.opacity??1)*vidOpacity;
            const vid=getOrCreateVideo({...co,videoOpacity:1,videoFit:ov.videoFit||"cover",videoLoop:ov.videoLoop!==false,videoMuted:ov.videoMuted!==false});
            if(vid&&vid.readyState>=2){
              const fit=ov.videoFit||"cover";
              const sw=vid.videoWidth||1280,sh=vid.videoHeight||720;
              let dx=0,dy=0,dw=W,dh=H;
              if(fit==="contain"){const sc=Math.min(W/sw,H/sh);dw=sw*sc;dh=sh*sc;dx=(W-dw)/2;dy=(H-dh)/2;}
              else if(fit==="cover"){const sc=Math.max(W/sw,H/sh);dw=sw*sc;dh=sh*sc;dx=(W-dw)/2;dy=(H-dh)/2;}
              ctx.drawImage(vid,dx,dy,dw,dh);
            }
          } else {
            if(ov.scale!==1||ov.posX!==0.5||ov.posY!==0.5){
              ctx.translate((ov.posX-0.5)*W,(ov.posY-0.5)*H);ctx.scale(ov.scale,ov.scale);
            }
            drawCustomOverlay(ctx,W,H,t,co,ps);
          }
        } else {
          const def=OVERLAY_BY_ID[ov.defId];
          if(!def){ctx.restore();return;}
          if(ov.scale!==1||ov.posX!==0.5||ov.posY!==0.5){
            ctx.translate((ov.posX-0.5)*W,(ov.posY-0.5)*H);ctx.scale(ov.scale,ov.scale);
          }
          def.draw(ctx,W,H,t,ps,ov.params);
        }

        // FIX 1: Recording ke doran overlay selection ring hide karo
        if(selOvRef.current===ov.instanceId && !recordingRef.current){
          ctx.setTransform(1,0,0,1,0,0);
          ctx.strokeStyle="rgba(150,100,255,0.9)";ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.strokeRect(10,10,W-20,H-20);ctx.setLineDash([]);
          const hps=[[W/2,12],[W/2,H-12],[12,H/2],[W-12,H/2]];
          hps.forEach(([hx,hy])=>{ctx.fillStyle="#fff";ctx.strokeStyle="#aa66ff";ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.arc(hx,hy,7,0,Math.PI*2);ctx.fill();ctx.stroke();});
        }

        // FIX 2: Image overlay ke liye proper selection handles (recording ke bahar)
        if(selOvRef.current===ov.instanceId && !recordingRef.current && !ov.isVideo && ov.defId.startsWith("custom:")) {
          ctx.setTransform(1,0,0,1,0,0);
          const ox=ov.posX*W, oy=ov.posY*H;
          const hw=W*0.35*ov.scale, hh=H*0.35*ov.scale;
          ctx.strokeStyle="rgba(150,100,255,0.85)";ctx.lineWidth=2;ctx.setLineDash([6,4]);
          ctx.strokeRect(ox-hw, oy-hh, hw*2, hh*2);
          ctx.setLineDash([]);
          // Corner handles
          [[ox-hw,oy-hh],[ox+hw,oy-hh],[ox+hw,oy+hh],[ox-hw,oy+hh]].forEach(([hx,hy])=>{
            ctx.fillStyle="#fff";ctx.strokeStyle="#aa66ff";ctx.lineWidth=2;
            ctx.beginPath();ctx.arc(hx,hy,7,0,Math.PI*2);ctx.fill();ctx.stroke();
          });
          // Center dot
          ctx.fillStyle="rgba(170,102,255,0.6)";ctx.beginPath();ctx.arc(ox,oy,4,0,Math.PI*2);ctx.fill();
          // Scale handle — bottom right mein yellow dot (resize ke liye)
          ctx.fillStyle="#ffdd44";ctx.strokeStyle="#aa66ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox+hw,oy+hh,9,0,Math.PI*2);ctx.fill();ctx.stroke();
          // Rotate handle — top center mein (rotate ke liye)
          ctx.fillStyle="#44ffaa";ctx.strokeStyle="#aa66ff";ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(ox,oy-hh);ctx.lineTo(ox,oy-hh-25);ctx.strokeStyle="rgba(170,102,255,0.6)";ctx.lineWidth=1;ctx.stroke();
          ctx.fillStyle="#44ffaa";ctx.strokeStyle="#aa66ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox,oy-hh-25,7,0,Math.PI*2);ctx.fill();ctx.stroke();
        }

        ctx.restore();
      });

      layersRef.current.forEach(l=>drawLayer(l,W,H,t));
      animFrameRef.current=requestAnimationFrame(render);
    };
    animFrameRef.current=requestAnimationFrame(render);
    return()=>{running=false;cancelAnimationFrame(animFrameRef.current);};
  },[canvasPreset]);

  // Mouse interaction
  const toCanvas=(e:React.MouseEvent<HTMLCanvasElement>|MouseEvent)=>{
    const cv=canvasRef.current!,rect=cv.getBoundingClientRect();
    return{x:(("clientX" in e?e.clientX:0)-rect.left)*(cv.width/rect.width),y:(("clientY" in e?e.clientY:0)-rect.top)*(cv.height/rect.height)};
  };

  const dragging=useRef(false),dragId=useRef<string|null>(null);
  const dragStartMouse=useRef({x:0,y:0}),dragStartPos=useRef({x:0,y:0});
  const resizing=useRef(false),resizeStartY=useRef(0),resizeStartSize=useRef(0);
  const rotating=useRef(false),rotateStartAngle=useRef(0),rotateStartRot=useRef(0),rotateCenter=useRef({x:0,y:0});

  const ovDragging=useRef(false),ovDragId=useRef<string|null>(null);
  const ovDragStartMouse=useRef({x:0,y:0}),ovDragStartPos=useRef({x:0,y:0});
  const ovResizing=useRef(false),ovResizeStartY=useRef(0),ovResizeStartScale=useRef(1);
  const ovRotating=useRef(false),ovRotateStart=useRef(0),ovRotateStartRot=useRef(0),ovRotateCenter=useRef({x:0,y:0});

  const handleCanvasMouseDown=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const {x,y}=toCanvas(e);const W=canvasPreset.w,H=canvasPreset.h;

    // Check selected overlay handles first
    const selOv=activeOverlaysRef.current.find(o=>o.instanceId===selOvRef.current);
    if(selOv){
      if(selOv.isVideo){
        // Video: bottom center scale handle
        if(Math.hypot(x-(W-12),y-(H-12))<20){
          ovResizing.current=true;ovDragId.current=selOv.instanceId;
          ovResizeStartY.current=y;ovResizeStartScale.current=selOv.scale;return;
        }
        // Top center rotate handle
        if(Math.hypot(x-W/2,y-12)<20){
          ovRotating.current=true;ovDragId.current=selOv.instanceId;
          ovRotateCenter.current={x:selOv.posX*W,y:selOv.posY*H};
          ovRotateStart.current=Math.atan2(y-ovRotateCenter.current.y,x-ovRotateCenter.current.x);
          ovRotateStartRot.current=selOv.rotation||0;return;
        }
      } else if(selOv.defId.startsWith("custom:")) {
        // FIX 2: Image overlay handles
        const ox=selOv.posX*W, oy=selOv.posY*H;
        const hw=W*0.35*selOv.scale, hh=H*0.35*selOv.scale;
        // Scale handle (bottom right yellow dot)
        if(Math.hypot(x-(ox+hw), y-(oy+hh))<15){
          ovResizing.current=true;ovDragId.current=selOv.instanceId;
          ovResizeStartY.current=y;ovResizeStartScale.current=selOv.scale;return;
        }
        // Rotate handle (top center green dot)
        if(Math.hypot(x-ox, y-(oy-hh-25))<15){
          ovRotating.current=true;ovDragId.current=selOv.instanceId;
          ovRotateCenter.current={x:ox,y:oy};
          ovRotateStart.current=Math.atan2(y-oy,x-ox);
          ovRotateStartRot.current=selOv.rotation||0;return;
        }
      }
    }

    // Text layer handles
    if(selectedLayerId){
      const sel=layersRef.current.find(l=>l.id===selectedLayerId);
      if(sel){
        const cx=sel.x*W,cy=sel.y*H,hh=sel._h/2+10;
        const rotHX=cx+Math.cos(sel.rotation-Math.PI/2)*(hh+25);const rotHY=cy+Math.sin(sel.rotation-Math.PI/2)*(hh+25);
        if(Math.hypot(x-rotHX,y-rotHY)<12){rotating.current=true;rotateCenter.current={x:cx,y:cy};rotateStartAngle.current=Math.atan2(y-cy,x-cx);rotateStartRot.current=sel.rotation;return;}
        const hw=sel._w/2+10,cos=Math.cos(sel.rotation),sin=Math.sin(sel.rotation);
        const brX=cx+(hw*cos-hh*sin),brY=cy+(hw*sin+hh*cos);
        if(Math.hypot(x-brX,y-brY)<14){resizing.current=true;resizeStartY.current=y;resizeStartSize.current=sel.fontSize;dragId.current=sel.id;return;}
      }
    }

    // Hit test text layers
    const hitL=[...layersRef.current].reverse().find(l=>hitTestLayer(l,x,y,W,H));
    if(hitL){
      setSelectedLayerId(hitL.id);setSelectedOverlayInstance(null);
      dragging.current=true;dragId.current=hitL.id;dragStartMouse.current={x,y};dragStartPos.current={x:hitL.x,y:hitL.y};
      return;
    }

    // Hit test overlay layers
    const hitO=[...activeOverlaysRef.current].reverse().find(o=>hitTestOverlay(o,x,y,W,H));
    if(hitO){
      setSelectedOverlayInstance(hitO.instanceId);setSelectedLayerId(null);
      setEditingOverlay(hitO.instanceId);
      ovDragging.current=true;ovDragId.current=hitO.instanceId;
      ovDragStartMouse.current={x,y};ovDragStartPos.current={x:hitO.posX,y:hitO.posY};
      return;
    }

    setSelectedLayerId(null);setSelectedOverlayInstance(null);
  };

  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{
      if(!canvasRef.current)return;const{x,y}=toCanvas(e);const W=canvasPreset.w,H=canvasPreset.h;
      if(dragging.current&&dragId.current){
        const dx=x-dragStartMouse.current.x,dy=y-dragStartMouse.current.y;
        updateLayer(dragId.current,{x:Math.max(0,Math.min(1,dragStartPos.current.x+dx/W)),y:Math.max(0,Math.min(1,dragStartPos.current.y+dy/H))});
      } else if(resizing.current&&dragId.current){
        const dy=y-resizeStartY.current;const ns=Math.max(8,Math.min(600,resizeStartSize.current+dy*0.5));
        updateLayer(dragId.current,{fontSize:Math.round(ns)});
      } else if(rotating.current&&selectedIdRef.current){
        const angle=Math.atan2(y-rotateCenter.current.y,x-rotateCenter.current.x);
        updateLayer(selectedIdRef.current,{rotation:rotateStartRot.current+(angle-rotateStartAngle.current)});
      } else if(ovDragging.current&&ovDragId.current){
        const dx=x-ovDragStartMouse.current.x,dy=y-ovDragStartMouse.current.y;
        updateOverlayProp(ovDragId.current,{posX:Math.max(0,Math.min(1,ovDragStartPos.current.x+dx/W)),posY:Math.max(0,Math.min(1,ovDragStartPos.current.y+dy/H))});
      } else if(ovResizing.current&&ovDragId.current){
        const dy=y-ovResizeStartY.current;
        const ns=Math.max(0.1,Math.min(5,ovResizeStartScale.current+dy*0.005));
        updateOverlayProp(ovDragId.current,{scale:ns});
      } else if(ovRotating.current&&ovDragId.current){
        const angle=Math.atan2(y-ovRotateCenter.current.y,x-ovRotateCenter.current.x);
        updateOverlayProp(ovDragId.current,{rotation:ovRotateStartRot.current+(angle-ovRotateStart.current)});
      }
    };
    const onUp=()=>{
      dragging.current=false;resizing.current=false;rotating.current=false;dragId.current=null;
      ovDragging.current=false;ovResizing.current=false;ovRotating.current=false;ovDragId.current=null;
    };
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[canvasPreset,updateLayer]);

  const handleExportPng=()=>{const cv=canvasRef.current;if(!cv)return;const a=document.createElement("a");a.href=cv.toDataURL("image/png");a.download=`horror-overlay-${canvasPreset.w}x${canvasPreset.h}.png`;a.click();};

 const startRecording = async () => {
  const cv = canvasRef.current; if (!cv) return;
  chunksRef.current = []; setRecordingTime(0);

  // FIX 1: Pehle canvas ko ek frame paint karne do
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // FIX 2: captureStream BAAD mein call karo, pehle nahi
  const videoStream = cv.captureStream(30);
  
  // FIX 3: Stream mein video tracks hain ya nahi check karo
  if (videoStream.getVideoTracks().length === 0) {
    alert("Canvas stream nahi bana. Browser support check karo.");
    return;
  }

  let finalStream: MediaStream = videoStream;

  try {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: 48000 });
    }
    const actx = audioCtxRef.current;
    if (actx.state === "suspended") await actx.resume();

    audioDestRef.current = actx.createMediaStreamDestination();
    const dest = audioDestRef.current;

    const vid = bgVideoRef.current;
    if (vid && !vid.muted && vid.readyState >= 2) {
      try {
        if (!(vid as any)._srcNode) {
          (vid as any)._srcNode = actx.createMediaElementSource(vid);
        }
        (vid as any)._srcNode.connect(dest);
        (vid as any)._srcNode.connect(actx.destination);
      } catch (e) { console.warn("BG video audio:", e); }
    }

    Object.entries(audioElsRef.current).forEach(([id, audio]) => {
      try {
        if (!(audio as any)._srcNode) {
          (audio as any)._srcNode = actx.createMediaElementSource(audio);
        }
        (audio as any)._srcNode.connect(dest);
        (audio as any)._srcNode.connect(actx.destination);
      } catch (e) { console.warn(`Sound ${id}:`, e); }
    });

    if (dest.stream.getAudioTracks().length > 0) {
      finalStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);
    }
  } catch (err) {
    console.warn("Audio setup failed, video only:", err);
    finalStream = videoStream;
  }

  // FIX 4: Codec selection — VP8 sabse zyada compatible hai
  const codecCandidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  const mimeType = codecCandidates.find(c => MediaRecorder.isTypeSupported(c)) ?? "video/webm";
  
  console.log("Using mimeType:", mimeType);
  console.log("Video tracks:", finalStream.getVideoTracks().length);
  console.log("Audio tracks:", finalStream.getAudioTracks().length);

  let mr: MediaRecorder;
  try {
    mr = new MediaRecorder(finalStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 128_000,
    });
  } catch (err) {
    // FIX 5: Options fail hain toh bina options ke try karo
    console.warn("MediaRecorder with options failed, trying without:", err);
    try {
      mr = new MediaRecorder(finalStream);
    } catch (err2) {
      alert("MediaRecorder nahi bana. Browser compatible nahi.");
      return;
    }
  }

  mr.ondataavailable = ev => {
    console.log("Data chunk:", ev.data?.size);
    if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
  };

  mr.onerror = (ev) => {
    console.error("MediaRecorder error:", ev);
    stopRecording();
  };

  mr.onstop = () => {
    console.log("Total chunks:", chunksRef.current.length);
    if (chunksRef.current.length === 0) {
      alert("Recording mein koi data nahi aaya. Dobara try karo.");
      return;
    }
    const blob = new Blob(chunksRef.current, { type: mimeType });
    if (blob.size < 1000) {
      alert("Recording file bohat chhoti hai. Dobara try karo.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const name = `rec-${Date.now()}.webm`;
    setRecordings(prev => [{ name, url, size: blob.size, webmBlob: blob }, ...prev]);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  };

  // FIX 6: Start karo aur foran ek requestData trigger karo
  mr.start(500); // 500ms chunks
  mediaRecorderRef.current = mr;
  setRecording(true);
  setSelectedLayerId(null);
  setSelectedOverlayInstance(null);

  // FIX 7: 1 second baad manually ek chunk request karo
  setTimeout(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.requestData();
      console.log("Manual requestData called, chunks so far:", chunksRef.current.length);
    }
  }, 1000);

  let el = 0;
  recTimerRef.current = setInterval(() => {
    el++; setRecordingTime(el);
    if (el >= 5 * 60) stopRecording();
  }, 1000);
};
  const stopRecording=()=>{
    if(recTimerRef.current){clearInterval(recTimerRef.current);recTimerRef.current=null;}
    if(mediaRecorderRef.current&&mediaRecorderRef.current.state!=="inactive"){mediaRecorderRef.current.requestData?.();setTimeout(()=>{if(mediaRecorderRef.current?.state!=="inactive")mediaRecorderRef.current?.stop();},200);}
    setRecording(false);
  };

  const convertToMp4 = async (webmBlob: Blob, recName: string) => {
    if (!ffmpegRef.current) { alert("FFmpeg load ho raha hai, thoda wait karo..."); return; }
    setConvertingMp4(true); setMp4Progress(0);
    try {
      const ff = ffmpegRef.current;
      ff.on("progress", ({ progress }: any) => setMp4Progress(Math.round(progress * 100)));
      const data = new Uint8Array(await webmBlob.arrayBuffer());
      await ff.writeFile("input.webm", data);
      await ff.exec(["-i","input.webm","-c:v","libx264","-preset","fast","-crf","18","-c:a","aac","-b:a","320k","-movflags","+faststart","-pix_fmt","yuv420p","output.mp4"]);
      const out = await ff.readFile("output.mp4");
      const mp4Blob = new Blob([out.buffer], { type: "video/mp4" });
      const mp4Url = URL.createObjectURL(mp4Blob);
      const a = document.createElement("a"); a.href = mp4Url; a.download = recName.replace(".webm", ".mp4"); a.click();
      await ff.deleteFile("input.webm"); await ff.deleteFile("output.mp4");
    } catch (err) {
      console.error("MP4 conversion failed:", err);
      alert("MP4 conversion fail hui. WebM file download karo.");
    } finally { setConvertingMp4(false); setMp4Progress(0); }
  };

  const handleSurprise=()=>selectTemplate(allTemplates[Math.floor(Math.random()*allTemplates.length)]);
  const categories=["All",...TEMPLATE_CATEGORIES];
  const editOv=activeOverlays.find(o=>o.instanceId===editingOverlay)||null;
  const isEditOvVideo=editOv?.isVideo;
  const filteredOverlays=[
    ...OVERLAY_DEFS.filter(o=>overlayCategory==="All"||o.category===overlayCategory),
    ...customOverlays
      .filter(o=>!o.id.includes("_")) // sirf original overlays dikhao (instances nahi)
      .filter(o=>overlayCategory==="All"||overlayCategory==="Custom"||o.category===overlayCategory)
      .map(o=>({id:`custom:${o.id}`,label:o.name,category:o.category,emoji:o.isVideo?"🎬":"🖼️"} as any)),
  ];

  return (
    <div className="h-full flex overflow-hidden text-zinc-300">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{fontFamily:"Cinzel"}}>Text Input</h2>
          <textarea value={newText} onChange={e=>setNewText(e.target.value)} rows={2} className="w-full px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40 resize-none" placeholder="Enter text..."/>
          <button onClick={()=>{const l=makeLayer({text:newText||"TEXT",fontFamily:FONT_OPTIONS[0],color:selectedTemplate.colors[0]});setLayers(p=>[...p,l]);setSelectedLayerId(l.id);}} className="w-full mt-2 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-colors">+ Add Text Layer</button>
          <button onClick={handleSurprise} className="w-full mt-1.5 py-1.5 rounded bg-purple-900/20 border border-purple-700/30 text-purple-300 text-xs font-bold hover:bg-purple-900/40 transition-colors">Surprise Me</button>
        </div>
        <div className="p-2 border-b border-red-900/20">
          <h2 className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">Text Layers</h2>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {layers.map(l=>(
              <div key={l.id} onClick={()=>{setSelectedLayerId(l.id);setSelectedOverlayInstance(null);setRightTab("text");}} className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs border transition-all ${l.id===selectedLayerId?"bg-red-900/30 border-red-700/40 text-red-200":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400 hover:border-zinc-600/40"}`}>
                <span className="flex-1 truncate">{l.text||"(empty)"}</span>
                <button onClick={e=>{e.stopPropagation();setLayers(p=>p.filter(x=>x.id!==l.id));if(selectedLayerId===l.id)setSelectedLayerId(null);}} className="text-zinc-600 hover:text-red-400 text-sm px-0.5">×</button>
              </div>))}
          </div>
        </div>
        <div className="p-2 border-b border-red-900/20">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat=>(<button key={cat} onClick={()=>setActiveCategory(cat)} className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all border ${activeCategory===cat?"bg-red-900/30 border-red-700/40 text-red-300":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{cat}</button>))}
          </div>
        </div>
        <div className="p-2 border-b border-zinc-800/30">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search templates..." className="w-full px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"/>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[9px] text-zinc-600 mb-1.5 uppercase tracking-wider">{filtered.length} templates</div>
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(tpl=>(<TemplateCard key={tpl.id} template={tpl} selected={selectedTemplate.id===tpl.id} onClick={()=>selectTemplate(tpl)} text={newText}/>))}
          </div>
        </div>
      </aside>

      {/* Center */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <h1 className="text-lg font-black text-purple-400" style={{fontFamily:"Cinzel"}}>TEXT OVERLAY ANIMATOR</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-600">Template:</span><span className="text-zinc-300">{selectedTemplate.name}</span>
            {recording&&<span className="text-red-300 text-[10px] border border-red-700/40 px-1.5 py-0.5 rounded animate-pulse">● REC — Selection UI hidden</span>}
            {selectedOverlayInstance&&!recording&&<span className="text-purple-300 text-[10px] border border-purple-700/40 px-1.5 py-0.5 rounded">Overlay selected — drag to move</span>}
          </div>
        </div>
        <div className="relative mb-2">
          <button onClick={()=>setShowSizeMenu(v=>!v)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-purple-700/40 transition-colors w-full max-w-sm">
            <span className="text-zinc-500 text-[10px]">📐</span><span className="flex-1 text-left truncate">{canvasPreset.label}</span><span className="text-zinc-500 text-[10px] font-mono">{canvasPreset.w}×{canvasPreset.h}</span><span className="text-zinc-600 ml-1">▾</span>
          </button>
          {showSizeMenu&&(<div className="absolute top-full left-0 mt-1 z-50 w-80 rounded border border-zinc-700/40 bg-[#0c0c16] shadow-xl max-h-72 overflow-y-auto">
            {CANVAS_PRESETS.map((p,i)=>(<button key={i} onClick={()=>{setCanvasPreset(p);setShowSizeMenu(false);}} className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-2 ${canvasPreset.label===p.label?"bg-blue-900/40 text-blue-300":"text-zinc-400 hover:bg-zinc-800/60"}`}><span className="truncate">{p.label}</span><span className="text-zinc-600 text-[10px] font-mono">{p.w}×{p.h}</span></button>))}
          </div>)}
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
          <div className="relative rounded border border-purple-900/30 overflow-hidden bg-[#05050a]" style={{aspectRatio:`${canvasPreset.w} / ${canvasPreset.h}`,maxWidth:"100%",maxHeight:"100%",boxShadow:"0 0 30px rgba(100,0,200,0.15)"}}>
            <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block",cursor:recording?"default":"crosshair"}} onMouseDown={recording?undefined:handleCanvasMouseDown}/>
            {recording&&(<div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/50 border border-red-700/60"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/><span className="text-xs text-red-300 font-mono font-bold">REC {fmt(recordingTime)}</span></div>)}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 border border-zinc-700/30 text-[9px] text-zinc-500 font-mono">{canvasPreset.w}×{canvasPreset.h}</div>
          </div>
        </div>
        {/* Bottom controls */}
        <div className="flex items-center gap-2 mt-2 flex-wrap flex-shrink-0">
          <button onClick={handleExportPng} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 hover:border-purple-700/30">📷 PNG</button>
          <button onClick={recording?stopRecording:startRecording} className={`px-4 py-1.5 rounded text-xs font-bold border transition-all ${recording?"bg-red-600/30 border-red-500/50 text-red-300 animate-pulse":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-red-700/30"}`}>{recording?`◼ Stop ${fmt(recordingTime)}`:"● Rec"}</button>
          <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload}/>
          <button onClick={()=>bgFileRef.current?.click()} className={`px-3 py-1.5 rounded text-xs border transition-colors ${bgImage?"bg-green-900/20 border-green-700/40 text-green-300":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-green-700/30"}`}>🖼 {bgImage?"BG:Img":"Img BG"}</button>
          <input ref={bgVidRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload}/>
          <button onClick={()=>bgVidRef.current?.click()} className={`px-3 py-1.5 rounded text-xs border transition-colors ${bgVideo?"bg-blue-900/20 border-blue-700/40 text-blue-300":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-blue-700/30"}`}>🎬 {bgVideo?"BG:Vid":"Vid BG"}</button>
          {(bgImage||bgVideo)&&(<><select value={bgObjectFit} onChange={e=>setBgObjectFit(e.target.value as any)} className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"><option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option></select><button onClick={clearBg} className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-red-400">✕</button></>)}
          <button onClick={()=>setRightTab("overlay")} className={`px-3 py-1.5 rounded text-xs border transition-colors ${activeOverlays.length>0?"bg-purple-900/30 border-purple-700/40 text-purple-300":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-purple-700/30"}`}>🎭 Overlays{activeOverlays.length>0?` (${activeOverlays.length})`:""}</button>
          <button onClick={()=>setRightTab("sound")} className={`px-3 py-1.5 rounded text-xs border transition-colors ${activeSounds.length>0?"bg-green-900/30 border-green-700/40 text-green-300":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-green-700/30"}`}>🔊 Sounds{activeSounds.length>0?` (${activeSounds.length})`:""}</button>
          <button onClick={saveProject} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 hover:border-green-700/30">💾</button>
          <input ref={loadProjectRef} type="file" accept=".json" className="hidden" onChange={loadProject}/>
          <button onClick={()=>loadProjectRef.current?.click()} className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 hover:border-yellow-700/30">📂</button>
          <button onClick={()=>setShowRecordings(v=>!v)} className="ml-auto px-3 py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400">📁 ({recordings.length})</button>
        </div>

        {showRecordings && (
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#06060c] max-h-48 overflow-y-auto flex-shrink-0">
            {convertingMp4 && (
              <div className="px-3 py-2 border-b border-zinc-800/30 bg-blue-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
                  <span className="text-xs text-blue-300 font-mono">MP4 ban rahi hai... {mp4Progress}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width:`${mp4Progress}%`}}/>
                </div>
              </div>
            )}
            {recordings.length === 0
              ? <p className="text-xs text-zinc-600 p-3 text-center">No recordings yet</p>
              : recordings.map((rec, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/30">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-300 truncate">{rec.name}</div>
                      <div className="text-[9px] text-zinc-600">{(rec.size/1024/1024).toFixed(2)} MB</div>
                    </div>
                    <a href={rec.url} download={rec.name} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-[10px] text-zinc-400 hover:text-white">↓ WebM</a>
                    {rec.webmBlob && (
                      <button onClick={() => convertToMp4(rec.webmBlob!, rec.name)} disabled={convertingMp4} className="px-2 py-0.5 rounded bg-blue-900/40 border border-blue-700/40 text-[10px] text-blue-300 hover:bg-blue-900/60 disabled:opacity-40 disabled:cursor-not-allowed">🎬 MP4</button>
                    )}
                  </div>
                ))
            }
            {!ffmpegLoaded && <p className="text-[9px] text-zinc-600 px-3 py-1.5 text-center border-t border-zinc-800/30">⏳ MP4 converter load ho raha hai...</p>}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="w-60 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        <div className="flex border-b border-zinc-800/40">
          {(["text","overlay","sound"] as const).map(tab=>(
            <button key={tab} onClick={()=>setRightTab(tab)} className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold transition-colors ${rightTab===tab?"bg-red-900/20 text-red-300 border-b-2 border-red-600":"text-zinc-600 hover:text-zinc-300"}`}>
              {tab==="text"?"✏️ Text":tab==="overlay"?"🎭 Overlay":"🔊 Sound"}
            </button>))}
        </div>
        <div className="p-3">
          {/* TEXT TAB */}
          {rightTab==="text"&&sl&&(
            <div className="space-y-3">
              <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold" style={{fontFamily:"Cinzel"}}>Edit Layer</h2>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Text</label><input type="text" value={sl.text} onChange={e=>updateLayer(sl.id,{text:e.target.value})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40"/></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Animation ({ALL_ANIMATIONS.length})</label><select value={sl.animation} onChange={e=>updateLayer(sl.id,{animation:e.target.value})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">{ALL_ANIMATIONS.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Font ({FONT_OPTIONS.length})</label><select value={sl.fontFamily} onChange={e=>updateLayer(sl.id,{fontFamily:e.target.value})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">{FONT_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Font Size: <span className="text-zinc-300">{sl.fontSize}px</span></label><div className="flex items-center gap-2"><input type="range" min={8} max={600} value={sl.fontSize} onChange={e=>updateLayer(sl.id,{fontSize:Number(e.target.value)})} className="flex-1 accent-red-600"/><input type="number" min={8} max={600} value={sl.fontSize} onChange={e=>{const v=Math.max(8,Math.min(600,Number(e.target.value)||8));updateLayer(sl.id,{fontSize:v});}} className="w-14 px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none text-center"/></div></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Style</label><div className="flex gap-1.5">{([{k:"bold",l:"B",c:"font-bold"},{k:"italic",l:"I",c:"italic"},{k:"underline",l:"U",c:"underline"}] as const).map(({k,l,c})=>(<button key={k} onClick={()=>updateLayer(sl.id,{[k]:!sl[k as keyof TextLayer]})} className={`flex-1 py-1 rounded text-xs border transition-all ${c} ${sl[k as keyof TextLayer]?"bg-red-900/40 border-red-700/50 text-red-200":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>{l}</button>))}</div></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Align</label><div className="flex gap-1.5">{(["left","center","right"] as CanvasTextAlign[]).map(a=>(<button key={a} onClick={()=>updateLayer(sl.id,{align:a})} className={`flex-1 py-1 rounded text-xs border transition-all ${sl.align===a?"bg-red-900/40 border-red-700/50 text-red-200":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>{a==="left"?"☰":a==="center"?"≡":"☷"}</button>))}</div></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Text Color</label><div className="flex items-center gap-2"><input type="color" value={sl.color} onChange={e=>updateLayer(sl.id,{color:e.target.value})} className="w-8 h-7 rounded cursor-pointer bg-transparent border-0 p-0"/><span className="text-[10px] font-mono text-zinc-400">{sl.color}</span></div></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Stroke: <span className="text-zinc-300">{sl.strokeWidth}</span></label><div className="flex items-center gap-2"><input type="range" min={0} max={20} value={sl.strokeWidth} onChange={e=>updateLayer(sl.id,{strokeWidth:Number(e.target.value)})} className="flex-1 accent-red-600"/><input type="color" value={sl.strokeColor} onChange={e=>updateLayer(sl.id,{strokeColor:e.target.value})} className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0"/></div></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Opacity: <span className="text-zinc-300">{Math.round(sl.opacity*100)}%</span></label><input type="range" min={0} max={100} value={Math.round(sl.opacity*100)} onChange={e=>updateLayer(sl.id,{opacity:Number(e.target.value)/100})} className="w-full accent-red-600"/></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Letter Spacing: <span className="text-zinc-300">{sl.letterSpacing}px</span></label><input type="range" min={-10} max={80} value={sl.letterSpacing} onChange={e=>updateLayer(sl.id,{letterSpacing:Number(e.target.value)})} className="w-full accent-red-600"/></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Position Y: <span className="text-zinc-300">{Math.round(sl.y*100)}%</span></label><input type="range" min={0} max={100} value={Math.round(sl.y*100)} onChange={e=>updateLayer(sl.id,{y:Number(e.target.value)/100})} className="w-full accent-red-600"/></div>
              <div><label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Rotation: <span className="text-zinc-300">{Math.round(sl.rotation*180/Math.PI)}°</span></label><input type="range" min={-180} max={180} value={Math.round(sl.rotation*180/Math.PI)} onChange={e=>updateLayer(sl.id,{rotation:Number(e.target.value)*Math.PI/180})} className="w-full accent-red-600"/></div>
              <div className="flex items-center justify-between"><label className="text-[9px] text-zinc-500 uppercase">Shadow</label><button onClick={()=>updateLayer(sl.id,{shadowEnabled:!sl.shadowEnabled})} className={`px-3 py-0.5 rounded text-xs border font-bold ${sl.shadowEnabled?"bg-green-900/30 border-green-700/40 text-green-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}>{sl.shadowEnabled?"On":"Off"}</button></div>
              {sl.shadowEnabled&&(<div className="flex items-center gap-2"><input type="color" value={sl.shadowColor} onChange={e=>updateLayer(sl.id,{shadowColor:e.target.value})} className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0"/><input type="range" min={0} max={60} value={sl.shadowBlur} onChange={e=>updateLayer(sl.id,{shadowBlur:Number(e.target.value)})} className="flex-1 accent-red-600"/><span className="text-[10px] text-zinc-500 w-6">{sl.shadowBlur}</span></div>)}
              <div className="flex items-center justify-between"><label className="text-[9px] text-zinc-500 uppercase">Glow</label><button onClick={()=>updateLayer(sl.id,{glowEnabled:!sl.glowEnabled})} className={`px-3 py-0.5 rounded text-xs border font-bold ${sl.glowEnabled?"bg-green-900/30 border-green-700/40 text-green-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}>{sl.glowEnabled?"On":"Off"}</button></div>
              {sl.glowEnabled&&(<div className="flex items-center gap-2"><input type="color" value={sl.glowColor} onChange={e=>updateLayer(sl.id,{glowColor:e.target.value})} className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0"/><span className="text-[9px] text-zinc-500">{sl.glowColor}</span></div>)}
              <button onClick={()=>{const f=makeLayer({id:sl.id,text:sl.text,x:sl.x,y:sl.y});setLayers(p=>p.map(l=>l.id===sl.id?f:l));}} className="w-full py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-[10px] text-zinc-500 hover:text-zinc-300">↺ Reset Layer</button>
            </div>)}
          {rightTab==="text"&&!sl&&<p className="text-[10px] text-zinc-600 text-center py-4">Select a text layer to edit</p>}

          {/* OVERLAY TAB */}
          {rightTab==="overlay"&&(
            <div className="space-y-3">
              <h2 className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">🎭 Overlays</h2>
              {activeOverlays.length>0&&(
                <div className="pb-2 border-b border-zinc-800/30">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">Active ({activeOverlays.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {activeOverlays.map(ov=>(
                      <div key={ov.instanceId} className={`flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-all ${editingOverlay===ov.instanceId?"bg-purple-900/50 border-purple-500/60 text-purple-200":"bg-zinc-800/50 border-zinc-700/30 text-zinc-300 hover:border-purple-700/40"}`}>
                        <span onClick={()=>{setEditingOverlay(ov.instanceId===editingOverlay?null:ov.instanceId);setSelectedOverlayInstance(ov.instanceId);}}>{ov.emoji} {ov.label}</span>
                        <button onClick={()=>removeOverlay(ov.instanceId)} className="text-zinc-600 hover:text-red-400 ml-1">×</button>
                      </div>))}
                  </div>
                </div>)}

              {(()=>{
                const ov=activeOverlays.find(o=>o.instanceId===selectedOverlayInstance);
                if(!selectedOverlayInstance||!ov) return <p className="text-[10px] text-zinc-600 py-2 text-center">Koi overlay select nahi</p>;
                const co=customOverlays.find(c=>`custom:${c.id}`===ov.defId);
                const isVid=ov.isVideo;
                return(
                  <div className="space-y-2">
                    <div className="text-xs text-purple-300 font-medium">{ov.emoji} {ov.label}</div>
                    <div><label className="text-[9px] text-zinc-500 block mb-0.5">Opacity: <span className="text-zinc-300">{Math.round((ov.opacity??1)*100)}%</span></label><input type="range" min={0} max={100} value={Math.round((ov.opacity??1)*100)} onChange={e=>updateOverlayProp(ov.instanceId,{opacity:Number(e.target.value)/100})} className="w-full accent-purple-600"/></div>
                    <div><label className="text-[9px] text-zinc-500 block mb-0.5">Scale: <span className="text-zinc-300">{ov.scale.toFixed(2)}</span></label><input type="range" min={0.1} max={3} step={0.05} value={ov.scale} onChange={e=>updateOverlayProp(ov.instanceId,{scale:Number(e.target.value)})} className="w-full accent-purple-600"/></div>
                    <div><label className="text-[9px] text-zinc-500 block mb-0.5">Rotation: <span className="text-zinc-300">{Math.round((ov.rotation||0)*180/Math.PI)}°</span></label><input type="range" min={-180} max={180} value={Math.round((ov.rotation||0)*180/Math.PI)} onChange={e=>updateOverlayProp(ov.instanceId,{rotation:Number(e.target.value)*Math.PI/180})} className="w-full accent-purple-600"/></div>
                    <div><label className="text-[9px] text-zinc-500 block mb-0.5">Pos X: <span className="text-zinc-300">{Math.round((ov.posX||0.5)*100)}%</span></label><input type="range" min={0} max={100} value={Math.round((ov.posX||0.5)*100)} onChange={e=>updateOverlayProp(ov.instanceId,{posX:Number(e.target.value)/100})} className="w-full accent-purple-600"/></div>
                    <div><label className="text-[9px] text-zinc-500 block mb-0.5">Pos Y: <span className="text-zinc-300">{Math.round((ov.posY||0.5)*100)}%</span></label><input type="range" min={0} max={100} value={Math.round((ov.posY||0.5)*100)} onChange={e=>updateOverlayProp(ov.instanceId,{posY:Number(e.target.value)/100})} className="w-full accent-purple-600"/></div>
                    {isVid&&<>
                      <div><label className="text-[9px] text-zinc-500 block mb-0.5">Video Opacity: <span className="text-zinc-300">{Math.round((ov.videoOpacity??1)*100)}%</span></label><input type="range" min={0} max={100} value={Math.round((ov.videoOpacity??1)*100)} onChange={e=>updateOverlayProp(ov.instanceId,{videoOpacity:Number(e.target.value)/100})} className="w-full accent-blue-500"/></div>
                      <div><label className="text-[9px] text-zinc-500 block mb-0.5">Fit</label><select value={ov.videoFit||"cover"} onChange={e=>updateOverlayProp(ov.instanceId,{videoFit:e.target.value as any})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"><option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option></select></div>
                    </>}
                    {!isVid&&<>
                      <div><label className="text-[9px] text-zinc-500 block mb-0.5">Count: <span className="text-zinc-300">{ov.params.count}</span></label><input type="range" min={1} max={500} value={ov.params.count} onChange={e=>updateOverlayParams(ov.instanceId,{count:Number(e.target.value)})} className="w-full accent-purple-600"/></div>
                      <div><label className="text-[9px] text-zinc-500 block mb-0.5">Direction</label><select value={ov.params.direction} onChange={e=>updateOverlayParams(ov.instanceId,{direction:e.target.value as any})} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"><option value="top">⬇ Top</option><option value="bottom">⬆ Bottom</option><option value="left">➡ Left</option><option value="right">⬅ Right</option><option value="random">🔀 Random</option></select></div>
                      <div><label className="text-[9px] text-zinc-500 block mb-0.5">Size: <span className="text-zinc-300">{ov.params.sizeMin}–{ov.params.sizeMax}</span></label><div className="flex gap-1"><input type="range" min={1} max={300} value={ov.params.sizeMin} onChange={e=>updateOverlayParams(ov.instanceId,{sizeMin:Number(e.target.value)})} className="flex-1 accent-purple-600"/><input type="range" min={1} max={400} value={ov.params.sizeMax} onChange={e=>updateOverlayParams(ov.instanceId,{sizeMax:Number(e.target.value)})} className="flex-1 accent-purple-600"/></div></div>
                      <div><label className="text-[9px] text-zinc-500 block mb-0.5">Speed: <span className="text-zinc-300">{ov.params.speedMin}–{ov.params.speedMax}</span></label><div className="flex gap-1"><input type="range" min={0.1} max={30} step={0.1} value={ov.params.speedMin} onChange={e=>updateOverlayParams(ov.instanceId,{speedMin:Number(e.target.value)})} className="flex-1 accent-purple-600"/><input type="range" min={0.1} max={40} step={0.1} value={ov.params.speedMax} onChange={e=>updateOverlayParams(ov.instanceId,{speedMax:Number(e.target.value)})} className="flex-1 accent-purple-600"/></div></div>
                      <div><label className="text-[9px] text-zinc-500 block mb-0.5">Alpha: <span className="text-zinc-300">{ov.params.alphaMin.toFixed(2)}–{ov.params.alphaMax.toFixed(2)}</span></label><div className="flex gap-1"><input type="range" min={0} max={1} step={0.01} value={ov.params.alphaMin} onChange={e=>updateOverlayParams(ov.instanceId,{alphaMin:Number(e.target.value)})} className="flex-1 accent-purple-600"/><input type="range" min={0} max={1} step={0.01} value={ov.params.alphaMax} onChange={e=>updateOverlayParams(ov.instanceId,{alphaMax:Number(e.target.value)})} className="flex-1 accent-purple-600"/></div></div>
                      <div className="flex items-center gap-2"><label className="text-[9px] text-zinc-500 uppercase">Rotate</label><button onClick={()=>updateOverlayParams(ov.instanceId,{rotate:!ov.params.rotate})} className={`px-3 py-0.5 rounded text-xs border ${ov.params.rotate?"bg-green-900/30 border-green-700/40 text-green-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}>{ov.params.rotate?"On":"Off"}</button></div>
                    </>}
                    <button onClick={()=>removeOverlay(ov.instanceId)} className="w-full py-1 rounded bg-red-900/30 border border-red-700/40 text-red-300 text-xs hover:bg-red-900/50">🗑 Remove</button>
                  </div>);
              })()}

              <div className="pt-2 border-t border-zinc-800/30">
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider w-full mb-1">Add Overlay</div>
                  <button onClick={()=>setShowAddCustom(v=>!v)} className="px-2 py-0.5 rounded bg-green-900/30 border border-green-700/40 text-green-300 text-[9px] hover:bg-green-900/50">+ Image/GIF</button>
                  <button onClick={()=>{setShowAddCustom(true);setPendingIsVideo(true);setTimeout(()=>customVideoRef.current?.click(),100);}} className="px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/40 text-blue-300 text-[9px] hover:bg-blue-900/50">+ Video</button>
                </div>
                {showAddCustom&&(
                  <div className="mb-2 p-2 rounded border border-green-900/40 bg-[#060c06] space-y-1.5">
                    <input type="text" placeholder="Name" value={newCustomName} onChange={e=>setNewCustomName(e.target.value)} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                    <input type="text" placeholder="Category" value={newCustomCategory} onChange={e=>setNewCustomCategory(e.target.value)} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"/>
                    <input ref={customUploadRef} type="file" accept="image/*,image/gif,video/*" className="hidden" onChange={handleCustomUpload}/>
                    <input ref={customVideoRef} type="file" accept="video/*" className="hidden" onChange={handleCustomVideoUpload}/>
                    <button onClick={()=>customUploadRef.current?.click()} className="w-full py-1 rounded bg-zinc-800/60 border border-dashed border-zinc-600/50 text-xs text-zinc-400 hover:border-green-700/50">
                      {pendingCustomFile?"✅ Ready":"📁 Choose File"}
                    </button>
                    {pendingCustomFile&&<div className="flex gap-1">
                      <button onClick={finalizeCustomOverlay} className="flex-1 py-1 rounded bg-green-900/40 border border-green-700/40 text-green-300 text-xs font-bold">💾 Add</button>
                      <button onClick={()=>{setPendingCustomFile(null);setShowAddCustom(false);setPendingIsVideo(false);}} className="px-2 py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-zinc-400 text-xs">✕</button>
                    </div>}
                  </div>)}
                <div className="flex gap-1 flex-wrap mb-1.5">
                  {OVERLAY_CATEGORIES.map(cat=>(<button key={cat} onClick={()=>setOverlayCategory(cat)} className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${overlayCategory===cat?"bg-purple-900/40 border-purple-700/40 text-purple-300":"border-zinc-700/30 text-zinc-400 hover:text-zinc-200"}`}>{cat}</button>))}
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {filteredOverlays.map((o:any)=>(
                    <button key={o.id} onClick={()=>o.id.startsWith("custom:")?addCustomOverlay(customOverlays.find(c=>`custom:${c.id}`===o.id)!):addOverlay(o.id)} className="px-2 py-1.5 rounded text-[10px] border border-zinc-800/40 text-zinc-400 hover:border-purple-700/40 hover:text-purple-300 hover:bg-purple-900/20 transition-all text-left">
                      {o.emoji} {o.label}
                    </button>))}
                </div>
              </div>
            </div>)}

          {/* SOUND TAB */}
          {rightTab==="sound"&&(
            <div className="space-y-2">
              <h2 className="text-[10px] text-green-400 uppercase tracking-widest font-bold">🔊 Sound Controls</h2>
              {activeSounds.length>0&&(
                <div className="pb-2 border-b border-zinc-800/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[9px] text-green-400 uppercase tracking-wider">Playing ({activeSounds.length})</div>
                    <button onClick={stopAllSounds} className="px-2 py-0.5 rounded bg-red-900/30 border border-red-700/40 text-red-300 text-[9px]">⏹ Stop All</button>
                  </div>
                  {activeSounds.map(s=>(
                    <div key={s.id} className="flex items-center gap-2 px-2 py-1 mb-1 rounded bg-green-900/20 border border-green-700/30">
                      <span className="text-sm">{s.emoji}</span>
                      <span className="text-[10px] text-green-300 flex-1 truncate">{s.name}</span>
                      <input type="range" min={0} max={100} value={Math.round(s.volume*100)} onChange={e=>updateSoundVolume(s.id,Number(e.target.value)/100)} className="w-16 accent-green-500"/>
                      <button onClick={()=>toggleSound(s)} className="text-red-400 hover:text-red-300 text-xs">×</button>
                    </div>))}
                </div>)}
              <div className="pb-2 border-b border-zinc-800/30">
                <div className="text-[10px] text-green-400 uppercase tracking-wider mb-1.5 font-bold">🗣️ Text-to-Speech</div>
                <textarea value={ttsText} onChange={e=>setTtsText(e.target.value)} rows={2} className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none resize-none mb-1.5" placeholder="Type text to speak..."/>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <div className="col-span-2">
                    <label className="text-[9px] text-zinc-500 block mb-0.5">Voice</label>
                    <select value={ttsVoice} onChange={e=>setTtsVoice(e.target.value)} className="w-full px-1.5 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-[10px] text-zinc-300 focus:outline-none">
                      {availableVoices.map(v=>(<option key={v.name} value={v.name}>{v.name}</option>))}
                    </select>
                  </div>
                  <div><label className="text-[9px] text-zinc-500 block mb-0.5">Rate: {ttsRate.toFixed(1)}</label><input type="range" min={0.5} max={2} step={0.1} value={ttsRate} onChange={e=>setTtsRate(Number(e.target.value))} className="w-full accent-green-500"/></div>
                  <div><label className="text-[9px] text-zinc-500 block mb-0.5">Pitch: {ttsPitch.toFixed(1)}</label><input type="range" min={0.5} max={2} step={0.1} value={ttsPitch} onChange={e=>setTtsPitch(Number(e.target.value))} className="w-full accent-green-500"/></div>
                </div>
                <button onClick={playTTS} className={`w-full py-1.5 rounded text-xs font-bold border transition-all ${ttsPlaying?"bg-red-900/40 border-red-700/40 text-red-300":"bg-green-900/30 border-green-700/40 text-green-300 hover:bg-green-900/50"}`}>
                  {ttsPlaying?"⏹ Stop":"▶ Speak"}
                </button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[10px] text-green-400 uppercase tracking-wider font-bold">🎵 Library</div>
                  <div><input ref={soundUploadRef} type="file" accept="audio/*" className="hidden" onChange={handleSoundUpload}/><button onClick={()=>soundUploadRef.current?.click()} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-[9px] text-zinc-400 hover:text-zinc-200">+ Upload</button></div>
                </div>
                <div className="flex gap-1 flex-wrap mb-1.5">
                  {soundCategories.map(cat=>(<button key={cat} onClick={()=>setSoundCategory(cat)} className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${soundCategory===cat?"bg-green-900/40 border-green-700/40 text-green-300":"border-zinc-700/30 text-zinc-400 hover:text-zinc-200"}`}>{cat}</button>))}
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {filteredSounds.map(s=>{
                    const isActive=activeSounds.some(a=>a.id===s.id);
                    const hasAudio=!!(s.dataUrl||s.url);
                    return(
                      <button key={s.id} onClick={()=>toggleSound(s)} disabled={!hasAudio&&!s.isCustom} className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] border transition-all text-left ${isActive?"bg-green-900/40 border-green-700/50 text-green-200":"border-zinc-800/40 text-zinc-400 hover:border-green-700/40 hover:text-green-300 hover:bg-green-900/20"} ${!hasAudio&&!s.isCustom?"opacity-40 cursor-not-allowed":""}`}>
                        <span>{s.emoji}</span>
                        <div className="min-w-0"><div className="truncate">{s.name}</div></div>
                        {isActive&&<span className="ml-auto text-green-400 text-[8px]">▶</span>}
                      </button>);})}
                </div>
              </div>
            </div>)}

          {rightTab==="text"&&(
            <div className="mt-4 pt-3 border-t border-zinc-800/40">
              <div className="space-y-1.5 text-xs">
                <div><span className="text-zinc-600 text-[9px]">Template</span><div className="text-zinc-200 font-medium">{selectedTemplate.name}</div></div>
                <div><span className="text-zinc-600 text-[9px]">Colors</span><div className="flex gap-1 mt-1">{selectedTemplate.colors.map((c,i)=>(<div key={i} className="w-5 h-5 rounded border border-zinc-700/30" style={{background:c}}/>))}</div></div>
                <div><span className="text-zinc-600 text-[9px]">Canvas</span><div className="text-zinc-300 font-mono text-[10px]">{canvasPreset.w}×{canvasPreset.h}</div></div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/40">
                <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">OBS Usage</h3>
                <p className="text-[10px] text-zinc-600 leading-relaxed">Export PNG for static. Record → .webm → OBS Media Source for animated.</p>
              </div>
            </div>)}
        </div>
      </aside>
    </div>
  );
}
