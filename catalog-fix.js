/* Visible catalogue entry point, independent of saved menu visibility. */
(function(){'use strict';
const previousRender=render;
render=function(){previousRender();if(tab!=='parts')return;const root=document.getElementById('app');if(!root||root.querySelector('#catalog-direct-link'))return;const section=document.createElement('section');section.id='catalog-direct-link';section.className='panel';section.innerHTML='<h2>🌍 輸入車・全メーカー部品検索</h2><p class="foot">メーカー・車種・VIN・純正品番を記録して検索します。純正カタログの自動取得は未対応です。</p><button type="button" class="full" id="catalog-open-button">🌍 外車の部品検索を開く</button>';root.insertBefore(section,root.firstChild);section.querySelector('button').addEventListener('click',()=>go('catalog'));};
render();
})();
