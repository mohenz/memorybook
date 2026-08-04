const imageTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']);
const textTypes = new Set(['text/plain', 'text/markdown', 'text/csv', 'application/json']);
const documentExtensions = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);

export function getFileExtension(filename) {
  return filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
}

export function getFileCategory(file) {
  if (imageTypes.has(file.type)) return 'image';
  if (textTypes.has(file.type)) return 'text';

  const extension = getFileExtension(file.name);
  if (extension && documentExtensions.has(extension)) return 'document';

  return 'other';
}

export function getFileInitial(category) {
  const labels = {
    image: 'IMG',
    text: 'TXT',
    document: 'DOC',
    other: 'FILE',
  };

  return labels[category] ?? labels.other;
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
