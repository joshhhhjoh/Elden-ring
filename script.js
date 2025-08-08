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
document.querySelectorAll('[data-copy]').forEach(btn=>{ btn.type='button'; btn.dataset.original=btn.textContent; btn.addEventListener('click',()=>{ const el=document.querySelector(btn.getAttribute('data-copy')); if(!el) return; copyText(el.textContent,()=>{ btn.textContent='Copied!'; if(window.__showToast) window.__showToast('Copied to clipboard'); setTimeout(()=>btn.textContent=btn.dataset.original||'Copy',1200); }); }); });

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


// ------ Progress bar ------
(function(){
  const bar = document.getElementById('progressbar');
  function setBar(){
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', setBar, {passive:true});
  window.addEventListener('resize', setBar);
  setBar();
})();

// ------ Persist <details> and checkboxes ------
(function(){
  const LS = window.localStorage;
  // Persist details state (needs an id to persist uniquely)
  document.querySelectorAll('details').forEach(d => {
    const id = d.id || ('details-' + Array.from(document.querySelectorAll('details')).indexOf(d));
    const key = 'open:' + id;
    const saved = LS.getItem(key);
    if (saved !== null) d.open = saved === '1';
    d.addEventListener('toggle', () => LS.setItem(key, d.open ? '1' : '0'));
  });
  // Persist checkboxes
  document.querySelectorAll('input[type="checkbox"][id]').forEach(cb => {
    const key = 'cb:' + cb.id;
    const saved = LS.getItem(key);
    if (saved !== null) cb.checked = saved === '1';
    cb.addEventListener('change', () => LS.setItem(key, cb.checked ? '1' : '0'));
  });
})();

// ------ Copy buttons for .kbd and code blocks ------
(function(){
  function attachCopy(el, getText){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn ghost copy-mini';
    btn.style.padding = '4px 8px';
    btn.style.fontSize = '12px';
    btn.style.marginLeft = '8px';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const text = getText();
      if(navigator.clipboard?.writeText){
        navigator.clipboard.writeText(text).then(()=>{
          const t = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(()=>btn.textContent=t, 1000);
        });
      }else{
        const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
    });
    el.insertAdjacentElement('afterend', btn);
  }
  document.querySelectorAll('.kbd').forEach(k => attachCopy(k, () => k.textContent.trim()));
  document.querySelectorAll('pre code').forEach(code => attachCopy(code, () => code.textContent));
})();

// ------ Command palette (search) ------
(function(){
  const modal = document.getElementById('cmdk');
  const input = document.getElementById('cmdk-input');
  const list = document.getElementById('cmdk-list');
  if(!modal || !input || !list) return;

  const links = Array.from(document.querySelectorAll('.side .nav a[href^="#"]')).map(a => ({
    text: a.textContent.trim(),
    href: a.getAttribute('href')
  }));

  function render(options){
    list.innerHTML = '';
    options.forEach((opt, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.textContent = opt.text;
      li.dataset.href = opt.href;
      if(i === 0) li.setAttribute('aria-selected', 'true');
      list.appendChild(li);
    });
  }
  function open(){
    modal.hidden = false;
    input.value = '';
    render(links);
    input.focus();
  }
  function close(){
    modal.hidden = true;
  }

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
      e.preventDefault();
      if (modal.hidden) open(); else close();
    } else if (e.key === 'Escape' && !modal.hidden) {
      close();
    }
  });

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    const filtered = links.filter(l => l.text.toLowerCase().includes(q));
    render(filtered.length ? filtered : [{text:'No matches', href:'#'}]);
  });

  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('li');
    if(!li) return;
    list.querySelectorAll('li[aria-selected="true"]').forEach(n => n.setAttribute('aria-selected','false'));
    li.setAttribute('aria-selected','true');
  });

  function activateSelected(){
    const active = list.querySelector('li[aria-selected="true"]');
    if(!active) return;
    const href = active.dataset.href;
    if(href && href.startsWith('#')){
      close();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if(el){
        const y = window.pageYOffset + el.getBoundingClientRect().top - (document.querySelector('header .wrap')?.getBoundingClientRect().height || 64) - 12;
        window.scrollTo({top:y, behavior:'smooth'});
      }
    }
  }

  input.addEventListener('keydown', (e) => {
    const items = Array.from(list.querySelectorAll('li'));
    const idx = items.findIndex(li => li.getAttribute('aria-selected') === 'true');
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      const next = items[Math.min(idx+1, items.length-1)];
      if(next){ items.forEach(li=>li.setAttribute('aria-selected','false')); next.setAttribute('aria-selected','true'); }
    }else if(e.key === 'ArrowUp'){
      e.preventDefault();
      const prev = items[Math.max(idx-1, 0)];
      if(prev){ items.forEach(li=>li.setAttribute('aria-selected','false')); prev.setAttribute('aria-selected','true'); }
    }else if(e.key === 'Enter'){
      e.preventDefault();
      activateSelected();
    }
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if(!li) return;
    list.querySelectorAll('li[aria-selected="true"]').forEach(n => n.setAttribute('aria-selected','false'));
    li.setAttribute('aria-selected','true');
    activateSelected();
  });
})();

// ------ Lazy-load images (if any) ------
(function(){
  document.querySelectorAll('img:not([loading])').forEach(img => img.setAttribute('loading','lazy'));
  document.querySelectorAll('img:not([decoding])').forEach(img => img.setAttribute('decoding','async'));
})();


// --- tiny toast helper ---
(function(){
  const toast = document.getElementById('toast');
  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    // trigger reflow to restart animation
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(()=>{
      toast.classList.remove('show');
      setTimeout(()=>{ toast.hidden = true; }, 180);
    }, 1200);
  }
  window.__showToast = showToast;
})();
