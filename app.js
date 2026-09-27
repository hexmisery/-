'use strict';

const projectSlides = [...document.querySelectorAll('#project-slides > .project-slide')];
const projectPrev = document.getElementById('project-prev');
const projectNext = document.getElementById('project-next');
const projectCount = document.getElementById('project-count');

if (projectSlides.length && projectPrev && projectNext && projectCount) {
  let activeProject = 0;
  function showProject(index) {
    if (!Number.isInteger(index) || index < 0 || index >= projectSlides.length) return;
    activeProject = index;
    projectSlides.forEach((slide, position) => {
      slide.hidden = position !== index;
      slide.setAttribute('aria-label', `${slide.dataset.projectName || 'Проект'}, ${position + 1} из ${projectSlides.length}`);
    });
    projectCount.textContent = `${index + 1} / ${projectSlides.length}`;
    projectCount.setAttribute('aria-label', `Проект ${index + 1} из ${projectSlides.length}`);
    projectPrev.disabled = index === 0;
    projectNext.disabled = index === projectSlides.length - 1;
  }
  projectPrev.addEventListener('click', () => showProject(activeProject - 1));
  projectNext.addEventListener('click', () => showProject(activeProject + 1));
  showProject(0);
}

const copyButton = document.getElementById('copy-contact');
const copyStatus = document.getElementById('copy-status');
let resetTimer;

if (copyButton && copyStatus) {
  copyButton.addEventListener('click', async () => {
    copyButton.disabled = true;
    clearTimeout(resetTimer);
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText('@hexmisery');
      copyStatus.textContent = 'Контакт скопирован: @hexmisery';
      copyButton.textContent = 'Скопировано ✓';
    } catch {
      copyStatus.textContent = 'Скопируй вручную: @hexmisery';
      copyButton.textContent = 'Скопировать ещё раз';
    } finally {
      copyButton.disabled = false;
      resetTimer = setTimeout(() => {
        copyButton.textContent = 'Скопировать контакт';
      }, 3500);
    }
  });
}

const hero = document.querySelector('.hero');
const letters = [...document.querySelectorAll('.letter')];
const halos = [...document.querySelectorAll('.halo')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

if (hero && letters.length) {
  const springs = letters.map(() => ({x:0,y:0,vx:0,vy:0}));
  let centers = [];
  let pointer = null;
  let frame = 0;
  let previousTime = 0;
  let visible = true;
  let bounds;
  let driftX = 0;
  let driftY = 0;

  function measure() {
    bounds = hero.getBoundingClientRect();
    centers = letters.map(letter => {
      const box = letter.getBoundingClientRect();
      return {x:box.left + box.width / 2,y:box.top + box.height / 2};
    });
  }

  function enabled() {
    return finePointer.matches && !reducedMotion.matches && visible && !document.hidden;
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    pointer = null;
    driftX = driftY = 0;
    springs.forEach((s,i) => {
      s.x = s.y = s.vx = s.vy = 0;
      letters[i].style.transform = '';
    });
    halos.forEach(halo => { halo.style.transform = ''; });
  }

  function tick(time) {
    frame = 0;
    if (!enabled()) { reset(); return; }
    const dt = previousTime ? Math.min((time - previousTime) / 16.67, 2) : 1;
    previousTime = time;
    const nx = pointer ? (pointer.x - bounds.left) / bounds.width - .5 : 0;
    const ny = pointer ? (pointer.y - bounds.top) / bounds.height - .5 : 0;
    let moving = !!pointer;
    springs.forEach((s,i) => {
      const center = centers[i];
      let tx = nx * 8, ty = ny * 8;
      if (pointer && center) {
        const dx = pointer.x - center.x, dy = pointer.y - center.y;
        const distance = Math.hypot(dx,dy);
        const strength = Math.max(0,1-distance/230);
        tx -= dx * strength * .10;
        ty -= dy * strength * .16;
      }
      s.vx = (s.vx + (tx-s.x)*.045*dt) * Math.pow(.79,dt);
      s.vy = (s.vy + (ty-s.y)*.045*dt) * Math.pow(.79,dt);
      s.x += s.vx*dt; s.y += s.vy*dt;
      letters[i].style.transform = `translate3d(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px,0) rotate(${(s.x*.15).toFixed(2)}deg)`;
      if (Math.abs(s.x)+Math.abs(s.y)+Math.abs(s.vx)+Math.abs(s.vy)>.03) moving=true;
    });
    driftX += (nx-driftX)*.055*dt;
    driftY += (ny-driftY)*.055*dt;
    halos.forEach(halo => {
      const depth = Number(halo.dataset.depth) || 0;
      halo.style.transform = `translate3d(${(driftX*depth).toFixed(2)}px,${(driftY*depth).toFixed(2)}px,0)`;
    });
    if (Math.abs(driftX)+Math.abs(driftY)>.002) moving=true;
    if (moving) frame=requestAnimationFrame(tick);
    else previousTime=0;
  }

  function start() {
    if (enabled() && !frame) frame=requestAnimationFrame(tick);
  }

  hero.addEventListener('pointerenter',event => {
    if (!enabled() || event.pointerType==='touch') return;
    reset(); measure(); pointer={x:event.clientX,y:event.clientY}; start();
  });
  hero.addEventListener('pointermove',event => {
    if (!enabled() || event.pointerType==='touch') return;
    pointer={x:event.clientX,y:event.clientY}; start();
  },{passive:true});
  hero.addEventListener('pointerleave',() => { pointer=null; start(); });
  window.addEventListener('resize',() => { reset(); measure(); },{passive:true});
  window.addEventListener('scroll',() => { if(pointer) { reset(); measure(); } },{passive:true});
  reducedMotion.addEventListener('change',reset);
  finePointer.addEventListener('change',reset);
  document.addEventListener('visibilitychange',reset);
  const observer=new IntersectionObserver(entries => {
    visible=entries[0].isIntersecting;
    if(!visible) reset();
  });
  observer.observe(hero);
  measure();
}
