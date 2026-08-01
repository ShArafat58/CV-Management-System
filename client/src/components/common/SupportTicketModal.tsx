import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface SupportTicketModalProps {
  open: boolean;
  onClose: () => void;
}

export function SupportTicketModal({ open, onClose }: SupportTicketModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<"High" | "Average" | "Low">("Average");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string | null>(null);

  const resetForm = () => {
    setSummary("");
    setPriority("Average");
    setSending(false);
    setError(null);
    setResultFileName(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSend = async () => {
    if (!summary.trim() || sending) return;
    setSending(true);
    setError(null);

    const currentPath = window.location.pathname;
    const posMatch = currentPath.match(/^\/positions\/([^/]+)/);
    const positionId = posMatch ? posMatch[1] : "";

    try {
      const { data } = await api.post("/tickets", {
        summary: summary.trim(),
        priority,
        link: window.location.href,
        positionId,
      });
      setResultFileName(data.fileName);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.details || t("ticket.failed");
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const currentLink = window.location.href;
  const reportedBy = user ? `${user.displayName} (${user.role})` : "";

  const inputClasses =
    "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">{t("ticket.title")}</h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5">
            <div>{t("ticket.reportedBy")}: {reportedBy}</div>
            <div className="truncate">{t("ticket.link")}: {currentLink}</div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {resultFileName && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                {t("ticket.success")}
              </div>
              <div className="text-xs font-mono text-green-600 dark:text-green-500">
                {resultFileName}
              </div>
            </div>
          )}

          {!resultFileName && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("ticket.summary")} *
                </label>
                <textarea
                  className={inputClasses}
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("ticket.priority")}
                </label>
                <select
                  className={inputClasses}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "High" | "Average" | "Low")}
                >
                  <option value="High">{t("ticket.high")}</option>
                  <option value="Average">{t("ticket.average")}</option>
                  <option value="Low">{t("ticket.low")}</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            {resultFileName ? t("common.close") : t("common.cancel")}
          </button>
          {!resultFileName && (
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !summary.trim()}
              className="px-5 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 font-medium transition-colors inline-flex items-center gap-2"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sending ? t("ticket.sending") : t("ticket.send")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
