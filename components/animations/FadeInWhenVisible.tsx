import React, { ReactNode, useEffect, useRef, useState } from 'react';

interface FadeInWhenVisibleProps {
  children: ReactNode;
  className?: string;
}

const FadeInWhenVisible: React.FC<FadeInWhenVisibleProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(20px)',
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
      }}
    >
      {children}
    </div>
  );
};

export default FadeInWhenVisible;
