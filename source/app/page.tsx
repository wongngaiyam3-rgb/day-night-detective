"use client";

import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Play, Pause, RotateCcw, Eye, Lightbulb, Check, ChevronRight, Compass, Globe2, MessageCircle } from "lucide-react";
import EarthModel from "./earth-model";
import ObserverView from "./observer-view";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const POINTS = [
  { id: "A", name: "香港", offset: 0, color: "#ffca64" },
  { id: "B", name: "另一側", offset: 180, color: "#b6a5ff" },
  { id: "C", name: "西側", offset: -90, color: "#73e4d9" },
  { id: "D", name: "東側", offset: 90, color: "#ffa7b5" },
];
const wrap = (n: number) => ((n % 360) + 360) % 360;
function pointState(angle: number, offset = 0) {
  const p = wrap(angle + offset);
  const light = Math.cos(p * Math.PI / 180);
  return Math.abs(light) < 0.035 ? "boundary" : light > 0 ? "day" : "night";
}
const stateText = (s: string, names: boolean) => s === "boundary" ? "日夜交界附近" : s === "day" ? (names ? "白天 · 向光" : "受到陽光") : (names ? "黑夜 · 背光" : "沒有陽光");

export default function Page() {
  const [angle, setAngle] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState(0);
  const [names, setNames] = useState(false);
  const [rays, setRays] = useState(true);
  const [tab, setTab] = useState("observe");
  const [challenge, setChallenge] = useState(0);
  const [done, setDone] = useState<boolean[]>([false, false, false]);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const live = useRef({ angle, selected }); live.current = { angle, selected };
  const move = (a: number) => { setPlaying(false); setAngle(a === 360 ? 360 : wrap(a)); };
  const reset = () => { setAngle(0); setPlaying(false); setSelected(0); setFeedback(null); setChoice(null); };
  useEffect(() => {
    if (!playing) return;
    let raf: number, previous: number;
    const tick = (now: number) => { if (previous) setAngle(a => wrap(a + Math.min(now - previous, 70) * 0.012 * speed)); previous = now; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [playing, speed]);
  useEffect(() => {
    const doc = document as Document & { modelContext?: { registerTool: (tool: unknown, opts: { signal: AbortSignal }) => void } };
    if (!doc.modelContext?.registerTool) return;
    const abort = new AbortController();
    try { doc.modelContext.registerTool({ name: "set_earth_rotation", title: "轉動地球模型", description: "設定地球自轉角度並暫停播放，回傳四個觀察點的受光狀態。", inputSchema: { type: "object", properties: { degrees: { type: "number", minimum: 0, maximum: 360 } }, required: ["degrees"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input: unknown) => {
      const value = input as { degrees?: unknown };
      if (!value || Object.keys(value).some(k => k !== "degrees") || typeof value.degrees !== "number" || !Number.isFinite(value.degrees) || value.degrees < 0 || value.degrees > 360) throw new Error("degrees 必須是 0 至 360 的數字。");
      setPlaying(false); setAngle(value.degrees);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return { degrees: live.current.angle, locations: POINTS.map(p => ({ id: p.id, state: pointState(live.current.angle, p.offset) })) };
    } }, { signal: abort.signal }); } catch { /* Browsers without WebMCP still support every visible control. */ }
    return () => abort.abort();
  }, []);
  const current = pointState(angle, POINTS[selected].offset);
  const completed = done.filter(Boolean).length;
  const startChallenge = (n: number) => { setChallenge(n); setFeedback(null); setChoice(null); setSelected(0); setPlaying(false); setAngle(0); };
  const answer = (value?: string) => {
    let ok = false, text = "";
    if (challenge === 0) { ok = pointState(angle) === "night"; text = ok ? "找到了！A 轉到背光面，香港便進入黑夜。再轉下去，它會重新回到向光面。" : pointState(angle) === "boundary" ? "A 在日夜交界附近。再轉一點，讓它完全進入背光面。" : "A 仍在受到陽光的一面。試試轉動地球，讓 A 走到另一邊。"; }
    if (challenge === 1) { setChoice(value!); ok = pointState(angle) === "day" && value === "night"; text = pointState(angle) !== "day" ? "先把 A 香港轉回受到陽光的一面，再比較另一側的 B。" : ok ? "觀察正確！同一時候，A 受到陽光，另一側的 B 沒有陽光。各地不一定同時是白天。" : "看看模型中的 A 和 B：哪一個受到陽光？先比較它們的位置，再選一次。"; }
    if (challenge === 2) { setChoice(value!); ok = value === "rotation"; text = ok ? "你把線索連起來了！地球自轉，讓同一地方交替朝向和背向太陽，形成日夜。自轉一圈約需 24 小時。" : "再按播放觀察：地球上的 A 在移動，太陽留在原處。甚麼改變了 A 是否受到陽光？"; }
    if (ok) setDone(d => d.map((v, i) => i === challenge ? true : v));
    setFeedback({ ok, text });
  };
  return <div className="site-shell">
    <a className="skip-link" href="#controls">跳至模型操作</a>
    <header className="site-header"><a className="brand" href="./" aria-label="日夜偵探首頁"><span className="brand-icon"><Sun size={25} /></span><span><strong>日夜偵探</strong><small>觀察與發現</small></span></a><div className="header-right"><span className="subject-label">小學科學</span><span className="header-rule" /><span className="learning-note"><Compass size={16} /> 從自己的發現開始</span></div></header>
    <main className="main-content">
      <div className="page-heading"><div><p className="eyebrow">今天的探索 · 日夜的發生</p><h1>轉動地球，<span>日夜怎樣變？</span></h1></div><p>看一看，動一動。<br />跟着同一個地方，找出日夜的線索。</p></div>
      <div className="learning-layout">
        <section className="simulation" aria-label="互動太陽與地球模型">
          <div className="stage-head"><span><Globe2 size={17} /> 太陽與地球</span><span className="view-label">3D · 地軸 23.5°</span></div>
          <div className="model-stage"><EarthModel angle={angle} selected={selected} rays={rays} names={names} onChange={move} points={POINTS} /></div>
          <div className="stage-caption"><span><span className="point-dot" style={{ background: POINTS[selected].color }} /> 正在追蹤 {POINTS[selected].id} {POINTS[selected].name}</span><span>播放沿實際自轉方向</span></div>
          <div className="control-panel" id="controls"><div className="control-top"><div className="play-group"><button className="play-button" onClick={() => setPlaying(v => !v)} aria-label={playing ? "暫停自轉" : "播放自轉"}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}{playing ? "暫停" : "播放"}</button><button className="reset-button" onClick={reset} aria-label="重設模型"><RotateCcw size={18} /></button></div><div className="speed-control" aria-label="播放速度">速度{[0.5, 1, 2].map(s => <button key={s} aria-pressed={speed === s} className={speed === s ? "active" : ""} onClick={() => setSpeed(s)}>{s}×</button>)}</div></div>
            <div className="slider-label"><label id="rotation-label">轉動地球</label><output aria-label="自轉角度">{Math.round(angle)}° <span>／ 一圈 360°</span></output></div>
            <Slider className="rotation-slider" aria-labelledby="rotation-label" min={0} max={360} step={1} value={[angle]} onValueChange={([v]) => move(v)} />
            <div className="slider-ticks"><span>起點</span><span>四分一圈</span><span>半圈</span><span>四分三圈</span><span>一圈</span></div>
            <div className="step-controls"><button onClick={() => move(angle + 45)}>前進少許 <span>45°</span></button><button onClick={() => move(angle + 90)}>轉四分一圈 <span>90°</span></button><button onClick={() => move(angle + 180)}>轉半圈 <span>180°</span></button></div>
            <div className="display-options"><label><Switch checked={rays} onCheckedChange={setRays} aria-label="顯示陽光線" /> 陽光線</label><label><Switch checked={names} onCheckedChange={setNames} aria-label="顯示日夜名稱" /> 顯示日夜名稱</label></div>
          </div>
        </section>
        <aside className="discovery-panel" aria-label="觀察與挑戰"><ObserverView angle={angle} selected={selected} points={POINTS}/><Tabs value={tab} onValueChange={v => { setTab(v); if (v === "challenge") startChallenge(challenge); }}><TabsList className="discovery-tabs"><TabsTrigger value="observe"><Eye size={17} /> 觀察線索</TabsTrigger><TabsTrigger value="challenge"><Lightbulb size={17} /> 小挑戰 <span className="tab-count">{completed}/3</span></TabsTrigger></TabsList>
          <TabsContent value="observe" className="observation-tab"><div className="panel-title"><p className="eyebrow">01 · 跟着一個地方看</p><h2>這裏，現在有陽光嗎？</h2><p>選一個觀察點，再慢慢轉動地球。</p></div>
            <div className="location-grid">{POINTS.map((p, i) => <button key={p.id} aria-pressed={selected === i} className={`location-card ${selected === i ? "selected" : ""}`} onClick={() => setSelected(i)}><span className="point-badge" style={{ background: p.color }}>{p.id}</span><span>{p.name}<small>{i === 0 ? "我們的觀察點" : "示意觀察點"}</small></span>{selected === i && <Check size={15} />}</button>)}</div>
            <div className={`observation-result ${current}`} data-testid="observation-result"><span>{POINTS[selected].id} {POINTS[selected].name} 現在</span><strong>{current === "day" ? <Sun size={23} /> : current === "night" ? <Moon size={23} /> : <Globe2 size={23} />}{stateText(current, names)}</strong><p>{current === "boundary" ? "看看它正轉入向光面，還是背光面。" : current === "day" ? "這個位置朝向太陽。你會在這裏看見甚麼？" : "地球擋住了陽光。再轉下去，它會去哪裏？"}</p></div>
            <div className="question-box"><span className="question-icon"><MessageCircle size={18} /></span><div><h3>停一停，說說看</h3><p>轉動時，亮的一面跟着地球走嗎？<br />還是觀察點進出亮的一面？</p><details><summary>給我一點提示</summary><p>看着 A，按播放，再暫停。太陽的位置改變了嗎？A 的位置又怎樣？</p></details></div></div>
            <div className="compare-points"><h3>同一時候，其他地方呢？</h3>{POINTS.map(p => <div key={p.id}><span><span className="point-dot" style={{ background: p.color }} />{p.id} {p.name}</span><span className={`mini-state ${pointState(angle, p.offset)}`}>{stateText(pointState(angle, p.offset), names)}</span></div>)}</div>
          </TabsContent>
          <TabsContent value="challenge" className="challenge-tab"><div className="panel-title"><p className="eyebrow">把觀察變成發現</p><h2>來做個日夜偵探</h2><p>可以重看模型，再試一次。</p></div><div className="challenge-steps" aria-label="選擇挑戰">{["找到黑夜", "比較兩地", "連起線索"].map((label, i) => <button key={label} className={challenge === i ? "active" : ""} aria-pressed={challenge === i} onClick={() => startChallenge(i)}><span>{done[i] ? <Check size={14} /> : i + 1}</span>{label}</button>)}</div>
            <div className="challenge-card"><span className="task-label">挑戰 {challenge + 1} / 3</span><h3>{["讓香港走進黑夜", "香港白天時，另一側呢？", "日夜為甚麼不斷交替？"][challenge]}</h3><p>{["起點的 A 受到陽光。操作模型，把 A 轉到沒有陽光的一面。", "先讓 A 香港在向光面，再比較另一側的 B。在同一時候，B 有沒有陽光？", "按播放，跟着 A 看一圈。哪個解釋最符合你的觀察？"][challenge]}</p>
              {challenge === 0 ? <button className="check-answer" onClick={() => answer()}>我找到了，看看對不對 <Check size={16} /></button> : <div className="answer-options">{(challenge === 1 ? [["day", "B 也受到陽光"], ["night", "B 沒有陽光"], ["same", "所有地方的日夜都相同"]] : [["rotation", "地球自轉，使同一地方交替向光和背光"], ["off", "太陽每天開燈和關燈"], ["orbit", "地球繞太陽公轉一圈，就過了一天"]]).map(([v, label]) => <button key={v} className={choice === v ? "chosen" : ""} onClick={() => answer(v)}><span className="answer-circle">{choice === v && <span />}</span>{label}</button>)}</div>}
            </div>{feedback && <div role="status" className={`feedback ${feedback.ok ? "correct" : "retry"}`}><strong>{feedback.ok ? "發現新線索！" : "再觀察一次"}</strong><p>{feedback.text}</p>{feedback.ok && challenge < 2 && <button onClick={() => startChallenge(challenge + 1)}>下一個挑戰 <ChevronRight size={16} /></button>}</div>}{completed === 3 && <div className="all-done"><Check size={19} /><div><strong>三個線索，連成一個發現。</strong><p>指着模型，向同學解釋日夜怎樣形成！</p></div></div>}
          </TabsContent>
        </Tabs></aside>
      </div>
      <section className="sharing"><span className="share-icon"><MessageCircle size={22} /></span><div><h2>把你的發現，說給同學聽。</h2><p>「我留意到＿＿。當地球轉動，＿＿。所以我認為日夜的發生和＿＿有關。」</p></div><details className="discovery-summary"><summary>交流後，看看科學解釋</summary><p>太陽照亮地球的一面，向光面是白天，背光面是黑夜。地球由西向東自轉，使同一地方交替向光和背光，形成日夜。自轉一圈約需 24 小時。</p></details></section>
      <footer className="page-footer"><span>先觀察，再操作，最後分享。</span><details><summary>關於這個教學模型</summary><div><p>這是可以轉換視角的 3D 球體模型。地球由西向東自轉；從北極上方俯視時，自轉是逆時針方向。拖動地球和拉桿可前後查看時間；「轉視角」只改變觀察方向，不會改變時間。A 是香港觀察點，B、C、D 是同緯度的示意觀察點。</p><p>地軸相對公轉軌道平面的垂直方向傾斜約 23.5°，地球繞着這條傾斜的軸自轉。為集中觀察日夜，模型固定在春分／秋分附近的受光情況，沒有模擬公轉、季節、極晝極夜、大氣折射或實際日出日落時間；太陽和地球的大小、距離及播放速度並非實際比例。畫面不作時計或天氣預報。模型的亮暗用來表示是否受到陽光。右上方小人的視野會跟隨選取的觀察點，顯示面向南方的天空示意；太陽位置和地球模型同步。</p><p>地表影像採用 Three.js 示例素材。本活動不收集姓名、作答或學習進度；重新整理頁面便重新開始。教師可讓學生兩人一組，一人操作、一人描述，再交換角色。</p><a href="https://science.nasa.gov/resource/seeing-equinoxes-and-solstices-from-space/" target="_blank" rel="noopener noreferrer">延伸閱讀：NASA · 地軸、日夜與受光情況</a></div></details></footer>
    </main>
  </div>;
}
