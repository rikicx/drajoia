import * as THREE from 'three';

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

function setupParallax() {
  if (reducedMotion) return;

  const items = [...document.querySelectorAll('[data-parallax]')].map((element) => ({
    element,
    speed: Number(element.dataset.parallax) || 0,
    center: 0,
    height: 0,
  }));
  let ticking = false;

  const measure = () => {
    items.forEach((item) => {
      const rect = item.element.getBoundingClientRect();
      item.center = rect.top + window.scrollY + rect.height / 2;
      item.height = rect.height;
    });
  };

  const render = () => {
    const viewportCenter = window.scrollY + window.innerHeight / 2;
    items.forEach((item) => {
      const distance = viewportCenter - item.center;
      const visibleRange = window.innerHeight + item.height;
      if (Math.abs(distance) < visibleRange) {
        const offset = Math.max(-72, Math.min(72, distance * item.speed));
        item.element.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      }
    });
    ticking = false;
  };

  const requestRender = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  };

  measure();
  render();
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    requestRender();
  }, { passive: true });
}

function createDiamond3D(container) {
  if (!container || !window.WebGLRenderingContext) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.1, 5.5);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);

  const positions = [];
  const colors = [];
  const segments = 10;
  const topCenter = new THREE.Vector3(0, 0.9, 0);
  const point = new THREE.Vector3(0, -1.7, 0);
  const topRing = [];
  const upperRing = [];
  const lowerRing = [];
  const palette = ['#fff3bf', '#efc46d', '#c88a2e', '#8b5318', '#f8d887', '#b66d20'];

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2 + Math.PI / 10;
    topRing.push(new THREE.Vector3(Math.cos(angle) * 0.72, 0.9, Math.sin(angle) * 0.72));
    upperRing.push(new THREE.Vector3(Math.cos(angle) * 1.45, 0.18, Math.sin(angle) * 1.45));
    lowerRing.push(new THREE.Vector3(Math.cos(angle) * 1.43, 0.02, Math.sin(angle) * 1.43));
  }

  const addTriangle = (a, b, c, color) => {
    const facetColor = new THREE.Color(color);
    [a, b, c].forEach((vertex) => {
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(facetColor.r, facetColor.g, facetColor.b);
    });
  };

  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    addTriangle(topCenter, topRing[index], topRing[next], index % 2 ? '#fff8d9' : '#f5d989');
    addTriangle(topRing[index], upperRing[index], upperRing[next], palette[index % palette.length]);
    addTriangle(topRing[index], upperRing[next], topRing[next], palette[(index + 2) % palette.length]);
    addTriangle(upperRing[index], lowerRing[index], lowerRing[next], index % 2 ? '#8a541d' : '#d39a3d');
    addTriangle(upperRing[index], lowerRing[next], upperRing[next], index % 2 ? '#b87425' : '#f0c36b');
    addTriangle(lowerRing[index], point, lowerRing[next], palette[(index + 3) % palette.length]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    flatShading: true,
    metalness: 0.28,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.08,
    thickness: 1.4,
    ior: 2.25,
    reflectivity: 1,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
  });

  const group = new THREE.Group();
  const gem = new THREE.Mesh(geometry, material);
  group.add(gem);

  const edgeGeometry = new THREE.EdgesGeometry(geometry, 14);
  const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({
    color: 0xffedbb,
    transparent: true,
    opacity: 0.3,
  }));
  group.add(edges);
  group.rotation.x = -0.08;
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xffe3ae, 1.45));
  const keyLight = new THREE.PointLight(0xffe9bb, 42, 12);
  keyLight.position.set(3.6, 4.2, 4.5);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xd68a26, 34, 10);
  rimLight.position.set(-4, 0.5, 2.5);
  scene.add(rimLight);
  const backLight = new THREE.PointLight(0xfff7de, 26, 9);
  backLight.position.set(0, -2.5, -3);
  scene.add(backLight);

  let pointerX = 0;
  let pointerY = 0;
  container.addEventListener('pointermove', (event) => {
    const rect = container.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.35;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.2;
  }, { passive: true });
  container.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  });

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const renderFrame = (time = 0) => {
    const scrollRotation = window.scrollY * 0.0012;
    if (!reducedMotion) {
      group.rotation.y = time * 0.00032 + scrollRotation + pointerX;
      group.rotation.x += ((-0.08 - pointerY) - group.rotation.x) * 0.04;
      group.rotation.z = Math.sin(time * 0.00045) * 0.045;
      group.position.y = Math.sin(time * 0.0011) * 0.06;
    }
    renderer.render(scene, camera);
    if (!reducedMotion) requestAnimationFrame(renderFrame);
  };

  resize();
  renderFrame();
  new ResizeObserver(resize).observe(container);
}

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

setupParallax();
createDiamond3D(document.querySelector('#diamond-3d'));
