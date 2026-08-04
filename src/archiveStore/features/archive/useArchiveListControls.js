import { useEffect, useMemo, useState } from 'react';

export function useArchiveListControls(files) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return files.filter((file) => {
      const matchesCategory = activeCategory === 'all' || file.category === activeCategory;
      const matchesQuery = !normalizedQuery || file.filename.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, files, query]);

  const effectivePageSize = pageSize === 'all' ? filteredFiles.length || 1 : pageSize;
  const pageCount = pageSize === 'all' ? 1 : Math.max(Math.ceil(filteredFiles.length / effectivePageSize), 1);
  const safeCurrentPage = Math.min(currentPage, pageCount);

  const visibleFiles = useMemo(() => {
    if (pageSize === 'all') return filteredFiles;

    const start = (safeCurrentPage - 1) * effectivePageSize;
    return filteredFiles.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredFiles, pageSize, safeCurrentPage]);

  const isAllSelected = useMemo(() => {
    return visibleFiles.length > 0 && visibleFiles.every((file) => selectedIds.has(file.id));
  }, [visibleFiles, selectedIds]);

  const isSomeSelected = useMemo(() => {
    return !isAllSelected && visibleFiles.some((file) => selectedIds.has(file.id));
  }, [visibleFiles, selectedIds, isAllSelected]);

  const pageNumbers = useMemo(() => {
    const groupStart = Math.floor((safeCurrentPage - 1) / 10) * 10 + 1;
    const groupEnd = Math.min(groupStart + 9, pageCount);
    return Array.from({ length: groupEnd - groupStart + 1 }, (_, index) => groupStart + index);
  }, [pageCount, safeCurrentPage]);

  const selectedFiles = useMemo(() => files.filter((file) => selectedIds.has(file.id)), [files, selectedIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, pageSize, query]);

  useEffect(() => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set();
      const validIds = new Set(files.map((file) => file.id));
      currentIds.forEach((id) => {
        if (validIds.has(id)) nextIds.add(id);
      });
      return nextIds;
    });
  }, [files]);

  function handleSelectAllToggle() {
    if (isAllSelected) {
      setSelectedIds((currentIds) => {
        const nextIds = new Set(currentIds);
        visibleFiles.forEach((file) => nextIds.delete(file.id));
        return nextIds;
      });
      return;
    }

    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      visibleFiles.forEach((file) => nextIds.add(file.id));
      return nextIds;
    });
  }

  function toggleSelected(fileId) {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(fileId)) {
        nextIds.delete(fileId);
      } else {
        nextIds.add(fileId);
      }
      return nextIds;
    });
  }

  return {
    activeCategory,
    currentPage: safeCurrentPage,
    filteredFiles,
    handleSelectAllToggle,
    isAllSelected,
    isSomeSelected,
    pageCount,
    pageNumbers,
    pageSize,
    query,
    selectedFile,
    selectedFiles,
    selectedIds,
    setActiveCategory,
    setCurrentPage,
    setPageSize,
    setQuery,
    setSelectedFile,
    setSelectedIds,
    toggleSelected,
    visibleFiles,
  };
}
