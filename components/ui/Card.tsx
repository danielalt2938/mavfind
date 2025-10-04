import { HTMLAttributes } from "react";
import { motion, MotionProps } from "framer-motion";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, keyof MotionProps> {
  hover?: boolean;
  children: React.ReactNode;
}

export function Card({ hover = true, className = "", children, ...props }: CardProps) {
  const baseStyles = "card-base p-6";
  const hoverStyles = hover ? "hover-lift hover:shadow-outline-hover cursor-pointer" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`${baseStyles} ${hoverStyles} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
