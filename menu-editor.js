/* AOZORA menu customization v1.7.3: pointer drag reorder (touch/mouse/pen), device-local settings */
(function(){
'use strict';
const KEY='aozora_menu_layout_v172';
const items=[['home','ホーム','⌂'],['vehicles','車両','🚗'],['shaken','車検証','📷'],['parts','部品','⚙'],['catalog','部品検索','🌍'],['jobs','見積','▤'],['details','明細','☷'],['orders','発注','▣'],['decision','修理支援','⚖'],['insights','分析','▥'],['settings','設定','⚙']];
const defaults=items.map(x=>x[0]);
let layout=load(), editing=false;
function load(){try{const a=JSON.parse(localStorage.getItem(KEY));if(a&&Array.isArray(a.order)&&Array.isArray(a.hidden))return {order:[...new Set([...a.order.filter(id=>defaults.includes(id)),...defaults])],hidden:a.hidden.filter(id=>defaults.includes(id)&&id!=='home')};}catch(e){}return {order:[...defaults],hidden:[]};}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(layout))}catch(e){alert('メニュー設定を保存できませんでした')} }
function safeId(id){return defaults.includes(id)?id:'home'}
function paint(){const nav=document.getElementById('nav');if(!nav)return;
nav.innerHTML=layout.order.filter(id=>!layout.hidden.includes(id)).map(id=>{const x=items.find(v=>v[0]===id);return `<button type="button" class="${tab===id?'active':''}" onclick="go('${id}')"><span style="display:block;font-size:18px">${x[2]}</span>${x[1]}</button>`}).join('');
let editBtn=document.getElementById('menu-edit-trigger');if(!editBtn){editBtn=document.createElement('button');editBtn.id='menu-edit-trigger';editBtn.type='button';editBtn.textContent='☰ メニュー編集';editBtn.onclick=()=>{editing=!editing;paint()};document.body.appendChild(editBtn)}editBtn.setAttribute('aria-expanded',String(editing));
let panel=document.getElementById('menu-editor');if(!panel){panel=document.createElement('section');panel.id='menu-editor';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','メニュー編集');document.body.appendChild(panel)}
panel.hidden=!editing;if(editing){panel.innerHTML=`<div class="menu-edit-head"><strong>メニューの並び替え・表示設定</strong><button type="button" onclick="menuClose()">閉じる ✕</button></div><p>右の「⠿」を長押しして上下にドラッグ。チェックを外すと非表示にできます。</p><div id="menu-sort-list">${layout.order.map(id=>{const x=items.find(v=>v[0]===id);return `<div class="menu-edit-row" data-menu-id="${id}"><label><input type="checkbox" ${!layout.hidden.includes(id)?'checked':''} ${id==='home'?'disabled':''} onchange="menuToggle('${id}',this.checked)"> ${x[2]} ${x[1]}</label><button type="button" class="menu-drag-handle" aria-label="${x[1]}をドラッグして並び替え" title="ドラッグして移動">⠿</button></div>`}).join('')}</div><button type="button" class="menu-reset" onclick="menuReset()">初期配置に戻す</button>`;bindDrag(panel);}

}

function bindDrag(panel){
 const list=panel.querySelector('#menu-sort-list');if(!list)return;
 let active=null;
 list.querySelectorAll('.menu-drag-handle').forEach(handle=>{
  handle.addEventListener('pointerdown',e=>{
   if(e.button!==0&&e.pointerType==='mouse')return;
   const row=handle.closest('.menu-edit-row');if(!row)return;
   e.preventDefault();active={id:row.dataset.menuId,source:row,target:row,pointerId:e.pointerId};
   row.classList.add('menu-dragging');handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove',e=>{
   if(!active||active.pointerId!==e.pointerId)return;
   e.preventDefault();
   const rect=panel.getBoundingClientRect();if(e.clientY<rect.top+42)panel.scrollTop-=12;else if(e.clientY>rect.bottom-35)panel.scrollTop+=12;
   const row=document.elementFromPoint(e.clientX,e.clientY)?.closest('.menu-edit-row');
   if(!row||!list.contains(row))return;
   list.querySelectorAll('.menu-drop-target').forEach(el=>el.classList.remove('menu-drop-target'));
   row.classList.add('menu-drop-target');active.target=row;
  });
  function finish(e){
   if(!active||active.pointerId!==e.pointerId)return;
   const {id,target}=active;active.source.classList.remove('menu-dragging');
   list.querySelectorAll('.menu-drop-target').forEach(el=>el.classList.remove('menu-drop-target'));
   active=null;
   if(e.type==='pointercancel')return;
   const from=layout.order.indexOf(id),to=layout.order.indexOf(target.dataset.menuId);
   if(from<0||to<0||from===to)return;
   layout.order.splice(from,1);layout.order.splice(to,0,id);persist();paint();
  }
  handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
 });
}

window.menuMove=function(id,d){id=safeId(id);const i=layout.order.indexOf(id),j=i+d;if(i<0||j<0||j>=layout.order.length)return;[layout.order[i],layout.order[j]]=[layout.order[j],layout.order[i]];persist();paint()};
window.menuToggle=function(id,on){id=safeId(id);if(id==='home')return;layout.hidden=on?layout.hidden.filter(x=>x!==id):[...new Set([...layout.hidden,id])];persist();paint()};
window.menuReset=function(){if(!confirm('メニューの順番と表示設定を初期状態に戻しますか？'))return;layout={order:[...defaults],hidden:[]};persist();paint()};
window.menuClose=function(){editing=false;paint()};
const previous=render;render=function(){previous();paint()};paint();
})();
