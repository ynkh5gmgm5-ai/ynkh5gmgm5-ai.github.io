import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function MotionController() {
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      gsap.fromTo(
        element,
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        },
      );
    });

    gsap.utils.toArray<HTMLElement>('[data-stack]').forEach((card, index) => {
      gsap.fromTo(
        card,
        { y: 56, scale: 0.97 },
        {
          y: 0,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top 92%',
            end: 'top 56%',
            scrub: true,
          },
        },
      );
      card.style.setProperty('--stack-index', String(index));
    });

    const words = gsap.utils.toArray<HTMLElement>('[data-scrub-text] .word');
    if (words.length > 0) {
      gsap.fromTo(
        words,
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-scrub-text]',
            start: 'top 82%',
            end: 'bottom 48%',
            scrub: true,
          },
        },
      );
    }
  });

  return null;
}
