import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const out=path.resolve(here,'../../_runtime/catalog');
await fs.mkdir(out,{recursive:true});
const base=process.env.BOI_CATALOG_URL||'http://127.0.0.1:8765';
const check=(value,message)=>{if(!value)throw new Error(message);};
const get=async route=>{const response=await fetch(base+route);check(response.ok,route);return response.json();};
const find=async(category,id)=>(await get('/api/entries?'+new URLSearchParams({category,q:id}))).items.find(e=>e.id===id);
const detail=async(category,id)=>{
  const entry=await find(category,id);check(entry,`Missing ${category}:${id}`);
  return (await get('/api/entry/'+encodeURIComponent(entry.uid))).entry;
};
const cases=[['items','63051','/additem 63051 1'],['monsters','1001','/addmonster 1001 1'],
  ['mounts','1206','/addrider 1206'],['pets','3093','/addpet 3093 1 1'],
  ['tarotcards','12519','/additem 54274 1'],['relics','11026','/additem 44441 1'],
  ['emotes','57039','/additem 61135 1']];
for(const [category,id,command] of cases){
  // The ordinary-monster sample is discovered if the archived table has no 1001.
  if(category==='monsters'&&!await find(category,id))continue;
  const e=await detail(category,id);check(e.gm.actions.some(a=>a.command===command),`Wrong action for ${e.uid}`);
}
const mount=await detail('mounts','1206');
check(mount.gm.actions.some(a=>a.command==='/additem 62141 1'),'Missing actual mount-item relationship');
const pet=await detail('pets','3093');
check(pet.gm.actions.some(a=>a.command==='/additem 62567 1'),'Missing actual pet egg');
const vehicle=await detail('vehicles','55518');
check(vehicle.gm.status==='unknown'&&!vehicle.gm.actions.length,'VehicleID must not be granted as ItemID');
check(vehicle.gm.relatedCommand.uid==='commands:createvehicle','Missing honest vehicle reference');
const meta=await get('/api/meta');
for(const category of meta.categories){
  const list=await get('/api/entries?'+new URLSearchParams({category:category.key,limit:1}));
  const e=(await get('/api/entry/'+encodeURIComponent(list.items[0].uid))).entry;
  check(e.gm&&(e.gm.actions.length||e.gm.notes.length),`Missing GM help in ${category.key}`);
}
const browser=await chromium.launch({headless:true,channel:process.env.BOI_BROWSER_CHANNEL||undefined});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.__copied=value;}}}));
 const item=await detail('items','63051');
 await page.goto(base+'/#items?entry='+encodeURIComponent(item.uid),{waitUntil:'networkidle'});
 await page.locator('.gm-help').waitFor();
 check(await page.locator('[data-gm-code="0"]').textContent()==='/additem 63051 1','Item command not rendered');
 await page.locator('[data-gm-quantity="0"]').fill('12');
 await page.locator('[data-gm-copy="0"]').click();
 check(await page.evaluate(()=>window.__copied)==='/additem 63051 12','Wrong clipboard command');
 await page.locator('[data-gm-quantity="0"]').fill('-1');
 check(await page.locator('[data-gm-copy="0"]').isDisabled(),'Negative quantity is copyable');
 check(await page.locator('[data-gm-error="0"]').isVisible(),'Quantity error not visible');
 await page.locator('[data-gm-quantity="0"]').fill('1.5');
 check(await page.locator('[data-gm-copy="0"]').isDisabled(),'Fractional quantity is copyable');
 await page.locator('[data-gm-quantity="0"]').fill('1');
 check(await page.locator('[data-gm-copy="0"]').isEnabled(),'Valid quantity not restored');
 await page.locator('.gm-activation').click();
 check(await page.evaluate(()=>window.__copied)==='/setpower','Wrong activation copied');
 await page.locator('.gm-help').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,'gm-item-desktop.png'),animations:'disabled'});
 await page.goto(base+'/#mounts?entry='+encodeURIComponent(mount.uid),{waitUntil:'networkidle'});
 await page.locator('[data-gm-code="1"]').waitFor();
 check(await page.locator('[data-gm-code="1"]').textContent()==='/additem 62141 1','Mount-item command uses wrong namespace');
 await page.locator('.gm-item-link').first().click();
 await page.waitForFunction(()=>document.querySelector('.detail-id b')?.textContent==='62141');
 await page.locator('#close-detail').click();
 check(await page.locator('#detail-drawer').isHidden(),'Close did not work after related item');
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/#pets?entry='+encodeURIComponent(pet.uid),{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('.detail-id b')?.textContent==='3093'&&!document.querySelector('#detail-drawer').hidden);
 await page.locator('.gm-help').scrollIntoViewIfNeeded();
 check(!await page.evaluate(()=>document.querySelector('#detail-drawer').scrollWidth>innerWidth),'Mobile drawer overflow');
 await page.screenshot({path:path.join(out,'gm-pet-mobile.png'),animations:'disabled'});
 await page.goto(base+'/#vehicles?entry='+encodeURIComponent(vehicle.uid),{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('.detail-id b')?.textContent==='55518'&&!document.querySelector('#detail-drawer').hidden);
 await page.locator('.gm-unknown').scrollIntoViewIfNeeded();
 check(!(await page.locator('.gm-help').textContent()).includes('/additem 55518'),'Unsafe namespace substitution in UI');
 await page.screenshot({path:path.join(out,'gm-vehicle-mobile.png'),animations:'disabled'});
 await page.locator('.gm-reference').click();
 await page.waitForFunction(()=>document.querySelector('.detail-id b')?.textContent==='/createvehicle');
 check(errors.length===0,errors.join('\n'));
 console.log('PASS: category coverage, source relationships, ID namespaces, quantity and clipboard, related navigation, desktop and mobile');
}finally{await browser.close();}
