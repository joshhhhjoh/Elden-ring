/* Read-only preview that renders from saved localStorage data */
(function(){
  const LSK = 'J_GALLERY_V38';
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const title = document.getElementById('galleryTitle');

  let items = [];
  try{
    const raw = localStorage.getItem(LSK);
    if(raw){
      const obj = JSON.parse(raw);
      title.value = obj.title || 'J Gallery';
      items = (obj.items||[]).map(it => ({
        id: it.id,
        title: it.title||'',
        full: it.src||'',
        dataURL: it.src||''
      }));
    } else {
      title.value = 'J Gallery';
    }
  }catch{ title.value = 'J Gallery'; }

  items.sort((a,b)=> (a.order||0)-(b.order||0));

  function render(){
    grid.innerHTML = '';
    count.textContent = items.length + ' items';
    items.forEach((it, idx)=>{
      const li = document.createElement('li');
      li.className = 'card';
      const media = document.createElement('div');
      media.className = 'media';
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = it.dataURL || it.full;
      img.alt = it.title || ('Image '+(idx+1));
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', ()=>openViewerAt(idx));
      media.appendChild(img);
      li.appendChild(media);
      grid.appendChild(li);
    });
  }

  // --- Minimal viewer identical behavior ---
  const viewer = document.getElementById('viewer');
  const vImg = viewer.querySelector('.v-img');
  const vPrev = viewer.querySelector('.v-prev');
  const vNext = viewer.querySelector('.v-next');
  const vClose = viewer.querySelector('.v-close');
  const vCount = viewer.querySelector('.v-count');

  let viewIndex = -1;
  let scale=1, startScale=1, panX=0, panY=0, lastTouches=[], lastTapTime=0;
  let __justZoomedOnce=false, __swipedThisGesture=false;

  function resetZoom(){ scale=1; panX=panY=0; applyTransform(); }
  function applyTransform(){ if(scale===1){ vImg.style.transform='none'; } else { vImg.style.transform=`translate(${panX}px, ${panY}px) scale(${scale})`; } }
  function distance(t1,t2){ const dx=t2.clientX-t1.clientX, dy=t2.clientY-t1.clientY; return Math.hypot(dx,dy); }

  function openViewerAt(idx){
    if(!items.length) return;
    viewIndex = (idx + items.length) % items.length;
    const it = items[viewIndex];
    vImg.src = it.full || it.dataURL || '';
    vCount.textContent = (viewIndex+1)+' / '+items.length;
    resetZoom();
    viewer.classList.add('on','show');
    viewer.setAttribute('aria-hidden','false');
  }
  function closeViewer(){ viewer.classList.remove('on','show'); viewer.setAttribute('aria-hidden','true'); viewIndex=-1; }
  function next(){ if(!items.length) return; openViewerAt(viewIndex+1); }
  function prev(){ if(!items.length) return; openViewerAt(viewIndex-1); }

  vNext.onclick = next;
  vPrev.onclick = prev;
  vClose.onclick = closeViewer;

  document.addEventListener('keydown', (e)=>{
    if(!viewer.classList.contains('on')) return;
    if(e.key==='ArrowRight') next();
    else if(e.key==='ArrowLeft') prev();
    else if(e.key==='Escape') closeViewer();
  });

  viewer.addEventListener('touchstart', onTouchStart, {passive:false});
  viewer.addEventListener('touchmove', onTouchMove, {passive:false});
  viewer.addEventListener('touchend', onTouchEnd, {passive:false});

  function onTouchStart(e){
    if(!viewer.classList.contains('on')) return;
    __swipedThisGesture=false;
    if(e.touches.length===1){
      const now=Date.now();
      if(now-lastTapTime<300){
        e.preventDefault();
        scale=(scale>1)?1:2.0;
        panX=panY=0;
        applyTransform();
        __justZoomedOnce=true;
        setTimeout(()=>{ __justZoomedOnce=false; }, 250);
      }
      lastTapTime=now;
      lastTouches=[e.touches[0]];
    } else if(e.touches.length===2){
      e.preventDefault();
      lastTouches=[e.touches[0], e.touches[1]];
      startScale=scale;
    }
  }
  function onTouchMove(e){
    if(!viewer.classList.contains('on')) return;
    if(e.touches.length===2){
      e.preventDefault();
      const [t1,t2]=[e.touches[0], e.touches[1]];
      const [p1,p2]=lastTouches;
      const ds=distance(t1,t2)/distance(p1,p2);
      scale=Math.min(5, Math.max(1, startScale*ds));
      applyTransform();
    } else if(e.touches.length===1 && scale>1){
      e.preventDefault();
      const t=e.touches[0];
      const p=lastTouches[0]||t;
      panX += (t.clientX - p.clientX);
      panY += (t.clientY - p.clientY);
      lastTouches=[t];
      applyTransform();
    }
  }
  function onTouchEnd(e){
    if(!viewer.classList.contains('on')) return;
    if(!__swipedThisGesture && !__justZoomedOnce && scale===1 && e.changedTouches.length===1){
      const t=e.changedTouches[0];
      const last=lastTouches[0];
      if(last){
        const dx=t.clientX - last.clientX;
        if(Math.abs(dx)>40){
          __swipedThisGesture=true;
          if(dx<0) next(); else prev();
        }
      }
    }
    lastTouches=[];
  }

  render();
})();
