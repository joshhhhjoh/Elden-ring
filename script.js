/* J//Gallery v2.3 — iOS Photos picker compatibility */
(() => {
  if (!('crypto' in window) || !('randomUUID' in crypto)) {
    window.crypto = window.crypto || {};
    crypto.randomUUID = function() {
      const s = [], hex = '0123456789abcdef';
      for (let i=0;i<36;i++) s[i] = hex[Math.floor(Math.random()*16)];
      s[14] = '4';
      s[19] = hex[(parseInt(s[19],16)&0x3)|0x8];
      s[8]=s[13]=s[18]=s[23]='-';
      return s.join('');
    };
  }

  const KEY = "joshGalleryData";
  const grid = document.getElementById('grid');
  const tmpl = document.getElementById('cardTemplate');
  const uploadInput = document.getElementById('uploadInput');
  const dockUpload = document.getElementById('dockUpload');
  const importJson = document.getElementById('importJson');
  const count = document.getElementById('count');
  const search = document.getElementById('search');
  const exportBtn = document.getElementById('exportJson');
  const saveBtn = document.getElementById('saveLocal');
  const newBtn = document.getElementById('newGallery');
  const addUrl = document.getElementById('addUrl');
  const dockUrl = document.getElementById('dockUrl');
  const dockExport = document.getElementById('dockExport');
  const galleryTitle = document.getElementById('galleryTitle');
  const toggleEdit = document.getElementById('toggleEdit');

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lbTitle = document.getElementById('lightboxTitle');
  const lbDesc = document.getElementById('lightboxDesc');

  const exportDlg = document.getElementById('exportDlg');
  const exportText = document.getElementById('exportText');
  const copyBtn = document.getElementById('copyBtn');
  const downloadLink = document.getElementById('downloadLink');

  let editMode = false;
  let data = safeLoadLocal() || sampleData();
  document.getElementById('galleryTitle').value = data.title || "Gallery";
  render();

  toggleEdit.addEventListener('click', () => {
    editMode = !editMode;
    toggleEdit.textContent = `Edit: ${editMode ? 'On' : 'Off'}`;
    document.querySelectorAll('.card').forEach(card => card.classList.toggle('edit', editMode));
  });

  // Wire both file inputs (header & dock). Using inputs *inside buttons* so iOS shows Photos/Camera.
  [uploadInput, dockUpload].forEach(inp => {
    if (!inp) return;
    inp.addEventListener('change', async e => {
      const files = [...(e.target.files || [])];
      for (const file of files) {
        const src = await fileToDataURL(file);
        pushItem({ src, title: file.name.replace(/\.[^.]+$/, ''), desc: '', tags: [] });
      }
      e.target.value = "";
    });
  });

  importJson.addEventListener('change', async e => {
    try{
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const obj = JSON.parse(text);
      validate(obj);
      data = obj;
      document.getElementById('galleryTitle').value = data.title || "Gallery";
      render(); autosave();
      e.target.value = "";
      toast("Imported JSON");
    }catch(err){
      alert('Import failed: ' + err.message);
    }
  });

  function doExport(){
    const out = JSON.stringify(data, null, 2);
    exportText.value = out;
    const href = 'data:application/json;charset=utf-8,' + encodeURIComponent(out);
    downloadLink.href = href;
    downloadLink.download = (data.title || 'gallery') + '.json';
    if (exportDlg.showModal) exportDlg.showModal();
    else alert('Copy from the text area:\n\n' + out);
  }
  exportBtn.addEventListener('click', doExport);
  dockExport.addEventListener('click', doExport);
  copyBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    try{ await navigator.clipboard.writeText(exportText.value); toast('Copied'); }
    catch{ exportText.select(); document.execCommand('copy'); toast('Copied'); }
  });

  saveBtn.addEventListener('click', () => { safeSaveLocal(data); toast("Saved locally"); });
  newBtn.addEventListener('click', () => {
    if(!confirm("Start a new, empty gallery? You can re-import JSON later.")) return;
    data = { title: "New Gallery", items: [] };
    document.getElementById('galleryTitle').value = data.title;
    render(); autosave();
  });

  function askUrl(){
    const url = prompt('Paste image URL');
    if (!url) return;
    pushItem({ src: url.trim(), title: '', desc: '', tags: [] });
  }
  addUrl.addEventListener('click', askUrl);
  dockUrl.addEventListener('click', askUrl);

  search.addEventListener('input', render);
  document.getElementById('galleryTitle').addEventListener('input', () => { data.title = document.getElementById('galleryTitle').value; autosave(); });

  lightboxClose.addEventListener('click', () => lightbox.hidden = true);
  lightbox.addEventListener('click', (e) => { if(e.target === lightbox) lightbox.hidden = true; });

  function render(){
    grid.innerHTML = '';
    const q = search.value.trim().toLowerCase();
    const items = q ? data.items.filter(it => match(it, q)) : data.items;

    for (const item of items){
      const node = tmpl.content.firstElementChild.cloneNode(true);
      const img = node.querySelector('.thumb');
      const title = node.querySelector('.title');
      const desc = node.querySelector('.desc');
      const tags = node.querySelector('.tags');
      const remove = node.querySelector('.remove');
      const replaceBtn = node.querySelector('.replace');

      if (editMode) node.classList.add('edit');

      img.src = item.src;
      img.alt = item.title || "Image";
      img.onclick = () => openLightbox(item);

      title.value = item.title || '';
      desc.value = item.desc || '';
      tags.value = (item.tags || []).join(', ');

      title.oninput = () => { item.title = title.value; autosave(); updateLightboxIfOpen(item); };
      desc.oninput = () => { item.desc = desc.value; autosave(); updateLightboxIfOpen(item); };
      tags.oninput = () => { item.tags = splitTags(tags.value); autosave(); };

      remove.onclick = () => {
        if (!confirm('Remove this image?')) return;
        data.items = data.items.filter(x => x.id !== item.id);
        render(); autosave();
      };

      replaceBtn.onclick = () => {
        // create inline input in DOM (not programmatic click) for iOS compliance
        const inline = document.createElement('input');
        inline.type = 'file';
        inline.accept = 'image/*,image/heic,image/heif';
        inline.capture = 'environment';
        inline.style.position = 'fixed';
        inline.style.left = '-9999px';
        document.body.appendChild(inline);
        inline.onchange = async e => {
          const file = e.target.files?.[0];
          if (!file) { inline.remove(); return; }
          const src = await fileToDataURL(file);
          item.src = src; autosave(); render();
          inline.remove();
        };
        inline.click();
      };

      node.querySelector('.up').onclick = () => moveItem(item.id, -1);
      node.querySelector('.down').onclick = () => moveItem(item.id, +1);

      grid.appendChild(node);
    }
    count.textContent = `${items.length} / ${data.items.length}`;
  }

  function moveItem(id, delta){
    const idx = data.items.findIndex(it => it.id === id);
    if (idx < 0) return;
    const newIdx = Math.max(0, Math.min(data.items.length - 1, idx + delta));
    if (newIdx === idx) return;
    const [it] = data.items.splice(idx, 1);
    data.items.splice(newIdx, 0, it);
    autosave(); render();
  }

  function openLightbox(item){
    lightboxImg.src = item.src;
    lbTitle.textContent = item.title || '';
    lbDesc.textContent = item.desc || '';
    lightbox.hidden = false;
  }
  function updateLightboxIfOpen(item){
    if (lightbox.hidden) return;
    if (lightboxImg.src && lightboxImg.src === item.src){
      lbTitle.textContent = item.title || '';
      lbDesc.textContent = item.desc || '';
    }
  }

  function pushItem({src, title, desc, tags}){
    data.items.push({ id: crypto.randomUUID(), src, title, desc, tags });
    render(); autosave();
  }
  function match(it, q){
    const hay = [it.title||'', it.desc||'', ...(it.tags||[])].join(' ').toLowerCase();
    return hay.includes(q);
  }
  function splitTags(str){
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
  function fileToDataURL(file){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function validate(obj){
    if (typeof obj !== 'object' || !obj.items || !Array.isArray(obj.items)) throw new Error('Invalid shape: expected { title, items: [] }');
    for (const it of obj.items){
      if (typeof it.src !== 'string') throw new Error('Each item needs a string "src"');
      if (!it.id) it.id = crypto.randomUUID();
      it.tags = Array.isArray(it.tags) ? it.tags : [];
      it.title = it.title || '';
      it.desc = it.desc || '';
    }
    obj.title = obj.title || 'J//Gallery';
  }
  function safeLoadLocal(){ try{ const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }catch{ return null; } }
  function safeSaveLocal(obj){ try{ localStorage.setItem(KEY, JSON.stringify(obj)); }catch{} }
  function autosave(){ clearTimeout(autosave._t); autosave._t = setTimeout(() => safeSaveLocal(data), 250); }
  function toast(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.position='fixed'; el.style.bottom='84px'; el.style.right='16px';
    el.style.padding='10px 12px'; el.style.border='1px solid #2a2a2a';
    el.style.background='#141414'; el.style.borderRadius='10px'; el.style.color='#fff';
    el.style.opacity='0'; el.style.transition='opacity .2s, transform .2s'; el.style.transform='translateY(6px)';
    el.style.zIndex='60';
    document.body.appendChild(el);
    requestAnimationFrame(()=>{el.style.opacity='1'; el.style.transform='translateY(0)'});
    setTimeout(()=>{el.style.opacity='0'; el.style.transform='translateY(6px)'; setTimeout(()=>el.remove(),200)},1400);
  }
  function sampleData(){
    return {
      title: "J//Gallery",
      items: [
        { id: crypto.randomUUID(), src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60", title: "City Night", desc: "Demo image. Replace me.", tags: ["city","night"] },
        { id: crypto.randomUUID(), src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=60", title: "Portrait", desc: "Demo image. Replace me.", tags: ["portrait"] }
      ]
    };
  }
})();