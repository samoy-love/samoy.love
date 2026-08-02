// 3D-фон hero: поле частиц с глубиной и туманом (OGL).
//
// Модуль грузится динамически и только на Full-уровне — проверки устройства и
// prefers-reduced-motion живут в вызывающем коде (Hero.astro), чтобы слабые
// устройства вообще не скачивали эти килобайты.

import { Renderer, Camera, Transform, Geometry, Program, Mesh } from 'ogl';

/**
 * Возвращает функцию остановки сцены — её обязан вызвать вызывающий код при
 * уходе со страницы (ClientRouter меняет DOM, не перезагружая документ).
 * null — сцена не поднялась, канвас можно убирать.
 */
export function initHeroScene(canvas: HTMLCanvasElement): (() => void) | null {
  const host = canvas.parentElement;
  if (!host) return null;

  const isMobile = matchMedia('(pointer: coarse)').matches;
  const COUNT = isMobile ? 1200 : 2600;
  const DPR = Math.min(devicePixelRatio, isMobile ? 1 : 1.5);

  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, dpr: DPR, alpha: true, antialias: false });
  } catch {
    return null;
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 45, near: 0.1, far: 40 });
  camera.position.z = 10;

  const scene = new Transform();

  // Частицы в вытянутом объёме
  const position = new Float32Array(COUNT * 3);
  const random = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    position.set(
      [(Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 16],
      i * 3,
    );
    random.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
  }

  const geometry = new Geometry(gl, {
    position: { size: 3, data: position },
    random: { size: 4, data: random },
  });

  const vertex = /* glsl */ `
    attribute vec3 position;
    attribute vec4 random;
    uniform mat4 modelViewMatrix, projectionMatrix;
    uniform float uTime, uDpr;
    varying float vDepth, vTwinkle, vWarm;

    void main() {
      vec3 p = position;
      // медленный дрейф, у каждой частицы своя фаза
      p.x += sin(uTime * 0.12 + random.x * 6.2831) * 0.7;
      p.y += cos(uTime * 0.10 + random.y * 6.2831) * 0.5;
      p.z += sin(uTime * 0.08 + random.z * 6.2831) * 0.9;

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      float dist = -mv.z;
      vDepth = clamp(1.0 - dist / 24.0, 0.0, 1.0);
      vTwinkle = 0.65 + 0.35 * sin(uTime * (0.6 + random.w) + random.x * 6.2831);
      vWarm = step(0.9, random.w); // ~10% тёплых янтарных частиц
      gl_PointSize = (1.5 + 5.0 * vDepth * random.y) * uDpr;
    }
  `;

  const fragment = /* glsl */ `
    precision mediump float;
    varying float vDepth, vTwinkle, vWarm;

    void main() {
      // мягкая круглая точка
      float d = length(gl_PointCoord - 0.5);
      float alpha = smoothstep(0.5, 0.1, d);
      vec3 cyan = vec3(0.35, 0.85, 0.95);
      vec3 amber = vec3(0.98, 0.72, 0.35);
      vec3 color = mix(cyan, amber, vWarm);
      // туман: дальние частицы гаснут
      float fog = mix(0.06, 1.0, vDepth);
      gl_FragColor = vec4(color, alpha * fog * vTwinkle * 0.85);
    }
  `;

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: { uTime: { value: 0 }, uDpr: { value: DPR } },
    transparent: true,
    depthTest: false,
  });
  // Аддитивное свечение. Именно через API OGL: сырой gl.blendFunc() библиотека
  // перетирает своим кэшем состояния на каждом кадре, и блендинг остаётся выключен.
  program.setBlendFunc(gl.SRC_ALPHA, gl.ONE);

  const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });
  mesh.setParent(scene);

  // Размер. ResizeObserver, а не одноразовый замер: на первом кадре родитель
  // может иметь нулевую ширину, а renderer.setSize() прописывает канвасу
  // инлайновые width/height и перекрывает CSS `width: 100%` — то есть нулевой
  // размер залипал бы навсегда, до случайного события resize.
  let sized = false;
  const ro = new ResizeObserver(() => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.perspective({ aspect: w / h });
    sized = true;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  ro.observe(host);

  // Параллакс от курсора (только desktop)
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  const onPointerMove = (e: PointerEvent) => {
    targetX = (e.clientX / innerWidth - 0.5) * 2;
    targetY = (e.clientY / innerHeight - 0.5) * 2;
  };
  if (!isMobile) addEventListener('pointermove', onPointerMove, { passive: true });

  // Пауза вне вьюпорта и при скрытой вкладке
  let visible = true;
  let raf = 0;
  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  io.observe(canvas);
  const onVisibility = () => {
    if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    ro.disconnect();
    io.disconnect();
    canvas.style.display = 'none'; // остаётся CSS-фолбэк
  });

  const t0 = performance.now();
  function loop(now: number) {
    raf = 0;
    if (!visible || document.hidden || !sized) return;
    program.uniforms.uTime!.value = (now - t0) / 1000;

    curX += (targetX - curX) * 0.04;
    curY += (targetY - curY) * 0.04;
    camera.position.x = curX * 1.1;
    camera.position.y = -curY * 0.7;
    camera.lookAt([0, 0, 0]);
    scene.rotation.y = (now - t0) * 0.000012;

    renderer.render({ scene, camera });
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    raf = 0;
    visible = false;
    ro.disconnect();
    io.disconnect();
    removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('visibilitychange', onVisibility);
    // Контекст отпускаем явно: без этого браузер держит его до сборки мусора,
    // а лимит одновременных WebGL-контекстов невелик.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
