// 3D-tilt карточек: perspective + rotateX/rotateY от позиции курсора.
// Только точный указатель и без reduced-motion; на таче не активируется.

export function initTilt(root: ParentNode = document): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(pointer: fine)').matches) return;

  for (const el of root.querySelectorAll<HTMLElement>('[data-tilt]')) {
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`;
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      raf = 0;
      el.style.transform = '';
    });
  }
}
