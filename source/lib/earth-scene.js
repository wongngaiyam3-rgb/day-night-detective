import * as THREE from '../vendor/three.module.js';
import { AXIAL_TILT, AXIS } from './earth-geometry.js';

const DEG = Math.PI / 180;
const RADIUS = 1.5;
const SUN_RADIUS = 1.8;
const VIEW_ROLL = 0.24;
const HK_LONGITUDE = 114.2;
const LATITUDE = 22.3;
const offsets = [0, 180, -90, 90];
const colors = ['#ffca64', '#b6a5ff', '#73e4d9', '#ffa7b5'];
const geoPosition = (longitude, latitude, radius = RADIUS) => new THREE.Vector3(
  Math.cos(latitude * DEG) * Math.cos(longitude * DEG) * radius,
  Math.sin(latitude * DEG) * radius,
  -Math.cos(latitude * DEG) * Math.sin(longitude * DEG) * radius,
);

export function createEarthScene(canvas, onFrame, onTextureReady, onError) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#091622');
  const camera = new THREE.OrthographicCamera(-4.5, 4.5, 2.7, -2.7, 0.1, 100);
  const earth = new THREE.Group();
  const earthCenter = new THREE.Vector3(1.15, 0, 0);
  earth.position.copy(earthCenter);
  scene.add(earth);
  let angle = 0, selected = 0, width = 900, height = 520;
  let yaw = -0.7, elevation = 0.2, disposed = false, pending = 0;
  const target = new THREE.Vector3(-0.85, 0, 0);

  const texture = new THREE.TextureLoader().load(new URL('./earth-map.jpg',document.baseURI).href, () => {
    if (!disposed) { onTextureReady(); invalidate(); }
  }, undefined, () => { if (!disposed) onError('地表影像未能載入，請重新整理再試。'); });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  const material = new THREE.ShaderMaterial({
    uniforms: {earthMap: {value: texture}},
    vertexShader: `varying vec2 vUv; varying vec3 vWorldNormal;
      void main(){ vUv=uv; vWorldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D earthMap; varying vec2 vUv; varying vec3 vWorldNormal;
      void main(){ vec3 land=texture2D(earthMap,vUv).rgb;
        float light=dot(normalize(vWorldNormal),vec3(-1.0,0.0,0.0));
        float day=smoothstep(-0.018,0.018,light);
        vec3 daylight=land*(0.65+0.65*max(light,0.0))+vec3(0.015,0.04,0.075);
        vec3 darkness=land*0.075+vec3(0.006,0.012,0.022);
        gl_FragColor=vec4(mix(darkness,daylight,day),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 96, 64), material);
  earth.add(globe);
  const gridMaterial = new THREE.LineBasicMaterial({color:'#b9e2eb',transparent:true,opacity:0.14});
  for (const latitude of [-60,-30,0,30,60]) {
    const points = Array.from({length:181}, (_,i) => geoPosition(i*2,latitude,RADIUS*1.003));
    earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),gridMaterial));
  }
  const markers = offsets.map((offset,index) => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.054,16,12),new THREE.MeshBasicMaterial({color:colors[index]}));
    marker.position.copy(geoPosition(HK_LONGITUDE+offset,LATITUDE,RADIUS*1.018));
    earth.add(marker); return marker;
  });
  const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.092,16,12),new THREE.MeshBasicMaterial({color:'#fff4cf',wireframe:true,transparent:true,opacity:0.85}));
  earth.add(highlight);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,4.8,12),new THREE.MeshBasicMaterial({color:'#ffe1a0'}));
  const axisGroup = new THREE.Group(); axisGroup.position.copy(earthCenter); axisGroup.rotation.x=AXIAL_TILT;axisGroup.add(axis); scene.add(axisGroup);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS,48,32),new THREE.MeshBasicMaterial({color:'#ffdb87'}));
  sun.position.set(-3.9,0,0); scene.add(sun);
  const glowCanvas = document.createElement('canvas'); glowCanvas.width=128; glowCanvas.height=128;
  const ctx = glowCanvas.getContext('2d');
  const glow = ctx.createRadialGradient(64,64,6,64,64,64);
  glow.addColorStop(0,'rgba(255,217,133,.95)'); glow.addColorStop(0.3,'rgba(255,185,67,.38)'); glow.addColorStop(1,'rgba(255,177,48,0)');
  ctx.fillStyle=glow; ctx.fillRect(0,0,128,128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  glowSprite.position.copy(sun.position); glowSprite.scale.set(5.2,5.2,1); scene.add(glowSprite);
  const rays = new THREE.Group(); scene.add(rays);
  function buildRays() {
    for(const child of [...rays.children]) {
      child.traverse(o=>{o.geometry?.dispose();if(o.material) o.material.dispose();}); rays.remove(child);
    }
    for(const y of [-0.9,-0.45,0,0.45,0.9]) {
      const start = new THREE.Vector3(sun.position.x+Math.sqrt(SUN_RADIUS*SUN_RADIUS-y*y-0.25*0.25)+0.08,y,0.25);
      const endX=earthCenter.x-Math.sqrt(RADIUS*RADIUS-y*y-0.25*0.25)-0.09;
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0),start,endX-start.x,0xffd17c,0.13,0.07);
      arrow.line.material.transparent=true; arrow.line.material.opacity=0.42;
      arrow.cone.material.transparent=true; arrow.cone.material.opacity=0.75;
      rays.add(arrow);
    }
  }
  const stars = new Float32Array(150*3);
  for(let i=0;i<150;i++){stars[i*3]=((i*7.13)%30)-15;stars[i*3+1]=((i*5.47)%20)-10;stars[i*3+2]=-8-((i*1.91)%8);}
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(stars,3));
  scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#718ba0',size:0.025,sizeAttenuation:true,transparent:true,opacity:0.45})));
  const raycaster = new THREE.Raycaster();
  const world = new THREE.Vector3();
  const project = position => {
    const p = position.clone().project(camera);
    return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};
  };
  function draw() {
    pending=0; if(disposed) return;
    earth.rotation.set(AXIAL_TILT,(180-HK_LONGITUDE+angle)*DEG,0,'XYZ');
    highlight.position.copy(markers[selected].position);
    markers.forEach((m,i)=>m.scale.setScalar(i===selected?1.3:1));
    camera.position.set(target.x+12*Math.cos(elevation)*Math.sin(yaw),12*Math.sin(elevation),12*Math.cos(elevation)*Math.cos(yaw));
    camera.lookAt(target); camera.rotateZ(VIEW_ROLL); camera.updateMatrixWorld();
    canvas.dataset.axisTilt="23.5";canvas.dataset.sunRadius=String(SUN_RADIUS);canvas.dataset.earthRadius=String(RADIUS);
    // Keep both bodies inside the space below the model toolbar as the camera turns.
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);
    const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
    const e=earthCenter.clone().sub(target),s=sun.position.clone().sub(target);
    const minX=Math.min(e.dot(right)-RADIUS,s.dot(right)-SUN_RADIUS-0.1),maxX=Math.max(e.dot(right)+RADIUS,s.dot(right)+SUN_RADIUS+0.1);
    const minY=Math.min(e.dot(up)-RADIUS,s.dot(up)-SUN_RADIUS-0.1),maxY=Math.max(e.dot(up)+RADIUS,s.dot(up)+SUN_RADIUS+0.1);
    const aspect=width/Math.max(height,1);
    const vertical=Math.max(5.4,(width<520?6.7:8.4)/aspect,(maxX-minX)*height/Math.max(1,width-36),(maxY-minY)*height/Math.max(1,height-150));
    const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2-vertical*15/height;
    camera.left=centerX-vertical*aspect/2;camera.right=centerX+vertical*aspect/2;
    camera.top=centerY+vertical/2;camera.bottom=centerY-vertical/2;camera.updateProjectionMatrix();
    earth.updateMatrixWorld(true);
    renderer.render(scene,camera);
    const sight=camera.getWorldDirection(new THREE.Vector3()).negate();
    const labels=markers.map((m,i)=>{
      m.getWorldPosition(world);
      const normal=world.clone().sub(earthCenter).normalize();
      const visible=normal.dot(sight)>0.035;
      return {id:['A','B','C','D'][i],...project(world),visible};
    });
    const sunLabel=project(sun.position);sunLabel.y+=SUN_RADIUS*height/vertical+10;
    onFrame({labels,selectedVisible:labels[selected].visible,
      sun:sunLabel,
      north:project(earthCenter.clone().add(new THREE.Vector3(...AXIS).multiplyScalar(2.43)))});
  }
  function invalidate(){if(!disposed&&!pending) pending=requestAnimationFrame(draw);}
  function resize(w,h) {
    if(w<40||h<170)return;
    width=w; height=h;
    const small=w<520;
    earthCenter.x=small?1.0:1.15;earth.position.copy(earthCenter);axisGroup.position.copy(earthCenter);
    sun.position.x=small?-3.9:-4.8;glowSprite.position.copy(sun.position);
    target.x=small?-0.4:-0.85;
    const aspect=w/Math.max(h,1);
    const vertical=Math.max(5.4,(small?6.7:8.4)/aspect);
    camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;
    camera.updateProjectionMatrix();renderer.setSize(w,h,false);buildRays();invalidate();
  }
  resize(canvas.clientWidth||900,canvas.clientHeight||520);
  return {
    updateModel(nextAngle,nextSelected,showRays){angle=nextAngle;selected=nextSelected;rays.visible=showRays;invalidate();},
    resize,
    rotateView(dx,dy){yaw-=dx*0.008;elevation=THREE.MathUtils.clamp(elevation+dy*0.006,-1.2,1.56);invalidate();},
    preset(view){yaw=view==='north'?0:-0.7;elevation=view==='north'?Math.PI/2-AXIAL_TILT:0.2;invalidate();},
    hitEarth(x,y){const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),camera);return raycaster.intersectObject(globe).length>0;},
    dispose(){disposed=true;cancelAnimationFrame(pending);scene.traverse(o=>{o.geometry?.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});texture.dispose();glowTexture.dispose();renderer.dispose();},
  };
}