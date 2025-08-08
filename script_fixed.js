
const themeToggle = document.getElementById('themeToggle');
try { if(localStorage.getItem('er_theme')==='gold'){ document.body.classList.add('gold'); } } catch(e){}
if(themeToggle){
  themeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('gold');
    try { localStorage.setItem('er_theme', document.body.classList.contains('gold') ? 'gold' : 'mint'); } catch(e){}
  });
}
const exportBtn = document.getElementById('exportPDF');
if(exportBtn){ exportBtn.addEventListener('click', ()=>{ window.print(); }); }
function copyText(text, onOk){
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onOk).catch(()=>fallbackCopy(text,onOk));
  } else { fallbackCopy(text,onOk); }
}
function fallbackCopy(text,onOk){
  const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta);
  ta.select(); try{document.execCommand('copy');onOk();}catch(e){alert('Copy failed — long-press to copy.');}
  document.body.removeChild(ta);
}
document.querySelectorAll('[data-copy]').forEach(btn=>{
  btn.type='button'; btn.dataset.original=btn.textContent;
  btn.addEventListener('click', ()=>{
    const el=document.querySelector(btn.getAttribute('data-copy')); if(!el) return;
    copyText(el.textContent, ()=>{ btn.textContent='Copied!'; setTimeout(()=>btn.textContent=btn.dataset.original||'Copy',1200); });
  });
});
const meter=document.getElementById('meterbar');
const checks=['#c1','#c2','#c3','#l1','#l2','#l3'].map(sel=>document.querySelector(sel));
function updateMeter(){ const total=checks.filter(Boolean).length; const done=checks.filter(c=>c&&c.checked).length; const pct=total?Math.round(done/total*100):0; if(meter) meter.style.width=pct+'%'; }
checks.forEach(c=>c&&c.addEventListener('change',updateMeter)); updateMeter();
const warn=document.getElementById('warn'); const cleanSave=document.getElementById('cleanSave');
function updateWarn(){ if(!warn) return; warn.style.display=(cleanSave&&cleanSave.checked)?'none':'block'; }
if(cleanSave) cleanSave.addEventListener('change',updateWarn); updateWarn();
document.querySelectorAll('.tabs button').forEach(btn=>{
  btn.type='button';
  btn.addEventListener('click',e=>{
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const tab=e.currentTarget.getAttribute('data-tab');
    document.querySelectorAll('.tabcontent').forEach(tc=>tc.classList.toggle('active', tc.id===tab));
  });
});
let t=0,timer=null; const disp=document.getElementById('timerDisplay');
function renderTimer(){ if(!disp) return; const m=String(Math.floor(t/60)).padStart(2,'0'); const s=String(t%60).padStart(2,'0'); disp.textContent=m+':'+s; }
const startBtn=document.getElementById('startTimer'), pauseBtn=document.getElementById('pauseTimer'), resetBtn=document.getElementById('resetTimer');
if(startBtn) startBtn.addEventListener('click',()=>{ if(timer) return; timer=setInterval(()=>{ t++; renderTimer(); },1000); });
if(pauseBtn) pauseBtn.addEventListener('click',()=>{ clearInterval(timer); timer=null; });
if(resetBtn) resetBtn.addEventListener('click',()=>{ t=0; renderTimer(); });
renderTimer();


// Smooth scrolling with sticky offset fix
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const offset = document.querySelector('.sticky-nav')?.offsetHeight || 80;
            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
            });
        }
    });
});
