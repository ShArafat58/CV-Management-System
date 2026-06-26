import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export interface CvListItem {
  id: string;
  positionId: string;
  positionTitle: string;
  createdAt: string;
  updatedAt: string;
  hidden: boolean;
  likesCount: number;
}

interface CvTableProps {
  cvs: CvListItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function CvTable({
  cvs,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: CvTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                checked={cvs.length > 0 && selectedIds.size === cvs.length}
                onChange={onToggleSelectAll}
              />
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cv.position")}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cv.likes")}
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cv.updated")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
          {cvs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                {t("cv.noCvs")}
              </td>
            </tr>
          ) : (
            cvs.map((cv) => (
              <tr key={cv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                    checked={selectedIds.has(cv.id)}
                    onChange={() => onToggleSelect(cv.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/cvs/${cv.id}`}
                    className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors"
                  >
                    {cv.positionTitle}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-sm">
                  {cv.likesCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-sm">
                  {new Date(cv.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
