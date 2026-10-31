'use client';
import { motion } from 'framer-motion';

export default function Reveal({ children, delay = 0, y = 26, as = 'div', ...rest }) {
  const M = motion[as];
  return (
    <M initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} {...rest}>
      {children}
    </M>
  );
}
