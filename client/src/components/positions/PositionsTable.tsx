import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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

interface PositionsTableProps {
  positions: PositionListItem[];
  selectedIds: Set<string>;
  canManage: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;

}

export function PositionsTable({
  positions,
  selectedIds,
  canManage,
  onToggleSelect,
  onToggleSelectAll,

}: PositionsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            {canManage && (
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                  checked={positions.length > 0 && selectedIds.size === positions.length}
                  onChange={onToggleSelectAll}
                />
              </th>
            )}
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("pos.name")}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("pos.visibility")}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("pos.cvs")}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("pos.updated")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
          {positions.length === 0 ? (
            <tr>
              <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                {t("pos.noPositions")}
              </td>
            </tr>
          ) : (
            positions.map((pos) => (
              <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                {canManage && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                      checked={selectedIds.has(pos.id)}
                      onChange={() => onToggleSelect(pos.id)}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/positions/${pos.id}`}
                    className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors"
                  >
                    {pos.title}
                  </Link>
                  {pos.shortDescription && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs truncate">
                      {pos.shortDescription}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pos.isPublic
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                  >
                    {pos.isPublic ? t("pos.public") : t("pos.restricted")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-sm">
                  {pos._count.cvs}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-sm">
                  {new Date(pos.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
