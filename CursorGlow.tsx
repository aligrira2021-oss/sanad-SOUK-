import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const isClickable = window.getComputedStyle(target).cursor === 'pointer' || target.tagName === 'BUTTON' || target.tagName === 'A';
      setIsHovering(isClickable);
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-64 h-64 rounded-full pointer-events-none z-0 mix-blend-screen opacity-40 blur-[80px]"
      animate={{
        x: mousePosition.x - 128,
        y: mousePosition.y - 128,
        scale: isHovering ? 1.2 : 1,
        backgroundColor: isHovering ? '#D4AF37' : '#10B981', // Gold when hovering, Emerald otherwise
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 25, mass: 0.1 }}
    />
  );
}
