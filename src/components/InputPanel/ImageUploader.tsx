"use client";

import { useCallback } from "react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

const MAX_IMAGES = 3;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE) {
      reject(new Error("图片不能超过 5MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("读取失败"));
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({ images, onChange }: Props) {
  const addImages = useCallback(
    async (files: FileList | File[]) => {
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) return;

      const toAdd = Array.from(files).slice(0, remaining);
      try {
        const base64List = await Promise.all(toAdd.map(fileToBase64));
        onChange([...images, ...base64List]);
      } catch (e) {
        console.warn('[ImageUploader] fileToBase64 failed', e);
        // 图片太大或读取失败，静默忽略
      }
    },
    [images, onChange]
  );

  const removeImage = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange]
  );

  return (
    <div>
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {images.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt={`上传图片 ${i + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
              <button
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-[10px] opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(i)}
                aria-label={`删除图片 ${i + 1}`}
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        id="image-upload-input"
        onChange={(e) => {
          if (e.target.files) addImages(e.target.files);
          e.target.value = "";
        }}
      />

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => document.getElementById("image-upload-input")?.click()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          上传图片 ({images.length}/{MAX_IMAGES})
        </button>
      )}
    </div>
  );
}
