type Point = { x: number; y: number };
type Props = {
  frame: { north: Point; south: Point; axis: Point; width: number; height: number; labels: (Point & {visible:boolean;upAngle:number})[] };
  selected: number;
  showAxis: boolean;
};

export default function ModelLandmarks({frame,selected,showAxis}: Props) {
  const center={x:(frame.north.x+frame.south.x)/2,y:(frame.north.y+frame.south.y)/2};
  const occupied:{x:number;y:number}[]=[];
  const observer=frame.labels[selected];
  if(observer?.visible)occupied.push({x:observer.x+Math.sin(observer.upAngle*Math.PI/180)*84,y:observer.y-Math.cos(observer.upAngle*Math.PI/180)*84});
  const items=[...(showAxis?[{id:'axis',text:'地軸',point:frame.axis}]:[]),{id:'north',text:'北極',point:frame.north},{id:'south',text:'南極',point:frame.south}].map(item=>{
    const dx=item.point.x-center.x,dy=item.point.y-center.y,length=Math.hypot(dx,dy)||1;
    const radial=[dx/length*34,dy/length*34];
    const candidates=item.id==='axis'?[[52,0],[-52,0],[0,-36],[52,56],[-72,48],[0,85],[-120,0]]:[radial,[48,14],[-48,-14],[0,-40],[0,40],[60,40],[-60,-40]];
    let best={x:0,y:0},score=Infinity;
    for(const [ox,oy] of candidates){
      const p={x:Math.max(40,Math.min(frame.width-40,item.point.x+ox)),y:Math.max(105,Math.min(frame.height-40,item.point.y+oy))};
      const overlap=occupied.reduce((sum,q)=>sum+Math.max(0,85-Math.abs(p.x-q.x))*Math.max(0,38-Math.abs(p.y-q.y)),0);
      if(overlap<score){best=p;score=overlap;}if(!overlap)break;
    }
    occupied.push(best);return {...item,label:best};
  });
  return <><svg className="model-landmark-leaders" width={frame.width} height={frame.height} aria-hidden="true">{items.map(item=><line key={item.id} x1={item.point.x} y1={item.point.y} x2={item.label.x} y2={item.label.y}/>)}</svg>{items.map(item=><span key={item.id} className={`model-landmark model-landmark-${item.id}`} data-testid={`model-label-${item.id}`} style={{left:item.label.x,top:item.label.y}}>{item.text}</span>)}</>;
}