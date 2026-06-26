import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2, Copy } from "lucide-react";

interface PositionToolbarProps {
  selectedCount: number;
  canManage: boolean;
  onNew: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function PositionToolbar({
  selectedCount,
  canManage,
  onNew,
  onEdit,
  onDuplicate,
  onDelete,
}: PositionToolbarProps) {
  const { t } = useTranslation();

  if (!canManage) return null;

  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        onClick={onNew}
        disabled={selectedCount > 0}
        className="flex items-center px-4 py-2 bg-sky-600 text-white rounded shadow-sm hover:bg-sky-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {t("pos.new")}
      </button>
      <button
        onClick={onEdit}
        disabled={selectedCount !== 1}
        className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        <Edit2 className="w-4 h-4 mr-1.5" />
        {t("pos.edit")}
      </button>
      <button
        onClick={onDuplicate}
        disabled={selectedCount !== 1}
        className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        <Copy className="w-4 h-4 mr-1.5" />
        {t("pos.duplicate")}
      </button>
      <button
        onClick={onDelete}
        disabled={selectedCount === 0}
        className="flex items-center px-4 py-2 border border-red-300 dark:border-red-800 rounded shadow-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        <Trash2 className="w-4 h-4 mr-1.5" />
        {t("pos.delete")}
      </button>
    </div>
  );
}
