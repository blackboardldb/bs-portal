import { useMemo } from "react";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsePaginationOptions {
  items: any[];
  page: number;
  pageSize: number;
}

export function usePagination({
  items,
  page,
  pageSize,
}: UsePaginationOptions): {
  paginationData: PaginationData;
  currentPageItems: any[];
} {
  const paginationData = useMemo((): PaginationData => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: pageSize,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [items.length, page, pageSize]);

  const currentPageItems = useMemo(() => {
    return items.slice(paginationData.startIndex, paginationData.endIndex);
  }, [items, paginationData.startIndex, paginationData.endIndex]);

  return {
    paginationData,
    currentPageItems,
  };
}

export function usePaginationControls(
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) {
  const goToPage = (page: number) => {
    const validPage = Math.min(Math.max(1, page), totalPages);
    onPageChange(validPage);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    goToPage(1);
  };

  const goToLastPage = () => {
    goToPage(totalPages);
  };

  return {
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
  };
}

export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | string)[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push("...");
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push("...");
    }
    pages.push(totalPages);
  }

  return pages;
}
