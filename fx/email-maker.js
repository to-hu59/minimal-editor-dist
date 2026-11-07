/* Integration only; the supplied email editor's controls and design remain. */
(function(){
'use strict';const editor=document.getElementById('editor');let run=null;
const cancel=()=>{run?.cancel();run=null};const post=m=>parent.postMessage(m,location.origin==='null'?'*':location.origin);
document.getElementById('btn-test-anim').onclick=()=>{cancel();const target=[...editor.querySelectorAll('.email-container')].pop();if(!target){alert('エディタ内にメールがありません。');return}run=ProvidedEmailMotion.play(target,{sound:true})};
editor.addEventListener('beforeinput',cancel,true);document.getElementById('btn-insert-email').addEventListener('pointerdown',cancel);editor.addEventListener('pointerdown',e=>{if(e.target.closest('button'))cancel()},true);window.addEventListener('pagehide',cancel);
const current=()=>{cancel();return ProvidedEmail.editorSource(editor)};
document.getElementById('email-back').onclick=()=>{cancel();post({type:'fx-close'})};
document.getElementById('email-insert').onclick=()=>{try{post({type:'fx-insert',src:current()})}catch(e){alert(e.message)}};
document.getElementById('email-save').onclick=()=>{try{post({type:'fx-save',src:current()})}catch(e){alert(e.message)}};
let received=false;
window.addEventListener('message',e=>{if(e.source!==parent||(location.origin!=='null'&&e.origin!==location.origin))return;const d=e.data;if(!d||d.type!=='fx-make'||received)return;received=true;cancel();try{editor.innerHTML=ProvidedEmail.editorHTML(d.src||'')}catch(error){post({type:'fx-error',message:error.message})}});
if(parent!==window){document.getElementById('email-integration').hidden=false;post({type:'fx-ready'})}
})();
