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

  const isBrandMark = container.matches('[data-brand-diamond]');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.05, 6.8);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);

  const positions = [];
  const segments = 10;
  const topCenter = new THREE.Vector3(0, 0.9, 0);
  const point = new THREE.Vector3(0, -1.7, 0);
  const topRing = [];
  const upperRing = [];
  const lowerRing = [];

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2 + Math.PI / 10;
    topRing.push(new THREE.Vector3(Math.cos(angle) * 0.72, 0.9, Math.sin(angle) * 0.72));
    upperRing.push(new THREE.Vector3(Math.cos(angle) * 1.45, 0.18, Math.sin(angle) * 1.45));
    lowerRing.push(new THREE.Vector3(Math.cos(angle) * 1.43, 0.02, Math.sin(angle) * 1.43));
  }

  const addTriangle = (a, b, c) => {
    [a, b, c].forEach((vertex) => {
      positions.push(vertex.x, vertex.y, vertex.z);
    });
  };

  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    addTriangle(topCenter, topRing[index], topRing[next]);
    addTriangle(topRing[index], upperRing[index], upperRing[next]);
    addTriangle(topRing[index], upperRing[next], topRing[next]);
    addTriangle(upperRing[index], lowerRing[index], lowerRing[next]);
    addTriangle(upperRing[index], lowerRing[next], upperRing[next]);
    addTriangle(lowerRing[index], point, lowerRing[next]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const group = new THREE.Group();
  const edgeGeometry = new THREE.EdgesGeometry(geometry, 1);
  const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({
    color: 0xf3cf7b,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  group.add(edges);

  const glowEdges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({
    color: 0xc6882e,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  glowEdges.scale.setScalar(1.012);
  group.add(glowEdges);
  group.rotation.x = -0.08;
  scene.add(group);

  const toothShape = new THREE.Shape();
  toothShape.moveTo(-0.52, 0.42);
  toothShape.bezierCurveTo(-0.5, 0.78, -0.22, 0.88, 0, 0.68);
  toothShape.bezierCurveTo(0.22, 0.88, 0.5, 0.78, 0.52, 0.42);
  toothShape.bezierCurveTo(0.54, 0.1, 0.36, -0.12, 0.28, -0.42);
  toothShape.bezierCurveTo(0.2, -0.76, 0.06, -0.86, 0, -0.54);
  toothShape.bezierCurveTo(-0.06, -0.86, -0.2, -0.76, -0.28, -0.42);
  toothShape.bezierCurveTo(-0.36, -0.12, -0.54, 0.1, -0.52, 0.42);

  const toothGeometry = new THREE.ExtrudeGeometry(toothShape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.055,
    bevelThickness: 0.055,
    curveSegments: 20,
  });
  toothGeometry.center();

  const tooth = new THREE.Mesh(toothGeometry, new THREE.MeshPhysicalMaterial({
    color: 0xfff7dc,
    metalness: 0.18,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    emissive: 0x6b4310,
    emissiveIntensity: 0.12,
  }));
  tooth.scale.setScalar(0.66);
  tooth.position.set(0, -0.03, 0.24);
  tooth.renderOrder = 2;
  scene.add(tooth);

  const toothOutline = new THREE.LineSegments(
    new THREE.EdgesGeometry(toothGeometry, 28),
    new THREE.LineBasicMaterial({ color: 0xd5a543, transparent: true, opacity: 0.72 }),
  );
  toothOutline.scale.copy(tooth.scale);
  toothOutline.position.copy(tooth.position);
  toothOutline.renderOrder = 3;
  scene.add(toothOutline);

  scene.add(new THREE.HemisphereLight(0xfff6d8, 0x4b2608, 2.1));
  const toothLight = new THREE.DirectionalLight(0xffd47a, 3.2);
  toothLight.position.set(-2.5, 3.5, 5);
  scene.add(toothLight);

  let pointerX = 0;
  let pointerY = 0;
  if (!isBrandMark) {
    container.addEventListener('pointermove', (event) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.35;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.2;
    }, { passive: true });
    container.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
    });
  }

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
      group.rotation.y = time * (isBrandMark ? 0.00018 : 0.00032) + scrollRotation + pointerX;
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
createDiamond3D(document.querySelector('#hero-diamond-3d'));
document.querySelectorAll('[data-brand-diamond]').forEach(createDiamond3D);
