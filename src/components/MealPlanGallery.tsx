"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type MealPlanGalleryProps = {
  images: string[];
  title?: string;
};

export default function MealPlanGallery({
  images,
  title = "Meal Plan Gallery",
}: MealPlanGalleryProps) {
  // Hooks must be called before any conditional returns
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Always render the component structure to maintain consistent hook calls
  if (!images.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-display text-xs uppercase tracking-[0.4em] text-accent">
        {title}
      </h4>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3"
      >
        {images.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setActiveImage(url)}
            className="group relative overflow-hidden rounded-2xl border border-border/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={url}
              alt="Meal plan preview"
              className="h-32 w-full object-cover transition group-hover:scale-105"
            />
          </button>
        ))}
      </motion.div>

      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
            onClick={() => setActiveImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-border/80 bg-background/95 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveImage(null)}
                className="absolute right-4 top-4 z-10 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[0.55rem] uppercase tracking-[0.32em] text-foreground/80 transition hover:border-accent hover:text-accent"
              >
                Close
              </button>
              <img
                src={activeImage}
                alt="Meal plan full preview"
                className="h-full w-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

