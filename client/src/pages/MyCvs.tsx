import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { CvTable, type CvListItem } from "../components/cvs/CvTable";
import { CvToolbar } from "../components/cvs/CvToolbar";
import { NewCvModal } from "../components/cvs/NewCvModal";

export function MyCvs() {
  const { t } = useTranslation();

  const [cvs, setCvs] = useState<CvListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCvs = useCallback(async () => {
    try {
      const res = await api.get<CvListItem[]>("/cvs");
      setCvs(res.data);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to fetch CVs", error);
    }
  }, []);

  useEffect(() => {
    fetchCvs();
  }, [fetchCvs]);

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === cvs.length && cvs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cvs.map((c) => c.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(t("cv.deleteConfirm"))) return;
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await api.delete(`/cvs/${id}`);
      }
      await fetchCvs();
    } catch (error) {
      console.error("Failed to delete CVs", error);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t("cv.title")}</h1>

        <CvToolbar
          selectedCount={selectedIds.size}
          selectedId={selectedIds.size === 1 ? Array.from(selectedIds)[0] : null}
          onNew={() => setIsModalOpen(true)}
          onDelete={handleDelete}
        />

        <CvTable
          cvs={cvs}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />
      </div>

      <NewCvModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
