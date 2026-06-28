import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Briefcase, Users, UserCheck, FileText, Clock } from "lucide-react";
import api from "../lib/api";

interface HomeStats {
  totalPositions: number;
  totalCandidates: number;
  totalRecruiters: number;
  totalCvs: number;
  cvsLast24h: number;
}

interface PositionShort {
  id: string;
  title: string;
  shortDescription?: string;
  isPublic: boolean;
  createdAt?: string;
  cvCount: number;
}

interface TagCloudItem {
  tag: string;
  count: number;
}

interface HomeData {
  stats: HomeStats;
  latestPositions: PositionShort[];
  popularPositions: PositionShort[];
  tagCloud: TagCloudItem[];
}

export function Home() {
  const { t } = useTranslation();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get<HomeData>("/home")
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || "Failed to load home data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500 dark:text-red-400">
        {error || "Failed to load"}
      </div>
    );
  }

  const { stats, latestPositions, popularPositions, tagCloud } = data;

  // Compute min/max for tag cloud
  const counts = tagCloud.map(t => t.count);
  const minCount = counts.length > 0 ? Math.min(...counts) : 0;
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

  const getFontSize = (count: number) => {
    if (minCount === maxCount) return "1rem";
    const ratio = (count - minCount) / (maxCount - minCount);
    // Scale between 0.8rem and 2rem
    return `${0.8 + ratio * 1.2}rem`;
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      <header className="text-center py-10 bg-gradient-to-b from-sky-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          {t("home.welcomeTitle")}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t("home.welcomeTagline")}
        </p>
      </header>

      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <Briefcase className="w-8 h-8 text-sky-500 mb-3" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.totalPositions}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("home.statsPositions")}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <Users className="w-8 h-8 text-emerald-500 mb-3" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.totalCandidates}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("home.statsCandidates")}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <UserCheck className="w-8 h-8 text-indigo-500 mb-3" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.totalRecruiters}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("home.statsRecruiters")}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <FileText className="w-8 h-8 text-amber-500 mb-3" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.totalCvs}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("home.statsCvs")}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <Clock className="w-8 h-8 text-rose-500 mb-3" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.cvsLast24h}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("home.statsCvsLast24h")}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            {t("home.latestPositions")}
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("pos.name")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("pos.visibility")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("home.cvs")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
                {latestPositions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                      {t("home.noPositionsYet")}
                    </td>
                  </tr>
                ) : (
                  latestPositions.map((pos) => (
                    <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/positions/${pos.id}`}
                          className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:underline transition-colors"
                        >
                          {pos.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pos.isPublic
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}>
                          {pos.isPublic ? t("home.visibilityPublic") : t("home.visibilityRestricted")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {pos.cvCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            {t("home.popularPositions")}
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("pos.name")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("home.cvs")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
                {popularPositions.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500 text-sm">
                      {t("home.noPositionsYet")}
                    </td>
                  </tr>
                ) : (
                  popularPositions.map((pos) => (
                    <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/positions/${pos.id}`}
                          className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:underline transition-colors"
                        >
                          {pos.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {pos.cvCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8">
          {t("home.tagCloud")}
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-4xl mx-auto">
          {tagCloud.length === 0 ? (
            <p className="text-slate-500">{t("home.noCvsYet")}</p>
          ) : (
            tagCloud.map((item) => (
              <Link
                key={item.tag}
                to={`/search?tag=${encodeURIComponent(item.tag)}`}
                style={{ fontSize: getFontSize(item.count) }}
                className="font-medium px-2 py-1 rounded transition-colors text-sky-600 hover:text-sky-800 hover:bg-sky-50 dark:text-sky-400 dark:hover:text-sky-200 dark:hover:bg-sky-900/30"
                title={`${item.count} usage(s)`}
              >
                {item.tag}
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
