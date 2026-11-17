"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function MotionSystem() {
  const pathname = usePathname();
  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          gsap.from("[data-enter]", {
            y: 28,
            opacity: 0,
            duration: 1.1,
            stagger: 0.12,
            ease: "power3.out",
          });
          gsap.utils
            .toArray<HTMLElement>("[data-reveal]")
            .forEach((el) =>
              gsap.from(el, {
                y: 35,
                opacity: 0.15,
                duration: 0.9,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 92%", once: true },
              }),
            );
          gsap.to(".hero-object", {
            y: 65,
            rotate: 9,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
          gsap.to(".story-object", {
            rotate: -18,
            y: -50,
            ease: "none",
            scrollTrigger: {
              trigger: ".story",
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        });
        cleanup = () => ctx.revert();
      },
    );
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pathname]);
  return null;
}
