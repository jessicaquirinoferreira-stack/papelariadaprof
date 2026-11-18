import React, { useRef, useState } from 'react';
import { Film, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';

interface MediaDropzoneProps {
  images: string[];
  videoUrl: string;
  onChangeImages: (images: string[]) => void;
  onChangeVideoUrl: (url: string) => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

interface UploadResult {
  url: string;
  storage: string;
  originalBytes: number;
  optimizedBytes: number;
  format: string;
}

export function MediaDropzone({
  images,
  videoUrl,
  onChangeImages,
  onChangeVideoUrl,
  onNotify,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastCompressionInfo, setLastCompressionInfo] = useState('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const addedImages: string[] = [];

    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          onNotify(err.error || `Erro ao enviar ${file.name}.`, 'error');
          continue;
        }

        const data = (await res.json()) as UploadResult;
        if (data.format.startsWith('video/')) {
          onChangeVideoUrl(data.url);
          onNotify(`Vídeo enviado via ${data.storage === 'vercel-blob' ? 'Vercel Blob' : 'servidor otimizado'}.`);
        } else {
          addedImages.push(data.url);
          const savedPct =
            data.originalBytes > 0
              ? Math.max(0, Math.round((1 - data.optimizedBytes / data.originalBytes) * 100))
              : 0;
          setLastCompressionInfo(
            `Otimizada para WebP (${Math.round(data.optimizedBytes / 1024)} KB · -${savedPct}%) via ${data.storage === 'vercel-blob' ? 'Vercel Blob' : 'armazenamento otimizado'}`
          );
        }
      }

      if (addedImages.length > 0) {
        onChangeImages([...images, ...addedImages].slice(0, 8));
        onNotify(`${addedImages.length} imagem(ns) otimizada(s) e adicionada(s)!`);
      }
    } catch {
      onNotify('Falha de rede durante o upload de mídia.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#3D2A24]">
          Mídias do Produto (Imagens WebP + Vídeo)
        </span>
        {lastCompressionInfo && (
          <span className="text-[11px] text-[#15803D] font-semibold">
            {lastCompressionInfo}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
          dragging
            ? 'border-[#E89EB8] bg-[#FDEEF4]'
            : 'border-[#EFE4DE] bg-[#FDF8F5]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#6F4E42]" />
          ) : (
            <UploadCloud className="w-6 h-6 text-[#6F4E42]" aria-hidden="true" />
          )}
          <p className="text-xs text-[#3D2A24] font-semibold">
            Arraste fotos ou vídeo MP4 aqui, ou clique para selecionar
          </p>
          <p className="text-[11px] text-[#725B53]">
            Compressão automática sem perda perceptível no servidor (sharp WebP) + envio Vercel Blob
          </p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white border border-[#EFE4DE] text-xs font-semibold text-[#6F4E42] hover:bg-[#FDEEF4] transition-colors"
          >
            <ImagePlus className="w-3.5 h-3.5 text-[#6F4E42]" aria-hidden="true" />
            <span>Selecionar arquivos</span>
          </button>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-[#EFE4DE] bg-[#FAF3EE]"
            >
              <img
                src={url}
                alt={`Prévia ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChangeImages(images.filter((_, i) => i !== idx))}
                aria-label={`Remover imagem ${idx + 1}`}
                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 text-[#DC2626] opacity-90 hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {videoUrl && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#EFE4DE] bg-[#FDF8F5] text-xs">
          <span className="inline-flex items-center gap-2 truncate text-[#3D2A24]">
            <Film className="w-4 h-4 text-[#6F4E42] shrink-0" aria-hidden="true" />
            <span className="truncate">{videoUrl}</span>
          </span>
          <button
            type="button"
            onClick={() => onChangeVideoUrl('')}
            className="text-[#DC2626] font-semibold shrink-0"
          >
            Remover vídeo
          </button>
        </div>
      )}
    </div>
  );
}
