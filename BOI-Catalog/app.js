'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
const format = value => Number(value).toLocaleString('ru-RU');
const paths = {
  search:'<circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.3 16.3 4.2 4.2"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  sword:'<path d="m14 3 7 0 0 7L8 19l-3-3L14 3Z M10 14l-5-5M15 19l-5-5M7 17l-4 4M17 3l4 4"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3ZM12 7v10M8 12h8"/>',
  gem:'<path d="m7 4-5 6 10 11 10-11-5-6H7ZM2 10h20M7 4l5 17 5-17"/>',
  monster:'<path d="m5 8-2-5 6 3h6l6-3-2 5 2 5-4 6-5 2-5-2-4-6 2-5Z M7 11l3 2M17 11l-3 2M9 17h6"/>',
  paw:'<ellipse cx="12" cy="16" rx="6" ry="4.5"/><ellipse cx="5" cy="9" rx="2" ry="3"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="16" cy="5" rx="2" ry="3"/><ellipse cx="20" cy="10" rx="2" ry="3"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15"/>',
  person:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
  book:'<path d="M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2ZM12 6v15"/>',
  flask:'<path d="M9 3h6M10 3v7l-6 9c-.6 1 .1 2 1.3 2h13.4c1.2 0 1.9-1 1.3-2l-6-9V3M7 15h10"/>',
  spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7ZM20 3v4M18 5h4"/>',
  box:'<path d="m12 3 9 5v10l-9 4-9-4V8l9-5ZM3 8l9 5 9-5M12 13v9M7 5l10 5"/>',
  code:'<path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18"/>',
  filter:'<path d="M4 6h16M4 18h16M9 3v6M15 15v6"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m21 16-6-6L5 21"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  home:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z"/>',
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
const categoryIcons = {items:'box', weapons:'sword', armour:'shield', monsters:'monster', npc:'person', maps:'map', skills:'spark', pets:'paw', mounts:'paw', gems:'gem', materials:'box', restore:'flask', charms:'scroll', stardust:'spark', titles:'star', prefixes:'star', factions:'shield', relics:'spark', petequipment:'shield', spiritequipment:'shield', treasures:'gem', treasureitems:'box', petskills:'paw', statuses:'spark', tools:'sword', tarotcards:'book', vehicles:'shield', emotes:'person', commands:'code'};
const categoryColors = {weapons:'#c8a465', armour:'#9d97c4', monsters:'#bd8274', pets:'#74b3a6', maps:'#81a6bf', gems:'#80adce', tarotcards:'#bc9cce', commands:'#81aeab'};
let favorites;
try { favorites = new Set(JSON.parse(localStorage.getItem('boi-atlas-favorites') || '[]')); } catch { favorites = new Set(); }
let view = localStorage.getItem('boi-atlas-view') || 'grid';
let descriptionLanguage = localStorage.getItem('boi-atlas-description-language') || 'ru';
let meta, categories, currentItems = [], selectedEntry = null, requestController, debounce, toastTimer, lastFocus;
const state = {category:'home', q:'', page:1, images:false, boss:false, min:'', max:'', sort:'default', classId:'', includeShared:true};
const supportsClassFilter = category => ['all','favorites',...(meta?.classFilterCategories||[])].includes(category);
const categoryIcon = category => categoryIcons[category] || 'gem';
const color = category => categoryColors[category] || '#b7a786';
const titleFor = category => ({home:'Обзор', all:'Все объекты', favorites:'Избранное'}[category] || categories?.get(category)?.title || 'Каталог');
function displayField(key,value) {
  if(value==='')return '—';
  if(/^(Можно |Разрешён маунт|Двуручное)/.test(key)&&['0','1'].includes(value))return value==='1'?'Да':'Нет';
  if(key==='Тип атаки'&&['0','1'].includes(value))return value==='0'?'Физическая':'Магическая';
  if(key==='Тип монстра')return ({monstertype_normal:'Обычный монстр',monstertype_boss:'Босс',monstertype_task:'Квестовый монстр',monstertype_building:'Сооружение',monstertype_collection:'Объект сбора',monstertype_vehicle:'Транспорт',monstertype_trap:'Ловушка'}[value]||value);
  return value;
}
const displayLabel = key => key.replace(' — исходное поле','').replace(' — поле','').replace(' — IsMerge','');
const imageHTML = (entry, large=false) => entry.image
  ? `<img src="${esc(entry.image)}" alt="${esc(entry.name || entry.id)}" ${large ? '' : 'loading="lazy"'} class="${entry.imageInfo?.width > 256 ? 'landscape-image' : ''}" data-image-fallback>`
  : `<span class="image-placeholder">${icon(categoryIcon(entry.category))}${large ? '<small>Можно добавить изображение</small>' : ''}</span>`;

function descriptionHTML(entry) {
  if(!entry.descriptions)return '';
  const languages=Object.keys(entry.descriptions).filter(key=>['ru','en'].includes(key));
  if(!languages.length)return '<section class="item-tooltip tooltip-empty"><h3>Описание предмета</h3><p>В установленных клиентах нет описания этого предмета. Характеристики сервера приведены ниже.</p></section>';
  const language=languages.includes(descriptionLanguage)?descriptionLanguage:languages[0];
  const description=entry.descriptions[language];
  return `<section class="item-tooltip"><div class="tooltip-heading"><h3>Описание предмета</h3><span>${icon('book')}</span></div>
    ${languages.length>1?`<div class="description-tabs" role="tablist" aria-label="Источник описания">${languages.map(key=>`<button role="tab" data-description-lang="${key}" aria-selected="${key===language}" class="${key===language?'active':''}">${key==='ru'?'Русский клиент':'Boi-Memory'}</button>`).join('')}</div>`:`<div class="tooltip-language">${language==='ru'?'Русский клиент':'Boi-Memory · English'}</div>`}
    ${description.name?`<div class="tooltip-client-name">${esc(description.name)}</div>`:''}
    <p class="item-description-text">${esc(description.text)}</p>
    <div class="tooltip-source">Текст из клиента ${esc(description.client)}. Параметры твоей сборки показаны ниже.</div></section>`;
}

function gmHTML(entry) {
  const gm=entry.gm;
  if(!gm)return '';
  return `<section class="gm-help ${gm.status==='unknown'?'gm-unknown':''}" aria-label="GM-команды для объекта">
    <div class="gm-heading"><h3>${icon('code')}${esc(gm.title)}</h3><span class="gm-status">${gm.status==='unknown'?'Формат не установлен':gm.status==='template'?'Шаблон':'По руководству'}</span></div>
    ${gm.actions.length?`<p class="gm-intro">Вводи в игровой чат. Сначала включи GM-доступ: <button class="gm-activation" data-copy="${esc(gm.activation)}" title="Скопировать активацию GM">${esc(gm.activation)} ${icon('copy')}</button></p>`:''}
    <div class="gm-actions">${gm.actions.map((action,index)=>`<div class="gm-action ${action.caution?'gm-caution':''}" data-gm-action="${index}">
      <div class="gm-action-heading"><h4>${esc(action.title)}</h4>${action.quantity?`<label class="gm-quantity">Количество<input type="number" min="1" step="1" value="1" inputmode="numeric" aria-label="Количество: ${esc(action.title)}" data-gm-quantity="${index}"></label>`:''}</div>
      <div class="gm-command-row"><code data-gm-code="${index}">${esc(action.command)}</code><button class="gm-copy" data-gm-copy="${index}" data-copy="${esc(action.command)}" aria-label="${action.template?'Скопировать шаблон':'Скопировать команду'} ${esc(action.command)}">${icon('copy')}<span>${action.template?'Шаблон':'Копировать'}</span></button></div>
      <p class="gm-quantity-error" data-gm-error="${index}" hidden>Введи целое положительное количество.</p><p class="gm-action-note">${esc(action.note)}</p>
      ${action.itemUid?`<button class="gm-item-link" data-open="${esc(action.itemUid)}">Открыть предмет ID ${esc(action.itemId)} ${icon('chevron')}</button>`:''}
      <details class="gm-source"><summary>Источник команды и ID</summary><p>${esc(action.source)}</p></details>
    </div>`).join('')}</div>
    ${gm.notes.map(note=>`<p class="gm-action-note">${esc(note)}</p>`).join('')}
    ${gm.namespaceNote?`<p class="gm-namespace-note">${esc(gm.namespaceNote)}</p>`:''}
    ${gm.relatedCommand?`<button class="gm-reference" data-open="${esc(gm.relatedCommand.uid)}">Открыть справку ${esc(gm.relatedCommand.name)} ${icon('chevron')}</button>`:''}
    ${gm.actions.length?'<p class="gm-footnote">Синтаксис взят из локальных руководств; команды на персонаже не проверялись. Здесь они только копируются.</p>':''}
  </section>`;
}

function notify(message) { const toast=$('#toast'); toast.textContent=message; toast.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.hidden=true,2600); }
async function api(url, options={}) { const response=await fetch(url, options); const body=await response.json(); if(!response.ok) throw new Error(body.error || 'Не удалось загрузить данные'); return body; }
async function copy(value) { try { await navigator.clipboard.writeText(value); notify(`Скопировано: ${value}`); } catch { notify('Буфер обмена недоступен. ID можно выделить в карточке.'); } }
function toggleFavorite(uid) { favorites.has(uid)?favorites.delete(uid):favorites.add(uid); localStorage.setItem('boi-atlas-favorites', JSON.stringify([...favorites])); renderNav(); renderResults(currentItems); if(selectedEntry?.uid===uid) updateDetailFavorite(); if(state.category==='favorites') loadEntries(); }
function updateDetailFavorite() { const button=$('#detail-favorite'); if(button) { button.classList.toggle('saved', favorites.has(selectedEntry.uid)); button.innerHTML=icon('star')+(favorites.has(selectedEntry.uid)?'В избранном':'В избранное'); button.setAttribute('aria-pressed',String(favorites.has(selectedEntry.uid))); } }

function renderNav() {
  $('#main-nav').innerHTML = [['home','Обзор','home'],['all','Все объекты','grid'],['favorites','Избранное','star']].map(([key,title,i])=>`<a href="#${key}" class="nav-item ${state.category===key?'active':''}" ${state.category===key?'aria-current="page"':''}>${icon(i)}<span>${title}</span>${key==='favorites'?`<small>${favorites.size}</small>`:''}</a>`).join('');
  if(!meta) return;
  const order=['items','weapons','armour','monsters','npc','maps','pets','mounts','skills','petskills','statuses','gems','restore','materials','charms','stardust','petequipment','spiritequipment','relics','treasures','treasureitems','tarotcards','titles','prefixes','factions','tools','vehicles','emotes','commands'];
  $('#category-nav').innerHTML=order.map(key=>{const c=categories.get(key); return `<a href="#${key}" class="nav-item ${state.category===key?'active':''}" ${state.category===key?'aria-current="page"':''}>${icon(categoryIcon(key))}<span>${esc(c.title)}</span><small>${format(c.count)}</small></a>`;}).join('');
}
function renderStats() {
  const stats=[['items','Предметов','box'],['monsters','Монстров','monster'],['maps','Карт мира','map'],['images','С изображениями','image']];
  $('#stats').innerHTML=stats.map(([key,title,i])=>`<button class="stat" data-category="${key==='images'?'all':key}" ${key==='images'?'data-show-images="1"':''}><span class="stat-icon">${icon(i)}</span><span><b>${format(key==='images'?meta.imageCount:categories.get(key).count)}</b><small>${title}</small></span><span class="stat-arrow">↗</span></button>`).join('');
}
function applyRoute() {
  const [key,params]=location.hash.slice(1).split('?');
  const category=key || 'home';
  if(!['home','all','favorites',...categories.keys()].includes(category)) { location.hash='home'; return; }
  if(state.category!==category) { state.q=''; $('#search').value=''; state.page=1; state.boss=false; state.min=''; state.max=''; $('#min-level').value=''; $('#max-level').value=''; }
  state.category=category;
  if(!supportsClassFilter(category))state.classId='';
  renderNav(); updateHeader(); loadEntries();
  $('#sidebar').classList.remove('open'); $('#mobile-shade').classList.remove('open');
  const entry=new URLSearchParams(params).get('entry');
  if(entry) openDetail(entry, false); else closeDetail(false);
}
function updateHeader() {
  const home=state.category==='home'&&!state.q;
  $('#hero').hidden=!home; $('#stats').hidden=!home;
  $('#breadcrumb').textContent=titleFor(state.category);
  $('#catalog-title').innerHTML=home?'Из мира Odin <span class="heading-star">✦</span>':esc(state.q&&state.category==='home'?'Результаты поиска':titleFor(state.category));
  $('#section-kicker').textContent=home?'ИССЛЕДУЙ КОЛЛЕКЦИЮ':state.category==='commands'?'СПРАВОЧНИК АДМИНИСТРАТОРА':'КАТАЛОГ ТВОЕГО СЕРВЕРА';
  $('#boss-only').hidden=state.category!=='monsters';
  $('#class-filter-row').hidden=!supportsClassFilter(state.category);
  $('#class-filter').value=state.classId;
  $('#class-shared-toggle').hidden=!state.classId||state.classId==='shared';
  $('#include-shared').checked=state.includeShared;
  const download=$('#download'), category=categories.get(state.category);
  download.hidden=!category; if(category) { download.href='/download/'+encodeURIComponent(category.file); download.innerHTML=(state.category==='commands'?'Скачать TXT':'Скачать CSV')+' <span>↓</span>'; }
  $('#images-only').innerHTML=icon('image')+'С изображениями';
  $('#images-only').classList.toggle('selected',state.images); $('#images-only').setAttribute('aria-pressed',String(state.images));
  $('#boss-only').classList.toggle('selected',state.boss); $('#boss-only').setAttribute('aria-pressed',String(state.boss));
  const active=Number(state.images)+Number(state.boss)+Number(Boolean(state.min))+Number(Boolean(state.max))+Number(state.sort!=='default')+Number(Boolean(state.classId));
  $('#filter-count').hidden=!active; $('#filter-count').textContent=active;
}
async function loadEntries(scroll=false) {
  requestController?.abort(); requestController=new AbortController();
  const params=new URLSearchParams({category:state.category,q:state.q,page:state.page,sort:state.sort});
  if(state.images)params.set('images','1'); if(state.boss)params.set('boss','1'); if(state.min)params.set('min',state.min); if(state.max)params.set('max',state.max);
  if(state.classId){params.set('class',state.classId);params.set('shared',state.includeShared?'1':'0');}
  if(state.category==='favorites')params.set('favorites',[...favorites].join(','));
  $('#results').classList.add('is-loading');
  try {
    const data=await api('/api/entries?'+params,{signal:requestController.signal});
    currentItems=data.items; state.page=data.page;
    renderResults(data.items);
    $('#collection-meta').textContent=state.category==='home'&&!state.q?`${meta.categories.length-1} категорий · ${format(meta.total-169)} записей`:`${format(data.total)} ${state.category==='commands'?'команд':'записей'}`;
    $('#results-text').textContent=data.total?`Показано ${format((data.page-1)*36+1)}–${format(Math.min(data.page*36,data.total))} из ${format(data.total)}`:'Ничего не найдено';
    renderPagination(data);
    if(scroll) $('.catalog-section').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error) { if(error.name!=='AbortError') { $('#results').innerHTML=`<div class="empty-state">${icon('book')}<h3>Не удалось открыть каталог</h3><p>${esc(error.message)}</p><button class="secondary-button" data-retry>Повторить</button></div>`; $('#pagination').innerHTML=''; } }
  finally { $('#results').classList.remove('is-loading'); }
}
function renderResults(items) {
  const results=$('#results'); results.className=view==='list'?'cards-grid list-mode':'cards-grid';
  $('#grid-view').classList.toggle('active',view==='grid'); $('#list-view').classList.toggle('active',view==='list');
  $('#grid-view').setAttribute('aria-pressed',String(view==='grid')); $('#list-view').setAttribute('aria-pressed',String(view==='list'));
  if(!items.length) { results.innerHTML=`<div class="empty-state">${icon(state.category==='favorites'?'star':'search')}<h3>${state.category==='favorites'?'Твоя коллекция начинается здесь':'Ничего не нашлось'}</h3><p>${state.category==='favorites'?'Нажми на звезду в карточке, чтобы сохранить интересный объект.':'Попробуй другой ID, название или сбрось фильтры.'}</p><button class="secondary-button" data-empty-reset>${state.category==='favorites'?'Исследовать каталог':'Сбросить поиск и фильтры'}</button></div>`; return; }
  results.innerHTML=items.map(entry=>{
    const command=entry.category==='commands', category=categories.get(entry.category), saved=favorites.has(entry.uid), title=command?entry.id:entry.name||'Без названия';
    return `<article class="entry-card ${command?'command-card':''}" style="--card-accent:${color(entry.category)}">
      <button class="card-open" data-open="${esc(entry.uid)}" aria-label="Открыть ${esc(title)}">
        <div class="card-image ${entry.imageInfo?.width>256?'wide-art':''}">${imageHTML(entry)}<span class="card-rune">✦</span></div>
        <div class="card-body"><div class="card-type">${icon(categoryIcon(entry.category))}${esc(category.title)}${entry.boss?'<span class="boss-label">БОСС</span>':''}</div><h3>${esc(title)}</h3><div class="card-description">${command?esc(entry.name):entry.level!==null?`${esc(entry.levelLabel)}: <b>${entry.level}</b>`:esc(category.namespace)}</div>${entry.classLabel?`<div class="card-class" title="${esc(entry.classLabel)}">${icon('person')}${esc(entry.classLabel)}</div>`:''}${entry.descriptionPreview?`<p class="card-tooltip-summary">${esc(entry.descriptionPreview)}</p>`:''}</div>
      </button><button class="favorite-button ${saved?'saved':''}" data-favorite="${esc(entry.uid)}" aria-label="${saved?'Убрать из избранного':'В избранное'}" aria-pressed="${saved}">${icon('star')}</button>
      <div class="card-foot"><span class="id-label">${command?'КОМАНДА':'ID'} <b>${esc(entry.id)}</b></span><button class="copy-button" data-copy="${esc(entry.id)}" aria-label="Скопировать ${esc(entry.id)}">${icon('copy')}</button></div>
    </article>`;
  }).join('');
}
function renderPagination(data) {
  if(data.pages===1) { $('#pagination').innerHTML=''; return; }
  const pages=[1,data.page-1,data.page,data.page+1,data.pages].filter((p,i,a)=>p>0&&p<=data.pages&&a.indexOf(p)===i).sort((a,b)=>a-b);
  let previous=0;
  $('#pagination').innerHTML=`<button data-page="${data.page-1}" ${data.page===1?'disabled':''} aria-label="Предыдущая страница">←</button>`+pages.map(page=>{const gap=previous&&page-previous>1?'<span>…</span>':'';previous=page;return gap+`<button data-page="${page}" class="${page===data.page?'current':''}" ${page===data.page?'aria-current="page"':''}>${page}</button>`;}).join('')+`<button data-page="${data.page+1}" ${data.page===data.pages?'disabled':''} aria-label="Следующая страница">→</button>`;
}
async function openDetail(uid, updateURL=true) {
  try {
    const data=await api('/api/entry/'+encodeURIComponent(uid)); selectedEntry=data.entry; lastFocus=document.activeElement;
    if(updateURL)history.replaceState(null,'','#'+state.category+'?entry='+encodeURIComponent(uid));
    const entry=data.entry,c=data.category,command=entry.category==='commands';
    $('#detail-content').innerHTML=`<div class="drawer-top"><span>${icon(categoryIcon(entry.category))}${esc(c.title)}</span><button class="icon-button" id="close-detail" aria-label="Закрыть карточку">${icon('close')}</button></div>
      <div class="detail-visual ${entry.imageInfo?.width>256?'detail-landscape':''}" style="--card-accent:${color(entry.category)}">${imageHTML(entry,true)}<span class="detail-rune">✦</span></div>
      <div class="detail-body"><div class="section-kicker">${esc(c.namespace)}</div><h2>${esc(command?entry.id:entry.name||'Название не указано')}</h2><div class="detail-id">${command?'Команда':'Идентификатор'} <b>${esc(entry.id)}</b>${entry.boss?'<span class="boss-label">БОСС</span>':''}</div>
      <div class="detail-actions"><button class="primary-button" id="detail-copy">${icon('copy')} ${command?'Скопировать команду':'Скопировать ID'}</button><button class="secondary-button" id="detail-favorite"></button></div>
      ${gmHTML(entry)}
      <div id="item-description-slot">${descriptionHTML(entry)}</div>
      <div class="detail-fields"><h3>${command?'Описание и параметры':'Характеристики'}</h3><dl>${Object.entries(entry.fields).map(([key,value])=>`<div><dt>${esc(displayLabel(key))}</dt><dd>${esc(displayField(key,value))}</dd></div>`).join('')}</dl></div>
      ${!command?`<section class="image-editor"><h3>Изображение</h3><p>${entry.customImage?'Твоё изображение сохранено в локальном каталоге.':entry.image?esc(entry.imageInfo?.kind||'Изображение из клиента игры'):'Штатное изображение не найдено. Можно добавить своё.'}</p><label class="upload-button" id="upload-zone">${icon('upload')}<span>${entry.image?'Заменить изображение':'Добавить изображение'}<small>PNG, JPG, WebP · до 8 МБ</small></span><input type="file" id="upload-image" accept="image/png,image/jpeg,image/webp"></label>${entry.customImage?'<button class="text-button" id="reset-image">Вернуть исходное изображение</button>':''}<div class="upload-status" id="upload-status" aria-live="polite"></div></section>`:''}
      <div class="source-note"><span>ИСТОЧНИК</span><code>${esc(c.source)}${entry.sourceRow?' · строка '+entry.sourceRow:''}</code>${c.note?`<p>${esc(c.note)}</p>`:''}${entry.imageInfo?.path?`<p class="asset-path">${esc(entry.imageInfo.client)} · ${esc(entry.imageInfo.path)}</p>`:''}</div></div>`;
    updateDetailFavorite(); $('#detail-drawer').hidden=false; $('#drawer-shade').hidden=false; document.body.classList.add('drawer-open'); $('#detail-drawer').scrollTop=0; $('#close-detail').focus();
    $('#close-detail').onclick=()=>closeDetail(); $('#detail-copy').onclick=()=>copy(command?(entry.fields['Пример']||entry.fields['Параметры']||entry.id):entry.id); $('#detail-favorite').onclick=()=>toggleFavorite(entry.uid);
    if(!command) {
      $('#upload-image').onchange=event=>uploadImage(event.target.files[0]);
      const zone=$('#upload-zone'); zone.ondragover=event=>{event.preventDefault();zone.classList.add('dragging');}; zone.ondragleave=()=>zone.classList.remove('dragging'); zone.ondrop=event=>{event.preventDefault();zone.classList.remove('dragging');uploadImage(event.dataTransfer.files[0]);};
      if($('#reset-image'))$('#reset-image').onclick=async()=>{try {await api('/api/image/'+encodeURIComponent(entry.uid),{method:'DELETE',headers:{'X-BOI-Local':'1'}});await openDetail(entry.uid);loadEntries();notify('Исходное изображение восстановлено');}catch(error){notify(error.message);}};
    }
  }catch(error){notify(error.message);}
}
function closeDetail(updateURL=true) { if($('#detail-drawer').hidden)return; $('#detail-drawer').hidden=true; $('#drawer-shade').hidden=true; document.body.classList.remove('drawer-open'); selectedEntry=null; if(updateURL)history.replaceState(null,'','#'+state.category); lastFocus?.focus?.(); }
async function uploadImage(file) {
  if(!file)return;
  if(file.size>8*1024*1024){notify('Максимальный размер — 8 МБ');return;}
  const uid=selectedEntry.uid; $('#upload-status').textContent='Сохраняю изображение…';
  try {await api('/api/image/'+encodeURIComponent(uid),{method:'POST',headers:{'X-BOI-Local':'1','Content-Type':'application/octet-stream'},body:file});await openDetail(uid);loadEntries();notify('Изображение добавлено');}catch(error){$('#upload-status').textContent=error.message;}
}
function resetFilters() { state.images=false;state.boss=false;state.min='';state.max='';state.sort='default';state.classId='';state.includeShared=true;state.page=1;$('#min-level').value='';$('#max-level').value='';$('#sort').value='default';updateHeader();loadEntries(); }

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-copy],[data-favorite],[data-open],[data-page],[data-category],[data-retry],[data-empty-reset],[data-description-lang]'); if(!button)return;
  if(button.hasAttribute('data-copy'))copy(button.dataset.copy);
  else if(button.hasAttribute('data-favorite'))toggleFavorite(button.dataset.favorite);
  else if(button.hasAttribute('data-open'))openDetail(button.dataset.open);
  else if(button.hasAttribute('data-page')&&!button.disabled){state.page=Number(button.dataset.page);loadEntries(true);}
  else if(button.hasAttribute('data-category')){state.images=button.hasAttribute('data-show-images');if(state.category===button.dataset.category){updateHeader();loadEntries(true);}else location.hash=button.dataset.category;}
  else if(button.hasAttribute('data-retry'))loadEntries();
  else if(button.hasAttribute('data-empty-reset')){if(state.category==='favorites')location.hash='all';else{state.q='';$('#search').value='';resetFilters();}}
  else if(button.hasAttribute('data-description-lang')&&selectedEntry){descriptionLanguage=button.dataset.descriptionLang;localStorage.setItem('boi-atlas-description-language',descriptionLanguage);$('#item-description-slot').innerHTML=descriptionHTML(selectedEntry);$('#item-description-slot').querySelector(`[data-description-lang="${descriptionLanguage}"]`)?.focus();}
});
document.addEventListener('error',event=>{if(event.target.matches?.('[data-image-fallback]')){const img=event.target;img.outerHTML=`<span class="image-placeholder">${icon('image')}</span>`;}},true);
document.addEventListener('input',event=>{
  const input=event.target.closest('[data-gm-quantity]');if(!input||!selectedEntry?.gm)return;
  const index=Number(input.dataset.gmQuantity),value=Number(input.value),valid=/^\d+$/.test(input.value)&&Number.isSafeInteger(value)&&value>0&&value<=2147483647;
  const button=$(`[data-gm-copy="${index}"]`),error=$(`[data-gm-error="${index}"]`);
  button.disabled=!valid;input.setAttribute('aria-invalid',String(!valid));error.hidden=valid;
  if(valid){const command=selectedEntry.gm.actions[index].command.replace(/ \d+$/,' '+value);$(`[data-gm-code="${index}"]`).textContent=command;button.dataset.copy=command;button.setAttribute('aria-label','Скопировать команду '+command);}
});
$('#drawer-shade').onclick=()=>closeDetail();
document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#search').focus();}
  if(event.key==='Escape'){closeDetail();$('#sidebar').classList.remove('open');$('#mobile-shade').classList.remove('open');}
  if(event.key==='Tab'&&!$('#detail-drawer').hidden){const focusable=[...$('#detail-drawer').querySelectorAll('button,a,input,[tabindex="0"]')].filter(el=>!el.disabled); const first=focusable[0],last=focusable.at(-1); if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
$('#search').oninput=()=>{clearTimeout(debounce);debounce=setTimeout(()=>{state.q=$('#search').value.trim();state.page=1;updateHeader();loadEntries();},180);};
$('#filter-toggle').onclick=()=>{const open=$('#filter-panel').hidden;$('#filter-panel').hidden=!open;$('#filter-toggle').setAttribute('aria-expanded',String(open));};
$('#images-only').onclick=()=>{state.images=!state.images;state.page=1;updateHeader();loadEntries();};
$('#boss-only').onclick=()=>{state.boss=!state.boss;state.page=1;updateHeader();loadEntries();};
$('#class-filter').onchange=event=>{state.classId=event.target.value;state.page=1;updateHeader();loadEntries();};
$('#include-shared').onchange=event=>{state.includeShared=event.target.checked;state.page=1;updateHeader();loadEntries();};
for(const [id,key] of [['min-level','min'],['max-level','max'],['sort','sort']])$('#'+id).onchange=()=>{state[key]=$('#'+id).value;state.page=1;updateHeader();loadEntries();};
$('#reset-filters').onclick=resetFilters;
for(const type of ['grid','list'])$('#'+type+'-view').onclick=()=>{view=type;localStorage.setItem('boi-atlas-view',type);renderResults(currentItems);};
$('#explore').onclick=()=>{location.hash='all';$('.catalog-section').scrollIntoView({behavior:'smooth',block:'start'});};
$('#mobile-menu').onclick=()=>{$('#sidebar').classList.add('open');$('#mobile-shade').classList.add('open');};
$('#mobile-shade').onclick=()=>{$('#sidebar').classList.remove('open');$('#mobile-shade').classList.remove('open');};
$('#search-icon').innerHTML=icon('search');$('#filter-icon').innerHTML=icon('filter');$('#grid-view').innerHTML=icon('grid');$('#list-view').innerHTML=icon('list');$('#mobile-menu').innerHTML=icon('menu');
async function init() {
  try {meta=await api('/api/meta');categories=new Map(meta.categories.map(c=>[c.key,c]));$('#class-filter').innerHTML='<option value="">Любой класс</option>'+meta.classes.map(c=>`<option value="${esc(c.id)}">${esc(c.label)} · ${esc(c.name)}</option>`).join('')+'<option value="shared">Общие для всех классов</option>';renderStats();if(meta.hero)$('#hero-art').style.backgroundImage=`url("${meta.hero}")`;$('#hero-count').textContent=`${meta.categories.length-1} категорий · ${format(meta.total-169)} записей`;window.addEventListener('hashchange',applyRoute);applyRoute();}
  catch(error){$('#results').innerHTML=`<div class="empty-state"><h3>Не удалось подключиться к каталогу</h3><p>Запусти Open-BOI-Catalog.cmd и обнови страницу.</p></div>`;$('#collection-meta').textContent=error.message;}
}
init();
