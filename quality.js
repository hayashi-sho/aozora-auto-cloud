'use strict';
// v1.4: read-only integrity checks and CSV exports. No AI or external APIs.
let qualityView='overview';
const qEsc=esc;
function qIssues(){
 const issues=[], ids=(a)=>new Set(a.map(x=>x.id));
 const parts=ids(state.parts), jobs=ids(state.jobs);
 for(const o of flow.orders){
  if(o.job&&!jobs.has(o.job))issues.push({level:'error',text:`発注 ${o.number||o.id}: 案件が存在しません`});
  for(const l of o.lines||[]){
   if(l.part&&!parts.has(l.part))issues.push({level:'error',text:`発注 ${o.number||o.id}: 部品台帳に存在しない部品があります`});
   for(const key of ['qty','received','allocated','used']){
    if(!Number.isFinite(Number(l[key]))||Number(l[key])<0)issues.push({level:'error',text:`発注 ${o.number||o.id}: ${key}の数値が不正です`});
   }
   if(Number(l.received)>Number(l.qty))issues.push({level:'warning',text:`発注 ${o.number||o.id}: 入荷数量が発注数量を超えています`});
   if(Number(l.used)>Number(l.allocated))issues.push({level:'warning',text:`発注 ${o.number||o.id}: 使用数量が引当数量を超えています`});
   if(Number(l.allocated)>Number(l.received))issues.push({level:'warning',text:`発注 ${o.number||o.id}: 引当数量が入荷数量を超えています`});
  }
 }
 for(const p of state.parts){
  if(fstock(p.id)<0)issues.push({level:'error',text:`${p.name}: 計算上の実在庫がマイナスです`});
  if(ffree(p.id)<0)issues.push({level:'warning',text:`${p.name}: 引当数が実在庫を超えています`});
 }
 for(const m of flow.movements)if(m.part&&!parts.has(m.part))issues.push({level:'error',text:'在庫移動履歴に削除済み部品があります'});
 return issues;
}
function qCSV(rows,filename){
 const quote=v=>{let t=String(v??'');if(/^[\s]*[=+@\-]/.test(t)&&!/^\s*-?\d+(\.\d+)?\s*$/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'};
 const csv='\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n');
 download(filename,csv,'text/csv;charset=utf-8');
}
function qExportStock(){
 qCSV([['品番','部品名','初期在庫','移動増減','実在庫','引当中','使用可能','棚番'],...state.parts.map(p=>[
 p.number||'',p.name||'',p.stock||0,
 flow.movements.filter(m=>m.part===p.id).reduce((s,m)=>s+Number(m.qty||0),0),
 fstock(p.id),freserved(p.id),ffree(p.id),p.shelf||''
 ])],'AOZORA_在庫照合_'+fd()+'.csv');
}
function qExportOrders(){
 const rows=[['発注番号','発注日','案件','仕入先','品番','部品名','発注数','入荷数','引当数','使用数','仕入単価','未入荷数']];
 for(const o of flow.orders)for(const l of o.lines||[])rows.push([
 o.number||'',o.date||'',fj(o.job)?.name||'',supplier(o.supplier)?.name||'',
 l.number||'',fp(l.part)?.name||l.name||'',l.qty,l.received,l.allocated,l.used,l.cost,
 Math.max(0,Number(l.qty||0)-Number(l.received||0))
 ]);
 qCSV(rows,'AOZORA_発注進捗_'+fd()+'.csv');
}
function qScreen(){
 const issues=qIssues(), waiting=flow.orders.reduce((n,o)=>n+(o.lines||[]).filter(l=>Number(l.received)<Number(l.qty)).length,0);
 const negative=state.parts.filter(p=>ffree(p.id)<0).length;
 return `<section class="panel"><h2>業務品質チェック v1.4</h2><p class="foot">保存データの不整合を検出する補助機能です。法令・税務適合や安全性を保証するものではありません。</p>
 <div class="grid"><div class="item"><strong>${state.jobs.length}</strong><small>登録案件</small></div><div class="item"><strong>${waiting}</strong><small>未入荷の発注明細</small></div><div class="item"><strong>${negative}</strong><small>引当超過部品</small></div><div class="item"><strong>${issues.length}</strong><small>要確認事項</small></div></div></section>
 <section class="panel"><h2>整合性チェック結果</h2>${issues.length?issues.map(x=>`<div class="item"><strong>${x.level==='error'?'要修正':'要確認'}</strong><p>${qEsc(x.text)}</p></div>`).join(''):'<p class="empty">現在のチェック項目では問題が見つかりませんでした。</p>'}<p class="foot">これは限定的な自動チェックです。入庫・修理・請求の正確性は別途確認してください。</p></section>
 <section class="panel"><h2>現場用CSV出力</h2><button class="full" onclick="qExportStock()">在庫・引当一覧CSV</button><button class="secondary full" onclick="qExportOrders()">発注・入荷進捗CSV</button><p class="foot">iPhoneの「ファイル」に保存し、Excelなどで開けます。</p></section>
 <section class="panel"><h2>データ保護</h2><button class="full" onclick="fbackup()">統合バックアップJSON</button><p class="foot">ブラウザの保存データは端末や設定によって消える場合があります。業務利用前・更新前に必ずバックアップしてください。</p></section>`;
}
const qRenderOld=render;
render=function(){
 if(tab==='quality'){
  $('app').innerHTML=qScreen();
  $('nav').innerHTML=`<button onclick="go('home')">⌂ ホーム</button><button onclick="go('jobs')">▤ 見積</button><button onclick="go('flow')">⇄ 連動</button><button class="active" onclick="go('quality')">✓ 品質</button>`;
  return;
 }
 qRenderOld();
 const nav=$('nav');
 if(nav&&!nav.querySelector('[data-quality]'))nav.insertAdjacentHTML('beforeend',`<button data-quality onclick="go('quality')">✓ 品質</button>`);
};
render();
