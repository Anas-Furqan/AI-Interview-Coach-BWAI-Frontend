'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SmoothLoader() {
  const pathname = usePathname();
  const isFirstPaint = useRef(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
      isFirstPaint.current = false;
    }, 850);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isFirstPaint.current) {
      return;
    }

    setVisible(true);

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="route-loader-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div>
            <div className="route-loader" />
            <p className="route-loader-label">Loading</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
