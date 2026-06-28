import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setUploading(true);
    setError(null);
    
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      onChange(data.secure_url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: uploading || disabled
  });

  if (disabled) {
    if (!value) {
      return (
        <div className="w-full p-4 border border-red-300 dark:border-red-800/50 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 flex flex-col items-center justify-center text-sm min-h-[128px]">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
          {t("common.noPhoto")}
        </div>
      );
    }
    return (
      <div className="relative inline-block">
        <img src={value} alt="Profile" className="w-32 h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" />
      </div>
    );
  }

  if (value) {
    return (
      <div className="relative inline-block group mt-2">
        <img src={value} alt="Profile" className="w-32 h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange("");
          }}
          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title={t("common.removeImage")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors min-h-[128px] flex flex-col justify-center items-center mt-2
        ${isDragActive ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20" : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"}
        ${uploading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />
      <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${isDragActive ? "text-sky-500" : "text-slate-400"}`} />
      {uploading ? (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">{t("common.uploading")}</p>
      ) : (
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("common.uploadImage")}
        </p>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
