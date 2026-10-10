'use strict';
const navLinks=[...document.querySelectorAll('nav a')];
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible)return;
    navLinks.forEach(link=>{const active=link.hash==='#'+visible.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  },{rootMargin:'-10% 0px -45% 0px',threshold:[0,.1,.3,.6]});
  document.querySelectorAll('main>section').forEach(section=>observer.observe(section));
}

