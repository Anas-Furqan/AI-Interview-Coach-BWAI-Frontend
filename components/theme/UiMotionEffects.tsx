'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function UiMotionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const autoRevealNodes = Array.from(
      document.querySelectorAll<HTMLElement>('.MuiCard-root, .section-shell, .hero-banner, .pro-card, section')
    );
    autoRevealNodes.forEach((node, index) => {
      if (node.dataset.reveal) {
        return;
      }

      node.dataset.reveal = 'up';
      if (!node.dataset.revealDelay) {
        node.dataset.revealDelay = String((index % 5) * 40);
      }
    });

    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }

          const node = entry.target as HTMLElement;
          node.classList.add('is-visible');
          revealObserver.unobserve(node);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );

    revealNodes.forEach(node => revealObserver.observe(node));

    const tiltNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt], .MuiCard-root'));
    const tiltCleanup: Array<() => void> = [];

    if (!reduceMotion) {
      tiltNodes.forEach(node => {
        const onMouseMove = (event: MouseEvent) => {
          const rect = node.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateY = ((x - centerX) / centerX) * 5;
          const rotateX = ((centerY - y) / centerY) * 4;

          node.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        const onMouseLeave = () => {
          node.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
        };

        node.addEventListener('mousemove', onMouseMove);
        node.addEventListener('mouseleave', onMouseLeave);

        tiltCleanup.push(() => {
          node.removeEventListener('mousemove', onMouseMove);
          node.removeEventListener('mouseleave', onMouseLeave);
          node.style.transform = 'none';
        });
      });
    }

    let parallaxInstance: { destroy?: () => void } | null = null;

    const setupParallax = async () => {
      if (reduceMotion) {
        return;
      }

      const images = Array.from(document.querySelectorAll<HTMLImageElement>('img[data-parallax="true"]'));
      if (images.length === 0) {
        return;
      }

      try {
        const module = await import('simple-parallax-js');
        const SimpleParallaxCtor = (module.default || module) as unknown;

        if (cancelled || typeof SimpleParallaxCtor !== 'function') {
          return;
        }

        // @ts-expect-error - Constructor call
        parallaxInstance = new SimpleParallaxCtor(images, {
          delay: 0.45,
          orientation: 'up',
          scale: 1.14,
          transition: 'cubic-bezier(0,0,0,1)',
          overflow: true,
        });
      } catch (error) {
        // Silently skip parallax if library fails to load or initialize
      }
    };

    const hydrationSafeTimer = window.setTimeout(() => {
      if (!cancelled) {
        void setupParallax();
      }
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(hydrationSafeTimer);
      revealObserver.disconnect();
      tiltCleanup.forEach(clean => clean());
      parallaxInstance?.destroy?.();
    };
  }, [pathname]);

  return null;
}
