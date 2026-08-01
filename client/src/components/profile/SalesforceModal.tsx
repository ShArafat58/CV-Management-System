import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import api from "../../lib/api";

interface SalesforceModalProps {
  open: boolean;
  onClose: () => void;
}

interface SyncResult {
  accountId: string;
  contactId: string;
}

const INDUSTRY_OPTIONS = ["Technology", "Finance", "Education", "Healthcare", "Retail", "Other"];

export function SalesforceModal({ open, onClose }: SalesforceModalProps) {
  const { t } = useTranslation();

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const resetForm = () => {
    setCompanyName("");
    setPhone("");
    setIndustry("");
    setWebsite("");
    setDescription("");
    setSyncing(false);
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSync = async () => {
    if (!companyName.trim() || syncing) return;
    setSyncing(true);
    setError(null);

    try {
      const body: Record<string, string> = { companyName: companyName.trim() };
      if (phone.trim()) body.phone = phone.trim();
      if (industry) body.industry = industry;
      if (website.trim()) body.website = website.trim();
      if (description.trim()) body.description = description.trim();

      const { data } = await api.post("/salesforce/sync", body);
      setResult({ accountId: data.accountId, contactId: data.contactId });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.details || t("sf.failed");
      setError(msg);
    } finally {
      setSyncing(false);
    }
  };

  if (!open) return null;

  const inputClasses =
    "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">{t("sf.title")}</h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("sf.help")}</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                {t("sf.success")}
              </div>
              <div className="text-xs font-mono text-green-600 dark:text-green-500 space-y-1">
                <div>Account ID: {result.accountId}</div>
                <div>Contact ID: {result.contactId}</div>
              </div>
            </div>
          )}

          {!result && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("sf.company")} *
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("sf.phone")}
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("sf.industry")}
                </label>
                <select
                  className={inputClasses}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value=""></option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("sf.website")}
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("sf.description")}
                </label>
                <textarea
                  className={inputClasses}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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
            {result ? t("common.close") : t("common.cancel")}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || !companyName.trim()}
              className="px-5 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 font-medium transition-colors inline-flex items-center gap-2"
            >
              {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
              {syncing ? t("sf.syncing") : t("sf.sync")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
