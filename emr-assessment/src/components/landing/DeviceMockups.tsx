"use client";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/** Laptop, tablet and phone frames showing real Careficient screens, with cursor parallax. */
export function DeviceMockups() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  const laptopX = useTransform(sx, (v) => v * -14);
  const laptopY = useTransform(sy, (v) => v * -10);
  const tabletX = useTransform(sx, (v) => v * 24);
  const tabletY = useTransform(sy, (v) => v * 18);
  const phoneX = useTransform(sx, (v) => v * 36);
  const phoneY = useTransform(sy, (v) => v * 26);

  return (
    <div className="relative mx-auto aspect-[16/11] w-full max-w-[640px]" aria-label="Careficient on laptop, tablet and phone" role="img">
      <div className="absolute inset-[12%] rounded-full bg-cyan/20 blur-3xl" aria-hidden />

      {/* Laptop */}
      <motion.div style={{ x: laptopX, y: laptopY }} className="absolute left-[4%] top-[6%] w-[80%]">
        <div className="rounded-t-2xl border border-white/15 bg-[#0d1b26] p-[1.6%] shadow-[0_0_60px_rgba(34,211,238,0.25)]">
          <div className="relative aspect-[1244/651] overflow-hidden rounded-md bg-white">
            <Image src="/brand/screenshot-dashboard.png" alt="" fill sizes="(max-width: 768px) 80vw, 520px" className="object-cover object-left-top" priority />
          </div>
        </div>
        <div className="mx-[-4%] h-3 rounded-b-xl bg-gradient-to-b from-[#9fb3c2] to-[#5d7383]" />
      </motion.div>

      {/* Tablet */}
      <motion.div style={{ x: tabletX, y: tabletY }} className="absolute bottom-[4%] right-[2%] w-[42%] motion-safe:animate-float">
        <div className="rounded-[18px] border border-white/20 bg-[#0d1b26] p-[3.5%] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(34,211,238,0.25)]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-white">
            <Image src="/brand/screenshot-schedule.png" alt="" fill sizes="260px" className="object-cover object-left-top" />
          </div>
        </div>
      </motion.div>

      {/* Phone */}
      <motion.div style={{ x: phoneX, y: phoneY }} className="absolute bottom-[0%] left-[2%] w-[19%] motion-safe:animate-[float_7s_ease-in-out_infinite_1s]">
        <div className="rounded-[22px] border border-white/20 bg-[#0d1b26] p-[5%] shadow-[0_20px_50px_rgba(0,0,0,0.55),0_0_32px_rgba(34,211,238,0.3)]">
          <div className="relative aspect-[9/19] overflow-hidden rounded-[16px] bg-white">
            <Image src="/brand/screenshot-schedule.png" alt="" fill sizes="240px" className="object-cover object-[62%_35%]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
