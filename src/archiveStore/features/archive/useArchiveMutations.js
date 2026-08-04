import { useState } from 'react';
import { validateArchiveFiles } from '../../core/fileValidation.js';
import { deleteArchiveFile, uploadArchiveFile } from './archiveService.js';
import { deleteLocalFile, uploadLocalFile } from './localArchiveApi.js';

function getDeleteErrorMessage(error) {
  switch (error?.code) {
    case 'storage/unauthorized':
      return '스토리지 파일 삭제 권한이 없습니다. Supabase Storage RLS를 확인하세요.';
    case 'permission-denied':
      return '파일 목록 삭제 권한이 없습니다. Supabase RLS를 확인하세요.';
    default:
      return error?.message || '파일 삭제에 실패했습니다.';
  }
}

function getUploadErrorMessage(error) {
  switch (error?.code) {
    case 'storage/unauthorized':
      return '스토리지 파일 업로드 권한이 없습니다. Supabase Storage RLS를 확인하세요.';
    case 'permission-denied':
      return '파일 목록 저장 권한이 없습니다. Supabase RLS를 확인하세요.';
    case 'storage/canceled':
      return '파일 업로드가 취소되었습니다.';
    case 'storage/retry-limit-exceeded':
      return '네트워크 문제로 파일 업로드를 완료하지 못했습니다. 잠시 후 다시 시도하세요.';
    default:
      return error?.message || '파일 업로드에 실패했습니다.';
  }
}

export function useArchiveMutations({
  dataBackend,
  supabaseReady,
  selectedFile,
  setFiles,
  setSelectedFile,
  setSelectedIds,
  usedBytes,
  userId,
}) {
  const [mutationStatus, setMutationStatus] = useState('');

  async function handleFiles(nextFiles) {
    if (!nextFiles.length) return;

    const { accepted, rejected } = validateArchiveFiles({ files: nextFiles, usedBytes });
    if (rejected.length) {
      setMutationStatus(rejected.join(' '));
    }

    if (!accepted.length) return;

    if (dataBackend === 'local-api') {
      for (const file of accepted) {
        setMutationStatus(`${file.name} 로컬 업로드 준비`);
        const uploadedFile = await uploadLocalFile(file);
        setFiles((currentFiles) => [uploadedFile, ...currentFiles]);
      }
      setMutationStatus('로컬 업로드 완료');
      return;
    }

    if (!supabaseReady) {
      setMutationStatus('Supabase 설정 후 업로드할 수 있습니다.');
      return;
    }

    if (!userId) {
      setMutationStatus('로그인 후 업로드할 수 있습니다.');
      return;
    }

    try {
      for (const file of accepted) {
        setMutationStatus(`${file.name} 업로드 준비`);
        const uploadedFile = await uploadArchiveFile({
          file,
          userId,
          onProgress: (progress) => setMutationStatus(`${file.name} ${progress}%`),
        });
        setFiles((currentFiles) => [uploadedFile, ...currentFiles.filter((item) => item.id !== uploadedFile.id)]);
      }
      setMutationStatus('업로드 완료');
    } catch (error) {
      setMutationStatus(getUploadErrorMessage(error));
    }
  }

  async function deleteFiles(targetFiles, label) {
    if (!targetFiles.length) return;

    const confirmed = window.confirm(`${label} ${targetFiles.length}개 파일을 삭제할까요? 삭제한 파일은 복구할 수 없습니다.`);
    if (!confirmed) return;

    setMutationStatus(`${targetFiles.length}개 파일 삭제 중`);
    try {
      if (dataBackend === 'local-api') {
        for (const file of targetFiles) {
          await deleteLocalFile(file.id);
        }
      } else {
        if (!userId) {
          setMutationStatus('로그인 후 삭제할 수 있습니다.');
          return;
        }

        for (const file of targetFiles) {
          await deleteArchiveFile({ file, userId });
        }
      }

      const deletedIds = new Set(targetFiles.map((file) => file.id));
      setFiles((currentFiles) => currentFiles.filter((file) => !deletedIds.has(file.id)));
      setSelectedIds((currentIds) => {
        const nextIds = new Set(currentIds);
        deletedIds.forEach((id) => nextIds.delete(id));
        return nextIds;
      });
      if (selectedFile && deletedIds.has(selectedFile.id)) {
        setSelectedFile(null);
      }
      setMutationStatus(`${targetFiles.length}개 파일 삭제 완료`);
    } catch (error) {
      setMutationStatus(getDeleteErrorMessage(error));
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    handleFiles(Array.from(event.dataTransfer.files));
  }

  function handlePaste(event) {
    const pastedFiles = Array.from(event.clipboardData.files);
    if (pastedFiles.length) {
      handleFiles(pastedFiles);
      return;
    }

    const text = event.clipboardData.getData('text/plain');
    if (text) {
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], `clipboard_${Date.now()}.txt`, { type: 'text/plain' });
      handleFiles([file]);
    }
  }

  return {
    deleteFiles,
    handleDrop,
    handleFiles,
    handlePaste,
    mutationStatus,
  };
}
