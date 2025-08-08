// PDF
const exportBtn=document.getElementById('exportPDF');
if(exportBtn){exportBtn.addEventListener('click',()=>window.print());}

// Mobile menu
const menuBtn=document.getElementById('menuBtn');
const sidenav=document.querySelector('.side');
if(menuBtn && sidenav){
  menuBtn.addEventListener('click',()=>sidenav.classList.toggle('open'));
  sidenav.addEventListener('click',e=>{ if(e.target.matches('a')) sidenav.classList.remove('open'); });
}

// Smooth scroll with sticky offset
function headerOffset(){ const h=document.querySelector('header .wrap'); return (h?h.getBoundingClientRect().height:64)+12; }
function goTo(id){
  const el=document.getElementById(id);
  if(!el) return;
  const y=window.pageYOffset + el.getBoundingClientRect().top - headerOffset();
  window.scrollTo({top:y,behavior:'smooth'});
}
document.querySelectorAll('.side .nav a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{ e.preventDefault(); goTo(a.getAttribute('href').slice(1)); });
});

// Active section highlight
const navLinks=[...document.querySelectorAll('.side .nav a[href^="#"]')];
const sections=navLinks.map(a=>document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
const io=new IntersectionObserver((ents)=>{
  ents.forEach(ent=>{
    if(ent.isIntersecting){
      const id=ent.target.id;
      navLinks.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+id));
    }
  });
},{rootMargin:'-45% 0px -50% 0px',threshold:0.01});
sections.forEach(s=>io.observe(s));

// Back to Top
const toTop=document.getElementById('toTop');
function toggleTop(){ if(!toTop) return; const show=window.scrollY>400; toTop.classList.toggle('show',show); }
window.addEventListener('scroll',toggleTop,{passive:true});
if(toTop) toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
toggleTop();

// Copy + meter + warn + timer
function copyText(text,onOk){ if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(onOk).catch(()=>fallbackCopy(text,onOk));} else {fallbackCopy(text,onOk);} }
function fallbackCopy(text,onOk){ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); onOk();}catch(e){alert('Copy failed — long-press to copy.');} document.body.removeChild(ta); }
document.querySelectorAll('[data-copy]').forEach(btn=>{ btn.type='button'; btn.dataset.original=btn.textContent; btn.addEventListener('click',()=>{ const el=document.querySelector(btn.getAttribute('data-copy')); if(!el) return; copyText(el.textContent,()=>{ btn.textContent='Copied!'; setTimeout(()=>btn.textContent=btn.dataset.original||'Copy',1200); }); }); });

const meter=document.getElementById('meterbar');
const checks=['#c1','#c2','#c3','#l1','#l2','#l3'].map(sel=>document.querySelector(sel));
function updateMeter(){ const total=checks.filter(Boolean).length; const done=checks.filter(c=>c&&c.checked).length; const pct=total?Math.round(done/total*100):0; if(meter) meter.style.width=pct+'%'; }
checks.forEach(c=>c&&c.addEventListener('change',updateMeter)); updateMeter();

const warn=document.getElementById('warn'); const cleanSave=document.getElementById('cleanSave');
function updateWarn(){ if(!warn) return; warn.style.display=(cleanSave&&cleanSave.checked)?'none':'block'; }
if(cleanSave) cleanSave.addEventListener('change',updateWarn); updateWarn();

let t=0,timer=null; const disp=document.getElementById('timerDisplay');
function renderTimer(){ if(!disp) return; const m=String(Math.floor(t/60)).padStart(2,'0'); const s=String(t%60).padStart(2,'0'); disp.textContent=m+':'+s; }
const startBtn=document.getElementById('startTimer'), pauseBtn=document.getElementById('pauseTimer'), resetBtn=document.getElementById('resetTimer');
if(startBtn) startBtn.addEventListener('click',()=>{ if(timer) return; timer=setInterval(()=>{ t++; renderTimer(); },1000); });
if(pauseBtn) pauseBtn.addEventListener('click',()=>{ clearInterval(timer); timer=null; });
if(resetBtn) resetBtn.addEventListener('click',()=>{ t=0; renderTimer(); });
renderTimer();
