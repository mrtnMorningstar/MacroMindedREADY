"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import EmptyState from "./EmptyState";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

type TableContainerProps = {
  children: ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  footerContent?: ReactNode;
  className?: string;
};

export default function TableContainer({
  children,
  isEmpty = false,
  emptyTitle = "No items found",
  emptyDescription = "There are no items to display at this time.",
  emptyAction,
  loading = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  footerContent,
  className = "",
}: TableContainerProps) {
  if (loading) {
    return null; // Let parent handle loading state
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={<DocumentTextIcon className="h-16 w-16" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden shadow-xl ${className}`}
    >
      <div className="overflow-x-auto">
        {children}
      </div>
      
      {/* Footer with Load More or status */}
      {(hasMore || footerContent) && (
        <div className="border-t border-neutral-800/50 px-6 py-4 bg-neutral-900/50">
          {hasMore && onLoadMore ? (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="w-full rounded-xl border border-[#D7263D] bg-[#D7263D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          ) : (
            footerContent && (
              <div className="text-center">
                {footerContent}
              </div>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}
