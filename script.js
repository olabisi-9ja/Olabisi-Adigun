const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;

window.addEventListener('load', () => {
  const curtain = document.getElementById('curtain');
  setTimeout(() => {
    curtain.classList.add('gone');
    document.getElementById('heroHeadline').classList.add('in');
    document.getElementById('heroPhoto').classList.add('in');
    
    const tagline = document.getElementById('heroTagline');
    if(tagline) tagline.classList.add('in');
    
    const metrics = document.querySelector('.hero-below');
    if(metrics) metrics.classList.add('in');
    
    document.getElementById('heroMeta').classList.add('in');
    setTimeout(() => curtain.remove(), 1100);
  }, 500);
});

// reveals
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// section counter
const mainSections = ['hero','products','client-work','now','journey','drafts','contact'];
const counterEl = document.getElementById('sectionCounter');
const secObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){
      const idx = mainSections.indexOf(e.target.id);
      if (idx > -1 && counterEl) counterEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(mainSections.length).padStart(2, '0');
    }
  });
}, { threshold: 0.5 });
mainSections.forEach(id => { const el = document.getElementById(id); if (el) secObserver.observe(el); });

// custom cursor
if (fine){
  const cursor = document.getElementById('cursor');
  const cursorText = document.getElementById('cursor-text');
  
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursorText.style.left = e.clientX + 'px';
    cursorText.style.top = e.clientY + 'px';
  });
  
  document.querySelectorAll('a, button, .premium-card .img-wrap').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hoverable');
      const text = el.getAttribute('data-cursor-text');
      if(text) {
        cursorText.textContent = text;
        cursorText.classList.add('show');
      }
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hoverable');
      cursorText.classList.remove('show');
    });
  });
}

// magnetic elements
if (fine && !reduceMotion){
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.3;
      const y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.transition = 'none';
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .45s cubic-bezier(.16,1,.3,1)';
      el.style.transform = 'translate(0, 0)';
    });
  });
}

// Scramble text effect on hover
const scrambleElements = document.querySelectorAll('.scramble-on-hover');
const chars = '!<>-_\\\\/[]{}—=+*^?#________';
scrambleElements.forEach(el => {
  const originalText = el.innerText;
  let interval = null;
  el.addEventListener('mouseenter', () => {
    let iteration = 0;
    clearInterval(interval);
    interval = setInterval(() => {
      el.innerText = originalText.split('').map((letter, index) => {
        if(index < iteration) {
          return originalText[index];
        }
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      if(iteration >= originalText.length){ 
        clearInterval(interval);
      }
      iteration += 1 / 2;
    }, 30);
  });
  el.addEventListener('mouseleave', () => {
    clearInterval(interval);
    el.innerText = originalText;
  });
});

// Timeline Scroll Spy
const timelineBeats = document.querySelectorAll('.timeline-beat');
const dateItems = document.querySelectorAll('.date-item');
const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      dateItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === entry.target.id) {
          item.classList.add('active');
          if(window.innerWidth <= 768){
            const container = item.parentElement;
            container.scrollTo({
              left: item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  });
}, { rootMargin: '-30% 0px -70% 0px' });

timelineBeats.forEach(beat => timelineObserver.observe(beat));

dateItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetId = item.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});




// hamburger / sidebar
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
function openMenu(){ hamburger.classList.add('open'); sidebar.classList.add('open'); backdrop.classList.add('open'); }
function closeMenu(){ hamburger.classList.remove('open'); sidebar.classList.remove('open'); backdrop.classList.remove('open'); }
hamburger.addEventListener('click', () => { sidebar.classList.contains('open') ? closeMenu() : openMenu(); });
document.getElementById('closeSidebar').addEventListener('click', closeMenu);
backdrop.addEventListener('click', closeMenu);
document.querySelectorAll('.sidebar-link').forEach(a => a.addEventListener('click', closeMenu));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// back to top
document.getElementById('backtotop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---- three.js hero scene: interactive functional data planes ----
(function heroScene(){
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  function resize(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const group = new THREE.Group();
  const layerCount = 7;
  const meshes = [];
  
  for (let i = 0; i < layerCount; i++){
    const geo = new THREE.PlaneGeometry(3.6, 2.2);
    const isAlt = i % 2 !== 0;
    const mat = new THREE.MeshBasicMaterial({
      color: isAlt ? 0xFF4641 : 0x346BF1,
      transparent: true,
      opacity: 0.05 + (i * 0.008),
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    mesh.userData = {
      baseY: (i - layerCount / 2) * 0.42,
      baseZ: (i - layerCount / 2) * 0.25,
      targetY: (i - layerCount / 2) * 0.42,
      targetZ: (i - layerCount / 2) * 0.25
    };
    
    mesh.position.y = mesh.userData.baseY;
    mesh.position.z = mesh.userData.baseZ;

    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
      color: isAlt ? 0xFF4641 : 0x346BF1, 
      transparent: true, 
      opacity: 0.25 
    }));
    mesh.add(line);

    group.add(mesh);
    meshes.push(mesh);
  }
  group.rotation.x = 0.45;
  group.rotation.y = -0.5;
  group.position.x = window.innerWidth < 768 ? 0 : 2.6;
  scene.add(group);

  let mx = 0, my = 0;
  let isClicking = false;
  let isVisible = true;
  
  const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
  });
  observer.observe(canvas);
  
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });
  
  canvas.addEventListener('mousedown', () => {
    isClicking = true;
    meshes.forEach((mesh, i) => {
      mesh.userData.targetY = mesh.userData.baseY + (Math.random() - 0.5) * 4;
      mesh.userData.targetZ = mesh.userData.baseZ + (Math.random() - 0.5) * 4;
    });
  });
  
  window.addEventListener('mouseup', () => {
    isClicking = false;
    meshes.forEach(mesh => {
      mesh.userData.targetY = mesh.userData.baseY;
      mesh.userData.targetZ = mesh.userData.baseZ;
    });
  });

  function animate(){
    requestAnimationFrame(animate);
    if (!isVisible) return;
    if (!reduceMotion){
      group.rotation.y += 0.0015;
      group.rotation.y += (-0.5 + mx * 0.5 - group.rotation.y) * 0.02;
      group.rotation.x += (0.45 - my * 0.4 - group.rotation.x) * 0.02;
      
      meshes.forEach(mesh => {
        mesh.position.y += (mesh.userData.targetY - mesh.position.y) * (isClicking ? 0.1 : 0.05);
        mesh.position.z += (mesh.userData.targetZ - mesh.position.z) * (isClicking ? 0.1 : 0.05);
      });
    }
    renderer.render(scene, camera);
  }
  animate();
})();
