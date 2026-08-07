const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
};

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  document.body.classList.toggle('menu-open', !open);
});

menu.addEventListener('click', (event) => {
  if (event.target.matches('a')) closeMenu();
});

const updateHeader = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
};

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

document.querySelector('#year').textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14, rootMargin: '0px 0px -48px' });

document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => revealObserver.observe(element));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeParticles(canvas, options = {}) {
  const context = canvas.getContext('2d');
  const count = options.count || 50;
  const speed = options.speed || 0.18;
  let width = 0;
  let height = 0;
  let particles = [];
  let frame;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: Math.min(count, Math.round(width / 22)) }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: index % 11 === 0 ? 2.2 : 0.5 + Math.random() * 1.1,
      alpha: 0.16 + Math.random() * 0.5,
      vx: (Math.random() - 0.5) * speed,
      vy: -(0.08 + Math.random() * speed),
      drift: Math.random() * Math.PI * 2,
    }));
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.drift += 0.008;
      particle.x += particle.vx + Math.sin(particle.drift) * 0.04;
      particle.y += particle.vy;
      if (particle.y < -8) particle.y = height + 8;
      if (particle.x < -8) particle.x = width + 8;
      if (particle.x > width + 8) particle.x = -8;

      const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 5);
      glow.addColorStop(0, `rgba(255, 224, 143, ${particle.alpha})`);
      glow.addColorStop(1, 'rgba(207, 151, 48, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * 5, 0, Math.PI * 2);
      context.fill();

      if (index % 13 === 0) {
        context.strokeStyle = `rgba(225, 181, 87, ${particle.alpha * 0.26})`;
        context.lineWidth = 0.5;
        context.beginPath();
        context.moveTo(particle.x, particle.y - 12);
        context.lineTo(particle.x, particle.y + 12);
        context.moveTo(particle.x - 12, particle.y);
        context.lineTo(particle.x + 12, particle.y);
        context.stroke();
      }
    });
    if (!reducedMotion) frame = requestAnimationFrame(draw);
  }

  resize();
  draw();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
  };
}

document.querySelectorAll('#gold-particles, #cta-particles').forEach((canvas, index) => {
  makeParticles(canvas, { count: index === 0 ? 72 : 34, speed: index === 0 ? 0.2 : 0.12 });
});
