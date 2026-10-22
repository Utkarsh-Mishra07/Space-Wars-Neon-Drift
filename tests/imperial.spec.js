const {test,expect}=require('@playwright/test');
async function start(page){
 await page.goto('/?test=1');
 await page.evaluate(()=>window.__game.manual=true);
 await page.locator('#start').click();
 await expect(page.locator('#overlay')).toBeHidden();
}
test('assets crop, rotation and uniform scaling on desktop and mobile',async({page})=>{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
 await page.setViewportSize(viewport);await start(page);
 const result=await page.evaluate(()=>{
 const g=__game,s=g.get();return Object.entries(s.assets).map(([kind,a])=>({kind,ready:a.ready,rotation:a.rotation,w:a.width,h:a.height,sw:a.sourceWidth,sh:a.sourceHeight,b:g.bounds({kind}),box:s.BALANCE.boxes[kind]}));
 });
 for(const a of result){expect(a.ready).toBe(true);expect(a.w).toBeLessThanOrEqual(a.sw);expect(a.h).toBeLessThanOrEqual(a.sh);if(a.kind!=='carrier')expect(a.w).toBeLessThan(a.sw);expect(a.b.w).toBeLessThanOrEqual(a.box[0]+.001);expect(a.b.h).toBeLessThanOrEqual(a.box[1]+.001);expect(a.b.w/a.b.h).toBeCloseTo(a.kind==='carrier'?a.h/a.w:a.w/a.h,5)}
 expect(result.find(a=>a.kind==='carrier').rotation).toBe(Math.PI/2);
 await page.evaluate(()=>{__game.sector(5);const s=__game.get();s.foes[0].y=145;s.sector.deployTimer=0;__game.step(.02);const c=s.foes.find(e=>e.kind==='carrier');c.y=235;c.launchTimer=0;__game.step(.02)});
 await page.screenshot({path:`/tmp/imperial-${viewport.width}.png`});
 }
});
test('carrier launches at its nose; death cancels budget but fighters must clear',async({page})=>{
 await start(page);
 const r=await page.evaluate(()=>{
 const g=__game,s=g.get();s.sector.carriersPending=0;s.sector.fightersPending=0;
 const c=g.spawn('carrier');c.y=120;c.launchTimer=0;g.step(.01);
 const f=s.foes.find(e=>e.kind==='tie'),bounds=g.bounds(c),launchY=f.y;const remaining=c.launches;
 g.hurt(c,9999);g.step(.01);const blocked=!g.complete(),canceled=s.sector.canceledLaunches;g.kill(f);g.step(1.2);
 return {launchY,min:120+bounds.h/2,remaining,canceled,blocked,state:g.get().state,level:g.get().level};
 });
 expect(r.launchY).toBeGreaterThan(r.min);expect(r.canceled).toBe(r.remaining);expect(r.blocked).toBe(true);expect(r.state).toBe('upgrade');expect(r.level).toBe(1);
 await page.locator('#up0').click();await expect(page.locator('#sector')).toHaveText('SECTOR 02');
});
for(const level of [4,5,10,100])test(`sector ${level} has finite deployments and advances`,async({page})=>{
 await start(page);
 const r=await page.evaluate(level=>{
 const g=__game;g.sector(level);let s=g.get();const support=s.allies.length,boss=s.foes.find(e=>e.boss);let shield=false,max=0;
 if(boss){g.hurt(boss,1e6);shield=boss.hp===boss.max}
 // Drive real scheduling to completion; deterministic kills isolate progression from aiming.
 let steps=0;for(;steps<20000&&g.get().state==='play';steps++){
 s=g.get();s.p.inv=10;g.step(.05);max=Math.max(max,g.get().foes.length);
 for(const e of g.get().foes){if(e.boss){if(s.sector.deployed>=3)g.hurt(e,1e6)}else if(e.kind!=='carrier'||e.launches===0)g.hurt(e,1e6)}
 }
 s=g.get();return {support,shield,boss:!!boss,deployed:s.sector.deployed,launched:s.sector.launched,max,steps,state:s.state,pending:s.sector.carriersPending+s.sector.fightersPending};
 },level);
 expect(r.support).toBe(Math.min(5,level-1));expect(r.max).toBeLessThanOrEqual(20);expect(r.state).toBe(level>=10?'victory':'upgrade');expect(r.pending).toBe(0);expect(r.launched).toBeGreaterThan(0);
 if(level%5===0){expect(r.boss).toBe(true);expect(r.shield).toBe(true);expect(r.deployed).toBeGreaterThanOrEqual(3)}
 if(level<10){await page.locator('#up0').click();expect(await page.evaluate(()=>__game.get().level)).toBe(level+1)}
 else{await expect(page.locator('#panel')).toContainText('CAMPAIGN COMPLETE');await expect(page.locator('#up0')).toHaveCount(0);await page.evaluate(()=>__game.step(60));expect(await page.evaluate(()=>__game.get().state)).toBe('victory');await page.locator('#retry').click();expect(await page.evaluate(()=>__game.get().level)).toBe(1)}
});
for(const inv of [0,10])test(`breach defeats full hull with invulnerability ${inv}`,async({page})=>{
 await start(page);
 await page.evaluate(inv=>{const g=__game,s=g.get();s.p.inv=inv;s.p.dashTime=inv?1:0;g.setScore(1234);const e=g.spawn();e.y=s.H+g.bounds(e).h/2+1;g.step(.01);g.step(5)},inv);
 await expect(page.locator('#panel')).toContainText('An enemy breached your defenses.');
 expect(await page.evaluate(()=>({state:__game.get().state,hp:__game.get().p.hp,best:localStorage.getItem('neondrift.best')}))).toEqual({state:'over',hp:5,best:'1234'});
 await page.locator('#retry').click();expect(await page.evaluate(()=>({level:__game.get().level,n:__game.get().allies.length,dead:__game.get().sector.bossDead}))).toEqual({level:1,n:0,dead:false});
 await page.reload();await expect(page.locator('#best')).toHaveText('001234');
});
test('lethal projectile precedes breach; entry, sideways, bullets and allies do not breach',async({page})=>{
 await start(page);
 const r=await page.evaluate(()=>{
 const g=__game;g.sector(2);const s=g.get();s.sector.carriersPending=0;s.sector.fightersPending=0;
 const e=g.spawn();e.y=s.H+g.bounds(e).h/2+1;e.speed=0;e.base=e.x;e.phase=0;
 s.shots.push({x:e.x,y:e.y,vx:0,vy:0,damage:100,faction:'player'});
 const entry=g.spawn();entry.y=-100;entry.speed=0;
 const side=g.spawn();side.x=-100;side.base=-100;side.y=150;side.speed=0;
 s.hostile.push({x:10,y:s.H+100,vx:0,vy:0,faction:'enemy'});s.allies[0].y=s.H+200;
 g.step(.01);return {state:g.get().state,dead:e.dead,entry:entry.dead||false};
 });expect(r).toEqual({state:'play',dead:true,entry:false});
});
test('pause freezes simulation; movement, nova, ally death and upgrades reset correctly',async({page})=>{
 await start(page);await page.keyboard.down('ArrowRight');await page.evaluate(()=>__game.step(.1));await page.keyboard.up('ArrowRight');expect(await page.evaluate(()=>__game.get().p.x)).toBeGreaterThan(480);
 await page.evaluate(()=>{__game.sector(5);__game.step(.5)});await page.keyboard.press('p');
 const snapshot=()=>page.evaluate(()=>JSON.stringify({sector:__game.get().sector,foes:__game.get().foes,allies:__game.get().allies}));const before=await snapshot();await page.evaluate(()=>__game.step(20));expect(await snapshot()).toBe(before);await page.keyboard.press('p');
 await page.evaluate(()=>{const s=__game.get();s.allies[0].hp=0;__game.step(.01)});expect(await page.evaluate(()=>__game.get().allies.length)).toBe(3);
 await page.keyboard.press('x');expect(await page.evaluate(()=>__game.get().p.nova)).toBe(0);expect(await page.evaluate(()=>__game.get().foes[0].hp===__game.get().foes[0].max)).toBe(true);
 await page.evaluate(()=>__game.sector(6));expect(await page.evaluate(()=>__game.get().allies.length)).toBe(5);
});
test('missing PNG falls back and normal play exposes no shortcuts',async({page})=>{
 await page.route('**/png/image.png',route=>route.abort());await page.goto('/');await page.locator('#start').click();await expect(page.locator('#overlay')).toBeHidden();expect(await page.evaluate(()=>window.__game)).toBeUndefined();
});
test('browser play: auto-fire, touch movement, targeting and bounded live simulation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await start(page);
 const r=await page.locator('#game').boundingBox();await page.mouse.move(r.x+r.width*.7,r.y+r.height*.8);await page.mouse.down();await page.evaluate(()=>{for(let i=0;i<30;i++)__game.step(1/60)});await page.mouse.up();expect(await page.evaluate(()=>__game.get().p.x)).toBeGreaterThan(480);
 await page.evaluate(()=>__game.manual=false);await page.waitForTimeout(12000);
 expect(await page.evaluate(()=>__game.get().foes.length)).toBeLessThanOrEqual(20);expect(await page.evaluate(()=>__game.get().sector.launched)).toBeGreaterThan(0);expect(errors).toEqual([]);
 await page.screenshot({path:'/tmp/imperial-live-mobile.png'});
});
test('hull, health pickups and faction isolation',async({page})=>{
 await start(page);
 const r=await page.evaluate(()=>{
 const g=__game;g.sector(2);const s=g.get();s.p.inv=0;
 s.hostile.push({x:s.p.x,y:s.p.y,vx:0,vy:0});g.step(.01);const damaged=s.p.hp;
 g.get().drops.push({x:s.p.x,y:s.p.y});g.step(.01);const healed=s.p.hp;
 const a=g.get().allies[0];g.get().shots.push({x:a.x,y:a.y,vx:0,vy:0,damage:100,faction:'player'});g.step(.01);
 return {damaged,healed,allyHP:a.hp};
 });expect(r).toEqual({damaged:4,healed:5,allyHP:3});
});
test('high-sector saturation retains pending launches until a slot opens',async({page})=>{
 await start(page);
 const r=await page.evaluate(()=>{
 const g=__game;g.sector(101);const s=g.get();s.p.inv=100;s.sector.carriersPending=0;s.sector.fightersPending=0;
 const c=g.spawn('carrier');c.y=120;c.launchTimer=0;
 for(let i=0;i<100;i++){const e=g.spawn();if(e){e.y=40;e.speed=0}}
 g.step(.1);const capped=g.get().foes.length,remaining=c.launches;
 g.kill(g.get().foes.find(e=>e.kind==='tie'));g.step(.1);
 return {capped,remaining,after:c.launches,count:g.get().foes.length};
 });expect(r.capped).toBe(20);expect(r.remaining).toBe(12);expect(r.after).toBe(11);expect(r.count).toBe(20);
});
test('boss fan attack and aimed shot survive integration; boss death cancels summons',async({page})=>{
 await start(page);
 const r=await page.evaluate(()=>{
 const g=__game;g.sector(25);const s=g.get(),boss=s.foes[0];boss.y=115;boss.cd=0;s.sector.deployed=3;
 g.step(.01);const bullets=g.get().hostile.length;
 const pending=s.sector.carriersPending+s.sector.fightersPending;g.hurt(boss,1e9);
 return {bullets,pending,canceled:s.sector.canceled,left:s.sector.carriersPending+s.sector.fightersPending,dead:s.sector.bossDead};
 });expect(r.bullets).toBe(8);expect(r.canceled).toBe(r.pending);expect(r.left).toBe(0);expect(r.dead).toBe(true);
});
for(const kind of ['carrier','deathstar'])test(`${kind} bounds below screen also breach`,async({page})=>{
 await start(page);await page.evaluate(kind=>{const g=__game,s=g.get(),e=g.spawn(kind);e.y=s.H+g.bounds(e).h/2+1;g.step(.01)},kind);await expect(page.locator('#panel')).toContainText('An enemy breached your defenses.');
});

test('total X-wings start at one and grow each sector up to six',async({page})=>{
 await start(page);
 const counts=await page.evaluate(()=>[1,2,3,4,5,6,7,10,100].map(level=>{__game.sector(level);return 1+__game.get().allies.length}));
 expect(counts).toEqual([1,2,3,4,5,6,6,6,6]);
});
