
// ====== REAPER Intro Logic ======
(function(){
  const intro = document.getElementById('intro');
  const app = document.getElementById('app');
  if(!intro || !app) return;

  const term = document.getElementById('term');
  const caret = document.getElementById('caret');
  const reaper = document.getElementById('reaperTitle');
  const slashWrap = document.getElementById('slashWrap');
  const soundBtn = document.getElementById('soundOn');
  const skipBtn = document.getElementById('skipIntro');
  const replayBtn = document.getElementById('replayIntro');

  // WebAudio (gesture-gated)
  let audioReady=false, AC, master;
  function initAudio(){
    if(audioReady) return;
    try {
      AC = new (window.AudioContext||window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value=0.6; master.connect(AC.destination);
      audioReady = true;
    } catch(e){ console.warn('Audio init failed', e); }
  }
  function noiseBurst(freq=800, dur=0.5){
    if(!audioReady) return;
    const bufferSize = Math.floor(AC.sampleRate * dur);
    const buffer = AC.createBuffer(1, bufferSize, AC.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){ data[i] = (Math.random()*2-1) * (1 - i/bufferSize); }
    const src = AC.createBufferSource(); src.buffer = buffer;
    const filter = AC.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=freq;
    const gain = AC.createGain(); gain.gain.value=0.0;
    src.connect(filter); filter.connect(gain); gain.connect(master);
    const t = AC.currentTime;
    gain.gain.linearRampToValueAtTime(0.9, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.start(); src.stop(t + dur + 0.05);
  }
  function blip(f=900){
    if(!audioReady) return;
    const o=AC.createOscillator(), g=AC.createGain();
    o.type='triangle'; o.frequency.value=f; g.gain.value=0;
    o.connect(g); g.connect(master);
    const t=AC.currentTime;
    g.gain.linearRampToValueAtTime(0.35, t+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.15);
    o.frequency.exponentialRampToValueAtTime(240, t+0.15);
    o.start(t); o.stop(t+0.16);
  }

  // Typing
  const lines = [
    'linking /dev/input -> tty0 … ok',
    'spinning up recon modules … ok',
    'attaching debugger: eldenring.exe … ok',
    'loading tables: ItemGib, AddSoul … ok',
    'verifying offline mode … ok',
    'deploying payload …',
    '',
    'echo REAPER'
  ];

  let timers = [];
  function typeLine(text, delay=20){
    return new Promise(resolve=>{
      let i=0;
      function tick(){
        if(i<text.length){
          term.textContent += text[i++];
          blip(700+Math.random()*200);
          timers.push(setTimeout(tick, delay * (0.6 + Math.random()*0.8)));
        } else resolve();
      }
      tick();
    });
  }
  function newline(){ term.textContent += '\\n'; }

  function showReaper(){
    reaper.style.opacity = '1';
    reaper.style.transform = 'scale(1)';
    noiseBurst(1200, 0.6);
  }

  function doSlash(){
    slashWrap.classList.add('active');
    noiseBurst(600, 0.8);
  }

  function revealApp(){
    intro.classList.add('hidden');
    setTimeout(()=>{
      app.classList.add('show');
      document.body.style.overflow='auto';
      replayBtn.disabled=false;
    }, 500);
  }

  async function runIntro(){
    // reset
    term.textContent=''; reaper.style.opacity='0'; reaper.style.transform='scale(.95)';
    slashWrap.classList.remove('active');
    intro.classList.remove('hidden');
    app.classList.remove('show'); app.classList.add('hidden');
    document.body.style.overflow='hidden';
    timers.forEach(t=>clearTimeout(timers)); timers=[];

    // sequence
    await new Promise(r=>setTimeout(r,120));
    for(const ln of lines){
      await typeLine(ln);
      newline();
      await new Promise(r=>setTimeout(r, ln ? 140 : 240));
    }
    showReaper();
    await new Promise(r=>setTimeout(r, 600));
    doSlash();
    await new Promise(r=>setTimeout(r, 500));
    revealApp();
  }

  // Controls
  soundBtn?.addEventListener('click', async ()=>{
    initAudio();
    if(AC && AC.state === 'suspended'){ await AC.resume(); }
    soundBtn.textContent = '🔊 Sound Ready';
    soundBtn.disabled = true;
  });
  skipBtn?.addEventListener('click', ()=>{
    showReaper(); doSlash(); revealApp();
  });
  replayBtn?.addEventListener('click', ()=>{
    runIntro();
  });

  // Start on load
  window.addEventListener('load', ()=>{
    runIntro();
  });

})(); // end intro IIFE


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


// ---- Export to TXT (steps + sources) ----
(function(){
  const btn = document.getElementById('exportTXT');
  if(!btn) return;

  function clean(t){ return (t||'').replace(/\s+/g,' ').trim(); }

  function collectText(){
    let out = [];
    const cards = document.querySelectorAll('main .card');
    cards.forEach(card => {
      const title = clean(card.querySelector('h2')?.textContent || '');
      if(title){ out.push(title); out.push(''.padEnd(title.length, '=')); }
      // Steps in .step blocks
      card.querySelectorAll('.step').forEach(step => {
        const num = clean(step.querySelector('.num')?.textContent || '');
        const body = clean(step.textContent.replace(num,'') || '');
        if(body) out.push(`- ${num?num+'. ':''}${body}`);
      });
      // Ordered/unordered lists inside details or sections
      card.querySelectorAll('ol, ul').forEach(list => {
        list.querySelectorAll('li').forEach(li => {
          const txt = clean(li.textContent);
          if(txt) out.push(`- ${txt}`);
        });
      });
      // Callouts
      card.querySelectorAll('.callout').forEach(el => {
        const txt = clean(el.textContent);
        if(txt) out.push(`NOTE: ${txt}`);
      });
      out.push(''); // blank line between cards
    });

    // Sources (unique external links)
    const links = Array.from(document.querySelectorAll('a[href^="http://"], a[href^="https://"]'));
    const seen = new Set();
    const src = [];
    links.forEach(a => {
      const href = a.getAttribute('href');
      if(!href || seen.has(href)) return;
      seen.add(href);
      const label = clean(a.textContent) || href;
      src.push(`- ${label} — ${href}`);
    });
    if(src.length){
      out.push('Sources');
      out.push('-------');
      out.push(...src);
      out.push('');
    }
    return out.join('\n');
  }

  function downloadTxt(filename, text){
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }

  btn.addEventListener('click', () => {
    const txt = collectText();
    const title = document.title.replace(/[^\w\-]+/g,'_').slice(0,60) || 'guide';
    downloadTxt(`${title}.txt`, txt);
    if(window.__showToast) window.__showToast('Downloaded TXT');
  });
})();


// Warning dismiss logic
(function(){
  const warn = document.querySelector('.warning');
  if(!warn) return;
  if(sessionStorage.getItem('warnDismissed') === 'true'){
    warn.style.display = 'none';
  }
  warn.addEventListener('click', () => {
    warn.style.display = 'none';
    sessionStorage.setItem('warnDismissed', 'true');
  });
})();
