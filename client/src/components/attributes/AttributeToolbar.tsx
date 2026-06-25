import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface AttributeToolbarProps {
  selectedCount: number;
  onNew: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
}

export function AttributeToolbar({ selectedCount, onNew, onEdit, onDelete, canManage }: AttributeToolbarProps) {
  const { t } = useTranslation();

  if (!canManage) return null;

  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      {selectedCount === 0 && (
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("attr.new")}
        </button>
      )}
      
      {selectedCount === 1 && (
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          {t("attr.edit")}
        </button>
      )}

      {selectedCount > 0 && (
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t("attr.delete")}
        </button>
      )}
    </div>
  );
}
