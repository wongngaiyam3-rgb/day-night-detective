// A CPU renderer for the same 3D sphere, used when WebGL is unavailable.
// Each visible pixel is a ray/sphere intersection, mapped to geographic
// longitude/latitude. Illumination uses the surface normal in world space.
import { AXIAL_TILT, AXIS, tiltVector } from './earth-geometry.js';
const D=Math.PI/180, R=1.5, LAT=22.3;
const offsets=[0,180,-90,90],colors=['#ffca64','#b6a5ff','#73e4d9','#ffa7b5'];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
const geo=(lon,lat,r=R)=>[Math.cos(lat*D)*Math.cos(lon*D)*r,Math.sin(lat*D)*r,-Math.cos(lat*D)*Math.sin(lon*D)*r];
const linear=v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;};
const srgb=v=>Math.round(255*(v<=0.0031308?v*12.92:1.055*v**(1/2.4)-0.055));
const inputLut=Array.from({length:256},(_,i)=>linear(i));
const outputLut=Array.from({length:4096},(_,i)=>srgb(i/4095));
export function createSoftwareEarthScene(canvas,onFrame,onReady,onError){
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Canvas is unavailable');
  let width=900,height=520,angle=0,selected=0,showRays=true,yaw=-.7,elevation=.2,disposed=false,pending=0;
  let texture=null,texW=0,texH=0;
  let earth=[1.15,0,0],sun=[-3.9,0,0],target=[-.85,0,0],camera=[-.85,4.4,11.1];
  let sight=[0,.371,.928],right=[1,0,0],up=[0,.928,-.371],scale=100,originX=450,originY=260;
  const sprite=document.createElement('canvas');const spriteCtx=sprite.getContext('2d');
  const image=new Image();
  image.onload=()=>{if(disposed)return;const map=document.createElement('canvas');map.width=image.width;map.height=image.height;const c=map.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);texture=c.getImageData(0,0,map.width,map.height).data;texW=map.width;texH=map.height;onReady();invalidate();};
  image.onerror=()=>{if(!disposed)onError('地表影像未能載入，請重新整理再試。');};image.src=new URL('./earth-map.jpg',document.baseURI).href;
  const rotate=(v,a)=>tiltVector([v[0]*Math.cos(a)+v[2]*Math.sin(a),v[1],-v[0]*Math.sin(a)+v[2]*Math.cos(a)]);
  const project=p=>{const v=sub(p,target);return{x:originX+dot(v,right)*scale,y:originY-dot(v,up)*scale};};
  function draw(){
    pending=0;if(disposed)return;
    const a=(180-114.2+angle)*D,co=Math.cos(a),si=Math.sin(a);
    sight=[Math.cos(elevation)*Math.sin(yaw),Math.sin(elevation),Math.cos(elevation)*Math.cos(yaw)];
    right=[Math.cos(yaw),0,-Math.sin(yaw)];up=[-Math.sin(elevation)*Math.sin(yaw),Math.cos(elevation),-Math.sin(elevation)*Math.cos(yaw)];
    camera=target.map((v,i)=>v+sight[i]*12);
    const aspect=width/Math.max(height,1),vertical=Math.max(5.4,(width<520?6.7:8.4)/aspect);
    const ex=dot(sub(earth,target),right),ey=dot(sub(earth,target),up),sx=dot(sub(sun,target),right),sy=dot(sub(sun,target),up);
    const minX=Math.min(ex-R,sx-.65),maxX=Math.max(ex+R,sx+.65),minY=Math.min(ey-R,sy-.65),maxY=Math.max(ey+R,sy+.65);
    scale=Math.min(height/vertical,Math.max(1,width-36)/(maxX-minX),Math.max(1,height-150)/(maxY-minY));
    originX=width/2-(minX+maxX)/2*scale;originY=(height+30)/2+(minY+maxY)/2*scale;
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#091622';ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#7c9bad';for(let i=0;i<65;i++){ctx.globalAlpha=.15+(i%4)*.05;ctx.beginPath();ctx.arc((i*127.31+31)%width,(i*71.57+47)%height,i%5===0?1.2:.6,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    const sc=project(sun),sr=.46*scale;
    const glow=ctx.createRadialGradient(sc.x,sc.y,sr*.2,sc.x,sc.y,sr*2.8);glow.addColorStop(0,'#ffd88bc0');glow.addColorStop(1,'#edb24700');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(sc.x,sc.y,sr*2.8,0,Math.PI*2);ctx.fill();
    const sg=ctx.createRadialGradient(sc.x-sr*.25,sc.y-sr*.3,0,sc.x,sc.y,sr);sg.addColorStop(0,'#fff4bd');sg.addColorStop(.7,'#ffdc87');sg.addColorStop(1,'#f0b951');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sc.x,sc.y,sr,0,Math.PI*2);ctx.fill();
    if(showRays){for(const y of[-.9,-.45,0,.45,.9]){const start=project([sun[0]+.63,y,.25]),end=project([earth[0]-Math.sqrt(R*R-y*y-.25*.25)-.09,y,.25]);ctx.strokeStyle='#ffd17c66';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();const dx=end.x-start.x,dy=end.y-start.y,l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l;const ax=start.x+dx*.6,ay=start.y+dy*.6;ctx.strokeStyle='#ffd17cbb';ctx.beginPath();ctx.moveTo(ax-ux*7-uy*3,ay-uy*7+ux*3);ctx.lineTo(ax,ay);ctx.lineTo(ax-ux*7+uy*3,ay-uy*7-ux*3);ctx.stroke();}}
    ctx.strokeStyle='#ffe1a0bb';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);for(const span of[[-2.05,-R],[R,2.05]]){const p=project(AXIS.map((v,i)=>earth[i]+v*span[0])),q=project(AXIS.map((v,i)=>earth[i]+v*span[1]));ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}ctx.setLineDash([]);
    const ec=project(earth),pr=R*scale;
    if(texture){
      const side=Math.ceil(pr*2)+2;sprite.width=side;sprite.height=side;const frame=spriteCtx.createImageData(side,side),data=frame.data;
      for(let y=0;y<side;y++){const ny=-(y+.5-side/2)/pr;for(let x=0;x<side;x++){const nx=(x+.5-side/2)/pr,rr=nx*nx+ny*ny;if(rr>1)continue;const nz=Math.sqrt(1-rr);
        const wx=right[0]*nx+up[0]*ny+sight[0]*nz,wy=right[1]*nx+up[1]*ny+sight[1]*nz,wz=right[2]*nx+up[2]*ny+sight[2]*nz;
        const uy=wy*AXIS[1]+wz*AXIS[2],uz=-wy*AXIS[2]+wz*AXIS[1];
        const lx=wx*co-uz*si,lz=wx*si+uz*co;
        let tx=Math.floor((Math.atan2(-lz,lx)/(Math.PI*2)+.5)*texW);tx=((tx%texW)+texW)%texW;
        const ty=Math.min(texH-1,Math.max(0,Math.floor((.5-Math.asin(Math.max(-1,Math.min(1,uy)))/Math.PI)*texH)));
        const index=(ty*texW+tx)*4,oi=(y*side+x)*4,light=-wx;
        let day=Math.max(0,Math.min(1,(light+.018)/.036));day=day*day*(3-2*day);
        const bright=.65+.65*Math.max(light,0);
        for(let c=0;c<3;c++){const base=inputLut[texture[index+c]],v=(base*.075+[.006,.012,.022][c])*(1-day)+(base*bright+[.015,.04,.075][c])*day;data[oi+c]=outputLut[Math.min(4095,Math.max(0,Math.round(v*4095)))];}
        data[oi+3]=Math.round(Math.min(1,(1-Math.sqrt(rr))*pr)*255);
      }}
      spriteCtx.putImageData(frame,0,0);ctx.drawImage(sprite,ec.x-side/2,ec.y-side/2);
    }else{ctx.fillStyle='#1a344a';ctx.beginPath();ctx.arc(ec.x,ec.y,pr,0,Math.PI*2);ctx.fill();}
    // Rotate the geographical grid with the actual sphere, clipping back arcs.
    ctx.strokeStyle='#b9e2eb25';ctx.lineWidth=.7;for(const lat of[-60,-30,0,30,60]){let drawing=false;ctx.beginPath();for(let lon=-180;lon<=180;lon+=4){const normal=rotate(geo(lon,lat,1),a);if(dot(normal,sight)>0){const p=project(normal.map((v,i)=>earth[i]+v*R));if(drawing)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);drawing=true;}else drawing=false;}ctx.stroke();}
    ctx.strokeStyle='#91b8cc55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(ec.x,ec.y,pr,0,Math.PI*2);ctx.stroke();
    const labels=offsets.map((offset,i)=>{const normal=rotate(geo(114.2+offset,LAT,1),a),world=normal.map((v,j)=>earth[j]+v*R*1.018),p=project(world),visible=dot(normal,sight)>.035;
      if(visible){ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(p.x,p.y,i===selected?5:3.5,0,Math.PI*2);ctx.fill();if(i===selected){ctx.strokeStyle='#fff3d2';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}}return{id:['A','B','C','D'][i],...p,visible};});
    onFrame({labels,selectedVisible:labels[selected].visible,sun:{x:sc.x,y:sc.y+sr+10},north:project(AXIS.map((v,i)=>earth[i]+v*1.95))});
  }
  function invalidate(){if(!disposed&&!pending)pending=requestAnimationFrame(draw);}
  function resize(w,h){if(w<40||h<170)return;width=w;height=h;canvas.width=Math.round(w);canvas.height=Math.round(h);earth=[w<520?1:1.15,0,0];sun=[w<520?-2.7:-3.9,0,0];target=[w<520?-.4:-.85,0,0];invalidate();}
  resize(canvas.clientWidth||900,canvas.clientHeight||520);
  return{kind:'software-3d',updateModel(a,s,r){angle=a;selected=s;showRays=r;invalidate();},resize,
    rotateView(dx,dy){yaw-=dx*.008;elevation=Math.max(-1.2,Math.min(1.56,elevation+dy*.006));invalidate();},
    preset(view){yaw=view==='north'?0:-.7;elevation=view==='north'?Math.PI/2-AXIAL_TILT:.2;invalidate();},
    hitEarth(x,y){const rect=canvas.getBoundingClientRect(),p=project(earth);return Math.hypot(x-rect.left-p.x,y-rect.top-p.y)<R*scale;},
    dispose(){disposed=true;cancelAnimationFrame(pending);image.onload=null;image.onerror=null;texture=null;},
  };
}
