import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { PositionsTable } from "../components/positions/PositionsTable";
import { PositionToolbar } from "../components/positions/PositionToolbar";
import { PositionModal } from "../components/positions/PositionModal";

interface PositionListItem {
  id: string;
  title: string;
  shortDescription: string;
  isPublic: boolean;
  maxProjects: number;
  projectTags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  _count: { cvs: number };
}

export function Positions() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [positions, setPositions] = useState<PositionListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const canManage = user?.role === "RECRUITER" || user?.role === "ADMIN";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPositions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      const res = await api.get<PositionListItem[]>(`/positions?${params.toString()}`);
      setPositions(res.data);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to fetch positions", error);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleToggleSelect = (id: string) => {
    if (!canManage) return;
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleToggleSelectAll = () => {
    if (!canManage) return;
    if (selectedIds.size === positions.length && positions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(positions.map((p) => p.id)));
    }
  };

  const handleNew = () => {
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    setEditId(id);
    setIsModalOpen(true);
  };

  const handleClickTitle = (id: string) => {
    if (!canManage) return;
    setEditId(id);
    setIsModalOpen(true);
  };

  const handleDuplicate = async () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    try {
      await api.post(`/positions/${id}/duplicate`);
      await fetchPositions();
    } catch (error) {
      console.error("Failed to duplicate position", error);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(t("pos.deleteConfirm"))) return;
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await api.delete(`/positions/${id}`);
      }
      await fetchPositions();
    } catch (error) {
      console.error("Failed to delete positions", error);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t("pos.title")}</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder={t("pos.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <PositionToolbar
          selectedCount={selectedIds.size}
          canManage={canManage}
          onNew={handleNew}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />

        <PositionsTable
          positions={positions}
          selectedIds={selectedIds}
          canManage={canManage}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onClickTitle={handleClickTitle}
        />
      </div>

      <PositionModal
        isOpen={isModalOpen}
        editId={editId}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchPositions}
      />
    </div>
  );
}
