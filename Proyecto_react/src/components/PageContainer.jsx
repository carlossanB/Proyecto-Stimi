import React from 'react';

/**
 * PageContainer — Shared content wrapper for all pages.
 * Provides consistent padding, max-width, and vertical spacing
 * so every page starts at the same horizontal position relative
 * to the sidebar and has uniform breathing room.
 *
 * Props:
 *   maxWidth – Tailwind max-w class override (default: "max-w-7xl")
 *   className – Additional classes to merge
 */
export default function PageContainer({ children, maxWidth = "max-w-7xl", className = "" }) {
  return (
    <div
      className={`
        px-6 py-8
        sm:px-8 sm:py-10
        lg:px-10
        ${maxWidth} mx-auto
        space-y-8
        animate-in fade-in duration-500
        text-gray-900 dark:text-gray-100
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

