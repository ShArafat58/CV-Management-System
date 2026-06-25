import { useTranslation } from "react-i18next";
import type { Attribute } from "../../types/attribute";

interface AttributeTableProps {
  attributes: Attribute[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  canManage: boolean;
}

export function AttributeTable({ attributes, selectedIds, onToggleSelect, onToggleSelectAll, canManage }: AttributeTableProps) {
  const { t } = useTranslation();
  const allSelected = attributes.length > 0 && selectedIds.size === attributes.length;

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          <tr>
            {canManage && (
              <th className="p-4 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 bg-white dark:bg-slate-800"
                />
              </th>
            )}
            <th className="p-4 font-medium">{t("attr.name")}</th>
            <th className="p-4 font-medium">{t("attr.category")}</th>
            <th className="p-4 font-medium">{t("attr.dataType")}</th>
            <th className="p-4 font-medium">{t("attr.createdAt")}</th>
          </tr>
        </thead>
        <tbody>
          {attributes.length === 0 ? (
            <tr>
              <td colSpan={canManage ? 5 : 4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                No attributes found.
              </td>
            </tr>
          ) : (
            attributes.map((attr) => (
              <tr key={attr.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                {canManage && (
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(attr.id)}
                      onChange={() => onToggleSelect(attr.id)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 bg-white dark:bg-slate-800"
                    />
                  </td>
                )}
                <td className="p-4 font-medium text-slate-900 dark:text-white">{attr.name}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {attr.category.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-4">{attr.dataType.replace(/_/g, " ")}</td>
                <td className="p-4 text-slate-500">{new Date(attr.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
