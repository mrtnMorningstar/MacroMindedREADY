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
    <div className={`rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        {children}
      </div>
      
      {/* Footer with Load More or status */}
      {(hasMore || footerContent) && (
        <div className="border-t border-neutral-800 px-6 py-4">
          {hasMore && onLoadMore ? (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="w-full rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

