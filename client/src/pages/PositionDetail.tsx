import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { Discussion } from "../components/discussions/Discussion";

interface AttributeDetail {
  sortOrder: number;
  attribute: {
    id: string;
    name: string;
    category: string;
    dataType: string;
    options: string[];
  };
}

interface PositionDetailData {
  id: string;
  title: string;
  shortDescription: string;
  isPublic: boolean;
  accessRules: any[];
  maxProjects: number;
  projectTags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  attributes: AttributeDetail[];
}

export function PositionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [position, setPosition] = useState<PositionDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "discussion">("details");

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const res = await api.get<PositionDetailData>(`/positions/${id}`);
        setPosition(res.data);
      } catch (error) {
        console.error("Failed to fetch position details", error);
      }
    };
    if (id) {
      fetchPosition();
    }
  }, [id]);

  if (!position) {
    return <div className="p-4 max-w-6xl mx-auto text-slate-500">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {position.title}
        </h1>
        {position.shortDescription && (
          <p className="text-slate-600 dark:text-slate-300 mb-4">{position.shortDescription}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
            {position.isPublic ? t("pos.public") : t("pos.restricted")}
          </span>
          <span>{position.attributes.length} {t("pos.attributes")}</span>
          <span>{t("pos.maxProjects")}: {position.maxProjects}</span>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${
              activeTab === "details"
                ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t("pos.detailsTab")}
          </button>
          <button
            onClick={() => setActiveTab("discussion")}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${
              activeTab === "discussion"
                ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t("pos.discussionTab")}
          </button>
        </div>
      </div>

      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t("pos.attributes")}
            </h3>
            {position.attributes.length === 0 ? (
              <p className="text-slate-500">No attributes.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {position.attributes.map((attr) => (
                  <li key={attr.attribute.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {attr.attribute.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {attr.attribute.category}
                      </div>
                    </div>
                    <div className="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {attr.attribute.dataType}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t("pos.projectTags")}
            </h3>
            {position.projectTags.length === 0 ? (
              <p className="text-slate-500">No tags.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {position.projectTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "discussion" && <Discussion positionId={position.id} />}
    </div>
  );
}
