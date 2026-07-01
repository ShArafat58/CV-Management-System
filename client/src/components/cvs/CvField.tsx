import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import api from "../../lib/api";
import { ImageUpload } from "../common/ImageUpload";

interface CvAttribute {
  attributeId: string;
  name: string;
  category: string;
  dataType: string;
  options: string[];
  value: string;
}

interface CvFieldProps {
  cvId: string;
  attribute: CvAttribute;
  canEdit: boolean;
  onValueSaved?: (attributeId: string, value: string) => void;
}

export function CvField({ cvId, attribute, canEdit, onValueSaved }: CvFieldProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(attribute.value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(attribute.value);
  }, [attribute.value]);

  const handleSave = async (newValue: string) => {
    if (newValue === attribute.value && newValue === value) return; // no change
    setSaving(true);
    setSaved(false);
    try {
      await api.put(`/cvs/${cvId}/value`, {
        attributeId: attribute.attributeId,
        value: newValue,
      });
      onValueSaved?.(attribute.attributeId, newValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save value", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBlur = () => {
    handleSave(value);
  };

  const isEmpty = value.trim() === "";

  const renderEditable = () => {
    const inputClass = `w-full p-2 border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white transition-colors ${isEmpty
      ? "border-red-400 placeholder-red-400 dark:border-red-500"
      : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
      }`;

    switch (attribute.dataType) {
      case "TEXT":
        return (
          <textarea
            className={inputClass}
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={isEmpty ? t("cv.empty") : ""}
          />
        );
      case "NUMERIC":
        return (
          <input
            type="number"
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={isEmpty ? t("cv.empty") : ""}
          />
        );
      case "DATE":
        return (
          <input
            type="date"
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
          />
        );
      case "BOOLEAN":
        return (
          <div className="flex items-center h-full pt-2">
            <input
              type="checkbox"
              className={`w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 ${isEmpty ? "ring-2 ring-red-400" : ""
                }`}
              checked={value === "true"}
              onChange={(e) => {
                const checked = e.target.checked;
                const v = checked ? "true" : "false";
                setValue(v);
                handleSave(v);
              }}
            />
          </div>
        );
      case "ONE_OF_MANY":
        return (
          <select
            className={inputClass}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleSave(e.target.value);
            }}
            onBlur={handleBlur}
          >
            <option value="" disabled>
              {isEmpty ? t("cv.empty") : "--"}
            </option>
            {attribute.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "IMAGE":
        return (
          <ImageUpload
            value={value}
            onChange={(url) => {
              setValue(url);
              handleSave(url);
            }}
          />
        );
      default:
        return (
          <input
            type="text"
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={isEmpty ? t("cv.empty") : ""}
          />
        );
    }
  };

  const renderReadOnly = () => {
    if (attribute.dataType === "IMAGE") {
      return <ImageUpload value={value} onChange={() => { }} disabled />;
    }

    if (isEmpty) {
      return (
        <div className="w-full p-2 border border-red-300 dark:border-red-800/50 rounded bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 text-sm">
          {t("cv.empty")}
        </div>
      );
    }
    return (
      <div className="w-full p-2 border border-transparent text-slate-900 dark:text-white">
        {attribute.dataType === "BOOLEAN" ? (value === "true" ? "Yes" : "No") : value}
      </div>
    );
  };

  return (
    <div className="flex flex-col relative group">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {attribute.name}
        </label>
        <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {attribute.category.replace(/_/g, " ")}
        </span>
      </div>
      <div className="relative">
        {canEdit ? renderEditable() : renderReadOnly()}
        {saved && canEdit && (
          <span className="absolute -top-6 right-0 text-xs text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-bottom-1">
            <Check className="w-3 h-3 mr-1" />
            {t("cv.saved")}
          </span>
        )}
        {saving && canEdit && (
          <span className="absolute -top-6 right-0 text-xs text-slate-400 flex items-center px-2 py-0.5">
            <div className="animate-spin w-3 h-3 border-b-2 border-sky-500 rounded-full mr-1" />
            ...
          </span>
        )}
      </div>
    </div>
  );
}
