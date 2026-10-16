'use strict';

const navLinks = [...document.querySelectorAll('nav a')];
const sections = [...document.querySelectorAll('main > section')];
let updatePending = false;

function updateNavigation() {
  updatePending = false;
  let current = sections[0];
  const marker = window.innerHeight * 0.3;

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= marker) current = section;
  }

  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    current = sections[sections.length - 1];
  }

  for (const link of navLinks) {
    const active = link.hash === '#' + current?.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function scheduleUpdate() {
  if (updatePending) return;
  updatePending = true;
  window.requestAnimationFrame(updateNavigation);
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('load', scheduleUpdate);
updateNavigation();

