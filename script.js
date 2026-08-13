const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');

/* Theme toggle */
const savedTheme = localStorage.getItem('nobleman-theme');
const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
root.dataset.theme = savedTheme || (preferredDark ? 'dark' : 'light');
const themeToggle = document.querySelector('.theme-toggle');
function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
}
syncTheme();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nobleman-theme', root.dataset.theme);
  syncTheme();
});

/* Mobile nav */
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  siteNav.classList.toggle('open');
});
siteNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  siteNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

document.querySelector('#year').textContent = new Date().getFullYear();

/* Contact form */
const form = document.querySelector('.contact-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  const status = form.querySelector('.form-status');
  button.disabled = true;
  status.className = 'form-status';
  status.textContent = 'Sending your inquiry…';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to send your inquiry.');
    status.classList.add('success');
    status.textContent = 'Thanks—your inquiry has been sent. I’ll respond soon.';
    form.reset();
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

/* Scroll progress + sticky header state */
const progressBar = document.querySelector('.scroll-progress span');
const header = document.querySelector('.site-header');
let ticking = false;
function onScroll() {
  const scrollTop = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${height > 0 ? Math.min(scrollTop / height, 1) : 0})`;
  header.classList.toggle('scrolled', scrollTop > 12);
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });
onScroll();

/* Hero load-in */
window.requestAnimationFrame(() => {
  document.querySelectorAll('.reveal-load').forEach((el) => el.classList.add('in'));
});

/* Scroll reveal */
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((el) => revealObserver.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('visible'));
}

/* Scrollspy nav indicator */
const navLinksWrap = document.querySelector('.nav-links');
const navIndicator = document.querySelector('.nav-indicator');
const navLinks = [...document.querySelectorAll('.nav-links a')];
const spySections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function moveIndicator(link) {
  if (!link || !navIndicator || !navLinksWrap) return;
  const wrapRect = navLinksWrap.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  navIndicator.style.left = `${linkRect.left - wrapRect.left}px`;
  navIndicator.style.width = `${linkRect.width}px`;
  navIndicator.classList.add('active');
}

if ('IntersectionObserver' in window && spySections.length) {
  const spyObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting);
    if (!visible.length) return;
    const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
    const activeLink = navLinks.find((l) => l.getAttribute('href') === `#${top.target.id}`);
    if (activeLink) moveIndicator(activeLink);
  }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
  spySections.forEach((section) => spyObserver.observe(section));
}
window.addEventListener('resize', () => {
  const active = navLinks.find((l) => navIndicator && navIndicator.classList.contains('active') && l.getBoundingClientRect().width);
  if (active) moveIndicator(active);
});

/* Process step reveal already handled by .reveal observer above (shares class) */

/* Pointer-driven flourishes: cursor, magnetic buttons, card tilt, hero parallax */
if (finePointer.matches && !reduceMotion.matches) {
  root.classList.add('has-fine-pointer');

  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  let cx = 0, cy = 0, rx = 0, ry = 0;
  window.addEventListener('mousemove', (e) => {
    root.classList.add('cursor-active');
    cx = e.clientX; cy = e.clientY;
    cursorDot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
  }, { passive: true });
  (function trackRing() {
    rx += (cx - rx) * 0.18;
    ry += (cy - ry) * 0.18;
    cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(trackRing);
  })();
  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => root.classList.add('cursor-grow'));
    el.addEventListener('mouseleave', () => root.classList.remove('cursor-grow'));
  });

  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${relX * 0.18}px, ${relY * 0.35}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  document.querySelectorAll('.project.tilt').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--rx', `${px * 4}deg`);
      card.style.setProperty('--ry', `${py * -4}deg`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  const heroVisual = document.querySelector('.hero-visual');
  const heroImg = heroVisual ? heroVisual.querySelector('img') : null;
  if (heroVisual && heroImg) {
    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      heroImg.style.transform = `scale(1.05) translate(${px * -10}px, ${py * -10}px)`;
    });
    heroVisual.addEventListener('mouseleave', () => { heroImg.style.transform = ''; });
  }
}
