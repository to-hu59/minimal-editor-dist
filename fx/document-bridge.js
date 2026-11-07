/* Adds only the provided document design; old letters and files keep their original renderer. */
(function(){
'use strict';
for(const kind of ['手紙','書類','メール']){
  const previous=BR[kind];
  BR[kind]=(attrs,lines)=>{
    if(attrs['見た目']!=='提供版')return previous(attrs,lines);
    try{
      const html=ProvidedDocument.parse('［'+kind+' 見た目=提供版'+(attrs['データ']?' データ='+attrs['データ']:'')+'］');
      return '<div class="blk ymdoc" data-fx="providedDocument">'+ProvidedDocument.rendered(html)+'</div>';
    }catch(e){return '<div class="blk"><p>文書を表示できません。元のデータは変更していません。</p><pre>'+esc(lines.join('\n'))+'</pre></div>'}
  };
}
D.providedDocument={
  prep(el){(el.querySelector('.email-container')?ProvidedEmailMotion:DocumentWriting).cancel(el.querySelector('.letter-container,.report-container,.email-container'))},
  still(el){(el.querySelector('.email-container')?ProvidedEmailMotion:DocumentWriting).cancel(el.querySelector('.letter-container,.report-container,.email-container'))},
  async run(el,a,c){const target=el.querySelector('.letter-container,.report-container,.email-container');if(!target)return;const run=(target.matches('.email-container')?ProvidedEmailMotion:DocumentWriting).play(target,{sound:!S.pvMute});c.on(()=>run.cancel());await run.promise;}
};
window.ProvidedDocumentBridge=true;
})();
