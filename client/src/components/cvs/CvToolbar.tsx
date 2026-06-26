import { useTranslation } from "react-i18next";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CvToolbarProps {
  selectedCount: number;
  selectedId: string | null;
  onNew: () => void;
  onDelete: () => void;
}

export function CvToolbar({
  selectedCount,
  selectedId,
  onNew,
  onDelete,
}: CvToolbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        onClick={onNew}
        disabled={selectedCount > 0}
        className="flex items-center px-4 py-2 bg-sky-600 text-white rounded shadow-sm hover:bg-sky-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {t("cv.new")}
      </button>
      <button
        onClick={() => {
          if (selectedId) navigate(`/cvs/${selectedId}`);
        }}
        disabled={selectedCount !== 1}
        className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        <FolderOpen className="w-4 h-4 mr-1.5" />
        {t("cv.open")}
      </button>
      <button
        onClick={onDelete}
        disabled={selectedCount === 0}
        className="flex items-center px-4 py-2 border border-red-300 dark:border-red-800 rounded shadow-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        <Trash2 className="w-4 h-4 mr-1.5" />
        {t("cv.delete")}
      </button>
    </div>
  );
}
