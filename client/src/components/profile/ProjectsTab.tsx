import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ReactTags } from "react-tag-autocomplete";
import type { Tag } from "react-tag-autocomplete";
import api from "../../lib/api";

interface Project {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  tags: string[];
  createdAt: string;
}

interface ProjectsTabProps {
  projects: Project[];
  onRefresh: () => void;
}

const styles = `
.react-tags {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.375rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  min-height: 2.5rem;
  align-items: center;
}
.dark .react-tags {
  background: #374151;
  border-color: #4b5563;
}
.react-tags__selected-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  background: #e0f2fe;
  color: #0284c7;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
}
.dark .react-tags__selected-tag {
  background: #0369a1;
  color: #e0f2fe;
}
.react-tags__search {
  flex-grow: 1;
  max-width: 100%;
}
.react-tags__search-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
}
.react-tags__listbox {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-top: 0.25rem;
}
.dark .react-tags__listbox {
  background: #1f2937;
  border-color: #374151;
}
.react-tags__listbox-option {
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}
.react-tags__listbox-option[aria-selected="true"] {
  background: #f3f4f6;
}
.dark .react-tags__listbox-option[aria-selected="true"] {
  background: #4b5563;
}
`;

function ProjectModal({
  project,
  onClose,
  onSave
}: {
  project?: Project;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(project?.name || "");
  const [startDate, setStartDate] = useState(
    project?.startDate ? format(parseISO(project.startDate), "yyyy-MM-dd") : ""
  );
  const [endDate, setEndDate] = useState(
    project?.endDate ? format(parseISO(project.endDate), "yyyy-MM-dd") : ""
  );
  const [description, setDescription] = useState(project?.description || "");
  const [tags, setTags] = useState<Tag[]>(
    (project?.tags || []).map(tag => ({ value: tag, label: tag }))
  );
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get<string[]>("/profile/project-tags").then(res => {
      setSuggestions(res.data.map(tag => ({ value: tag, label: tag })));
    });
  }, []);

  const onAdd = useCallback((newTag: Tag) => {
    setTags(prev => [...prev, newTag]);
  }, []);

  const onDelete = useCallback((index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name,
        startDate: startDate || null,
        endDate: endDate || null,
        description,
        tags: tags.map(t => t.label as string)
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">
            {project ? t("project.edit") : t("project.new")}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">{t("project.name")} *</label>
            <input required type="text" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">{t("project.startDate")}</label>
              <input type="date" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">{t("project.endDate")}</label>
              <input type="date" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">{t("project.tags")}</label>
            <div className="react-tags-wrapper">
              <ReactTags
                selected={tags}
                suggestions={suggestions}
                onAdd={onAdd}
                onDelete={onDelete}
                allowNew
                placeholderText="Add a tag"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2">
            <div className="flex flex-col">
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">{t("project.description")}</label>
              <textarea className="w-full flex-1 min-h-[250px] p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-mono text-sm resize-y" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">{t("project.preview")}</label>
              <div className="w-full flex-1 min-h-[250px] overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 prose dark:prose-invert max-w-none text-sm break-words">
                <ReactMarkdown>{description || "*No description provided.*"}</ReactMarkdown>
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-900/50">
          <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">
            {t("project.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={isSaving || !name.trim()} className="px-5 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 font-medium transition-colors">
            {isSaving ? t("project.save") + "..." : t("project.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectsTab({ projects, onRefresh }: ProjectsTabProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(projects.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleNew = () => {
    setEditingProject(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    const id = Array.from(selectedIds)[0];
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setEditingProject(proj);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("project.deleteConfirm"))) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id => api.delete(`/profile/projects/${id}`))
      );
      setSelectedIds(new Set());
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (data: any) => {
    if (editingProject) {
      await api.put(`/profile/projects/${editingProject.id}`, data);
    } else {
      await api.post("/profile/projects", data);
    }
    onRefresh();
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={handleNew}
          className="flex items-center px-4 py-2 bg-sky-600 text-white rounded shadow-sm hover:bg-sky-700 disabled:opacity-50 text-sm font-medium transition-colors"
          disabled={selectedIds.size > 0}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {t("project.new")}
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm font-medium transition-colors"
          disabled={selectedIds.size !== 1}
        >
          <Edit2 className="w-4 h-4 mr-1.5" />
          {t("project.edit")}
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center px-4 py-2 border border-red-300 dark:border-red-800 rounded shadow-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 text-sm font-medium transition-colors"
          disabled={selectedIds.size === 0}
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          {t("project.delete")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800"
                  checked={projects.length > 0 && selectedIds.size === projects.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("project.name")}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("project.period")}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("project.tags")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                  {t("project.noProjects")}
                </td>
              </tr>
            ) : (
              projects.map(project => {
                const start = project.startDate ? format(parseISO(project.startDate), "MMM yyyy") : "";
                const end = project.endDate ? format(parseISO(project.endDate), "MMM yyyy") : "Present";
                const period = start ? `${start} – ${end}` : (end !== "Present" ? `Until ${end}` : "");
                return (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800"
                        checked={selectedIds.has(project.id)}
                        onChange={e => handleSelect(project.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm">
                      {period}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {project.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
