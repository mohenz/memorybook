import { archivePolicy } from '../config/archivePolicy.js';
import { formatBytes, getFileExtension } from './fileTypes.js';

export function validateArchiveFiles({ files, usedBytes }) {
  const accepted = [];
  const rejected = [];
  let nextUsedBytes = usedBytes;

  for (const file of files) {
    const extension = getFileExtension(file.name);

    if (archivePolicy.blockedExtensions.has(extension)) {
      rejected.push(`${file.name}: 실행 가능한 파일 형식은 차단됩니다.`);
      continue;
    }

    if (file.size > archivePolicy.maxFileBytes) {
      rejected.push(`${file.name}: 단일 파일 최대 ${formatBytes(archivePolicy.maxFileBytes)}를 초과했습니다.`);
      continue;
    }

    if (nextUsedBytes + file.size > archivePolicy.storageLimitBytes) {
      rejected.push(`${file.name}: 사용자 총 저장 용량 ${formatBytes(archivePolicy.storageLimitBytes)}를 초과합니다.`);
      continue;
    }

    accepted.push(file);
    nextUsedBytes += file.size;
  }

  return { accepted, rejected };
}

