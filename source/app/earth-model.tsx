"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Move3D, RotateCw, PersonStanding } from "lucide-react";

type Point = { id: string; name: string; color: string };
type Frame = { labels: {id:string;x:number;y:number;visible:boolean}[];selectedVisible:boolean;sun:{x:number;y:number};north:{x:number;y:number} };
type Controller = {kind?:string;updateModel:(angle:number,selected:number,rays:boolean)=>void;resize:(w:number,h:number)=>void;rotateView:(dx:number,dy:number)=>void;preset:(view:string)=>void;hitEarth:(x:number,y:number)=>boolean;dispose:()=>void};
export default function EarthModel({angle,selected,rays,names,onChange,points}:{angle:number;selected:number;rays:boolean;names:boolean;onChange:(a:number)=>void;points:Point[]}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const engine=useRef<Controller|null>(null);
  const props=useRef({angle,selected,rays,onChange});props.current={angle,selected,rays,onChange};
  const pointer=useRef<{x:number;y:number}|null>(null);
  const [mode,setMode]=useState<"spin"|"view">("spin");
  const [preset,setPreset]=useState("three");
  const latestPreset=useRef(preset);latestPreset.current=preset;
  const [backend,setBackend]=useState("webgl-3d");
  const [status,setStatus]=useState("loading");
  const [error,setError]=useState("");
  const [frame,setFrame]=useState<Frame|null>(null);
  useEffect(()=>{
    let stopped=false,observer:ResizeObserver|undefined;
    import("../lib/earth-scene.js").then(async module=>{
      if(stopped||!canvas.current) return;
      const ready=()=>{if(!stopped)setStatus("ready");};
      const failed=(message:string)=>{if(!stopped){setError(message);setStatus("error");}};
      try { engine.current=module.createEarthScene(canvas.current,setFrame,ready,failed); }
      catch {
        const fallback=await import("../lib/earth-software.js");
        if(stopped||!canvas.current)return;
        engine.current=fallback.createSoftwareEarthScene(canvas.current,setFrame,ready,failed);
        setBackend("software-3d");
      }
      engine.current!.updateModel(props.current.angle,props.current.selected,props.current.rays);
      engine.current!.preset(latestPreset.current);
      observer=new ResizeObserver(([entry])=>engine.current?.resize(entry.contentRect.width,entry.contentRect.height));
      observer.observe(canvas.current);
    }).catch(()=>{if(!stopped){setError("這個瀏覽器未能顯示 3D 模型，請使用支援 WebGL 的瀏覽器重新開啟。");setStatus("error");}});
    return ()=>{stopped=true;observer?.disconnect();engine.current?.dispose();engine.current=null;};
  },[]);
  useEffect(()=>engine.current?.updateModel(angle,selected,rays),[angle,selected,rays]);
  const end=()=>{pointer.current=null;};
  const down=(e:PointerEvent<HTMLCanvasElement>)=>{
    if(mode==="spin"&&!engine.current?.hitEarth(e.clientX,e.clientY))return;
    pointer.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move=(e:PointerEvent<HTMLCanvasElement>)=>{
    if(!pointer.current)return;
    const dx=e.clientX-pointer.current.x,dy=e.clientY-pointer.current.y;
    if(mode==="spin")props.current.onChange(((props.current.angle+dx*0.55)%360+360)%360);
    else {engine.current?.rotateView(dx,dy);setPreset("custom");}
    pointer.current={x:e.clientX,y:e.clientY};
  };
  return <div className="three-model" data-testid="three-model" data-renderer={backend} data-status={status}>
    <canvas ref={canvas} className="earth-canvas" aria-label="3D 太陽與地球球體模型；朝向太陽的一面受到陽光，另一面背光。可拖動地球自轉，或切換到轉視角。" onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/>
    <div className="model-toolbar"><div className="model-mode"><button className={mode==="spin"?"active":""} aria-pressed={mode==="spin"} onClick={()=>setMode("spin")}><RotateCw size={14}/>轉地球</button><button className={mode==="view"?"active":""} aria-pressed={mode==="view"} onClick={()=>setMode("view")}><Move3D size={14}/>轉視角</button></div><div className="model-presets">{[["three","立體"],["north","俯視"]].map(([v,t])=><button key={v} className={preset===v?"active":""} aria-pressed={preset===v} aria-label={v==="three"?"切換立體視角":"切換北極俯視"} onClick={()=>{engine.current?.preset(v);setPreset(v);}}>{t}</button>)}</div></div>
    <p className="three-instruction">{mode==="spin"?"左右拖動地球，或按播放觀察自轉。":"拖動畫面，換個方向看。時間不會改變。"}</p>
    <div className="world-labels" aria-hidden="true">{frame?.labels.map((label,i)=>label.visible&&<span key={label.id} className={`world-point ${i===selected?"tracked":""}`} style={{left:label.x,top:label.y,color:points[i].color}}>{i===selected&&<PersonStanding size={17}/>} {label.id}<span className="world-point-name"> {points[i].name}</span></span>)}{frame&&<><span className="world-sun" style={{left:frame.sun.x,top:frame.sun.y}}>太陽</span><span className="world-north" style={{left:frame.north.x,top:frame.north.y}}>北極 · 地軸</span></>}</div>
    <div className="three-legend"><span><i/>向光面{names?" · 白天":""}</span><span><i/>背光面{names?" · 黑夜":""}</span></div>
    {frame&&!frame.selectedVisible&&status==="ready"&&<p className="hidden-point-note">{points[selected].id} 在球體後方，可轉動視角找找看。</p>}
    {status!=="ready"&&<div className="model-status" role="status">{status==="loading"?"正在載入 3D 地球…":error}</div>}
  </div>;
}
