// overlays.ts — Place at: artifacts/horror-studio/src/data/overlays.ts

export interface OverlayParticle {
  x:number; y:number; vx:number; vy:number;
  size:number; life:number; maxLife:number;
  color:string; alpha:number; rot:number; vrot:number;
  type:string; extra?:Record<string,number|string>;
}
export interface OverlayDef {
  id:string; label:string; category:string; emoji:string;
  audioType?:string;
  initParticles:(W:number,H:number)=>OverlayParticle[];
  draw:(ctx:CanvasRenderingContext2D,W:number,H:number,t:number,ps:OverlayParticle[])=>void;
}

function rnd(a:number,b:number){return a+Math.random()*(b-a);}
function rc(p:string[]){return p[Math.floor(Math.random()*p.length)];}

export function tickParticles(ps:OverlayParticle[],W:number,H:number){
  ps.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.rot+=p.vrot; p.life=Math.max(0,p.life-0.004);
    if(p.life<=0||p.y>H+150||p.x<-300||p.x>W+300){
      p.life=1;
      const fall=["rain","blood","snow","leaf","flower","confetti","cherry","money","coin","gift","skull","bat","petal","diamond","sparkle"];
      const rise=["fire","smoke","lava","ember","bubble"];
      if(fall.includes(p.type)){p.x=rnd(0,W);p.y=rnd(-200,-10);}
      else if(rise.includes(p.type)){p.x=rnd(0,W);p.y=H+50;}
      else if(p.type==="fish"||p.type==="shark"){p.x=p.vx>0?-300:W+300;}
      else{p.x=rnd(0,W);p.y=rnd(-100,0);}
    }
  });
}

// ─── Draw Helpers ──────────────────────────────────────────────────────────
function dC(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,col:string,a:number){
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=col;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();
}
function dHeart(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,col:string,a:number){
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=col;ctx.translate(x,y);ctx.scale(s/30,s/30);
  ctx.beginPath();ctx.moveTo(0,-5);ctx.bezierCurveTo(0,-15,-16,-15,-16,-3);
  ctx.bezierCurveTo(-16,8,0,18,0,18);ctx.bezierCurveTo(0,18,16,8,16,-3);
  ctx.bezierCurveTo(16,-15,0,-15,0,-5);ctx.fill();ctx.restore();
}
function dStar(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,col:string,a:number){
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=col;ctx.translate(x,y);ctx.beginPath();
  for(let i=0;i<10;i++){const rad=i%2===0?r:r*0.4;const ang=(i*Math.PI)/5-Math.PI/2;
    i===0?ctx.moveTo(Math.cos(ang)*rad,Math.sin(ang)*rad):ctx.lineTo(Math.cos(ang)*rad,Math.sin(ang)*rad);}
  ctx.closePath();ctx.fill();ctx.restore();
}
function dLeaf(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,col:string,a:number,rot:number){
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=col;ctx.translate(x,y);ctx.rotate(rot);
  ctx.beginPath();ctx.ellipse(0,0,s*0.4,s*0.7,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function dFlower(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,col:string,a:number,rot:number){
  ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(rot);
  for(let i=0;i<6;i++){ctx.fillStyle=col;ctx.save();ctx.rotate(i*Math.PI/3);
    ctx.beginPath();ctx.ellipse(s*0.3,0,s*0.25,s*0.15,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.fillStyle="#ffff88";ctx.beginPath();ctx.arc(0,0,s*0.2,0,Math.PI*2);ctx.fill();ctx.restore();
}
function dSkull(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,a:number){
  ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);
  ctx.fillStyle="#ffffff";ctx.beginPath();ctx.arc(0,-s*0.15,s*0.5,Math.PI,0);ctx.fill();
  ctx.fillRect(-s*0.5,-s*0.15,s,s*0.35);
  ctx.fillStyle="#000";
  ctx.beginPath();ctx.arc(-s*0.18,-s*0.1,s*0.12,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.18,-s*0.1,s*0.12,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(0,s*0.08,s*0.07,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffffff";
  for(let i=-2;i<=1;i++)ctx.fillRect(i*s*0.14+s*0.02,s*0.18,s*0.1,s*0.15);
  ctx.restore();
}
function dGhost(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,a:number,t:number){
  const bob=Math.sin(t*2+x)*6;
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle="rgba(200,230,255,0.65)";ctx.translate(x,y+bob);
  ctx.beginPath();ctx.arc(0,-s*0.3,s*0.4,Math.PI,0);ctx.lineTo(s*0.4,s*0.3);
  for(let i=3;i>=0;i--){const bx=-s*0.4+(i+0.5)*(s*0.8/4);
    ctx.quadraticCurveTo(bx+s*0.1,s*0.45+(i%2===0?s*0.1:-s*0.1),bx-s*0.1,s*0.3);}
  ctx.closePath();ctx.fill();
  ctx.fillStyle="#000";ctx.globalAlpha=a*0.8;
  ctx.beginPath();ctx.ellipse(-s*0.14,-s*0.28,s*0.08,s*0.12,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(s*0.14,-s*0.28,s*0.08,s*0.12,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function dBat(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,a:number,flap:number){
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle="#220022";ctx.translate(x,y);
  ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-s*0.3,-s*0.4*Math.sin(flap),-s*0.7,s*0.1,-s*0.9,s*0.2);
  ctx.bezierCurveTo(-s*0.5,-s*0.05,-s*0.2,s*0.15,0,0);ctx.fill();
  ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(s*0.3,-s*0.4*Math.sin(flap),s*0.7,s*0.1,s*0.9,s*0.2);
  ctx.bezierCurveTo(s*0.5,-s*0.05,s*0.2,s*0.15,0,0);ctx.fill();
  ctx.beginPath();ctx.ellipse(0,0,s*0.15,s*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// ─── Complex Creature Drawers ──────────────────────────────────────────────
function drawDragon(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number,col="#228833"){
  ctx.save();ctx.translate(x,y);const wave=Math.sin(t*2)*0.2;
  for(let i=0;i<5;i++){const bx=-i*s*0.18;const by=Math.sin(t*2+i*0.8)*s*0.12;
    ctx.fillStyle=col;ctx.globalAlpha=0.92;
    ctx.beginPath();ctx.ellipse(bx,by,s*(0.35-i*0.04),s*(0.28-i*0.03),wave,0,Math.PI*2);ctx.fill();}
  const hx=s*0.4,hy=Math.sin(t*2)*s*0.1;
  ctx.fillStyle=col;ctx.globalAlpha=0.95;ctx.beginPath();ctx.ellipse(hx,hy,s*0.4,s*0.28,wave,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#aaff22";ctx.lineWidth=s*0.04;ctx.globalAlpha=0.9;
  ctx.beginPath();ctx.moveTo(hx-s*0.1,hy-s*0.2);ctx.lineTo(hx-s*0.18,hy-s*0.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(hx+s*0.1,hy-s*0.2);ctx.lineTo(hx+s*0.18,hy-s*0.5);ctx.stroke();
  ctx.fillStyle="#ff4400";ctx.globalAlpha=1;ctx.beginPath();ctx.arc(hx+s*0.22,hy-s*0.05,s*0.07,0,Math.PI*2);ctx.fill();
  if(Math.sin(t*1.5)>0.3){
    ctx.globalAlpha=0.7;const g=ctx.createRadialGradient(hx+s*0.5,hy,5,hx+s*1.2,hy,s*0.7);
    g.addColorStop(0,"#ffff00");g.addColorStop(0.4,"#ff6600");g.addColorStop(1,"rgba(255,0,0,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(hx+s*0.85,hy,s*0.6,s*0.2,wave*0.3,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#115522";ctx.globalAlpha=0.7;
  ctx.beginPath();ctx.moveTo(0,-s*0.1);ctx.bezierCurveTo(-s*0.4,-s*(0.6+Math.sin(t*3)*0.2),-s*0.9,-s*0.3,-s*0.6,s*0.2);ctx.bezierCurveTo(-s*0.3,s*0.1,0,0,0,-s*0.1);ctx.fill();
  ctx.beginPath();ctx.moveTo(0,-s*0.1);ctx.bezierCurveTo(s*0.3,-s*(0.5+Math.sin(t*3+0.5)*0.2),s*0.7,-s*0.3,s*0.5,s*0.15);ctx.bezierCurveTo(s*0.2,s*0.05,0,-s*0.05,0,-s*0.1);ctx.fill();
  ctx.restore();
}
function drawGodzilla(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#336633";
  ctx.beginPath();ctx.moveTo(-s*0.4,s*0.3);ctx.quadraticCurveTo(-s*1.2,s*0.5+Math.sin(t)*s*0.1,-s*1.8,s*0.2);ctx.lineTo(-s*1.6,s*0.4);ctx.quadraticCurveTo(-s*1.1,s*0.7,-s*0.3,s*0.5);ctx.closePath();ctx.fill();
  ctx.fillStyle="#335533";ctx.fillRect(-s*0.3,s*0.35,s*0.22,s*0.55);ctx.fillRect(s*0.08,s*0.35,s*0.22,s*0.55);
  ctx.fillStyle="#336633";ctx.beginPath();ctx.ellipse(0,0,s*0.42,s*0.55,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#44ff88";
  for(let i=0;i<5;i++){const sx=-s*0.15+i*s*0.08;ctx.beginPath();ctx.moveTo(sx,-s*0.45);ctx.lineTo(sx-s*0.05,-s*(0.57+i*0.04));ctx.lineTo(sx+s*0.05,-s*(0.57+i*0.04));ctx.closePath();ctx.fill();}
  ctx.fillStyle="#336633";ctx.beginPath();ctx.ellipse(0,-s*0.7,s*0.28,s*0.25,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#aaff44";ctx.shadowColor="#00ff00";ctx.shadowBlur=15;
  ctx.beginPath();ctx.arc(-s*0.12,-s*0.72,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.12,-s*0.72,s*0.06,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  if(Math.sin(t*1.2)>0.5){
    const g=ctx.createLinearGradient(0,-s*0.65,0,-s*1.8);
    g.addColorStop(0,"rgba(0,255,100,0.9)");g.addColorStop(1,"rgba(0,255,100,0)");
    ctx.fillStyle=g;ctx.globalAlpha=0.8;ctx.beginPath();ctx.ellipse(0,-s*1.1,s*0.1,s*0.5,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function drawShark(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.88;ctx.rotate(Math.sin(t*2)*0.12);
  ctx.fillStyle="#4477aa";
  ctx.beginPath();ctx.moveTo(-s*0.8,0);ctx.bezierCurveTo(-s*0.4,-s*0.22,s*0.5,-s*0.18,s*0.8,0);ctx.bezierCurveTo(s*0.5,s*0.18,-s*0.4,s*0.22,-s*0.8,0);ctx.fill();
  ctx.fillStyle="#ccddee";ctx.beginPath();ctx.ellipse(0,s*0.06,s*0.65,s*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#336699";ctx.beginPath();ctx.moveTo(-s*0.1,-s*0.18);ctx.lineTo(s*0.15,-s*0.55);ctx.lineTo(s*0.35,-s*0.18);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-s*0.8,0);ctx.lineTo(-s*1.1,-s*0.3);ctx.lineTo(-s*0.85,0);ctx.lineTo(-s*1.1,s*0.3);ctx.closePath();ctx.fill();
  ctx.fillStyle="#000";ctx.beginPath();ctx.arc(s*0.45,-s*0.06,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawFreddy(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#111111";ctx.fillRect(-s*0.35,-s*1.18,s*0.7,s*0.12);ctx.fillRect(-s*0.25,-s*1.6,s*0.5,s*0.44);
  ctx.fillStyle="#222222";ctx.beginPath();ctx.ellipse(0,0,s*0.42,s*0.55,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<5;i++){ctx.fillStyle=i%2===0?"#cc3300":"#226600";ctx.fillRect(-s*0.42,-s*0.55+i*s*0.22,s*0.84,s*0.22);}
  ctx.globalCompositeOperation="destination-in";ctx.beginPath();ctx.ellipse(0,0,s*0.42,s*0.55,0,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="source-over";
  ctx.fillStyle="#8B4513";ctx.globalAlpha=0.9;ctx.beginPath();ctx.ellipse(0,-s*0.72,s*0.32,s*0.32,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ff2200";ctx.globalAlpha=0.9;
  ctx.beginPath();ctx.arc(-s*0.12,-s*0.74,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.12,-s*0.74,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#664422";ctx.globalAlpha=0.88;ctx.beginPath();ctx.ellipse(s*0.6,s*0.1+Math.sin(t*3)*s*0.06,s*0.15,s*0.2,0.3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#bbbbbb";ctx.lineWidth=s*0.04;
  for(let i=0;i<4;i++){const cx=s*0.52+i*s*0.06;ctx.beginPath();ctx.moveTo(cx,s*0.05);ctx.lineTo(cx,s*0.05-s*0.25-Math.sin(t*3+i)*s*0.05);ctx.stroke();}
  ctx.restore();
}
function drawJason(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#1a1a1a";ctx.beginPath();ctx.ellipse(0,0,s*0.45,s*0.6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ddddcc";ctx.beginPath();ctx.ellipse(0,-s*0.75,s*0.35,s*0.35,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffffff";ctx.strokeStyle="#cc3300";ctx.lineWidth=s*0.025;
  ctx.beginPath();ctx.ellipse(0,-s*0.75,s*0.33,s*0.34,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle="#cc3300";ctx.lineWidth=s*0.03;
  ctx.beginPath();ctx.moveTo(-s*0.2,-s*0.96);ctx.lineTo(-s*0.2,-s*0.54);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.2,-s*0.96);ctx.lineTo(s*0.2,-s*0.54);ctx.stroke();
  ctx.fillStyle="#111111";
  ctx.beginPath();ctx.ellipse(-s*0.12,-s*0.78,s*0.07,s*0.05,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(s*0.12,-s*0.78,s*0.07,s*0.05,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.rotate(Math.sin(t*2)*0.1);ctx.fillStyle="#888888";
  ctx.fillRect(s*0.5,-s*0.2,s*0.08,s*0.55);ctx.fillStyle="#aaaaaa";
  ctx.beginPath();ctx.moveTo(s*0.5,-s*0.2);ctx.lineTo(s*0.58,-s*0.2);ctx.lineTo(s*0.62,-s*0.45);ctx.closePath();ctx.fill();ctx.restore();
  ctx.restore();
}
function drawPennywise(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#ffffff";
  for(let i=0;i<8;i++){ctx.save();ctx.rotate(i/8*Math.PI*2);ctx.beginPath();ctx.ellipse(s*0.35,0,s*0.18,s*0.1,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.fillStyle="#eeeecc";ctx.beginPath();ctx.ellipse(0,0,s*0.42,s*0.55,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ff4400";for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,-s*0.25+i*s*0.25,s*0.06,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#f5d0c0";ctx.beginPath();ctx.ellipse(0,-s*0.72,s*0.33,s*0.34,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffee00";ctx.shadowColor="#ffee00";ctx.shadowBlur=10;
  ctx.beginPath();ctx.arc(-s*0.12,-s*0.76,s*0.07,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.12,-s*0.76,s*0.07,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle="#ff0000";ctx.shadowColor="#ff0000";ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(0,-s*0.68,s*0.07,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle="#cc0000";ctx.lineWidth=s*0.035;ctx.beginPath();ctx.arc(0,-s*0.6,s*0.2,0.2,Math.PI-0.2);ctx.stroke();
  ctx.fillStyle="#ff4400";ctx.beginPath();ctx.arc(-s*0.32,-s*0.84,s*0.12,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.32,-s*0.84,s*0.12,0,Math.PI*2);ctx.fill();
  if(Math.sin(t*1.5)>0){ctx.fillStyle="#ff2222";ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(-s*0.7,-s*0.5+Math.sin(t*2)*s*0.1,s*0.18,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function drawJoker(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#6600aa";ctx.beginPath();ctx.ellipse(0,0,s*0.42,s*0.6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f5d0c0";ctx.beginPath();ctx.ellipse(0,-s*0.76,s*0.33,s*0.33,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#220033";
  ctx.beginPath();ctx.ellipse(-s*0.12,-s*0.8,s*0.07,s*0.05,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(s*0.12,-s*0.8,s*0.07,s*0.05,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#cc0000";ctx.lineWidth=s*0.04;const sw=Math.sin(t*3)*0.1;
  ctx.beginPath();ctx.arc(0,-s*0.65,s*0.22,0.1+sw,Math.PI-0.1-sw);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*0.2,-s*0.68);ctx.lineTo(-s*0.32,-s*0.56);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.2,-s*0.68);ctx.lineTo(s*0.32,-s*0.56);ctx.stroke();
  ctx.fillStyle="#00cc22";ctx.beginPath();ctx.ellipse(0,-s*1.0,s*0.28,s*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawVampire(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#220000";
  ctx.beginPath();ctx.moveTo(-s*0.4,-s*0.4);ctx.bezierCurveTo(-s*0.8,s*0.2,-s*0.7,s*0.9,-s*0.2,s*1.0);ctx.lineTo(s*0.2,s*1.0);ctx.bezierCurveTo(s*0.7,s*0.9,s*0.8,s*0.2,s*0.4,-s*0.4);ctx.fill();
  ctx.fillStyle="#880000";
  ctx.beginPath();ctx.moveTo(-s*0.35,-s*0.35);ctx.bezierCurveTo(-s*0.7,s*0.1,-s*0.6,s*0.7,-s*0.18,s*0.85);ctx.lineTo(s*0.18,s*0.85);ctx.bezierCurveTo(s*0.6,s*0.7,s*0.7,s*0.1,s*0.35,-s*0.35);ctx.fill();
  ctx.fillStyle="#ddeeff";ctx.beginPath();ctx.ellipse(0,-s*0.72,s*0.3,s*0.32,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#111111";ctx.beginPath();ctx.ellipse(0,-s*0.98,s*0.28,s*0.14,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(0,-s*0.84);ctx.lineTo(-s*0.1,-s*1.0);ctx.lineTo(s*0.1,-s*1.0);ctx.fill();
  ctx.fillStyle="#ff0000";ctx.shadowColor="#ff0000";ctx.shadowBlur=12;
  ctx.beginPath();ctx.arc(-s*0.1,-s*0.74,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.1,-s*0.74,s*0.06,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle="#ffffff";
  ctx.beginPath();ctx.moveTo(-s*0.05,-s*0.6);ctx.lineTo(-s*0.02,-s*0.5);ctx.lineTo(-s*0.08,-s*0.5);ctx.fill();
  ctx.beginPath();ctx.moveTo(s*0.05,-s*0.6);ctx.lineTo(s*0.08,-s*0.5);ctx.lineTo(s*0.02,-s*0.5);ctx.fill();
  ctx.restore();
}
function drawZombie(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.88;ctx.rotate(Math.sin(t*2)*0.12);
  ctx.fillStyle="#334422";ctx.beginPath();ctx.ellipse(0,0,s*0.4,s*0.55,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#556633";
  ctx.beginPath();ctx.moveTo(-s*0.4,-s*0.2);ctx.bezierCurveTo(-s*0.8,-s*0.15,-s*1.1,-s*0.25,-s*1.3,-s*0.1);ctx.lineTo(-s*1.25,s*0.1);ctx.bezierCurveTo(-s*1.0,-s*0.05,-s*0.7,s*0.05,-s*0.35,0);ctx.fill();
  ctx.beginPath();ctx.moveTo(s*0.4,-s*0.2);ctx.bezierCurveTo(s*0.8,-s*0.15,s*1.1,-s*0.25,s*1.3,-s*0.1);ctx.lineTo(s*1.25,s*0.1);ctx.bezierCurveTo(s*1.0,-s*0.05,s*0.7,s*0.05,s*0.35,0);ctx.fill();
  ctx.fillStyle="#aabb88";ctx.beginPath();ctx.ellipse(0,-s*0.72,s*0.32,s*0.32,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffffff";
  ctx.beginPath();ctx.arc(-s*0.12,-s*0.75,s*0.07,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.12,-s*0.75,s*0.07,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#cc0000";ctx.beginPath();ctx.arc(0,-s*0.62,s*0.12,0,Math.PI);ctx.fill();
  ctx.fillStyle="#eeeecc";for(let i=0;i<4;i++){ctx.fillRect(-s*0.1+i*s*0.055,-s*0.64,s*0.04,s*0.06);}
  ctx.restore();
}
function drawDemon(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#660000";ctx.beginPath();ctx.ellipse(0,0,s*0.45,s*0.6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#330000";ctx.globalAlpha=0.8;
  ctx.beginPath();ctx.moveTo(-s*0.2,-s*0.3);ctx.bezierCurveTo(-s*0.8,-s*(0.7+Math.sin(t*2)*0.15),-s*1.1,0,-s*0.8,s*0.4);ctx.bezierCurveTo(-s*0.5,s*0.2,-s*0.3,0,-s*0.2,-s*0.3);ctx.fill();
  ctx.beginPath();ctx.moveTo(s*0.2,-s*0.3);ctx.bezierCurveTo(s*0.8,-s*(0.7+Math.sin(t*2+0.5)*0.15),s*1.1,0,s*0.8,s*0.4);ctx.bezierCurveTo(s*0.5,s*0.2,s*0.3,0,s*0.2,-s*0.3);ctx.fill();ctx.globalAlpha=0.9;
  ctx.fillStyle="#880000";ctx.beginPath();ctx.ellipse(0,-s*0.75,s*0.35,s*0.35,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#440000";
  ctx.beginPath();ctx.moveTo(-s*0.2,-s*1.0);ctx.lineTo(-s*0.32,-s*1.45);ctx.lineTo(-s*0.08,-s*1.0);ctx.fill();
  ctx.beginPath();ctx.moveTo(s*0.2,-s*1.0);ctx.lineTo(s*0.32,-s*1.45);ctx.lineTo(s*0.08,-s*1.0);ctx.fill();
  ctx.fillStyle="#ff4400";ctx.shadowColor="#ff4400";ctx.shadowBlur=20;
  ctx.beginPath();ctx.arc(-s*0.13,-s*0.78,s*0.08,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.13,-s*0.78,s*0.08,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.restore();
}
function drawSpiderMan(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.92;
  ctx.fillStyle="#cc0000";ctx.beginPath();ctx.ellipse(0,0,s*0.38,s*0.5,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#000066";ctx.lineWidth=s*0.015;
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*s*0.13,-s*0.5);ctx.lineTo(i*s*0.13*0.7,s*0.5);ctx.stroke();}
  ctx.fillStyle="#000088";ctx.beginPath();ctx.ellipse(0,s*0.28,s*0.38,s*0.28,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#cc0000";ctx.beginPath();ctx.ellipse(0,-s*0.68,s*0.3,s*0.3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffffff";
  ctx.beginPath();ctx.ellipse(-s*0.12,-s*0.7,s*0.1,s*0.07,-0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(s*0.12,-s*0.7,s*0.1,s*0.07,0.3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#ffffff";ctx.lineWidth=s*0.02;ctx.globalAlpha=0.8;
  ctx.beginPath();ctx.moveTo(s*0.5,-s*0.1+Math.sin(t*2)*s*0.15);ctx.lineTo(s*1.5,-s*0.8);ctx.stroke();
  ctx.restore();
}
function drawThanos(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.9;
  ctx.fillStyle="#334455";ctx.beginPath();ctx.ellipse(0,0,s*0.55,s*0.65,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#7744aa";ctx.beginPath();ctx.ellipse(0,-s*0.82,s*0.38,s*0.38,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#664488";for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(i*s*0.1,-s*0.62,s*0.07,s*0.09,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#ffaaaa";
  ctx.beginPath();ctx.arc(-s*0.14,-s*0.86,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.14,-s*0.86,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ddaa00";ctx.shadowColor="#ffdd00";ctx.shadowBlur=20;
  ctx.beginPath();ctx.ellipse(s*0.7,s*0.05,s*0.2,s*0.3,0.3,0,Math.PI*2);ctx.fill();
  ["#ff0000","#ff8800","#ffff00","#00ff00","#0000ff","#aa00ff"].forEach((gc,i)=>{
    ctx.fillStyle=gc;ctx.shadowColor=gc;ctx.shadowBlur=15;
    ctx.beginPath();ctx.arc(s*0.65+(i%3)*s*0.08,s*0.02-Math.floor(i/3)*s*0.1,s*0.04,0,Math.PI*2);ctx.fill();});
  ctx.shadowBlur=0;ctx.restore();
}

// ─── OVERLAY DEFINITIONS ──────────────────────────────────────────────────
export const OVERLAY_CATEGORIES=["All","Weather","Nature","Horror","Creatures","Superheroes","Villains","Space","Ocean","Fire & Lava","Celebration","Tech & Glitch","Fantasy","Cinematic"];

export const OVERLAY_DEFS:OverlayDef[]=[
  // ── WEATHER ──
  {id:"rain",label:"Rain",category:"Weather",emoji:"🌧️",audioType:"rain",
   initParticles:(W,H)=>Array.from({length:220},()=>({x:rnd(0,W),y:rnd(-H,0),vx:rnd(-1,1),vy:rnd(12,22),size:rnd(1,3),life:1,maxLife:1,color:"#aaccff",alpha:rnd(0.4,0.9),rot:0,vrot:0,type:"rain"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{ctx.save();ctx.globalAlpha=p.alpha;ctx.strokeStyle=p.color;ctx.lineWidth=p.size*0.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.vx,p.y+p.size*3);ctx.stroke();ctx.restore();});}},
  {id:"snow",label:"Snowfall",category:"Weather",emoji:"❄️",audioType:"wind",
   initParticles:(W,H)=>Array.from({length:180},()=>({x:rnd(0,W),y:rnd(-100,H),vx:rnd(-1.5,1.5),vy:rnd(1.5,4),size:rnd(4,12),life:1,maxLife:1,color:"#ffffff",alpha:rnd(0.5,0.9),rot:0,vrot:0,type:"snow"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.x+=Math.sin(t+p.y*0.01)*0.5;dC(ctx,p.x,p.y,p.size*0.5,p.color,p.alpha);});}},
  {id:"lightning",label:"Lightning",category:"Weather",emoji:"⚡",audioType:"thunder",
   initParticles:(W,H)=>Array.from({length:5},()=>({x:rnd(W*0.1,W*0.9),y:0,vx:0,vy:0,size:1,life:1,maxLife:1,color:"#ccddff",alpha:0,rot:0,vrot:0,type:"lightning",extra:{lastT:0}})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{if(Math.random()<0.02){p.alpha=1;}else{p.alpha=Math.max(0,p.alpha-0.06);}if(p.alpha>0){ctx.save();ctx.globalAlpha=p.alpha;ctx.strokeStyle=p.color;ctx.lineWidth=rnd(1,4);ctx.shadowColor=p.color;ctx.shadowBlur=30;let cx=p.x,cy=0;ctx.beginPath();ctx.moveTo(cx,cy);while(cy<H){cx+=rnd(-60,60);cy+=rnd(30,80);ctx.lineTo(cx,cy);}ctx.stroke();if(p.alpha>0.7){ctx.globalAlpha=0.12;ctx.fillStyle="#ccddff";ctx.fillRect(0,0,W,H);}ctx.restore();}});}},
  {id:"fog",label:"Fog",category:"Weather",emoji:"🌫️",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:20},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(0.3,1),vy:0,size:rnd(120,280),life:1,maxLife:1,color:"#aabbcc",alpha:rnd(0.06,0.14),rot:0,vrot:0,type:"fog"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.alpha=0.05+Math.sin(t*0.5+p.x*0.001)*0.04;if(p.x>W+p.size)p.x=-p.size;ctx.save();ctx.globalAlpha=p.alpha;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);g.addColorStop(0,p.color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  {id:"wind",label:"Wind",category:"Weather",emoji:"💨",audioType:"wind",
   initParticles:(W,H)=>Array.from({length:50},()=>({x:rnd(-100,W),y:rnd(0,H),vx:rnd(8,18),vy:rnd(-0.5,0.5),size:rnd(40,160),life:rnd(0,1),maxLife:1,color:"#aaccff",alpha:rnd(0.05,0.18),rot:0,vrot:0,type:"wind"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{ctx.save();ctx.globalAlpha=p.alpha;ctx.strokeStyle=p.color;ctx.lineWidth=rnd(1,3);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.size,p.y);ctx.stroke();ctx.restore();});}},
  // ── NATURE ──
  {id:"leaves",label:"Autumn Leaves",category:"Nature",emoji:"🍂",audioType:"wind",
   initParticles:(W,H)=>Array.from({length:80},()=>({x:rnd(0,W),y:rnd(-H,0),vx:rnd(-3,-0.5),vy:rnd(1,3),size:rnd(10,24),life:1,maxLife:1,color:rc(["#228833","#886622","#cc8800","#ff6622"]),alpha:rnd(0.6,1),rot:rnd(0,Math.PI*2),vrot:rnd(-0.05,0.05),type:"leaf"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.x+=Math.sin(t+p.y*0.008)*1.2;dLeaf(ctx,p.x,p.y,p.size,p.color,p.alpha,p.rot);});}},
  {id:"flowers",label:"Flowers",category:"Nature",emoji:"🌸",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:70},()=>({x:rnd(0,W),y:rnd(-H*0.5,0),vx:rnd(-1,1),vy:rnd(1,3),size:rnd(14,28),life:1,maxLife:1,color:rc(["#ff88cc","#ff44aa","#ffaadd","#ff66bb","#ffffff"]),alpha:rnd(0.7,1),rot:rnd(0,Math.PI*2),vrot:rnd(-0.04,0.04),type:"flower"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.x+=Math.sin(t*0.8+p.y*0.007)*0.8;dFlower(ctx,p.x,p.y,p.size,p.color,p.alpha,p.rot);});}},
  {id:"cherry-blossom",label:"Cherry Blossom",category:"Nature",emoji:"🌺",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:80},()=>({x:rnd(0,W),y:rnd(-H*0.5,0),vx:rnd(-2,-0.3),vy:rnd(1,3),size:rnd(10,22),life:1,maxLife:1,color:rc(["#ffbbcc","#ff99bb","#ffddee","#ffaabb"]),alpha:rnd(0.6,1),rot:rnd(0,Math.PI*2),vrot:rnd(-0.06,0.06),type:"cherry"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.x+=Math.sin(t+p.y*0.008)*1.0;dFlower(ctx,p.x,p.y,p.size,p.color,p.alpha,p.rot);});}},
  // ── FIRE & LAVA ──
  {id:"fire",label:"Hell Fire",category:"Fire & Lava",emoji:"🔥",audioType:"fire",
   initParticles:(W,H)=>Array.from({length:160},()=>({x:rnd(0,W),y:H+rnd(0,60),vx:rnd(-2,2),vy:rnd(-6,-2),size:rnd(20,60),life:rnd(0.3,1),maxLife:1,color:rc(["#ff4400","#ff8800","#ffcc00","#ff2200"]),alpha:rnd(0.3,0.8),rot:0,vrot:0,type:"fire"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.size+=0.5;p.alpha-=0.008;const a=Math.max(0,p.alpha);ctx.save();ctx.globalAlpha=a;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);g.addColorStop(0,p.color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  {id:"lava",label:"Lava",category:"Fire & Lava",emoji:"🌋",audioType:"fire",
   initParticles:(W,H)=>Array.from({length:60},()=>({x:rnd(0,W),y:H-rnd(0,H*0.15),vx:rnd(-0.5,0.5),vy:rnd(-1,-0.2),size:rnd(20,60),life:rnd(0,1),maxLife:1,color:rc(["#ff3300","#ff6600","#ff9900","#cc2200"]),alpha:rnd(0.5,0.9),rot:0,vrot:0,type:"lava"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.size+=0.2;p.alpha-=0.004;const a=Math.max(0,p.alpha);ctx.save();ctx.globalAlpha=a;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);g.addColorStop(0,"#ffcc00");g.addColorStop(0.3,p.color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  {id:"smoke",label:"Smoke",category:"Fire & Lava",emoji:"💨",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:60},()=>({x:rnd(0,W),y:H+rnd(0,50),vx:rnd(-0.8,0.8),vy:rnd(-2,-0.5),size:rnd(30,80),life:rnd(0.2,1),maxLife:1,color:"#888888",alpha:rnd(0.1,0.3),rot:rnd(0,Math.PI),vrot:rnd(-0.01,0.01),type:"smoke"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.size+=0.8;p.alpha-=0.003;const a=Math.max(0,p.alpha);ctx.save();ctx.globalAlpha=a;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);g.addColorStop(0,p.color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  {id:"embers",label:"Embers",category:"Fire & Lava",emoji:"✨",audioType:"fire",
   initParticles:(W,H)=>Array.from({length:120},()=>({x:rnd(0,W),y:H+rnd(0,50),vx:rnd(-3,3),vy:rnd(-4,-1),size:rnd(2,6),life:rnd(0.3,1),maxLife:1,color:rc(["#ff8800","#ffcc00","#ff4400"]),alpha:rnd(0.5,1),rot:0,vrot:0,type:"ember"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.vx+=rnd(-0.3,0.3);p.alpha-=0.005;const a=Math.max(0,p.alpha);ctx.save();ctx.globalAlpha=a;ctx.shadowColor=p.color;ctx.shadowBlur=8;dC(ctx,p.x,p.y,p.size,p.color,a);ctx.restore();});}},
  // ── HORROR ──
  {id:"blood-rain",label:"Blood Rain",category:"Horror",emoji:"🩸",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:120},()=>({x:rnd(0,W),y:rnd(-H,0),vx:rnd(-0.5,0.5),vy:rnd(10,20),size:rnd(2,5),life:1,maxLife:1,color:rc(["#cc0000","#aa0000","#880000"]),alpha:rnd(0.6,1),rot:0,vrot:0,type:"blood"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{ctx.save();ctx.globalAlpha=p.alpha;ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y+p.size*6);ctx.stroke();ctx.restore();});}},
  {id:"skulls",label:"Falling Skulls",category:"Horror",emoji:"💀",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:15},()=>({x:rnd(0,W),y:rnd(-H*0.3,0),vx:rnd(-0.5,0.5),vy:rnd(1,3),size:rnd(30,60),life:1,maxLife:1,color:"#ffffff",alpha:rnd(0.5,0.9),rot:0,vrot:0,type:"skull"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{dSkull(ctx,p.x,p.y,p.size,p.alpha);});}},
  {id:"ghosts",label:"Ghosts",category:"Horror",emoji:"👻",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:10},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-1.5,1.5),vy:rnd(-0.5,0.5),size:rnd(40,80),life:1,maxLife:1,color:"#aaccff",alpha:rnd(0.4,0.7),rot:0,vrot:0,type:"ghost"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<-100)p.x=W+50;if(p.x>W+100)p.x=-50;if(p.y<0)p.y=H;if(p.y>H)p.y=0;dGhost(ctx,p.x,p.y,p.size,p.alpha,t+p.x*0.001);});}},
  {id:"bats",label:"Bats",category:"Horror",emoji:"🦇",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:20},()=>({x:rnd(0,W),y:rnd(0,H*0.6),vx:rnd(-3,3),vy:rnd(-1.5,1.5),size:rnd(20,45),life:1,maxLife:1,color:"#220022",alpha:0.9,rot:0,vrot:0,type:"bat",extra:{fp:rnd(0,Math.PI*2),fs:rnd(6,12)}})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx+=rnd(-0.2,0.2);p.vy+=rnd(-0.1,0.1);p.vx=Math.max(-5,Math.min(5,p.vx));p.vy=Math.max(-2,Math.min(2,p.vy));if(p.x<-100)p.x=W+50;if(p.x>W+100)p.x=-50;if(p.y<0)p.y=H*0.5;if(p.y>H*0.8)p.y=H*0.1;dBat(ctx,p.x,p.y,p.size,0.88,Math.sin(t*(p.extra?.fs||8)+(p.extra?.fp||0)));});}},
  {id:"eyes",label:"Glowing Eyes",category:"Horror",emoji:"👁️",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:20},()=>({x:rnd(0,W),y:rnd(0,H),vx:0,vy:0,size:rnd(15,40),life:1,maxLife:1,color:"#ff0000",alpha:rnd(0.3,0.9),rot:0,vrot:0,type:"eye",extra:{bs:rnd(1,4)}})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{const blink=Math.sin(t*(p.extra?.bs||2)+p.x*0.001);const sy=blink>0.9?0.05:1;ctx.save();ctx.globalAlpha=p.alpha*0.8+Math.sin(t*2+p.x)*0.2;ctx.shadowColor=p.color;ctx.shadowBlur=25;ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.scale(1,sy);ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*0.6,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(0,0,p.size*0.4,p.size*0.5*sy,0,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  {id:"cracks",label:"Earthquake Cracks",category:"Horror",emoji:"⚡",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:12},()=>({x:rnd(W*0.1,W*0.9),y:rnd(H*0.3,H*0.8),vx:0,vy:0,size:rnd(60,180),life:1,maxLife:1,color:"#ffaa00",alpha:rnd(0.4,0.9),rot:rnd(0,Math.PI*2),vrot:0,type:"crack",extra:{b:Math.floor(rnd(3,7))}})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.alpha*0.5+Math.sin(t*8)*0.2;ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.shadowColor=p.color;ctx.shadowBlur=10;const b=p.extra?.b||4;for(let i=0;i<b;i++){ctx.save();ctx.rotate((i/b)*Math.PI*2);ctx.beginPath();ctx.moveTo(0,0);let cx2=0,cy2=0;for(let k=0;k<4;k++){cx2+=rnd(-15,15);cy2+=p.size*0.25;ctx.lineTo(cx2,cy2);}ctx.stroke();ctx.restore();}ctx.restore();});}},
  {id:"pentagrams",label:"Pentagrams",category:"Horror",emoji:"⛤",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:6},()=>({x:rnd(0,W),y:rnd(0,H),vx:0,vy:0,size:rnd(30,80),life:1,maxLife:1,color:rc(["#cc0000","#aa0000"]),alpha:rnd(0.3,0.6),rot:rnd(0,Math.PI*2),vrot:rnd(-0.01,0.01),type:"penta"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.rot+=p.vrot;p.alpha=0.3+Math.sin(t*1.5+p.x*0.001)*0.2;ctx.save();ctx.globalAlpha=p.alpha;ctx.strokeStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=20;ctx.lineWidth=2;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.beginPath();for(let i=0;i<5;i++){const a=i*(Math.PI*4/5)-Math.PI/2;i===0?ctx.moveTo(Math.cos(a)*p.size,Math.sin(a)*p.size):ctx.lineTo(Math.cos(a)*p.size,Math.sin(a)*p.size);}ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.stroke();ctx.restore();});}},
  {id:"runes",label:"Dark Runes",category:"Horror",emoji:"🔮",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:20},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.3,0.3),vy:rnd(-0.3,0.3),size:rnd(20,50),life:1,maxLife:1,color:rc(["#aa00ff","#ff0088","#00ffaa","#ff6600"]),alpha:rnd(0.3,0.8),rot:rnd(0,Math.PI*2),vrot:rnd(-0.02,0.02),type:"rune"})),
   draw(ctx,W,H,t,ps){const g=["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚾ","ᛁ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛟ"];ps.forEach((p,i)=>{p.alpha=0.4+Math.sin(t*2+i)*0.3;p.rot+=p.vrot;ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=15;ctx.font=`${p.size}px serif`;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillText(g[i%g.length],0,0);ctx.restore();});}},
  // ── HORROR CREATURES ──
  {id:"freddy",label:"Freddy Krueger",category:"Horror",emoji:"🔪",audioType:"horror",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.45,vx:0,vy:0,size:Math.min(W,H)*0.22,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"freddy"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.5)*W*0.04;drawFreddy(ctx,p.x,p.y,p.size,t);});}},
  {id:"jason",label:"Jason Voorhees",category:"Horror",emoji:"🎭",audioType:"horror",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.45,vx:0,vy:0,size:Math.min(W,H)*0.22,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"jason"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.3)*W*0.03;drawJason(ctx,p.x,p.y,p.size,t);});}},
  {id:"pennywise",label:"Pennywise (IT)",category:"Horror",emoji:"🎈",audioType:"horror",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.45,vx:0,vy:0,size:Math.min(W,H)*0.22,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"pennywise"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.8)*W*0.04;drawPennywise(ctx,p.x,p.y,p.size,t);});}},
  {id:"joker",label:"Joker",category:"Villains",emoji:"🃏",audioType:"horror",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.45,vx:0,vy:0,size:Math.min(W,H)*0.22,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"joker"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.7)*W*0.04;drawJoker(ctx,p.x,p.y,p.size,t);});}},
  {id:"vampire",label:"Vampire",category:"Horror",emoji:"🧛",audioType:"horror",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.42,vx:0,vy:0,size:Math.min(W,H)*0.22,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"vampire"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.4)*W*0.03;p.y=H*0.42+Math.sin(t)*H*0.02;drawVampire(ctx,p.x,p.y,p.size,t);});}},
  {id:"zombie-horde",label:"Zombie Horde",category:"Horror",emoji:"🧟",audioType:"horror",
   initParticles:(W,H)=>Array.from({length:5},(_, i)=>({x:-100+i*W*0.25,y:H*0.65,vx:rnd(0.3,0.8),vy:0,size:Math.min(W,H)*0.14,life:1,maxLife:1,color:"",alpha:rnd(0.7,0.9),rot:0,vrot:0,type:"zombie"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;if(p.x>W+200)p.x=-200;drawZombie(ctx,p.x,p.y,p.size,t+p.x*0.001);});}},
  {id:"demon",label:"Demon",category:"Horror",emoji:"😈",audioType:"horror",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.42,vx:0,vy:0,size:Math.min(W,H)*0.22,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"demon"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.5)*W*0.03;drawDemon(ctx,p.x,p.y,p.size,t);});}},
  // ── CREATURES ──
  {id:"dragon",label:"Dragon",category:"Creatures",emoji:"🐉",audioType:"fire",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.45,vx:0,vy:0,size:Math.min(W,H)*0.28,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"dragon"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.4)*W*0.08;p.y=H*0.45+Math.cos(t*0.3)*H*0.04;drawDragon(ctx,p.x,p.y,p.size,t);});}},
  {id:"dragon-army",label:"Dragon Army",category:"Creatures",emoji:"🐲",audioType:"fire",
   initParticles:(W,H)=>Array.from({length:3},(_, i)=>({x:rnd(W*0.1,W*0.9),y:rnd(H*0.1,H*0.6),vx:rnd(-1,1),vy:rnd(-0.3,0.3),size:Math.min(W,H)*rnd(0.12,0.2),life:1,maxLife:1,color:rc(["#228833","#aa3300","#113388","#660088"]),alpha:0.88,rot:0,vrot:0,type:"dragon"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<-200)p.x=W+200;if(p.x>W+200)p.x=-200;drawDragon(ctx,p.x,p.y,p.size,t+p.x*0.001,p.color||"#228833");});}},
  {id:"godzilla",label:"Godzilla",category:"Creatures",emoji:"🦖",audioType:"horror",
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.5,vx:0,vy:0,size:Math.min(W,H)*0.3,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"godzilla"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.3)*W*0.03;drawGodzilla(ctx,p.x,p.y,p.size,t);});}},
  {id:"shark",label:"Shark",category:"Ocean",emoji:"🦈",audioType:undefined,
   initParticles:(W,H)=>[{x:-200,y:H*0.65,vx:2.5,vy:0,size:Math.min(W,H)*0.18,life:1,maxLife:1,color:"",alpha:0.9,rot:0,vrot:0,type:"shark"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;if(p.x>W+300)p.x=-300;drawShark(ctx,p.x,p.y,p.size,t);});}},
  {id:"megalodon",label:"Megalodon",category:"Ocean",emoji:"🦈",audioType:undefined,
   initParticles:(W,H)=>[{x:-400,y:H*0.6,vx:1.8,vy:0,size:Math.min(W,H)*0.38,life:1,maxLife:1,color:"",alpha:0.88,rot:0,vrot:0,type:"shark"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;if(p.x>W+500)p.x=-500;drawShark(ctx,p.x,p.y,p.size,t);});}},
  // ── SUPERHEROES ──
  {id:"spiderman",label:"Spider-Man",category:"Superheroes",emoji:"🕷️",audioType:undefined,
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.45,vx:0,vy:0,size:Math.min(W,H)*0.22,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"spiderman"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.6)*W*0.04;drawSpiderMan(ctx,p.x,p.y,p.size,t);});}},
  {id:"thanos",label:"Thanos",category:"Villains",emoji:"💜",audioType:undefined,
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.45,vx:0,vy:0,size:Math.min(W,H)*0.25,life:1,maxLife:1,color:"",alpha:0.92,rot:0,vrot:0,type:"thanos"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x=W*0.5+Math.sin(t*0.3)*W*0.02;drawThanos(ctx,p.x,p.y,p.size,t);});}},
  // ── SPACE ──
  {id:"stars",label:"Twinkling Stars",category:"Space",emoji:"⭐",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:120},()=>({x:rnd(0,W),y:rnd(0,H),vx:0,vy:0,size:rnd(2,5),life:1,maxLife:1,color:"#ffffff",alpha:rnd(0.3,1),rot:0,vrot:0,type:"star",extra:{tw:rnd(1,4)}})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{const a=0.3+Math.sin(t*(p.extra?.tw||2)+p.x*0.01)*0.35;dC(ctx,p.x,p.y,p.size,p.color,Math.max(0,a));});}},
  {id:"meteors",label:"Meteors",category:"Space",emoji:"☄️",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:20},()=>({x:rnd(0,W),y:rnd(-H*0.3,0),vx:rnd(8,18),vy:rnd(8,18),size:rnd(3,7),life:rnd(0,1),maxLife:1,color:"#ffeeaa",alpha:1,rot:0,vrot:0,type:"meteor",extra:{tail:rnd(40,100)}})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{const tl=p.extra?.tail||60;ctx.save();ctx.globalAlpha=p.alpha;const g=ctx.createLinearGradient(p.x,p.y,p.x-tl,p.y-tl);g.addColorStop(0,p.color);g.addColorStop(1,"transparent");ctx.strokeStyle=g;ctx.lineWidth=p.size;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-tl,p.y-tl);ctx.stroke();dC(ctx,p.x,p.y,p.size*1.5,"#ffffff",p.alpha);ctx.restore();});}},
  {id:"black-hole",label:"Black Hole",category:"Space",emoji:"🌑",audioType:undefined,
   initParticles:(W,H)=>[{x:W*0.5,y:H*0.5,vx:0,vy:0,size:Math.min(W,H)*0.25,life:1,maxLife:1,color:"",alpha:1,rot:0,vrot:0,type:"blackhole"}],
   draw(ctx,W,H,t,ps){ps.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);const r=p.size*0.5;ctx.save();ctx.rotate(t*0.5);ctx.scale(1,0.35);const d=ctx.createRadialGradient(0,0,r*0.6,0,0,r*1.4);d.addColorStop(0,"rgba(255,100,0,0.9)");d.addColorStop(0.4,"rgba(255,200,0,0.6)");d.addColorStop(1,"rgba(255,50,0,0)");ctx.fillStyle=d;ctx.globalAlpha=0.8;ctx.beginPath();ctx.arc(0,0,r*1.4,0,Math.PI*2);ctx.fill();ctx.restore();ctx.fillStyle="#000";ctx.globalAlpha=1;ctx.beginPath();ctx.arc(0,0,r*0.5,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  {id:"ufo",label:"UFO",category:"Space",emoji:"🛸",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:3},()=>({x:rnd(0,W),y:rnd(H*0.05,H*0.35),vx:rnd(-3,3),vy:rnd(-0.5,0.5),size:rnd(50,100),life:1,maxLife:1,color:"#aaccff",alpha:0.88,rot:0,vrot:0,type:"ufo"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=Math.sin(t*1.5+p.x*0.002)*0.8;if(p.x<-200)p.x=W+200;if(p.x>W+200)p.x=-200;ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.shadowColor="#88ddff";ctx.shadowBlur=20;ctx.beginPath();ctx.ellipse(0,0,p.size*0.8,p.size*0.25,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#cceeff";ctx.beginPath();ctx.ellipse(0,-p.size*0.1,p.size*0.4,p.size*0.3,0,Math.PI,2*Math.PI);ctx.fill();ctx.fillStyle="rgba(0,255,255,0.3)";ctx.shadowColor="#00ffff";ctx.shadowBlur=30;ctx.beginPath();ctx.ellipse(0,p.size*0.2,p.size*0.7,p.size*0.15,0,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  // ── OCEAN ──
  {id:"bubbles",label:"Bubbles",category:"Ocean",emoji:"🫧",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:80},()=>({x:rnd(0,W),y:rnd(H,H+200),vx:rnd(-0.5,0.5),vy:rnd(-2,-0.8),size:rnd(8,30),life:1,maxLife:1,color:"#88ccff",alpha:rnd(0.2,0.5),rot:0,vrot:0,type:"bubble"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.x+=Math.sin(t+p.y*0.01)*0.4;ctx.save();ctx.globalAlpha=p.alpha;ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=p.alpha*0.2;ctx.fillStyle=p.color;ctx.fill();ctx.restore();});}},
  {id:"fish",label:"Fish School",category:"Ocean",emoji:"🐠",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:20},()=>({x:rnd(-200,0),y:rnd(H*0.3,H*0.9),vx:rnd(1.5,4),vy:rnd(-0.3,0.3),size:rnd(20,45),life:1,maxLife:1,color:rc(["#ff8844","#44aaff","#ffcc44","#88ffcc","#ff44aa"]),alpha:0.88,rot:0,vrot:0,type:"fish"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy+Math.sin(t*2+p.x*0.01)*0.3;if(p.x>W+100){p.x=-100;p.y=rnd(H*0.3,H*0.9);}ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.vx>0?1:-1,1);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size*0.6,p.size*0.28,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(0,0,0,0.3)";ctx.beginPath();ctx.moveTo(-p.size*0.6,0);ctx.lineTo(-p.size*0.9,-p.size*0.3);ctx.lineTo(-p.size*0.9,p.size*0.3);ctx.fill();ctx.fillStyle="#000";ctx.beginPath();ctx.arc(p.size*0.4,-p.size*0.05,p.size*0.06,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  // ── CELEBRATION ──
  {id:"confetti",label:"Confetti",category:"Celebration",emoji:"🎊",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:150},()=>({x:rnd(0,W),y:rnd(-H,0),vx:rnd(-3,3),vy:rnd(2,6),size:rnd(6,14),life:1,maxLife:1,color:rc(["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"]),alpha:rnd(0.7,1),rot:rnd(0,Math.PI*2),vrot:rnd(-0.1,0.1),type:"confetti"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.size*0.5,-p.size*0.25,p.size,p.size*0.5);ctx.restore();});}},
  {id:"hearts",label:"Hearts",category:"Celebration",emoji:"❤️",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:60},()=>({x:rnd(0,W),y:rnd(-H*0.3,0),vx:rnd(-1,1),vy:rnd(1.5,3.5),size:rnd(16,36),life:1,maxLife:1,color:rc(["#ff2255","#ff4488","#ff88aa","#ff0044"]),alpha:rnd(0.6,1),rot:0,vrot:0,type:"heart"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.x+=Math.sin(t+p.y*0.01)*0.6;dHeart(ctx,p.x,p.y,p.size,p.color,p.alpha);});}},
  {id:"fireworks",label:"Fireworks",category:"Celebration",emoji:"🎆",audioType:"fire",
   initParticles:(W,H)=>Array.from({length:200},()=>({x:rnd(W*0.1,W*0.9),y:rnd(H*0.1,H*0.5),vx:rnd(-5,5),vy:rnd(-8,2),size:rnd(3,8),life:rnd(0,1),maxLife:1,color:rc(["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"]),alpha:1,rot:0,vrot:0,type:"firework"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life-=0.015;p.alpha=p.life;if(p.life<=0){p.x=rnd(W*0.1,W*0.9);p.y=rnd(H*0.1,H*0.5);p.vx=rnd(-5,5);p.vy=rnd(-8,2);p.life=rnd(0.4,1);p.color=rc(["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"]);}const a=Math.max(0,p.alpha);ctx.save();ctx.globalAlpha=a;ctx.shadowColor=p.color;ctx.shadowBlur=6;dC(ctx,p.x,p.y,p.size,p.color,a);ctx.restore();});}},
  {id:"money",label:"Money Rain",category:"Celebration",emoji:"💵",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:50},()=>({x:rnd(0,W),y:rnd(-H*0.5,0),vx:rnd(-2,2),vy:rnd(2,5),size:rnd(20,40),life:1,maxLife:1,color:"#44cc44",alpha:rnd(0.7,1),rot:rnd(0,Math.PI*2),vrot:rnd(-0.05,0.05),type:"money"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.alpha;ctx.fillStyle="#337733";const w=p.size*1.6,h=p.size*0.8;ctx.fillRect(-w*0.5,-h*0.5,w,h);ctx.fillStyle="#44aa44";ctx.beginPath();ctx.arc(0,0,p.size*0.22,0,Math.PI*2);ctx.fill();ctx.fillStyle="#aaffaa";ctx.font=`bold ${p.size*0.35}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("$",0,0);ctx.restore();});}},
  {id:"stars-shower",label:"Stars Shower",category:"Celebration",emoji:"🌟",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:80},()=>({x:rnd(0,W),y:rnd(-H*0.5,0),vx:rnd(-1,1),vy:rnd(2,5),size:rnd(10,22),life:1,maxLife:1,color:rc(["#ffff44","#ffcc00","#ffffff","#ffaa00"]),alpha:rnd(0.6,1),rot:rnd(0,Math.PI*2),vrot:rnd(-0.05,0.05),type:"star"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{ctx.save();ctx.shadowColor=p.color;ctx.shadowBlur=10;dStar(ctx,p.x,p.y,p.size,p.color,p.alpha);ctx.restore();});}},
  {id:"balloons",label:"Balloons",category:"Celebration",emoji:"🎈",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:20},()=>({x:rnd(0,W),y:H+rnd(0,100),vx:rnd(-1,1),vy:rnd(-2,-0.8),size:rnd(30,60),life:1,maxLife:1,color:rc(["#ff4444","#ff8844","#ffff44","#44ff44","#4444ff","#ff44ff"]),alpha:0.85,rot:0,vrot:rnd(-0.01,0.01),type:"balloon"})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{p.x+=Math.sin(t*0.8+p.y*0.005)*0.5;ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,-p.size*0.3,p.size*0.4,p.size*0.55,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.color;ctx.lineWidth=1.5;ctx.globalAlpha=0.5;ctx.beginPath();ctx.moveTo(0,p.size*0.25);ctx.bezierCurveTo(p.size*0.1,p.size*0.5,-p.size*0.1,p.size*0.7,0,p.size);ctx.stroke();ctx.restore();});}},
  // ── TECH & GLITCH ──
  {id:"matrix",label:"Matrix Rain",category:"Tech & Glitch",emoji:"💻",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:Math.floor(W/20)},(_,i)=>({x:i*20,y:rnd(-H,0),vx:0,vy:rnd(3,8),size:rnd(10,18),life:1,maxLife:1,color:"#00ff00",alpha:rnd(0.4,1),rot:0,vrot:0,type:"matrix",extra:{ci:Math.floor(rnd(0,50))}})),
   draw(ctx,W,H,t,ps){tickParticles(ps,W,H);ps.forEach(p=>{if(!p.extra)return;const chars="ｦｧｨｩｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";p.extra.ci=(p.extra.ci as number+0.1)%chars.length;ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle="#00ff00";ctx.shadowColor="#00ff00";ctx.shadowBlur=5;ctx.font=`${p.size}px monospace`;ctx.fillText(chars[Math.floor(p.extra.ci)],p.x,p.y);ctx.globalAlpha*=0.3;ctx.fillText(chars[Math.floor((p.extra.ci as number+5)%chars.length)],p.x,p.y-p.size);ctx.restore();});}},
  {id:"scan-lines",label:"Scan Lines",category:"Tech & Glitch",emoji:"📡",audioType:undefined,
   initParticles:()=>[{x:0,y:0,vx:0,vy:0,size:2,life:1,maxLife:1,color:"#000",alpha:0.04,rot:0,vrot:0,type:"scan"}],
   draw(ctx,W,H,t,ps){ctx.save();ctx.globalAlpha=0.04;ctx.fillStyle="#000000";for(let y=0;y<H;y+=4){ctx.fillRect(0,y,W,2);}const sy=(t*100)%H;ctx.globalAlpha=0.15;ctx.fillStyle="#ffffff";ctx.fillRect(0,sy,W,3);ctx.restore();}},
  {id:"vignette",label:"Vignette",category:"Cinematic",emoji:"⬛",audioType:undefined,
   initParticles:()=>[{x:0,y:0,vx:0,vy:0,size:1,life:1,maxLife:1,color:"#000",alpha:0.6,rot:0,vrot:0,type:"vignette"}],
   draw(ctx,W,H,t,ps){ctx.save();const g=ctx.createRadialGradient(W*0.5,H*0.5,Math.min(W,H)*0.3,W*0.5,H*0.5,Math.max(W,H)*0.8);g.addColorStop(0,"transparent");g.addColorStop(1,"rgba(0,0,0,0.7)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();}},
  {id:"cinematic-bars",label:"Cinematic Bars",category:"Cinematic",emoji:"🎬",audioType:undefined,
   initParticles:()=>[{x:0,y:0,vx:0,vy:0,size:1,life:1,maxLife:1,color:"#000",alpha:1,rot:0,vrot:0,type:"bars"}],
   draw(ctx,W,H,t,ps){ctx.save();ctx.fillStyle="#000000";ctx.globalAlpha=1;ctx.fillRect(0,0,W,H*0.1);ctx.fillRect(0,H*0.9,W,H*0.1);ctx.restore();}},
  {id:"sparkles",label:"Sparkles",category:"Fantasy",emoji:"✨",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:100},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-1,1),vy:rnd(-1,1),size:rnd(4,16),life:rnd(0,1),maxLife:1,color:rc(["#ffffff","#ffffaa","#ffaaff","#aaffff"]),alpha:rnd(0.4,1),rot:rnd(0,Math.PI*2),vrot:rnd(-0.1,0.1),type:"sparkle"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.rot+=p.vrot;p.alpha=0.4+Math.sin(t*3+p.x*0.01)*0.4;ctx.save();ctx.globalAlpha=p.alpha;ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(0,-p.size);ctx.lineTo(p.size*0.2,-p.size*0.2);ctx.lineTo(p.size,0);ctx.lineTo(p.size*0.2,p.size*0.2);ctx.lineTo(0,p.size);ctx.lineTo(-p.size*0.2,p.size*0.2);ctx.lineTo(-p.size,0);ctx.lineTo(-p.size*0.2,-p.size*0.2);ctx.closePath();ctx.fill();ctx.restore();});}},
  {id:"light-leaks",label:"Light Leaks",category:"Cinematic",emoji:"💡",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:5},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.5),size:rnd(W*0.2,W*0.6),life:1,maxLife:1,color:rc(["#ff8800","#ff4400","#ffcc00","#ff0044"]),alpha:rnd(0.05,0.12),rot:rnd(0,Math.PI*2),vrot:rnd(-0.002,0.002),type:"leak"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.rot+=p.vrot;p.alpha=0.04+Math.sin(t*0.5+p.x*0.001)*0.04;if(p.x<-p.size)p.x=W+p.size;if(p.x>W+p.size)p.x=-p.size;ctx.save();ctx.globalAlpha=p.alpha;ctx.translate(p.x,p.y);ctx.rotate(p.rot);const g=ctx.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,p.color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();ctx.restore();});}},
  {id:"portal",label:"Magic Portal",category:"Fantasy",emoji:"🔮",audioType:undefined,
   initParticles:(W,H)=>Array.from({length:2},()=>({x:rnd(W*0.2,W*0.8),y:rnd(H*0.2,H*0.8),vx:0,vy:0,size:rnd(60,120),life:1,maxLife:1,color:"#aa00ff",alpha:0.8,rot:0,vrot:0.02,type:"portal"})),
   draw(ctx,W,H,t,ps){ps.forEach(p=>{p.rot+=p.vrot;p.alpha=0.6+Math.sin(t*2+p.x)*0.2;ctx.save();ctx.translate(p.x,p.y);const r=p.size*0.5;for(let l=3;l>=0;l--){ctx.strokeStyle=["#aa00ff","#ff00aa","#00aaff","#ff6600"][l];ctx.lineWidth=6+l*3;ctx.globalAlpha=0.15+l*0.1;ctx.beginPath();ctx.arc(0,0,r+l*8,0,Math.PI*2);ctx.stroke();}ctx.save();ctx.rotate(t*2);for(let i=0;i<8;i++){ctx.strokeStyle=`hsl(${(i/8)*360+t*60},100%,60%)`;ctx.lineWidth=4;ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(0,0,r*0.75,(i/8)*Math.PI*2,((i+0.6)/8)*Math.PI*2);ctx.stroke();}ctx.restore();const g=ctx.createRadialGradient(0,0,0,0,0,r*0.65);g.addColorStop(0,`hsla(${t*60},80%,15%,0.95)`);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(0,0,r*0.65,0,Math.PI*2);ctx.fill();ctx.restore();})}
];

export const OVERLAY_BY_ID:Record<string,OverlayDef>=Object.fromEntries(OVERLAY_DEFS.map(o=>[o.id,o]));
