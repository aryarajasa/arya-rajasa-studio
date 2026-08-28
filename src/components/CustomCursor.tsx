import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 28, stiffness: 450, mass: 0.4 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);
  
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button') || target.closest('.group') || target.closest('[role="button"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      style={{
        x: smoothX,
        y: smoothY,
      }}
      className="fixed top-0 left-0 pointer-events-none z-50 hidden md:block mix-blend-difference"
      aria-hidden="true"
    >
      <div className={`relative ${isHovering ? 'w-6 h-6' : 'w-3.5 h-3.5'} -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-150`}>
        <motion.div
          initial={false}
          animate={{ opacity: isHovering ? 1 : 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute inset-[3px] rounded-full bg-white"
        />

        <span className="absolute -top-px -left-px w-[3px] h-[3px] border-t border-l border-white" />
        <span className="absolute -top-px -right-px w-[3px] h-[3px] border-t border-r border-white" />
        <span className="absolute -bottom-px -left-px w-[3px] h-[3px] border-b border-l border-white" />
        <span className="absolute -bottom-px -right-px w-[3px] h-[3px] border-b border-r border-white" />
      </div>
    </motion.div>
  );
}
