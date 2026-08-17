import gsap from 'gsap';

/**
 * Attaches magnetic hover physics to a DOM element.
 * The element follows the mouse position slightly on hover and springs back smoothly on leave.
 */
export function applyMagneticEffect(element, strength = 0.3) {
  if (!element) return () => {};

  const handleMouseMove = (e) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1.1, 0.4)',
      overwrite: 'auto'
    });
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
}

/**
 * Performs a 3D Tilt effect calculation on a element given bounding box and mouse cursor
 */
export function calculate3DTilt(rect, mouseX, mouseY, maxTilt = 15) {
  const relativeX = mouseX - rect.left;
  const relativeY = mouseY - rect.top;

  const percentX = Math.max(0, Math.min(1, relativeX / rect.width));
  const percentY = Math.max(0, Math.min(1, relativeY / rect.height));

  const rotateY = (percentX - 0.5) * (maxTilt * 2);
  const rotateX = (0.5 - percentY) * (maxTilt * 2);

  return {
    rotateX,
    rotateY,
    percentX,
    percentY
  };
}
