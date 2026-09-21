const canvas = document.querySelector('#universe');
const ctx = canvas.getContext('2d', { alpha: false });
const music = document.querySelector('#music');
const sound = document.querySelector('#sound');
const pause = document.querySelector('#pause');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phrases = ['Flores para ti', 'Mi persona favorita', 'Contigo el tiempo\nse vuelve eterno', 'Gracias por existir', 'Eres luz\naun de noche', 'El infinito cabe\nen tu sonrisa', 'Te elegiría\nmil veces más', 'Todo lo que busco\nya está en ti', 'Feliz día ☀', 'Mi lugar favorito\nes contigo', 'Coincidir contigo\nfue mi destino', 'Tú haces florecer\nmis días', 'Amar es elegir,\ny te elijo a ti', 'Lo eterno también\ncabe en un instante', 'Mi universo\ntiene tu nombre', 'Amarte es mi\nverdad más simple', 'Donde estés tú,\nestá mi hogar', 'Un abrazo\nhecho de flores', 'Siempre tú', 'Te mereces\ntodas las flores', 'Me encantas', 'Tu sonrisa es mi sol', 'Eres mi alegría', 'Cada día contigo\nes primavera', 'Lo mejor de mí\nnació contigo', 'Que este amor\nno se marchite', 'Tu voz es mi\nlugar seguro', 'Eres pura luz', 'Por siempre'];
const galaxyMode = document.body.dataset.scene === 'galaxy';
const sceneLabel = galaxyMode ? 'galaxia' : 'viaje';
const DEPTH = 6500;
const ITEM_COUNT = 460;
const TRAVEL_SPEED = 1100;
let width = 1, height = 1, focal = 1, running = false, started = false, last = 0, animation, elapsed = 0;
let pointer = {x:0,y:0}, camera = {x:0,y:0};
const view = {x:0,y:0,zoom:1,targetZoom:1};
let sprites = [], haze, blackHole, coreGlow;
const random = (a,b) => a + Math.random()*(b-a);
function surface(w,h) { const c=document.createElement('canvas'); c.width=w;c.height=h;return c; }
// Draw the flowers once; animation only composites cached transparent sprites.
function sunflower(g,x,y,r,angle=0) {
 g.save();g.translate(x,y);g.rotate(angle);
 g.strokeStyle='#468335';g.lineWidth=r*.09;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-r*.18,r*1.25,0,r*2.5);g.stroke();
 for(const side of [-1,1]) {g.save();g.translate(0,r*(side===1?1.65:2.05));g.scale(side,1);const leaf=g.createLinearGradient(0,0,r,0);leaf.addColorStop(0,'#285720');leaf.addColorStop(.6,'#6ca849');leaf.addColorStop(1,'#365f28');g.fillStyle=leaf;g.beginPath();g.moveTo(0,0);g.bezierCurveTo(r*.15,-r*.62,r*.85,-r*.75,r*1.03,-r*.48);g.bezierCurveTo(r*.72,r*.02,r*.2,r*.1,0,0);g.fill();g.restore();}
 for(let layer=0;layer<2;layer++) for(let j=0;j<15;j++){g.save();g.rotate(j*Math.PI*2/15+layer*.19);const petal=g.createLinearGradient(0,-r*.32,0,-r);petal.addColorStop(0,'#b07800');petal.addColorStop(.45,'#f8c908');petal.addColorStop(1,layer?'#ffe345':'#e8ad00');g.fillStyle=petal;g.beginPath();g.moveTo(-r*.13,-r*.3);g.quadraticCurveTo(-r*.35,-r*.67,0,-r*(layer?1:1.07));g.quadraticCurveTo(r*.36,-r*.67,r*.13,-r*.3);g.fill();g.restore();}
 const core=g.createRadialGradient(-r*.1,-r*.1,0,0,0,r*.46);core.addColorStop(0,'#271709');core.addColorStop(.75,'#50300d');core.addColorStop(1,'#94531a');g.fillStyle=core;g.beginPath();g.arc(0,0,r*.46,0,Math.PI*2);g.fill();
 for(let j=0;j<95;j++){const a=j*2.399,rr=Math.sqrt(j/95)*r*.4;g.fillStyle=j%2?'#c18a323b':'#100b0755';g.beginPath();g.arc(Math.cos(a)*rr,Math.sin(a)*rr,r*.016,0,7);g.fill();}g.restore();
}
function buildBlackHole(){
 // Cache the textured disk; rotation happens before perspective compression.
 blackHole=surface(512,512);const g=blackHole.getContext('2d');g.scale(.512,.512);g.translate(500,500);
 for(let r=455;r>170;r-=3){g.strokeStyle=r<225?'#fff7bd':r<335?'#ffd959':'#ba7616';g.globalAlpha=.68;g.lineWidth=3.4;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}
 for(let i=0;i<190;i++){const r=random(185,450),a=random(0,Math.PI*2);g.strokeStyle=i%3?'#fff5b4':'#ffac27';g.globalAlpha=random(.2,.8);g.lineWidth=random(1,4);g.beginPath();g.arc(0,0,r,a,a+random(.025,.45));g.stroke();}
}
function buildCoreGlow(){
 coreGlow=surface(360,360);const g=coreGlow.getContext('2d');
 const glow=g.createRadialGradient(180,180,139,180,180,172);glow.addColorStop(0,'#ffd553aa');glow.addColorStop(1,'#ffd55300');g.fillStyle=glow;g.fillRect(0,0,360,360);
 g.fillStyle='#020201';g.strokeStyle='#ffe18c';g.lineWidth=2;g.beginPath();g.arc(180,180,142,0,Math.PI*2);g.fill();g.stroke();
}
function drawBlackHole(cx,cy){
 const t=reduced?0:elapsed;
 const size=Math.min(width*.88,height*1.2)*view.zoom,scale=size/1000;
 const beat=1+.045*Math.sin(t*2.4)+.015*Math.sin(t*4.8);
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-.1+Math.sin(t*.27)*.055);
 ctx.globalAlpha=.65+.15*Math.sin(t*2.4);ctx.drawImage(haze,-size*.65*beat,-size*.5*beat,size*1.3*beat,size*beat);ctx.globalAlpha=1;
 function disk(front){ctx.save();ctx.beginPath();ctx.rect(-size,-size*(front?0:1),size*2,size);ctx.clip();ctx.scale(scale,scale*(.28+.035*Math.sin(t*.35)));ctx.rotate(t*.33);ctx.drawImage(blackHole,-500,-500,1000,1000);ctx.restore();}
 disk(false);
 const radius=142*scale*beat;
 ctx.drawImage(coreGlow,-180*scale*beat,-180*scale*beat,360*scale*beat,360*scale*beat);
 disk(true);
 // Bright orbiting particles make the direction of rotation readable.
 for(let i=0;i<9;i++){const a=t*(.45+(i%3)*.08)+i*2.399,r=(245+(i%4)*48)*scale,x=Math.cos(a)*r,y=Math.sin(a)*r*.28;if(y<0&&Math.hypot(x,y)<radius)continue;ctx.fillStyle='#fff8cd';ctx.globalAlpha=.5+.45*(Math.sin(a)+1)/2;ctx.beginPath();ctx.arc(x,y,(1.4+i%2)*scale,0,Math.PI*2);ctx.fill();}
 ctx.restore();ctx.globalAlpha=1;
}
function cacheSpriteLevels(sprite){
 sprite.levels=[sprite.image];
 while(sprite.levels.at(-1).width>48){const previous=sprite.levels.at(-1),small=surface(Math.max(1,Math.round(previous.width/2)),Math.max(1,Math.round(previous.height/2)));small.getContext('2d').drawImage(previous,0,0,small.width,small.height);sprite.levels.push(small);}
}
function buildSprites(){
 sprites=[];
 for(let kind=0;kind<3;kind++){const c=surface(360,440),g=c.getContext('2d');if(kind===0) sunflower(g,180,140,100,-.08);else {const count=kind===1?7:12;for(let j=0;j<count;j++){const a=j*2.4,rr=Math.sqrt(j/count)*(kind===1?85:100);sunflower(g,180+Math.cos(a)*rr,135+Math.sin(a)*rr*.7,kind===1?40:28,Math.cos(a)*.22);}}sprites.push({image:c,w:150,h:183});}
 for(const [i,text] of phrases.entries()){const c=surface(840,220),g=c.getContext('2d');g.font='500 64px "Delius", "Comic Sans MS", cursive';g.textAlign='center';g.textBaseline='middle';g.fillStyle=i%3===0?'#ffe55d':'#ffffd8';const lines=text.split('\n');lines.forEach((line,j)=>g.fillText(line,420,110+(j-(lines.length-1)/2)*72,800));sprites.push({image:c,w:540,h:141});}
 sprites.forEach(cacheSpriteLevels);
 haze=surface(600,600);const g=haze.getContext('2d'),gradient=g.createRadialGradient(300,300,0,300,300,300);gradient.addColorStop(0,'#c5bd574d');gradient.addColorStop(.22,'#8e792d40');gradient.addColorStop(.55,'#65531a1b');gradient.addColorStop(1,'#00000000');g.fillStyle=gradient;g.fillRect(0,0,600,600);
}
const items=Array.from({length:ITEM_COUNT},(_,i)=>({x:random(-2100,2100),y:random(-1900,1900),z:70+i/ITEM_COUNT*DEPTH,sprite:i%2===0?(i/2)%3:3+Math.floor(Math.random()*phrases.length),tilt:random(-.1,.1)})).reverse();
const streaks=Array.from({length:170},()=>({x:random(-2600,2600),y:random(-2400,2400),z:random(100,DEPTH),length:random(60,240)}));
function resize(){width=innerWidth;height=innerHeight;focal=Math.max(370,Math.min(width,height)*.95);const dpr=Math.min(devicePixelRatio||1,galaxyMode?1.25:1.75,Math.sqrt(1800000/(width*height)));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!running)draw(0);}
function draw(dt){
 elapsed+=dt;ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
 const smoothing=1-Math.exp(-dt*9);camera.x+=((galaxyMode?view.x:pointer.x*95)-camera.x)*smoothing;camera.y+=((galaxyMode?view.y:pointer.y*65)-camera.y)*smoothing;view.zoom+=(view.targetZoom-view.zoom)*smoothing;
 const lens=focal*(galaxyMode?view.zoom:1);
 const cx=width/2+Math.sin(elapsed*.16)*width*.025,cy=height/2+Math.cos(elapsed*.13)*height*.018;
 ctx.drawImage(haze,cx-width*.5,cy-height*.43,width,height*.86);
 if(!started)return;
 if(galaxyMode)drawBlackHole(cx-camera.x*lens/1100,cy-camera.y*lens/1100);
 const travel=dt*TRAVEL_SPEED*(galaxyMode?.48:1);
 ctx.lineWidth=.65;
 for(const star of streaks){star.z-=travel;if(star.z<60)star.z+=DEPTH;const s=lens/star.z,t=lens/(star.z+star.length);const x=cx+(star.x-camera.x)*s,y=cy+(star.y-camera.y)*s;if(x<0||x>width||y<0||y>height)continue;ctx.strokeStyle="#f4e29a";ctx.globalAlpha=Math.min(.65,300/star.z);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx+(star.x-camera.x)*t,cy+(star.y-camera.y)*t);ctx.stroke();}
 ctx.globalAlpha=1;
 // Equal travel preserves depth order; only re-sort when a particle loops.
 let wrapped=false;
 for(const item of items){item.z-=travel;if(item.z<45){item.z+=DEPTH;item.x=random(-2100,2100);item.y=random(-1900,1900);if(item.sprite>=3)item.sprite=3+Math.floor(Math.random()*phrases.length);wrapped=true;}}
 if(wrapped)items.sort((a,b)=>b.z-a.z);
 for(const item of items){const scale=lens/item.z,sprite=sprites[item.sprite],w=sprite.w*scale,h=sprite.h*scale,x=cx+(item.x-camera.x)*scale,y=cy+(item.y-camera.y)*scale;if(x+w/2<0||x-w/2>width||y+h/2<0||y-h/2>height)continue;
 ctx.globalAlpha=Math.min(1,(DEPTH+45-item.z)/600,item.z/110)*Math.min(1,.35+scale*1.7);ctx.save();ctx.translate(x,y);ctx.rotate(item.tilt);const level=Math.max(0,Math.min(sprite.levels.length-1,Math.floor(Math.log2(sprite.image.width/Math.max(1,w*1.3)))));ctx.drawImage(sprite.levels[level],-w/2,-h/2,w,h);ctx.restore();}
 ctx.globalAlpha=1;
}
function tick(time){if(!running)return;const dt=last?Math.min((time-last)/1000,.05):0;last=time;draw(dt);animation=requestAnimationFrame(tick);}
function setRunning(value){running=value;last=0;cancelAnimationFrame(animation);pause.textContent=(value?'Pausar ':'Continuar ')+sceneLabel;if(value)animation=requestAnimationFrame(tick);}
function updateSound(){sound.textContent=music.paused?'Música: apagada':'Música: encendida';sound.setAttribute('aria-label',music.paused?'Activar música':'Desactivar música');}
function playMusic(){music.play().then(updateSound).catch(updateSound);}
const start=document.querySelector('#start');
start.addEventListener('click',()=>{started=true;document.querySelector('#welcome').hidden=true;document.querySelector('#controls').hidden=false;sound.hidden=false;document.body.classList.add('traveling');if(galaxyMode)document.querySelector('#galaxy-title').hidden=false;playMusic();setRunning(!reduced);draw(0);pause.focus({preventScroll:true});});
for(const event of ['play','pause','error'])music.addEventListener(event,updateSound);
 sound.addEventListener('click',()=>{if(music.paused)playMusic();else music.pause();});pause.addEventListener('click',()=>setRunning(!running));
addEventListener('pointermove',e=>{if(!galaxyMode&&!reduced)pointer={x:e.clientX/width-.5,y:e.clientY/height-.5};});
addEventListener('resize',resize);
let resume=false;document.addEventListener('visibilitychange',()=>{if(document.hidden){resume=running;setRunning(false);}else if(resume){setRunning(true);resume=false;}});
if(galaxyMode){buildBlackHole();buildCoreGlow();}buildSprites();resize();document.fonts.ready.then(()=>{buildSprites();if(!running)draw(0);});


if(galaxyMode){
 const fingers=new Map();let gesture=null;
 const refresh=()=>{document.querySelector('#zoom-value').textContent=Math.round(view.targetZoom*100)+'%';if(!running){camera.x=view.x;camera.y=view.y;view.zoom=view.targetZoom;draw(0);}};
 const zoomTo=value=>{view.targetZoom=Math.min(2.4,Math.max(.55,value));refresh();};
 const measure=()=>{const points=[...fingers.values()];if(!points.length)return null;return {x:points.reduce((sum,p)=>sum+p.x,0)/points.length,y:points.reduce((sum,p)=>sum+p.y,0)/points.length,distance:points.length>1?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0};};
 canvas.addEventListener('pointerdown',e=>{if(!started||e.button>0)return;canvas.setPointerCapture(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture=measure();canvas.classList.add('dragging');});
 canvas.addEventListener('pointermove',e=>{if(!fingers.has(e.pointerId))return;fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=measure();if(gesture){const factor=1100/(focal*view.zoom);view.x=Math.max(-2200,Math.min(2200,view.x-(next.x-gesture.x)*factor));view.y=Math.max(-2200,Math.min(2200,view.y-(next.y-gesture.y)*factor));if(next.distance&&gesture.distance)zoomTo(view.targetZoom*next.distance/gesture.distance);refresh();}gesture=next;});
 const release=e=>{fingers.delete(e.pointerId);gesture=measure();if(!fingers.size)canvas.classList.remove('dragging');};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
 canvas.addEventListener('wheel',e=>{if(!started)return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1);zoomTo(view.targetZoom*Math.exp(-delta*.0012));},{passive:false});
 document.querySelector('#zoom-in').addEventListener('click',()=>zoomTo(view.targetZoom*1.2));
 document.querySelector('#zoom-out').addEventListener('click',()=>zoomTo(view.targetZoom/1.2));
 document.querySelector('#reset-camera').addEventListener('click',()=>{view.x=0;view.y=0;zoomTo(1);});
}
