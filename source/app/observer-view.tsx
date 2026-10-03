"use client";
import { PersonStanding, Sun, Moon } from "lucide-react";
import { observerSky, OFFSETS } from "../lib/earth-geometry.js";

type Point = {id:string;name:string;color:string};
export default function ObserverView({angle,selected,points}:{angle:number;selected:number;points:Point[]}) {
  const point=points[selected],sky=observerSky(angle,OFFSETS[selected]);
  const boundary=Math.abs(sky.light)<0.035,day=sky.light>0;
  const phase=boundary?"地平線附近":day?"太陽在地平線上方":"太陽在地平線下方";
  const x=26+(sky.azimuth-90)/180*288,y=126-sky.altitude/90*108;
  const wrapped=((angle+OFFSETS[selected])%360+360)%360;
  const note=boundary?(wrapped<180?"太陽正在落下。":"太陽正在升起。"):
    day?"站在這裏，可以看見太陽。":"地球擋住了陽光，看不見太陽。";
  const gradient=boundary?["#427e9f","#f3be85"]:day?["#68b1d8","#c9e8ec"]:["#081626","#203b58"];
  return <section className={`observer-view ${day?"day":"night"}`} aria-label="小人的視野" data-testid="observer-view" data-point={point.id} data-altitude={sky.altitude.toFixed(2)}>
    <div className="observer-head"><span><PersonStanding size={20}/>小人的視野</span><span className="observer-location"><i style={{background:point.color}}/>{point.id} {point.name}</span></div>
    <div className="observer-sky">
      <p>站在 {point.id}，面向南方</p>
      <svg viewBox="0 0 340 162" role="img" aria-label={`${point.id} ${point.name}的地面視野：${phase}`}>
        <defs><linearGradient id="local-sky" x2="0" y2="1"><stop stopColor={gradient[0]}/><stop offset="1" stopColor={gradient[1]}/></linearGradient><clipPath id="above-horizon"><rect width="340" height="126"/></clipPath></defs>
        <rect width="340" height="162" fill="url(#local-sky)"/>
        {!day&&!boundary&&<g fill="#c9dff4" opacity=".65">{[[35,33],[87,55],[134,23],[211,47],[284,31],[305,75]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={i%2?1:1.5}/>)}</g>}
        <g clipPath="url(#above-horizon)">{sky.altitude>-6&&<g data-testid="observer-sun" transform={`translate(${x},${y})`}><circle r="18" fill="#ffeaa1" opacity=".2"/><circle r="11" fill="#fff2b3"/><circle r="9" fill="#ffd469"/></g>}</g>
        <rect y="126" width="340" height="36" fill={day?"#294d51":"#112a35"}/>
        <path d="M0 126H340" stroke={day?"#d5eeed":"#638b9d"} strokeWidth="1"/>
        <text x="330" y="120" textAnchor="end" fill={day?"#244a59":"#b8d1df"} fontSize="13">地平線</text>
        <g fill="#dceeed" fontSize="14"><text x="26" y="151" textAnchor="middle">東</text><text x="170" y="151" textAnchor="middle">南</text><text x="314" y="151" textAnchor="middle">西</text></g>
      </svg>
    </div>
    <div className="observer-caption">{day||boundary?<Sun size={16}/>:<Moon size={16}/>}<span>{note}</span></div>
  </section>;
}
