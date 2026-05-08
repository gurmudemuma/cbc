import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { duration, easing } from '../utils/designSystem';

interface PageTransitionProps {
    children: ReactNode;
    /**
     * Transition variant
     * @default 'fade'
     */
    variant?: 'fade' | 'slide' | 'scale' | 'none';
}

/**
 * Page Transition Wrapper Component
 * 
 * Provides smooth transitions between route changes
 */
const PageTransition = ({ children, variant = 'fade' }: PageTransitionProps) => {
    const location = useLocation();

    const variants = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        },
        slide: {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 },
        },
        scale: {
            initial: { opacity: 0, scale: 0.95 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 1.05 },
        },
        none: {
            initial: {},
            animate: {},
            exit: {},
        },
    };

    const selectedVariant = variants[variant];

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={selectedVariant.initial}
                animate={selectedVariant.animate}
                exit={selectedVariant.exit}
                transition={{
                    duration: duration.normal / 1000,
                    ease: [0.25, 0.1, 0.25, 1], // Smooth easing curve
                }}
                style={{ width: '100%', height: '100%' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default PageTransition;
