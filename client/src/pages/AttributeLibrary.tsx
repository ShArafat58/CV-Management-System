import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Attribute, AttributeCategory } from "../types/attribute";
import { AttributeTable } from "../components/attributes/AttributeTable";
import { AttributeToolbar } from "../components/attributes/AttributeToolbar";
import { AttributeModal } from "../components/attributes/AttributeModal";

const CATEGORIES: AttributeCategory[] = ["CERTIFICATION", "DOMAIN_KNOWLEDGE", "PERSONAL_INFORMATION", "SOFT_SKILLS"];

export function AttributeLibrary() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalData, setModalData] = useState<Attribute | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const canManage = user?.role === "RECRUITER" || user?.role === "ADMIN";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAttributes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryFilter) params.append("category", categoryFilter);
      
      const res = await api.get(`/attributes?${params.toString()}`);
      setAttributes(res.data);
      // Clear selection on refresh
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to fetch attributes", error);
    }
  }, [debouncedSearch, categoryFilter]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleToggleSelect = (id: string) => {
    if (!canManage) return;
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleToggleSelectAll = () => {
    if (!canManage) return;
    if (selectedIds.size === attributes.length && attributes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(attributes.map(a => a.id)));
    }
  };

  const handleNew = () => {
    setModalMode("create");
    setModalData(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    const attr = attributes.find(a => a.id === id);
    if (attr) {
      setModalMode("edit");
      setModalData(attr);
      setModalError(null);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(t("attr.deleteConfirm"))) {
      try {
        const ids = Array.from(selectedIds);
        for (const id of ids) {
          await api.delete(`/attributes/${id}`);
        }
        await fetchAttributes();
        alert(t("attr.deleteSuccess"));
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete some attributes");
      }
    }
  };

  const handleSaveModal = async (data: any) => {
    setModalError(null);
    try {
      if (modalMode === "create") {
        await api.post("/attributes", data);
      } else {
        await api.put(`/attributes/${modalData!.id}`, data);
      }
      setIsModalOpen(false);
      await fetchAttributes();
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to save attribute";
      setModalError(msg);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t("attr.title")}</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder={t("attr.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">{t("attr.allCategories")}</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <AttributeToolbar
          selectedCount={selectedIds.size}
          onNew={handleNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canManage={canManage}
        />

        <AttributeTable
          attributes={attributes}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          canManage={canManage}
        />
      </div>

      <AttributeModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={modalData}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        error={modalError}
      />
    </div>
  );
}
