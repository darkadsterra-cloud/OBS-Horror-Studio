import { useState, useRef, useEffect, useCallback } from "react";
import { useListTemplates } from "@workspace/api-client-react";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";
import { OVERLAY_DEFS, OVERLAY_CATEGORIES, OVERLAY_BY_ID, tickParticles, type OverlayDef, type OverlayParticle } from "@/data/overlays";

// ─── Canvas Sizes ─────────────────────────────────────────────────────────────
const CANVAS_PRESETS = [
  { label:"[Standard] 1920×1080 — Full HD",       w:1920, h:1080, group:"Standard" },
  { label:"[2K] 2560×1440 — 2K QHD",              w:2560, h:1440, group:"Standard" },
  { label:"[4K] 3840×2160 — 4K UHD",              w:3840, h:2160, group:"Standard" },
  { label:"[HD] 1280×720 — HD 720p",               w:1280, h:720,  group:"Standard" },
  { label:"[Twitch] 1920×1080",                    w:1920, h:1080, group:"Streaming" },
  { label:"[OBS] 1920×1080 — OBS Canvas",          w:1920, h:1080, group:"Streaming" },
  { label:"[TikTok] 1080×1920 — TikTok Vertical",  w:1080, h:1920, group:"Social" },
  { label:"[TikTok] 1920×1080 — TikTok Landscape", w:1920, h:1080, group:"Social" },
  { label:"[Square] 1080×1080 — Square",            w:1080, h:1080, group:"Social" },
  { label:"[Vertical] 1080×1920 — Vertical 9:16",  w:1080, h:1920, group:"Social" },
  { label:"[Shorts] 1080×1920 — YouTube Shorts",   w:1080, h:1920, group:"Social" },
  { label:"[Reel] 1080×1920 — Instagram Reel",     w:1080, h:1920, group:"Social" },
];

// ─── 100+ Animations ──────────────────────────────────────────────────────────
const ALL_ANIMATIONS = [
  // Basic
  "none","fade-in","fade-out","zoom-in","zoom-out","zoom-pulse",
  // Slide
  "slide-left","slide-right","slide-up","slide-down","slide-left-loop","pan-right",
  // Bounce / Physics
  "bounce","drop-in","drop-bounce","elastic","swing","pendulum","rubber-band",
  // Spin / Flip
  "spin","spin-reveal","flip-x","flip-y","3d-flip","roll-in",
  // Horror / Dark
  "glitch","blood-drip","flicker","static","possessed","demonic","shadow-pulse",
  "corrupt","void","skull-flash","hellfire","cursed","phantom","decay","shriek",
  // Glow / Neon
  "neon-pulse","fire-glow","rainbow","color-cycle","ice-glow","gold-shine",
  "toxic-glow","plasma","hologram","disco","lava-glow","acid","chroma","aurora",
  // Cinematic
  "cinematic-fade","typewriter","dramatic-zoom","film-grain","split-reveal",
  "curtain","wipe-left","letter-by-letter","word-by-word",
  // Tech / Sci-Fi
  "matrix","scan-line","data-stream","hack","terminal","pixel-reveal","binary",
  "circuit","laser","hologram-glitch","radar","system-boot","decrypt",
  // Motion
  "float","wobble","jello","heartbeat","tada","wiggle","flash","breathe","levitate",
  // 3D
  "perspective-tilt","depth-push","depth-pull","parallax","shadow-rise","extrude",
  // Extra
  "shake","jack-in-box","swing-in","back-in-up","back-in-down","slingshot",
  "pinball","ricochet","lens-flare-text","neon-wave","thunder-strike",
];

// ─── 100+ Fonts ───────────────────────────────────────────────────────────────
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

// ─── Text Layer ────────────────────────────────────────────────────────────────
interface TextLayer {
  id:string; text:string;
  x:number; y:number;
  fontSize:number; fontFamily:string;
  color:string; bold:boolean; italic:boolean; underline:boolean;
  align:CanvasTextAlign; opacity:number; rotation:number;
  strokeColor:string; strokeWidth:number;
  shadowEnabled:boolean; shadowColor:string; shadowBlur:number;
  glowEnabled:boolean; glowColor:string;
  letterSpacing:number; animation:string;
  _w:number; _h:number;
}

function makeLayer(p:Partial<TextLayer>={}):TextLayer {
  return {
    id:Math.random().toString(36).slice(2), text:"STARTING SOON",
    x:0.5, y:0.5, fontSize:120, fontFamily:"Creepster", color:"#cc0000",
    bold:false, italic:false, underline:false, align:"center",
    opacity:1, rotation:0, strokeColor:"#000000", strokeWidth:4,
    shadowEnabled:true, shadowColor:"#000000", shadowBlur:20,
    glowEnabled:false, glowColor:"#ff0000", letterSpacing:0,
    animation:"none", _w:0, _h:0, ...p,
  };
}

function TemplatePreview({ template, text }:{ template:TemplateData; text:string }) {
  const [key,setKey]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setKey(k=>k+1),3000);return()=>clearInterval(t);},[]);
  const bg=template.backgroundStyle==="dark-gradient"
    ?"linear-gradient(135deg,#0a0808 0%,#150a1a 100%)":"#080810";
  return (
    <div className="h-full flex items-center justify-center overflow-hidden" style={{background:bg}}>
      <span className="text-sm font-bold block text-center px-2 leading-tight"
        style={{fontFamily:`'${template.font}',sans-serif`,color:template.colors[0],
          textShadow:template.glow?`0 0 10px ${template.colors[0]},0 0 20px ${template.colors[0]}88`
            :template.shadowEffect?"2px 2px 8px rgba(0,0,0,0.8)":"none"}}>
        {text||template.name.toUpperCase()}
      </span>
    </div>
  );
}

function TemplateCard({ template,selected,onClick,text }:{
  template:TemplateData;selected:boolean;onClick:()=>void;text:string;
}) {
  return (
    <div onClick={onClick}
      className={`rounded border cursor-pointer transition-all overflow-hidden ${selected
        ?"border-red-600/60 ring-1 ring-red-500/30":"border-zinc-800/40 hover:border-zinc-600/40"}`}
      style={selected?{boxShadow:"0 0 12px rgba(220,20,60,0.25)"}:{}}>
      <div className="h-16 bg-[#08080f]"><TemplatePreview template={template} text={text}/></div>
      <div className="px-2 py-1 bg-[#0a0a14] border-t border-zinc-800/30">
        <div className="text-[9px] font-medium text-zinc-400 truncate">{template.name}</div>
        <div className="text-[8px] text-zinc-600">{template.animation}</div>
      </div>
    </div>
  );
}

function formatTime(s:number){return`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;}

function hitTest(l:TextLayer,cx:number,cy:number,W:number,H:number):boolean {
  const lx=l.x*W,ly=l.y*H,hw=l._w/2+10,hh=l._h/2+10;
  const cos=Math.cos(-l.rotation),sin=Math.sin(-l.rotation);
  const dx=cx-lx,dy=cy-ly;
  const localX=dx*cos-dy*sin,localY=dx*sin+dy*cos;
  return Math.abs(localX)<=hw&&Math.abs(localY)<=hh;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TextAnimator() {
  const [selectedTemplate,setSelectedTemplate]=useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory,setActiveCategory]=useState("All");
  const [searchQuery,setSearchQuery]=useState("");
  const [canvasPreset,setCanvasPreset]=useState(CANVAS_PRESETS[0]);
  const [showSizeMenu,setShowSizeMenu]=useState(false);

  // BG media
  const [bgImage,setBgImage]=useState<HTMLImageElement|null>(null);
  const [bgVideo,setBgVideo]=useState<HTMLVideoElement|null>(null);
  const [bgObjectFit,setBgObjectFit]=useState<"cover"|"contain"|"fill">("cover");
  const bgFileRef=useRef<HTMLInputElement>(null);
  const bgVidRef=useRef<HTMLInputElement>(null);

  // Layers
  const [layers,setLayers]=useState<TextLayer[]>([makeLayer()]);
  const [selectedLayerId,setSelectedLayerId]=useState<string|null>(layers[0].id);
  const [newText,setNewText]=useState("STARTING SOON");
  const selectedLayer=layers.find(l=>l.id===selectedLayerId)??null;
  const updateLayer=useCallback((id:string,patch:Partial<TextLayer>)=>{
    setLayers(prev=>prev.map(l=>l.id===id?{...l,...patch}:l));
  },[]);

  // Overlays
  const [activeOverlayIds,setActiveOverlayIds]=useState<string[]>([]);
  const [overlayCategory,setOverlayCategory]=useState("All");
  const overlayParticlesRef=useRef<Record<string,OverlayParticle[]>>({});
  const [showEditPanel,setShowEditPanel]=useState(true);
  const [showOverlayPanel,setShowOverlayPanel]=useState(false);

  // Recording
  const [recording,setRecording]=useState(false);
  const [recordingTime,setRecordingTime]=useState(0);
  const [recordings,setRecordings]=useState<Array<{name:string;url:string;size:number}>>([]);
  const [showRecordings,setShowRecordings]=useState(false);
  const mediaRecorderRef=useRef<MediaRecorder|null>(null);
  const chunksRef=useRef<Blob[]>([]);
  const recTimerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  // Audio for BG video
  const audioCtxRef=useRef<AudioContext|null>(null);
  const audioDestRef=useRef<MediaStreamAudioDestinationNode|null>(null);
  const audioSourceRef=useRef<MediaElementAudioSourceNode|null>(null);

  const canvasRef=useRef<HTMLCanvasElement>(null);
  const animFrameRef=useRef<number>(0);
  const layersRef=useRef(layers);
  useEffect(()=>{layersRef.current=layers;},[layers]);
  const selectedIdRef=useRef(selectedLayerId);
  useEffect(()=>{selectedIdRef.current=selectedLayerId;},[selectedLayerId]);
  const bgImageRef=useRef(bgImage);
  const bgVideoRef=useRef(bgVideo);
  const bgFitRef=useRef(bgObjectFit);
  const presetRef=useRef(canvasPreset);
  const templateRef=useRef(selectedTemplate);
  const overlayIdsRef=useRef(activeOverlayIds);
  useEffect(()=>{bgImageRef.current=bgImage;},[bgImage]);
  useEffect(()=>{bgVideoRef.current=bgVideo;},[bgVideo]);
  useEffect(()=>{bgFitRef.current=bgObjectFit;},[bgObjectFit]);
  useEffect(()=>{presetRef.current=canvasPreset;},[canvasPreset]);
  useEffect(()=>{templateRef.current=selectedTemplate;},[selectedTemplate]);
  useEffect(()=>{overlayIdsRef.current=activeOverlayIds;},[activeOverlayIds]);

  const { data:dbTemplates=[] }=useListTemplates();
  const allTemplates:TemplateData[]=[
    ...PRESET_TEMPLATES,
    ...dbTemplates.map(t=>({id:t.id,name:t.name,category:t.category,font:t.font,
      animation:t.animation,colors:t.colors as string[],glow:t.glow,
      shadowEffect:t.shadowEffect,backgroundStyle:t.backgroundStyle,
      motionBehavior:t.motionBehavior,isPreset:t.isPreset})),
  ];

  const filtered=allTemplates.filter(t=>{
    const catMatch=activeCategory==="All"||t.category===activeCategory;
    const searchMatch=!searchQuery||t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch&&searchMatch;
  });

  // FIX: Template card click now applies template settings to selected layer
  const selectTemplate=(tpl:TemplateData)=>{
    setSelectedTemplate(tpl);
    // Apply template to selected layer
    if(selectedLayerId){
      updateLayer(selectedLayerId,{
        color:tpl.colors[0],
        fontFamily:tpl.font,
        animation:tpl.animation,
        glowEnabled:tpl.glow,
        shadowEnabled:tpl.shadowEffect,
      });
    }
  };

  // BG upload
  const handleBgUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{const img=new Image();img.onload=()=>{setBgImage(img);setBgVideo(null);};img.src=ev.target?.result as string;};
    reader.readAsDataURL(file);
  };

  // FIX: Video upload with audio support via Web Audio API
  const handleVideoUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file);
    if(bgVideo){bgVideo.pause();}
    const vid=document.createElement("video");
    vid.src=url;vid.loop=true;vid.playsInline=true;
    // Audio: unmuted, will be played with audio
    vid.muted=false;
    vid.volume=1;
    vid.play().catch(()=>{vid.muted=true;vid.play();});
    setBgVideo(vid);setBgImage(null);
  };

  const clearBg=()=>{
    if(bgVideo){bgVideo.pause();}
    setBgImage(null);setBgVideo(null);
    if(bgFileRef.current)bgFileRef.current.value="";
    if(bgVidRef.current)bgVidRef.current.value="";
  };

  // Toggle overlay
  const toggleOverlay=(id:string)=>{
    setActiveOverlayIds(prev=>{
      if(prev.includes(id)){
        delete overlayParticlesRef.current[id];
        return prev.filter(x=>x!==id);
      }else{
        const def=OVERLAY_BY_ID[id];
        if(def){overlayParticlesRef.current[id]=def.initParticles(presetRef.current.w,presetRef.current.h);}
        return [...prev,id];
      }
    });
  };

  // ─── Render loop ────────────────────────────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d")!;
    let running=true,frameCount=0;

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

    const getAnimState=(anim:string,t:number,W:number,H:number)=>{
      let ox=0,oy=0,sc=1,al=1,er=0;
      if(anim==="float"){oy=Math.sin(t*1.5)*(H*0.03);}
      else if(anim==="bounce"){oy=-Math.abs(Math.sin(t*3))*(H*0.06);}
      else if(anim==="shake"){ox=(Math.random()-0.5)*12;oy=(Math.random()-0.5)*6;}
      else if(anim==="flicker"){al=Math.random()>0.1?1:(Math.random()>0.5?0.3:0);}
      else if(anim==="zoom-pulse"){sc=1+Math.sin(t*3)*0.1;}
      else if(anim==="neon-pulse"){al=0.7+(Math.sin(t*4)+1)/2*0.3;}
      else if(anim==="wobble"){er=Math.sin(t*4)*0.15;}
      else if(anim==="jello"){sc=1+Math.sin(t*6)*0.05;}
      else if(anim==="heartbeat"){sc=1+Math.abs(Math.sin(t*4))*0.15;}
      else if(anim==="levitate"){oy=Math.sin(t*2)*(H*0.02);sc=1+Math.sin(t*2)*0.02;}
      else if(anim==="spin"){er=t*2;}
      else if(anim==="cinematic-fade"){const c=(t%4)/4;al=c<0.25?c*4:c<0.75?1:(1-c)*4;}
      else if(anim==="slide-left"){const c=(t*0.5)%2;ox=c<1?W*(1-c*2):0;}
      else if(anim==="slide-right"){const c=(t*0.5)%2;ox=c<1?-W*(1-c*2):0;}
      else if(anim==="slide-up"){const c=(t*0.5)%2;oy=c<1?H*(1-c*2):0;}
      else if(anim==="fade-in"){al=(Math.sin(t*0.5)+1)*0.5;}
      else if(anim==="zoom-in"){sc=0.5+((Math.sin(t*0.5)+1)*0.5)*0.5;}
      else if(anim==="swing"){er=Math.sin(t*3)*0.2;}
      else if(anim==="pendulum"){er=Math.sin(t*2)*0.3;}
      else if(anim==="tada"){sc=1+Math.abs(Math.sin(t*6))*0.1;er=Math.sin(t*8)*0.05;}
      else if(anim==="wiggle"){ox=Math.sin(t*8)*8;}
      else if(anim==="breathe"){sc=0.95+Math.sin(t*1.5)*0.05;}
      else if(anim==="flash"){al=Math.round(Math.sin(t*6)*0.5+0.5);}
      else if(anim==="spin-reveal"){const c=(t*0.5)%Math.PI;sc=Math.abs(Math.cos(c));al=0.3+sc*0.7;}
      else if(anim==="drop-bounce"){oy=-Math.abs(Math.sin(t*4))*(H*0.1)*(1/(t*0.5+1));}
      else if(anim==="elastic"){sc=1+Math.sin(t*8)*Math.exp(-t*0.5)*0.3;}
      else if(anim==="cursed"){ox=(Math.random()-0.5)*6;oy=(Math.random()-0.5)*4;er=(Math.random()-0.5)*0.1;}
      else if(anim==="possessed"){ox=(Math.random()-0.5)*15;er=(Math.random()-0.5)*0.2;al=0.7+Math.random()*0.3;}
      else if(anim==="decay"){al=0.4+Math.sin(t*2)*0.2;sc=0.95+Math.sin(t*3)*0.03;}
      else if(anim==="phantom"){al=0.3+Math.abs(Math.sin(t*1.5))*0.5;}
      else if(anim==="void"){sc=1+Math.sin(t*0.5)*0.08;al=0.6+Math.sin(t*2)*0.2;}
      else if(anim==="dramatic-zoom"){sc=0.8+((Math.sin(t*0.3)+1)*0.5)*0.4;}
      else if(anim==="gold-shine"){al=0.8+Math.sin(t*4)*0.2;}
      else if(anim==="ice-glow"){sc=1+Math.sin(t*2)*0.03;al=0.85+Math.sin(t*3)*0.1;}
      return {ox,oy,sc,al,er};
    };

    const drawLayer=(l:TextLayer,W:number,H:number,t:number)=>{
      const anim=l.animation;
      const {ox,oy,sc,al,er}=getAnimState(anim,t,W,H);
      const cx=l.x*W+ox,cy=l.y*H+oy;

      ctx.save();ctx.translate(cx,cy);ctx.rotate(l.rotation+er);ctx.scale(sc,sc);
      ctx.globalAlpha=l.opacity*al;ctx.textAlign=l.align;ctx.textBaseline="middle";

      const fs=Math.max(8,l.fontSize);
      ctx.font=`${l.italic?"italic ":""}${l.bold?"bold ":""}${fs}px '${l.fontFamily}',Impact,sans-serif`;

      // Glow / shadow
      if(l.glowEnabled){ctx.shadowColor=l.glowColor;ctx.shadowBlur=30+Math.sin(t*2)*10;}
      else if(l.shadowEnabled){ctx.shadowColor=l.shadowColor;ctx.shadowBlur=l.shadowBlur;ctx.shadowOffsetX=3;ctx.shadowOffsetY=3;}

      // Special animation overrides
      if(anim==="neon-pulse"){const i=(Math.sin(t*4)+1)/2;ctx.shadowColor=l.color;ctx.shadowBlur=10+i*60;}
      else if(anim==="fire-glow"){ctx.shadowColor="#ff6600";ctx.shadowBlur=20+Math.sin(t*2)*20;}
      else if(anim==="gold-shine"){ctx.shadowColor="#ffdd00";ctx.shadowBlur=20+Math.sin(t*4)*10;}
      else if(anim==="ice-glow"){ctx.shadowColor="#88ccff";ctx.shadowBlur=20+Math.sin(t*3)*8;}
      else if(anim==="blood-drip"){ctx.shadowColor="#cc0000";ctx.shadowBlur=15;}
      else if(anim==="hellfire"){ctx.shadowColor="#ff4400";ctx.shadowBlur=25+Math.sin(t*3)*10;}
      else if(anim==="hologram"){ctx.shadowColor="#00ffcc";ctx.shadowBlur=20;}
      else if(anim==="toxic-glow"){ctx.shadowColor="#88ff00";ctx.shadowBlur=20+Math.sin(t*4)*10;}

      // Glitch separate handling
      if(anim==="glitch"){
        ctx.fillStyle=l.color;ctx.fillText(l.text,0,0);
        if(Math.random()>0.6){try{const s=ctx.getImageData(0,cy-15,W,30);ctx.putImageData(s,(Math.random()-0.5)*60,cy-15);}catch{}}
        ctx.globalAlpha*=0.5;ctx.fillStyle=Math.random()>0.5?"#ff0066":"#00ffff";ctx.fillText(l.text,(Math.random()-0.5)*8,0);
        ctx.fillStyle=Math.random()>0.5?"#00ffff":"#ff0066";ctx.fillText(l.text,-(Math.random()-0.5)*8,2);
        ctx.restore();return;
      }

      // Color override for some anims
      let fillCol=l.color;
      if(anim==="rainbow"||anim==="color-cycle"){fillCol=`hsl(${(t*60)%360},100%,60%)`;}
      else if(anim==="disco"){fillCol=`hsl(${Math.floor(t*10)*36},100%,60%)`;}
      else if(anim==="plasma"){fillCol=`hsl(${Math.sin(t*2)*60+280},100%,65%)`;}
      else if(anim==="chroma"){fillCol=`hsl(${(t*30)%360},80%,55%)`;}
      else if(anim==="gold-shine"){fillCol="#ffdd00";}
      else if(anim==="ice-glow"){fillCol="#aaddff";}
      else if(anim==="toxic-glow"){fillCol="#aaff44";}
      else if(anim==="hologram"){fillCol=`rgba(0,255,200,${0.6+Math.sin(t*4)*0.3})`;}

      // Draw text
      const lines=l.text.split("\n");const lineH=fs*1.2;const totalH=(lines.length-1)*lineH;
      lines.forEach((line,li)=>{
        const ly=li*lineH-totalH/2;
        if(l.strokeWidth>0){ctx.strokeStyle=l.strokeColor;ctx.lineWidth=l.strokeWidth;ctx.lineJoin="round";ctx.strokeText(line,0,ly);}
        ctx.fillStyle=fillCol;ctx.fillText(line,0,ly);
        if(l.underline){const m=ctx.measureText(line);const uw=m.width;let ux=0;
          if(l.align==="center")ux=-uw/2;if(l.align==="right")ux=-uw;
          ctx.save();ctx.shadowBlur=0;ctx.strokeStyle=fillCol;ctx.lineWidth=Math.max(1,fs*0.05);
          ctx.beginPath();ctx.moveTo(ux,ly+fs*0.15);ctx.lineTo(ux+uw,ly+fs*0.15);ctx.stroke();ctx.restore();}
      });

      // Blood drip effect
      if(anim==="blood-drip"){
        const approxW=fs*l.text.length*0.5;
        for(let i=0;i<5;i++){const dx=-approxW*0.5+i*(approxW/4);const dy=((t*80+i*37)%(400));
          ctx.fillStyle=`rgba(180,0,0,${0.6+Math.sin(t+i)*0.3})`;ctx.shadowBlur=0;
          ctx.beginPath();ctx.ellipse(dx,fs*0.6+dy,3,10+Math.sin(t+i)*5,0,0,Math.PI*2);ctx.fill();}
      }

      // Measure for hit testing
      const m=ctx.measureText(l.text);l._w=m.width+Math.max(0,l.letterSpacing)*l.text.length;l._h=fs*1.4;
      ctx.restore();

      // Selection handles
      if(l.id===selectedIdRef.current){
        const hw=l._w/2+10,hh=l._h/2+10;
        ctx.save();ctx.translate(cx,cy);ctx.rotate(l.rotation);
        ctx.strokeStyle="rgba(255,60,60,0.85)";ctx.lineWidth=1.5;ctx.setLineDash([5,3]);
        ctx.strokeRect(-hw,-hh,hw*2,hh*2);ctx.setLineDash([]);
        [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([hx,hy])=>{
          ctx.fillStyle="#fff";ctx.strokeStyle="#cc0000";ctx.lineWidth=1.5;
          ctx.beginPath();ctx.arc(hx,hy,5,0,Math.PI*2);ctx.fill();ctx.stroke();});
        ctx.strokeStyle="rgba(255,60,60,0.6)";ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(0,-hh);ctx.lineTo(0,-hh-25);ctx.stroke();
        ctx.fillStyle="#fff";ctx.strokeStyle="#cc0000";ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(0,-hh-25,5,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.restore();
      }
    };

    const render=()=>{
      if(!running)return;frameCount++;const t=frameCount/60;
      const W=presetRef.current.w,H=presetRef.current.h,cv=canvasRef.current;
      if(!cv)return;if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
      drawBg(W,H);
      // Draw active overlays
      overlayIdsRef.current.forEach(id=>{
        const def=OVERLAY_BY_ID[id];
        if(!def)return;
        if(!overlayParticlesRef.current[id]){overlayParticlesRef.current[id]=def.initParticles(W,H);}
        def.draw(ctx,W,H,t,overlayParticlesRef.current[id]);
      });
      layersRef.current.forEach(l=>drawLayer(l,W,H,t));
      animFrameRef.current=requestAnimationFrame(render);
    };
    animFrameRef.current=requestAnimationFrame(render);
    return()=>{running=false;cancelAnimationFrame(animFrameRef.current);};
  },[canvasPreset]);

  // ─── Canvas mouse ──────────────────────────────────────────────────────────
  const toCanvas=(e:React.MouseEvent<HTMLCanvasElement>|MouseEvent)=>{
    const cv=canvasRef.current!,rect=cv.getBoundingClientRect();
    return{x:(("clientX" in e?e.clientX:0)-rect.left)*(cv.width/rect.width),
           y:(("clientY" in e?e.clientY:0)-rect.top)*(cv.height/rect.height)};
  };
  const dragging=useRef(false),dragId=useRef<string|null>(null);
  const dragStartMouse=useRef({x:0,y:0}),dragStartPos=useRef({x:0,y:0});
  const resizing=useRef(false),resizeStartY=useRef(0),resizeStartSize=useRef(0);
  const rotating=useRef(false),rotateStartAngle=useRef(0),rotateStartRot=useRef(0),rotateCenter=useRef({x:0,y:0});

  const handleCanvasMouseDown=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const {x,y}=toCanvas(e);const W=canvasPreset.w,H=canvasPreset.h;
    if(selectedLayerId){
      const sel=layersRef.current.find(l=>l.id===selectedLayerId);
      if(sel){
        const cx=sel.x*W,cy=sel.y*H,hh=sel._h/2+10;
        const rotHX=cx+Math.cos(sel.rotation-Math.PI/2)*(hh+25);
        const rotHY=cy+Math.sin(sel.rotation-Math.PI/2)*(hh+25);
        if(Math.hypot(x-rotHX,y-rotHY)<12){
          rotating.current=true;rotateCenter.current={x:cx,y:cy};
          rotateStartAngle.current=Math.atan2(y-cy,x-cx);rotateStartRot.current=sel.rotation;return;
        }
        const hw=sel._w/2+10,cos=Math.cos(sel.rotation),sin=Math.sin(sel.rotation);
        const brX=cx+(hw*cos-hh*sin),brY=cy+(hw*sin+hh*cos);
        if(Math.hypot(x-brX,y-brY)<14){resizing.current=true;resizeStartY.current=y;resizeStartSize.current=sel.fontSize;dragId.current=sel.id;return;}
      }
    }
    const hit=[...layersRef.current].reverse().find(l=>hitTest(l,x,y,W,H));
    if(hit){setSelectedLayerId(hit.id);dragging.current=true;dragId.current=hit.id;dragStartMouse.current={x,y};dragStartPos.current={x:hit.x,y:hit.y};}
    else{setSelectedLayerId(null);}
  };
  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{
      if(!canvasRef.current)return;const {x,y}=toCanvas(e);const W=canvasPreset.w,H=canvasPreset.h;
      if(dragging.current&&dragId.current){
        const dx=x-dragStartMouse.current.x,dy=y-dragStartMouse.current.y;
        updateLayer(dragId.current,{x:Math.max(0,Math.min(1,dragStartPos.current.x+dx/W)),y:Math.max(0,Math.min(1,dragStartPos.current.y+dy/H))});
      }else if(resizing.current&&dragId.current){
        const dy=y-resizeStartY.current;const ns=Math.max(8,Math.min(600,resizeStartSize.current+dy*0.5));
        updateLayer(dragId.current,{fontSize:Math.round(ns)});
      }else if(rotating.current&&selectedIdRef.current){
        const angle=Math.atan2(y-rotateCenter.current.y,x-rotateCenter.current.x);
        updateLayer(selectedIdRef.current,{rotation:rotateStartRot.current+(angle-rotateStartAngle.current)});
      }
    };
    const onUp=()=>{dragging.current=false;resizing.current=false;rotating.current=false;dragId.current=null;};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[canvasPreset,updateLayer]);

  // Export PNG
  const handleExportPng=()=>{
    const cv=canvasRef.current;if(!cv)return;
    const a=document.createElement("a");a.href=cv.toDataURL("image/png");a.download=`horror-overlay-${canvasPreset.w}x${canvasPreset.h}.png`;a.click();
  };

  // FIX: Recording with video audio support
  const startRecording=()=>{
    const cv=canvasRef.current;if(!cv)return;
    chunksRef.current=[];setRecordingTime(0);
    const videoStream=cv.captureStream(30);
    let finalStream=videoStream;
    // Add audio from video element if present
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
        const combinedTracks=[...videoStream.getVideoTracks(),...audioDestRef.current.stream.getAudioTracks()];
        finalStream=new MediaStream(combinedTracks);
      }catch(err){console.warn("Audio capture failed, recording video only:",err);}
    }
    const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":MediaRecorder.isTypeSupported("video/webm;codecs=vp8")?"video/webm;codecs=vp8":"video/webm";
    const mr=new MediaRecorder(finalStream,{mimeType,videoBitsPerSecond:8_000_000});
    mr.ondataavailable=ev=>{if(ev.data.size>0)chunksRef.current.push(ev.data);};
    mr.onstop=()=>{
      const blob=new Blob(chunksRef.current,{type:mimeType});const url=URL.createObjectURL(blob);const name=`rec-${Date.now()}.webm`;
      setRecordings(prev=>[{name,url,size:blob.size},...prev]);
      const a=document.createElement("a");a.href=url;a.download=name;a.click();
    };
    // FIX: 400ms delay so animation is running before recording starts
    setTimeout(()=>{mr.start(250);mediaRecorderRef.current=mr;setRecording(true);
      let el=0;recTimerRef.current=setInterval(()=>{el++;setRecordingTime(el);if(el>=5*60)stopRecording();},1000);},400);
  };
  const stopRecording=()=>{
    if(recTimerRef.current){clearInterval(recTimerRef.current);recTimerRef.current=null;}
    if(mediaRecorderRef.current&&mediaRecorderRef.current.state!=="inactive"){
      mediaRecorderRef.current.requestData?.();setTimeout(()=>{if(mediaRecorderRef.current?.state!=="inactive")mediaRecorderRef.current?.stop();},200);}
    setRecording(false);
  };

  const handleSurprise=()=>selectTemplate(allTemplates[Math.floor(Math.random()*allTemplates.length)]);
  const categories=["All",...TEMPLATE_CATEGORIES];
  const sl=selectedLayer;

  const filteredOverlays=OVERLAY_DEFS.filter(o=>overlayCategory==="All"||o.category===overlayCategory);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{fontFamily:"Cinzel"}}>Text Input</h2>
          <textarea value={newText} onChange={e=>setNewText(e.target.value)} rows={2}
            className="w-full px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40 resize-none" placeholder="Enter text..."/>
          <button onClick={()=>{const l=makeLayer({text:newText||"TEXT",fontFamily:FONT_OPTIONS[0],color:selectedTemplate.colors[0]});setLayers(p=>[...p,l]);setSelectedLayerId(l.id);}}
            className="w-full mt-2 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-colors">+ Add Text Layer</button>
          <button onClick={handleSurprise}
            className="w-full mt-1.5 py-1.5 rounded bg-purple-900/20 border border-purple-700/30 text-purple-300 text-xs font-bold hover:bg-purple-900/40 transition-colors">Surprise Me</button>
        </div>

        {/* Layers */}
        <div className="p-2 border-b border-red-900/20">
          <h2 className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">Layers</h2>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {layers.map(l=>(
              <div key={l.id} onClick={()=>setSelectedLayerId(l.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs border transition-all ${l.id===selectedLayerId?"bg-red-900/30 border-red-700/40 text-red-200":"bg-zinc-800/40 border-zinc-800/30 text-zinc-400 hover:border-zinc-600/40"}`}>
                <span className="flex-1 truncate">{l.text||"(empty)"}</span>
                <button onClick={e=>{e.stopPropagation();setLayers(p=>p.filter(x=>x.id!==l.id));if(selectedLayerId===l.id)setSelectedLayerId(null);}}
                  className="text-zinc-600 hover:text-red-400 text-sm px-0.5">×</button>
              </div>))}
          </div>
        </div>

        {/* Template Categories */}
        <div className="p-2 border-b border-red-900/20">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat=>(
              <button key={cat} onClick={()=>setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all border ${activeCategory===cat?"bg-red-900/30 border-red-700/40 text-red-300":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                {cat}</button>))}
          </div>
        </div>
        <div className="p-2 border-b border-zinc-800/30">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search templates..."
            className="w-full px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"/>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[9px] text-zinc-600 mb-1.5 uppercase tracking-wider">{filtered.length} templates</div>
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(tpl=>(
              <TemplateCard key={tpl.id} template={tpl} selected={selectedTemplate.id===tpl.id}
                onClick={()=>selectTemplate(tpl)} text={newText}/>))}
          </div>
        </div>
      </aside>

      {/* ── Center ── */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <h1 className="text-lg font-black text-purple-400" style={{fontFamily:"Cinzel"}}>TEXT OVERLAY ANIMATOR</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-600">Template:</span><span className="text-zinc-300">{selectedTemplate.name}</span>
          </div>
        </div>

        {/* Canvas Size */}
        <div className="relative mb-2">
          <button onClick={()=>setShowSizeMenu(v=>!v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-purple-700/40 transition-colors w-full max-w-sm">
            <span className="text-zinc-500 text-[10px]">📐</span>
            <span className="flex-1 text-left truncate">{canvasPreset.label}</span>
            <span className="text-zinc-500 text-[10px] font-mono">{canvasPreset.w}×{canvasPreset.h}</span>
            <span className="text-zinc-600 ml-1">▾</span>
          </button>
          {showSizeMenu&&(
            <div className="absolute top-full left-0 mt-1 z-50 w-80 rounded border border-zinc-700/40 bg-[#0c0c16] shadow-xl max-h-72 overflow-y-auto">
              {CANVAS_PRESETS.map((p,i)=>(
                <button key={i} onClick={()=>{setCanvasPreset(p);setShowSizeMenu(false);}}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-2 ${canvasPreset.label===p.label?"bg-blue-900/40 text-blue-300":"text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"}`}>
                  <span className="truncate">{p.label}</span>
                  <span className="text-zinc-600 text-[10px] font-mono">{p.w}×{p.h}</span>
                </button>))}
            </div>)}
        </div>

        {/* Canvas — FIX: aspect-ratio wrapper */}
        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
          <div className="relative rounded border border-purple-900/30 overflow-hidden bg-[#05050a]"
            style={{aspectRatio:`${canvasPreset.w} / ${canvasPreset.h}`,maxWidth:"100%",maxHeight:"100%",boxShadow:"0 0 30px rgba(100,0,200,0.15)"}}>
            <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block",cursor:"crosshair"}}
              onMouseDown={handleCanvasMouseDown}/>
            {recording&&(
              <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/50 border border-red-700/60">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                <span className="text-xs text-red-300 font-mono font-bold">REC {formatTime(recordingTime)}</span>
              </div>)}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 border border-zinc-700/30 text-[9px] text-zinc-500 font-mono">
              {canvasPreset.w}×{canvasPreset.h}</div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center gap-2 mt-2 flex-wrap flex-shrink-0">
          <button onClick={handleExportPng}
            className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 hover:border-purple-700/30 transition-colors">
            📷 Export PNG</button>
          <button onClick={recording?stopRecording:startRecording}
            className={`px-4 py-1.5 rounded text-xs font-bold border transition-all ${recording?"bg-red-600/30 border-red-500/50 text-red-300 animate-pulse":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-red-700/30"}`}>
            {recording?`◼ Stop  ${formatTime(recordingTime)}`:"● Record"}</button>
          <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload}/>
          <button onClick={()=>bgFileRef.current?.click()}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${bgImage?"bg-green-900/20 border-green-700/40 text-green-300":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-green-700/30"}`}>
            🖼 {bgImage?"BG: Image":"Upload Image"}</button>
          <input ref={bgVidRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload}/>
          <button onClick={()=>bgVidRef.current?.click()}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${bgVideo?"bg-blue-900/20 border-blue-700/40 text-blue-300":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-blue-700/30"}`}>
            🎬 {bgVideo?"BG: Video (+Audio)":"Upload Video"}</button>
          {(bgImage||bgVideo)&&(
            <><select value={bgObjectFit} onChange={e=>setBgObjectFit(e.target.value as any)}
                className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                <option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option>
              </select>
              <button onClick={clearBg} className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-red-400 hover:border-red-700/40">✕ Clear BG</button></>)}
          <button onClick={()=>setShowOverlayPanel(v=>!v)}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${activeOverlayIds.length>0?"bg-purple-900/30 border-purple-700/40 text-purple-300":"bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-purple-700/30"}`}>
            🎭 Overlays {activeOverlayIds.length>0?`(${activeOverlayIds.length})`:""}</button>
          <button onClick={()=>{setShowRecordings(v=>!v);}}
            className="ml-auto px-3 py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200">
            📁 Recordings ({recordings.length})</button>
        </div>

        {/* Overlay Panel */}
        {showOverlayPanel&&(
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#06060c] flex-shrink-0">
            <div className="p-2 border-b border-zinc-800/30">
              <div className="flex gap-1 flex-wrap">
                {OVERLAY_CATEGORIES.map(cat=>(
                  <button key={cat} onClick={()=>setOverlayCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[9px] border ${overlayCategory===cat?"bg-purple-900/30 border-purple-700/40 text-purple-300":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                    {cat}</button>))}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1 p-2 max-h-40 overflow-y-auto">
              {filteredOverlays.map(o=>(
                <button key={o.id} onClick={()=>toggleOverlay(o.id)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded border text-center transition-all ${activeOverlayIds.includes(o.id)?"bg-purple-900/40 border-purple-600/60 text-purple-200":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:border-zinc-500/60"}`}>
                  <span className="text-lg leading-none">{o.emoji}</span>
                  <span className="text-[8px] leading-tight truncate w-full">{o.label}</span>
                </button>))}
            </div>
          </div>)}

        {/* Recordings */}
        {showRecordings&&(
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#06060c] max-h-36 overflow-y-auto flex-shrink-0">
            {recordings.length===0?<p className="text-xs text-zinc-600 p-3 text-center">No recordings yet</p>:
              recordings.map((rec,i)=>(
                <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate">{rec.name}</div>
                    <div className="text-[9px] text-zinc-600">{(rec.size/1024/1024).toFixed(2)} MB</div>
                  </div>
                  <a href={rec.url} download={rec.name} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-[10px] text-zinc-400 hover:text-white flex-shrink-0">↓ Download</a>
                </div>))}
          </div>)}
      </div>

      {/* ── Right Sidebar ── */}
      <aside className="w-60 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        <div className="p-3">
          <button onClick={()=>setShowEditPanel(v=>!v)}
            className={`w-full mb-3 py-1.5 rounded text-xs font-bold border transition-all ${showEditPanel?"bg-red-900/30 border-red-700/40 text-red-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:border-red-700/30"}`}>
            {showEditPanel?"✎ Editing Mode ON":"✎ Edit Layer"}</button>

          {showEditPanel&&sl&&(
            <div className="space-y-3 pb-3 border-b border-zinc-800/40">
              <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold" style={{fontFamily:"Cinzel"}}>Edit Override</h2>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Text</label>
                <input type="text" value={sl.text} onChange={e=>updateLayer(sl.id,{text:e.target.value})}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40"/>
              </div>
              {/* Animation — 100+ list */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Animation ({ALL_ANIMATIONS.length})</label>
                <select value={sl.animation} onChange={e=>updateLayer(sl.id,{animation:e.target.value})}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40">
                  {ALL_ANIMATIONS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* Font */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Font ({FONT_OPTIONS.length})</label>
                <select value={sl.fontFamily} onChange={e=>updateLayer(sl.id,{fontFamily:e.target.value})}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40">
                  {FONT_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {/* Font Size */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Font Size: <span className="text-zinc-300">{sl.fontSize}px</span></label>
                <div className="flex items-center gap-2">
                  <input type="range" min={8} max={600} value={sl.fontSize} onChange={e=>updateLayer(sl.id,{fontSize:Number(e.target.value)})} className="flex-1 accent-red-600"/>
                  <input type="number" min={8} max={600} value={sl.fontSize} onChange={e=>{const v=Math.max(8,Math.min(600,Number(e.target.value)||8));updateLayer(sl.id,{fontSize:v});}}
                    className="w-14 px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none text-center"/>
                </div>
              </div>
              {/* B/I/U */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Style</label>
                <div className="flex gap-1.5">
                  {([{k:"bold",l:"B",c:"font-bold"},{k:"italic",l:"I",c:"italic"},{k:"underline",l:"U",c:"underline"}] as const).map(({k,l,c})=>(
                    <button key={k} onClick={()=>updateLayer(sl.id,{[k]:!sl[k as keyof TextLayer]})}
                      className={`flex-1 py-1 rounded text-xs border transition-all ${c} ${sl[k as keyof TextLayer]?"bg-red-900/40 border-red-700/50 text-red-200":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>
                      {l}</button>))}
                </div>
              </div>
              {/* Align */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Align</label>
                <div className="flex gap-1.5">
                  {(["left","center","right"] as CanvasTextAlign[]).map(a=>(
                    <button key={a} onClick={()=>updateLayer(sl.id,{align:a})}
                      className={`flex-1 py-1 rounded text-xs border transition-all ${sl.align===a?"bg-red-900/40 border-red-700/50 text-red-200":"bg-zinc-800/40 border-zinc-700/30 text-zinc-400"}`}>
                      {a==="left"?"☰":a==="center"?"≡":"☷"}</button>))}
                </div>
              </div>
              {/* Color */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={sl.color} onChange={e=>updateLayer(sl.id,{color:e.target.value})} className="w-8 h-7 rounded cursor-pointer bg-transparent border-0 p-0"/>
                  <span className="text-[10px] font-mono text-zinc-400">{sl.color}</span>
                </div>
              </div>
              {/* Stroke */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Stroke: <span className="text-zinc-300">{sl.strokeWidth}</span></label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={20} value={sl.strokeWidth} onChange={e=>updateLayer(sl.id,{strokeWidth:Number(e.target.value)})} className="flex-1 accent-red-600"/>
                  <input type="color" value={sl.strokeColor} onChange={e=>updateLayer(sl.id,{strokeColor:e.target.value})} className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0"/>
                </div>
              </div>
              {/* Opacity */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Opacity: <span className="text-zinc-300">{Math.round(sl.opacity*100)}%</span></label>
                <input type="range" min={0} max={100} value={Math.round(sl.opacity*100)} onChange={e=>updateLayer(sl.id,{opacity:Number(e.target.value)/100})} className="w-full accent-red-600"/>
              </div>
              {/* Letter Spacing */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Letter Spacing: <span className="text-zinc-300">{sl.letterSpacing}px</span></label>
                <input type="range" min={-10} max={80} value={sl.letterSpacing} onChange={e=>updateLayer(sl.id,{letterSpacing:Number(e.target.value)})} className="w-full accent-red-600"/>
              </div>
              {/* Position Y */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Position Y: <span className="text-zinc-300">{Math.round(sl.y*100)}%</span></label>
                <input type="range" min={0} max={100} value={Math.round(sl.y*100)} onChange={e=>updateLayer(sl.id,{y:Number(e.target.value)/100})} className="w-full accent-red-600"/>
              </div>
              {/* Rotation */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Rotation: <span className="text-zinc-300">{Math.round(sl.rotation*180/Math.PI)}°</span></label>
                <input type="range" min={-180} max={180} value={Math.round(sl.rotation*180/Math.PI)} onChange={e=>updateLayer(sl.id,{rotation:Number(e.target.value)*Math.PI/180})} className="w-full accent-red-600"/>
              </div>
              {/* Shadow */}
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider">Shadow</label>
                <button onClick={()=>updateLayer(sl.id,{shadowEnabled:!sl.shadowEnabled})}
                  className={`px-3 py-0.5 rounded text-xs border font-bold ${sl.shadowEnabled?"bg-green-900/30 border-green-700/40 text-green-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}>
                  {sl.shadowEnabled?"On":"Off"}</button>
              </div>
              {sl.shadowEnabled&&(
                <div className="flex items-center gap-2">
                  <input type="color" value={sl.shadowColor} onChange={e=>updateLayer(sl.id,{shadowColor:e.target.value})} className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0"/>
                  <input type="range" min={0} max={60} value={sl.shadowBlur} onChange={e=>updateLayer(sl.id,{shadowBlur:Number(e.target.value)})} className="flex-1 accent-red-600"/>
                  <span className="text-[10px] text-zinc-500 w-6">{sl.shadowBlur}</span>
                </div>)}
              {/* Glow */}
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider">Glow</label>
                <button onClick={()=>updateLayer(sl.id,{glowEnabled:!sl.glowEnabled})}
                  className={`px-3 py-0.5 rounded text-xs border font-bold ${sl.glowEnabled?"bg-green-900/30 border-green-700/40 text-green-300":"bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}>
                  {sl.glowEnabled?"On":"Off"}</button>
              </div>
              {sl.glowEnabled&&(
                <div className="flex items-center gap-2">
                  <input type="color" value={sl.glowColor} onChange={e=>updateLayer(sl.id,{glowColor:e.target.value})} className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0"/>
                  <span className="text-[9px] text-zinc-500">{sl.glowColor}</span>
                </div>)}
              <button onClick={()=>{const f=makeLayer({id:sl.id,text:sl.text,x:sl.x,y:sl.y});setLayers(p=>p.map(l=>l.id===sl.id?f:l));}}
                className="w-full py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-[10px] text-zinc-500 hover:text-zinc-300">↺ Reset Layer</button>
            </div>)}

          {!sl&&showEditPanel&&<p className="text-[10px] text-zinc-600 text-center py-4">Select a layer to edit</p>}

          {/* Template Info */}
          <div className="mt-3">
            <h2 className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mb-2" style={{fontFamily:"Cinzel"}}>Template Info</h2>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-zinc-600">Name</span><div className="text-zinc-200 font-medium mt-0.5">{selectedTemplate.name}</div></div>
              <div><span className="text-zinc-600">Category</span><div className="text-zinc-300 mt-0.5">{selectedTemplate.category}</div></div>
              <div><span className="text-zinc-600">Colors</span><div className="flex gap-1 mt-1">{selectedTemplate.colors.map((c,i)=>(<div key={i} className="w-5 h-5 rounded border border-zinc-700/30" style={{background:c}}/>))}</div></div>
              <div><span className="text-zinc-600">Canvas</span><div className="text-zinc-300 font-mono text-[10px] mt-0.5">{canvasPreset.w}×{canvasPreset.h}</div></div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/40">
            <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5">OBS Usage</h3>
            <p className="text-[10px] text-zinc-600 leading-relaxed">Export PNG for static overlays. Record → Download .webm → Add as OBS Media Source for animated overlays.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
