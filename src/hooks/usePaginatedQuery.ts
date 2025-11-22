import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  limit,
  startAfter,
  getDocs,
  orderBy,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  type Firestore,
} from "firebase/firestore";

type UsePaginatedQueryOptions = {
  db: Firestore;
  collectionName: string;
  pageSize?: number;
  orderByField?: string;
  orderByDirection?: "asc" | "desc";
  additionalConstraints?: QueryConstraint[];
  filterFn?: (doc: DocumentData) => boolean;
};

type UsePaginatedQueryReturn<T> = {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
};

/**
 * Hook for paginated Firestore queries
 * 
 * Features:
 * - Loads data in pages using limit + startAfter
 * - Provides "Load More" functionality
 * - No real-time listeners (reduces database reads)
 * - Manual refresh capability
 * - Stable references to prevent infinite re-renders
 */
export function usePaginatedQuery<T = DocumentData>(
  options: UsePaginatedQueryOptions
): UsePaginatedQueryReturn<T> {
  const {
    db,
    collectionName,
    pageSize = 25,
    orderByField,
    orderByDirection = "desc",
    additionalConstraints = [],
    filterFn,
  } = options;

  // Use refs to store mutable values without causing re-renders
  const filterFnRef = useRef(filterFn);
  const additionalConstraintsRef = useRef(additionalConstraints);
  
  // Update refs when values change (without triggering re-renders)
  useEffect(() => {
    filterFnRef.current = filterFn;
  }, [filterFn]);
  
  useEffect(() => {
    additionalConstraintsRef.current = additionalConstraints;
  }, [additionalConstraints]);

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchPage = useCallback(
    async (startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
      try {
        const constraints: QueryConstraint[] = [];

        // Add ordering if specified
        if (orderByField) {
          constraints.push(orderBy(orderByField, orderByDirection));
        }

        // Add additional constraints from ref
        const currentConstraints = additionalConstraintsRef.current;
        if (currentConstraints.length > 0) {
          constraints.push(...currentConstraints);
        }

        // Add limit
        constraints.push(limit(pageSize));

        // Add startAfter if this is a "load more" request
        if (startAfterDoc) {
          constraints.push(startAfter(startAfterDoc));
        }

        const q = query(collection(db, collectionName), ...constraints);
        const snapshot = await getDocs(q);

        const newDocs: T[] = [];
        let lastDocument: QueryDocumentSnapshot<DocumentData> | null = null;
        const currentFilterFn = filterFnRef.current;

        snapshot.forEach((doc) => {
          const docData = { id: doc.id, ...doc.data() } as T;
          
          // Apply filter function if provided (using ref to avoid dependency)
          if (currentFilterFn) {
            if (currentFilterFn(doc.data())) {
              newDocs.push(docData);
            }
          } else {
            newDocs.push(docData);
          }

          lastDocument = doc;
        });

        // Check if there are more documents
        setHasMore(snapshot.size === pageSize);

        if (startAfterDoc) {
          // Append to existing data
          setData((prev) => [...prev, ...newDocs]);
        } else {
          // Replace data (initial load or refresh)
          setData(newDocs);
        }

        setLastDoc(lastDocument);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch data");
        setError(error);
        console.error("Error fetching paginated data:", error);
      }
    },
    // Only depend on stable primitives, not functions/arrays
    [db, collectionName, pageSize, orderByField, orderByDirection]
  );

  // Initial load - only run once or when stable dependencies change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchPage(null).finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) {
      return;
    }

    setLoadingMore(true);
    await fetchPage(lastDoc);
    setLoadingMore(false);
  }, [hasMore, loadingMore, lastDoc, fetchPage]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLastDoc(null);
    await fetchPage(null);
    setLoading(false);
  }, [fetchPage]);

  const reset = useCallback(() => {
    setData([]);
    setLastDoc(null);
    setHasMore(true);
    setError(null);
    setLoading(true);
    fetchPage(null).finally(() => {
      setLoading(false);
    });
  }, [fetchPage]);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    reset,
  };
}

