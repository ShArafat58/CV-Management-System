import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2 } from "lucide-react";
import type { Attribute, AttributeCategory, AttributeDataType } from "../../types/attribute";

const CATEGORIES: AttributeCategory[] = ["CERTIFICATION", "DOMAIN_KNOWLEDGE", "PERSONAL_INFORMATION", "SOFT_SKILLS"];
const DATA_TYPES: AttributeDataType[] = ["STRING", "TEXT", "IMAGE", "NUMERIC", "DATE", "PERIOD", "BOOLEAN", "ONE_OF_MANY"];

interface AttributeModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData: Attribute | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  error: string | null;
}

export function AttributeModal({ isOpen, mode, initialData, onClose, onSave, error }: AttributeModalProps) {
  const { t } = useTranslation();
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AttributeCategory>("CERTIFICATION");
  const [dataType, setDataType] = useState<AttributeDataType>("STRING");
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setName(initialData.name);
        setCategory(initialData.category);
        setDataType(initialData.dataType);
        setOptions(initialData.options || []);
      } else {
        setName("");
        setCategory("CERTIFICATION");
        setDataType("STRING");
        setOptions([]);
      }
      setNewOption("");
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (newOption.trim() !== "") {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave({ name, category, dataType, options });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {mode === "create" ? t("attr.new") : t("attr.edit")}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("attr.name")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("attr.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AttributeCategory)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("attr.dataType")}</label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as AttributeDataType)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {DATA_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
            </select>
          </div>

          {dataType === "ONE_OF_MANY" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("attr.options")}</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddOption(); } }}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {options.map((opt, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                    <span className="text-sm text-slate-800 dark:text-slate-200">{opt}</span>
                    <button type="button" onClick={() => handleRemoveOption(idx)} className="text-rose-500 hover:text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {options.length === 0 && (
                <p className="text-xs text-rose-500 mt-1">At least one option is required.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              {t("attr.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (dataType === "ONE_OF_MANY" && options.length === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "..." : t("attr.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
