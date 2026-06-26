import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, AlertCircle } from "lucide-react";
import api from "../../lib/api";
import { AccessRuleEditor } from "./AccessRuleEditor";

export interface LibAttribute {
  id: string;
  name: string;
  category: string;
  dataType: string;
  options: string[];
  isBuiltIn?: boolean;
}

export interface AccessRule {
  attributeId: string;
  operator: string;
  value: string;
}

interface PositionDetail {
  id: string;
  title: string;
  shortDescription: string;
  isPublic: boolean;
  accessRules: AccessRule[];
  maxProjects: number;
  projectTags: string[];
  version: number;
  attributes: { sortOrder: number; attribute: LibAttribute }[];
}

interface PositionModalProps {
  isOpen: boolean;
  editId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PositionModal({ isOpen, editId, onClose, onSaved }: PositionModalProps) {
  const { t } = useTranslation();
  const isEdit = !!editId;

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [maxProjects, setMaxProjects] = useState(3);
  const [projectTags, setProjectTags] = useState("");
  const [selectedAttrs, setSelectedAttrs] = useState<LibAttribute[]>([]);
  const [version, setVersion] = useState(1);

  const [allAttributes, setAllAttributes] = useState<LibAttribute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaving(false);
    api.get<LibAttribute[]>("/attributes").then((res) => setAllAttributes(res.data));

    if (editId) {
      setLoading(true);
      api
        .get<PositionDetail>(`/positions/${editId}`)
        .then((res) => {
          const d = res.data;
          setTitle(d.title);
          setShortDescription(d.shortDescription);
          setIsPublic(d.isPublic);
          setAccessRules(Array.isArray(d.accessRules) ? d.accessRules : []);
          setMaxProjects(d.maxProjects);
          setProjectTags(d.projectTags.join(", "));
          setSelectedAttrs(d.attributes.map((a) => a.attribute));
          setVersion(d.version);
        })
        .finally(() => setLoading(false));
    } else {
      setTitle("");
      setShortDescription("");
      setIsPublic(true);
      setAccessRules([]);
      setMaxProjects(3);
      setProjectTags("");
      setSelectedAttrs([]);
      setVersion(1);
    }
  }, [isOpen, editId]);

  const handleAddAttr = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const attr = allAttributes.find((a) => a.id === id);
    if (attr && !selectedAttrs.find((a) => a.id === id)) {
      setSelectedAttrs((prev) => [...prev, attr]);
    }
    e.target.value = "";
  };

  const handleRemoveAttr = (id: string) => {
    setSelectedAttrs((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    const tagsArray = projectTags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body: any = {
      title: title.trim(),
      shortDescription,
      isPublic,
      accessRules: isPublic ? [] : accessRules,
      maxProjects,
      projectTags: tagsArray,
      attributeIds: selectedAttrs.map((a) => a.id),
    };

    try {
      if (isEdit) {
        body.version = version;
        await api.put(`/positions/${editId}`, body);
      } else {
        await api.post("/positions", body);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(t("pos.versionConflict"));
      } else {
        setError(err.response?.data?.error || "Failed to save position");
      }
    } finally {
      setSaving(false);
    }
  };

  const availableAttrs = allAttributes.filter((a) => !selectedAttrs.find((s) => s.id === a.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">
            {isEdit ? t("pos.edit") : t("pos.new")}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                {t("pos.name")} *
              </label>
              <input
                type="text"
                required
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                {t("pos.shortDesc")}
              </label>
              <textarea
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                rows={3}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                {t("pos.visibility")}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t("pos.public")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t("pos.restricted")}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                {t("pos.attributes")}
              </label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
                {selectedAttrs.map((attr) => (
                  <span
                    key={attr.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 rounded-full text-xs font-medium"
                  >
                    {attr.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttr(attr.id)}
                      className="hover:text-red-500 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <select
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value=""
                onChange={handleAddAttr}
              >
                <option value="" disabled>
                  {t("pos.addAttribute")}
                </option>
                {availableAttrs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>

            {!isPublic && (
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("pos.accessRules")}
                </label>
                <AccessRuleEditor rules={accessRules} allAttributes={allAttributes} onChange={setAccessRules} />
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("pos.maxProjects")}
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  value={maxProjects}
                  onChange={(e) => setMaxProjects(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {t("pos.projectTags")}
                </label>
                <input
                  type="text"
                  placeholder="tag1, tag2, tag3"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  value={projectTags}
                  onChange={(e) => setProjectTags(e.target.value)}
                />
              </div>
            </div>
          </form>
        )}

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
          >
            {t("pos.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="px-5 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 font-medium transition-colors"
          >
            {saving ? t("pos.save") + "..." : t("pos.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
