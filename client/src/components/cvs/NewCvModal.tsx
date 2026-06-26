import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

interface AvailablePosition {
  id: string;
  title: string;
  shortDescription: string;
  isPublic: boolean;
}

interface NewCvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewCvModal({ isOpen, onClose }: NewCvModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [positions, setPositions] = useState<AvailablePosition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    
    api.get<AvailablePosition[]>("/cvs/available-positions")
      .then(res => setPositions(res.data))
      .catch(() => setError("Failed to load available positions"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    
    try {
      const res = await api.post("/cvs", { positionId: selectedId });
      onClose();
      navigate(`/cvs/${res.data.id}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("You already have a CV for this position.");
      } else if (err.response?.status === 403) {
        setError(t("cv.conflict"));
      } else {
        setError(err.response?.data?.error || "Failed to create CV.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">
            {t("cv.new")}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
             <div className="flex justify-center p-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
             </div>
          ) : positions.length === 0 ? (
            <div className="text-center p-8 text-slate-500 dark:text-slate-400">
              {t("cv.noAvailable")}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t("cv.availablePositions")}
              </h3>
              {positions.map(pos => (
                <div 
                  key={pos.id}
                  onClick={() => setSelectedId(pos.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedId === pos.id 
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20" 
                      : "border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className={`font-medium ${selectedId === pos.id ? "text-sky-700 dark:text-sky-300" : "text-slate-900 dark:text-white"}`}>
                      {pos.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pos.isPublic 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}>
                      {pos.isPublic ? t("cv.publicHint") : t("cv.restrictedHint")}
                    </span>
                  </div>
                  {pos.shortDescription && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{pos.shortDescription}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
          >
            {t("cv.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedId}
            className="px-5 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 font-medium transition-colors"
          >
            {saving ? t("cv.create") + "..." : t("cv.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
