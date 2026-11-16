import { W,H,clamp,clear,text,rnd,type Game,type Pal,type Keys } from './engine'

// Original games. Dates in the catalogue describe visual/interaction inspiration.
export function pinball(p:Pal):Game {
  let x=128,y=140,vx=55,vy=-140,balls=3,cool=0
  const bumpers=[{x:76,y:65},{x:180,y:65},{x:128,y:105}]
  const serve=()=>{x=128;y=150;vx=rnd(-60,60);vy=-160;cool=0.2}
  const game:Game={over:false,score:0,update(dt,k){
    cool-=dt;vy+=85*dt;x+=vx*dt;y+=vy*dt
    if(x<13||x>W-13){x=clamp(x,13,W-13);vx=-vx}
    if(y<26){y=26;vy=Math.abs(vy)}
    bumpers.forEach(b=>{const dx=x-b.x,dy=y-b.y,d=Math.hypot(dx,dy);if(d<18&&cool<=0){vx=dx/Math.max(d,1)*140;vy=dy/Math.max(d,1)*140;game.score+=50;cool=0.1}})
    if(y>H-42&&y<H-21&&vy>0&&((x<128&&k.l)||(x>=128&&k.r)||k.a)){vy=-170;vx=(128-x)*1.5;game.score+=5}
    if(y>H+8){balls--;if(!balls)game.over=true;else serve()}
  },draw(g){clear(g,p);g.strokeStyle=p.dim;g.strokeRect(9,23,W-18,H-30);bumpers.forEach(b=>{g.fillStyle=p.b;g.beginPath();g.arc(b.x,b.y,13,0,7);g.fill();g.strokeStyle=p.c;g.stroke()});g.strokeStyle=p.a;g.lineWidth=7;g.beginPath();g.moveTo(50,H-28);g.lineTo(113,H-17);g.moveTo(W-50,H-28);g.lineTo(W-113,H-17);g.stroke();g.lineWidth=1;g.fillStyle=p.fg;g.beginPath();g.arc(x,y,4,0,7);g.fill();text(g,`SCORE ${game.score}   BALLS ${balls}`,9,13,9,p.fg)}}
  return game
}

export function trailDuel(p:Pal):Game {
  const cols=32,rows=24,grid=new Set<string>();let a={x:8,y:12,dx:1,dy:0},b={x:24,y:12,dx:-1,dy:0},timer=0
  const key=(x:number,y:number)=>`${x},${y}`,blocked=(x:number,y:number)=>x<0||x>=cols||y<0||y>=rows||grid.has(key(x,y))
  const game:Game={over:false,score:0,update(dt,k){timer+=dt;if(k.l&&a.dx!==1){a.dx=-1;a.dy=0}else if(k.r&&a.dx!==-1){a.dx=1;a.dy=0}else if(k.u&&a.dy!==1){a.dx=0;a.dy=-1}else if(k.d&&a.dy!==-1){a.dx=0;a.dy=1}if(timer<0.1)return;timer=0
    if(blocked(b.x+b.dx,b.y+b.dy)||Math.random()<0.04){const options=[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>!(dx===-b.dx&&dy===-b.dy)&&!blocked(b.x+dx,b.y+dy));if(options.length){const pick=options[Math.floor(Math.random()*options.length)];b.dx=pick[0];b.dy=pick[1]}}
    grid.add(key(a.x,a.y));grid.add(key(b.x,b.y));a.x+=a.dx;a.y+=a.dy;b.x+=b.dx;b.y+=b.dy
    if(blocked(a.x,a.y)||a.x===b.x&&a.y===b.y)game.over=true
    else if(blocked(b.x,b.y)){game.score+=500;game.over=true}else game.score+=2
  },draw(g){clear(g,p);g.fillStyle=p.dim;grid.forEach(s=>{const[x,y]=s.split(',').map(Number);g.fillRect(x*8,24+y*8,7,7)});g.fillStyle=p.a;g.fillRect(a.x*8,24+a.y*8,8,8);g.fillStyle=p.c;g.fillRect(b.x*8,24+b.y*8,8,8);text(g,`TRAIL DUEL  ${game.score}`,8,14,10,p.fg)}}
  return game
}

export function slalom(p:Pal):Game {
  let x=128,time=0,spawn=0,misses=0;const gates:{x:number;y:number;checked:boolean}[]=[]
  const game:Game={over:false,score:0,update(dt,k){time+=dt;x=clamp(x+((k.r?1:0)-(k.l?1:0))*130*dt,16,W-16);spawn-=dt
    if(spawn<=0){gates.push({x:rnd(40,W-40),y:-10,checked:false});spawn=1.3}
    gates.forEach(g=>{g.y+=(55+time*0.65)*dt;if(!g.checked&&g.y>H-38){g.checked=true;if(Math.abs(x-g.x)<24)game.score+=100;else misses++}})
    while(gates[0]?.y>H+10)gates.shift();if(misses>=3||time>90)game.over=true
  },draw(g){clear(g,p);g.strokeStyle=p.dim;for(let i=0;i<10;i++){const y=(i*28+time*50)%H;g.beginPath();g.moveTo(7,y);g.lineTo(12,y+12);g.moveTo(W-7,y);g.lineTo(W-12,y+12);g.stroke()}gates.forEach(a=>{g.fillStyle=p.a;g.fillRect(a.x-25,a.y,3,16);g.fillRect(a.x+22,a.y,3,16);g.fillRect(a.x-25,a.y,11,5);g.fillRect(a.x+14,a.y,11,5)});g.fillStyle=p.c;g.fillRect(x-4,H-43,3,14);g.fillRect(x+2,H-43,3,14);text(g,`${game.score}  MISSES ${misses}/3`,10,14,9,p.fg)}}
  return game
}

export function targetRange(p:Pal):Game {
  let aimX=128,aimY=100,time=45,cool=0;const targets=Array.from({length:5},(_,i)=>({x:i*45+20,y:50+i%3*42,v:(i%2?1:-1)*(20+i*5),alive:true,wait:0}))
  const shoot=()=>{if(cool>0)return;cool=0.18;const hit=targets.find(t=>t.alive&&Math.hypot(aimX-t.x,aimY-t.y)<13);if(hit){hit.alive=false;hit.wait=0.8;game.score+=100}else game.score=Math.max(0,game.score-10)}
  const game:Game={over:false,score:0,update(dt,k){time-=dt;cool-=dt;aimX=clamp(aimX+((k.r?1:0)-(k.l?1:0))*120*dt,5,W-5);aimY=clamp(aimY+((k.d?1:0)-(k.u?1:0))*120*dt,25,H-10);if(k.hit('a'))shoot();targets.forEach(t=>{t.x+=t.v*dt;if(t.x<12||t.x>W-12)t.v=-t.v;if(!t.alive){t.wait-=dt;if(t.wait<=0)t.alive=true}});if(time<=0)game.over=true},click(x,y){aimX=x;aimY=y;shoot()},draw(g){clear(g,p);targets.forEach(t=>{if(!t.alive)return;g.fillStyle=p.b;g.beginPath();g.arc(t.x,t.y,11,0,7);g.fill();g.fillStyle=p.a;g.beginPath();g.arc(t.x,t.y,5,0,7);g.fill()});g.strokeStyle=p.fg;g.strokeRect(aimX-5,aimY-5,10,10);text(g,`SCORE ${game.score}   ${Math.max(0,Math.ceil(time))}s`,8,14,9,p.fg)}}
  return game
}

export function warehouse(p:Pal):Game {
  let player={x:2,y:2},moves=0;const boxes=[{x:4,y:3},{x:6,y:3},{x:3,y:5}],goals=[{x:4,y:6},{x:6,y:6},{x:3,y:6}]
  const walls=(x:number,y:number)=>x<1||x>8||y<1||y>7
  const move=(dx:number,dy:number)=>{const x=player.x+dx,y=player.y+dy;if(walls(x,y))return;const box=boxes.find(b=>b.x===x&&b.y===y);if(box){if(walls(x+dx,y+dy)||boxes.some(b=>b.x===x+dx&&b.y===y+dy))return;box.x+=dx;box.y+=dy}player={x,y};moves++;if(boxes.every(b=>goals.some(g=>g.x===b.x&&g.y===b.y))){game.score=Math.max(100,1500-moves*10);game.over=true}}
  const game:Game={over:false,score:0,update(_,k){if(k.hit('l'))move(-1,0);else if(k.hit('r'))move(1,0);else if(k.hit('u'))move(0,-1);else if(k.hit('d'))move(0,1)},draw(g){clear(g,p);const cell=23,ox=13,oy=20;for(let y=0;y<9;y++)for(let x=0;x<10;x++){g.fillStyle=walls(x,y)?p.dim:p.bg;g.fillRect(ox+x*cell,oy+y*cell,cell-1,cell-1)}goals.forEach(a=>{g.strokeStyle=p.b;g.strokeRect(ox+a.x*cell+5,oy+a.y*cell+5,12,12)});boxes.forEach(b=>{g.fillStyle=goals.some(a=>a.x===b.x&&a.y===b.y)?p.c:p.a;g.fillRect(ox+b.x*cell+3,oy+b.y*cell+3,17,17)});g.fillStyle=p.fg;g.beginPath();g.arc(ox+player.x*cell+11,oy+player.y*cell+11,6,0,7);g.fill();text(g,`WAREHOUSE  MOVES ${moves}`,10,12,9,p.fg)}}
  return game
}

export function matchPairs(p:Pal):Game {
  const cards=Array.from({length:16},(_,i)=>i%8).sort(()=>Math.random()-0.5),found=new Set<number>();let first=-1,second=-1,wait=0,turns=0,sel=0
  const flip=(i:number)=>{if(wait>0||found.has(i)||i===first)return;if(first<0)first=i;else{second=i;turns++;if(cards[first]===cards[second]){found.add(first);found.add(second);first=second=-1;game.score+=100;if(found.size===16){game.score+=Math.max(0,400-turns*10);game.over=true}}else wait=0.8}}
  const game:Game={over:false,score:0,update(dt,k){if(wait>0){wait-=dt;if(wait<=0)first=second=-1}if(k.hit('l'))sel=(sel+15)%16;if(k.hit('r'))sel=(sel+1)%16;if(k.hit('u'))sel=(sel+12)%16;if(k.hit('d'))sel=(sel+4)%16;if(k.hit('a'))flip(sel)},click(x,y){const cx=Math.floor((x-18)/55),cy=Math.floor((y-29)/45);if(cx>=0&&cx<4&&cy>=0&&cy<4)flip(cy*4+cx)},draw(g){clear(g,p);cards.forEach((v,i)=>{const x=18+i%4*55,y=29+Math.floor(i/4)*45,visible=found.has(i)||i===first||i===second;g.fillStyle=found.has(i)?p.dim:visible?p.b:p.a;g.fillRect(x,y,49,39);text(g,visible?String.fromCharCode(65+v):'?',x+24,y+26,18,p.fg,'center');if(i===sel){g.strokeStyle=p.c;g.strokeRect(x-2,y-2,53,43)}});text(g,`PAIRS  ${found.size/2}/8   TURNS ${turns}`,10,14,9,p.fg)}}
  return game
}

export function pegGarden(p:Pal):Game {
  const board=Array.from({length:7},(_,y)=>Array.from({length:7},(_,x)=>x<2&&y<2||x>4&&y<2||x<2&&y>4||x>4&&y>4?-1:x===3&&y===3?0:1));let sel={x:3,y:3},from:{x:number;y:number}|null=null
  const valid=(x:number,y:number)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<7&&y>=0&&y<7&&board[y][x]>=0
  const can=(x:number,y:number,dx:number,dy:number)=>Number.isInteger(dx)&&Number.isInteger(dy)&&Math.abs(dx)+Math.abs(dy)===1&&valid(x,y)&&valid(x+dx*2,y+dy*2)&&board[y][x]===1&&board[y+dy][x+dx]===1&&board[y+dy*2][x+dx*2]===0
  const choose=(x:number,y:number)=>{if(!valid(x,y))return;if(board[y][x]===1){from={x,y};return}if(from){const dx=(x-from.x)/2,dy=(y-from.y)/2;if(Math.abs(dx)+Math.abs(dy)===1&&can(from.x,from.y,dx,dy)){board[from.y][from.x]=0;board[from.y+dy][from.x+dx]=0;board[y][x]=1;game.score+=50;from=null;if(!board.some((row,yy)=>row.some((v,xx)=>v===1&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>can(xx,yy,a,b)))))game.over=true}}}
  const game:Game={over:false,score:0,update(_,k){if(k.hit('l'))sel.x=Math.max(0,sel.x-1);if(k.hit('r'))sel.x=Math.min(6,sel.x+1);if(k.hit('u'))sel.y=Math.max(0,sel.y-1);if(k.hit('d'))sel.y=Math.min(6,sel.y+1);if(k.hit('a'))choose(sel.x,sel.y)},click(x,y){choose(Math.round((x-44)/28),Math.round((y-34)/28))},draw(g){clear(g,p);board.forEach((r,y)=>r.forEach((v,x)=>{if(v<0)return;g.fillStyle=v?p.c:p.dim;g.beginPath();g.arc(44+x*28,34+y*28,v?9:4,0,7);g.fill();if(from?.x===x&&from.y===y){g.strokeStyle=p.a;g.strokeRect(32+x*28,22+y*28,24,24)}}));g.strokeStyle=p.fg;g.strokeRect(32+sel.x*28,22+sel.y*28,24,24);text(g,`PEG GARDEN  ${game.score}`,10,13,9,p.fg)}}
  return game
}

export function circuitRace(p:Pal):Game {
  let x=128,y=H-43,angle=0,speed=0,time=0,lap=0,checkpoint=0
  const game:Game={over:false,score:0,update(dt,k){time+=dt;speed=clamp(speed+(k.u?55:k.d?-90:-18)*dt,0,100);angle+=((k.r?1:0)-(k.l?1:0))*dt*2.7*(0.2+speed/100);x+=Math.cos(angle)*speed*dt;y+=Math.sin(angle)*speed*dt;x=clamp(x,5,W-5);y=clamp(y,24,H-5)
    const radius=Math.hypot((x-128)/100,(y-121)/66);if(radius<0.66||radius>1.05)speed*=Math.pow(0.18,dt)
    if(checkpoint===0&&x>200&&y<125)checkpoint=1;else if(checkpoint===1&&x<128&&y<75)checkpoint=2;else if(checkpoint===2&&x<52&&y>120)checkpoint=3;else if(checkpoint===3&&x>122&&y>160){lap++;checkpoint=0;game.score+=Math.max(100,1200-Math.floor(time*4));if(lap===3)game.over=true}
    if(time>180)game.over=true
  },draw(g){clear(g,p);g.strokeStyle=p.dim;g.lineWidth=29;g.beginPath();g.ellipse(128,121,86,57,0,0,7);g.stroke();g.lineWidth=1;g.strokeStyle=p.fg;g.setLineDash([5,7]);g.beginPath();g.ellipse(128,121,86,57,0,0,7);g.stroke();g.setLineDash([]);g.save();g.translate(x,y);g.rotate(angle);g.fillStyle=p.a;g.fillRect(-7,-4,14,8);g.fillStyle=p.c;g.fillRect(1,-3,3,6);g.restore();text(g,`LAP ${Math.min(3,lap+1)}/3   ${time.toFixed(1)}s`,8,14,9,p.fg)}}
  return game
}

export function discGolf(p:Pal):Game {
  let ball={x:40,y:160},hole={x:210,y:65},vx=0,vy=0,angle=-0.5,power=0.5,charging=false,moving=false,shots=0,holes=0
  const shoot=()=>{if(moving)return;if(!charging){charging=true;power=0.05}else{charging=false;moving=true;vx=Math.cos(angle)*power*200;vy=Math.sin(angle)*power*200;shots++}}
  const game:Game={over:false,score:0,update(dt,k){if(!moving){angle+=((k.r?1:0)-(k.l?1:0))*dt*1.7;if(charging)power=(power+dt*0.55)%1;if(k.hit('a'))shoot()}else{ball.x+=vx*dt;ball.y+=vy*dt;vx*=Math.pow(0.35,dt);vy*=Math.pow(0.35,dt);if(ball.x<12||ball.x>W-12){ball.x=clamp(ball.x,12,W-12);vx=-vx*0.7}if(ball.y<30||ball.y>H-12){ball.y=clamp(ball.y,30,H-12);vy=-vy*0.7}if(Math.hypot(ball.x-hole.x,ball.y-hole.y)<9&&Math.hypot(vx,vy)<120){holes++;game.score+=Math.max(50,1000-shots*60);shots=0;ball={x:35,y:160};hole={x:rnd(130,225),y:rnd(45,140)};moving=false;vx=vy=0;if(holes>=5)game.over=true}else if(Math.hypot(vx,vy)<5)moving=false}if(shots>20)game.over=true},draw(g){clear(g,p);g.strokeStyle=p.dim;g.strokeRect(10,27,W-20,H-37);g.fillStyle=p.dim;g.beginPath();g.arc(hole.x,hole.y,9,0,7);g.fill();g.fillStyle=p.a;g.fillRect(hole.x,hole.y-20,2,20);g.fillRect(hole.x+2,hole.y-20,12,7);g.fillStyle=p.fg;g.beginPath();g.arc(ball.x,ball.y,3,0,7);g.fill();if(!moving){g.strokeStyle=p.c;g.beginPath();g.moveTo(ball.x,ball.y);g.lineTo(ball.x+Math.cos(angle)*22,ball.y+Math.sin(angle)*22);g.stroke()}text(g,`HOLE ${Math.min(5,holes+1)}/5  SHOTS ${shots}`,8,14,9,p.fg);if(charging){g.fillStyle=p.a;g.fillRect(20,H-8,power*200,4)}}}
  return game
}

export function starFort(p:Pal):Game {
  let bank=90,time=0,wave=1,spawn=0,left=8,lives=10,sel=0;const slots=[{x:48,y:63},{x:104,y:63},{x:160,y:63},{x:208,y:122},{x:160,y:174},{x:104,y:174},{x:48,y:174}],towers:{x:number;y:number;cool:number}[]=[],enemies:{x:number;y:number;hp:number;stage:number}[]=[]
  const buy=(i:number)=>{const pos=slots[i];if(pos&&bank>=30&&!towers.some(t=>t.x===pos.x&&t.y===pos.y)){bank-=30;towers.push({...pos,cool:0})}}
  const game:Game={over:false,score:0,update(dt,k){time+=dt;spawn-=dt;if(k.hit('l'))sel=(sel+6)%7;if(k.hit('r'))sel=(sel+1)%7;if(k.hit('a'))buy(sel);if(left>0&&spawn<=0){enemies.push({x:0,y:100,hp:2+wave,stage:0});left--;spawn=0.9}
    enemies.forEach(e=>{if(e.hp<=0)return;const speed=(18+wave*2)*dt;if(e.stage===0){e.x+=speed;if(e.x>232){e.x=232;e.stage=1}}else if(e.stage===1){e.y+=speed;if(e.y>144)e.stage=2}else{e.x-=speed;if(e.x<0){lives--;e.hp=-999}}})
    towers.forEach(t=>{t.cool-=dt;if(t.cool<=0){const e=enemies.find(e=>e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<62);if(e){e.hp--;t.cool=0.65;if(e.hp===0){bank+=10;game.score+=25}}}})
    for(let i=enemies.length-1;i>=0;i--)if(enemies[i].hp<=0)enemies.splice(i,1)
    if(left===0&&!enemies.length){wave++;left=6+wave*2;bank+=25;if(wave>5){game.score+=lives*100;game.over=true}}if(lives<=0)game.over=true
  },click(x,y){const i=slots.findIndex(s=>Math.hypot(x-s.x,y-s.y)<17);if(i>=0)buy(i)},draw(g){clear(g,p);g.strokeStyle=p.dim;g.lineWidth=13;g.beginPath();g.moveTo(0,100);g.lineTo(232,100);g.lineTo(232,144);g.lineTo(0,144);g.stroke();g.lineWidth=1;slots.forEach((s,i)=>{g.strokeStyle=i===sel?p.c:p.dim;g.strokeRect(s.x-12,s.y-12,24,24)});towers.forEach(t=>{g.fillStyle=p.b;g.fillRect(t.x-7,t.y-7,14,14);g.strokeStyle=p.c;g.beginPath();g.arc(t.x,t.y,11,0,7);g.stroke()});enemies.forEach(e=>{g.fillStyle=p.a;g.fillRect(e.x-4,e.y-4,8,8)});text(g,`WAVE ${wave}/5  $${bank}  LIFE ${lives}`,6,14,8,p.fg);text(g,'BUILD TOWER: $30',W/2,H-8,8,p.c,'center')}}
  return game
}

export function beatStreet(p:Pal):Game {
  let time=0,spawn=0,misses=0,combo=0;const notes:{lane:number;y:number}[]=[]
  const game:Game={over:false,score:0,update(dt,k){time+=dt;spawn-=dt;if(spawn<=0){notes.push({lane:Math.floor(Math.random()*4),y:24});spawn=0.48+Math.random()*0.3}notes.forEach(n=>n.y+=85*dt)
    ;(['l','u','d','r'] as const).forEach((key,lane)=>{if(!k.hit(key))return;const index=notes.findIndex(n=>n.lane===lane&&Math.abs(n.y-185)<20);if(index>=0){notes.splice(index,1);combo++;game.score+=50+Math.min(combo,20)*5}else{misses++;combo=0}})
    while(notes[0]?.y>H){notes.shift();misses++;combo=0}if(misses>=12||time>=60)game.over=true
  },draw(g){clear(g,p);for(let i=0;i<4;i++){g.strokeStyle=p.dim;g.strokeRect(28+i*51,24,46,179);text(g,['<','^','v','>'][i],51+i*51,195,18,p.c,'center')}notes.forEach(n=>{g.fillStyle=p.a;g.fillRect(35+n.lane*51,n.y-5,32,10)});text(g,`BEAT ${game.score}  COMBO ${combo}  MISS ${misses}/12`,5,14,8,p.fg)}}
  return game
}

export function orbitalSalvage(p:Pal):Game {
  let x=128,y=H/2,cargo=false,time=90,delivered=0
  let crate={x:40,y:50};const hazards=Array.from({length:6},(_,i)=>({a:i*Math.PI/3,r:60+i%2*20}))
  const game:Game={over:false,score:0,update(dt,k){time-=dt;x=clamp(x+((k.r?1:0)-(k.l?1:0))*85*dt,8,W-8);y=clamp(y+((k.d?1:0)-(k.u?1:0))*85*dt,26,H-8);hazards.forEach(h=>h.a+=dt*0.35)
    if(!cargo&&Math.hypot(x-crate.x,y-crate.y)<13)cargo=true
    if(cargo&&Math.hypot(x-128,y-112)<17){cargo=false;delivered++;game.score+=100;crate={x:rnd(15,240),y:rnd(30,205)}}
    if(hazards.some(h=>Math.hypot(x-(128+Math.cos(h.a)*h.r),y-(112+Math.sin(h.a)*h.r))<10)){time-=5;x=128;y=112;cargo=false}
    if(time<=0||delivered>=10)game.over=true
  },draw(g){clear(g,p);g.strokeStyle=p.dim;for(let i=0;i<2;i++){g.beginPath();g.arc(128,112,60+i*20,0,7);g.stroke()}g.fillStyle=p.b;g.fillRect(116,100,24,24);text(g,'BASE',128,116,7,p.bg,'center');hazards.forEach(h=>{g.fillStyle=p.a;g.beginPath();g.arc(128+Math.cos(h.a)*h.r,112+Math.sin(h.a)*h.r,6,0,7);g.fill()});if(!cargo){g.fillStyle=p.c;g.fillRect(crate.x-4,crate.y-4,8,8)}g.fillStyle=p.fg;g.beginPath();g.moveTo(x,y-6);g.lineTo(x-5,y+5);g.lineTo(x+5,y+5);g.fill();if(cargo){g.fillStyle=p.c;g.fillRect(x+6,y,5,5)}text(g,`SALVAGE ${delivered}/10  ${Math.max(0,Math.ceil(time))}s`,8,14,9,p.fg)}}
  return game
}

export function marbleTilt(p:Pal):Game {
  let x=30,y=40,vx=0,vy=0,lives=3,level=1,time=0
  const walls=[{x:65,y:27,w:12,h:115},{x:118,y:85,w:12,h:125},{x:174,y:27,w:12,h:115}],holes=[{x:45,y:175},{x:95,y:185},{x:150,y:45},{x:205,y:160}]
  const reset=()=>{x=30;y=40;vx=vy=0}
  const game:Game={over:false,score:0,update(dt,k){time+=dt;vx=clamp((vx+((k.r?1:0)-(k.l?1:0))*95*dt)*Math.pow(0.45,dt),-75,75);vy=clamp((vy+((k.d?1:0)-(k.u?1:0))*95*dt)*Math.pow(0.45,dt),-75,75)
    const blocked=(px:number,py:number)=>px<15||px>W-15||py<25||py>H-15||walls.some(w=>px+5>w.x&&px-5<w.x+w.w&&py+5>w.y&&py-5<w.y+w.h)
    if(!blocked(x+vx*dt,y))x+=vx*dt;else vx*=-0.35
    if(!blocked(x,y+vy*dt))y+=vy*dt;else vy*=-0.35
    if(holes.some(h=>Math.hypot(x-h.x,y-h.y)<8)){lives--;reset();if(lives<=0)game.over=true}
    if(Math.hypot(x-225,y-185)<12){game.score+=Math.max(100,1000-Math.floor(time*5));level++;time=0;reset();if(level>3)game.over=true}
  },draw(g){clear(g,p);g.strokeStyle=p.dim;g.strokeRect(10,20,W-20,H-30);walls.forEach(w=>{g.fillStyle=p.dim;g.fillRect(w.x,w.y,w.w,w.h);g.fillStyle=p.b;g.fillRect(w.x,w.y,w.w,2)});holes.forEach(h=>{g.fillStyle=p.dim;g.beginPath();g.arc(h.x,h.y,9,0,7);g.fill()});g.strokeStyle=p.c;g.strokeRect(215,175,20,20);g.fillStyle=p.fg;g.beginPath();g.arc(x,y,5,0,7);g.fill();g.fillStyle=p.c;g.beginPath();g.arc(x-1,y-2,2,0,7);g.fill();text(g,`TILT ${level}/3  MARBLES ${lives}`,8,13,9,p.fg)}}
  return game
}
