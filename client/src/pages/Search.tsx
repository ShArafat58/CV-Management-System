import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";

interface PositionShort {
  id: string;
  title: string;
  shortDescription?: string;
  isPublic: boolean;
}

interface AttributeShort {
  id: string;
  name: string;
  category: string;
  dataType: string;
}

interface SearchResults {
  positions: PositionShort[];
  attributes: AttributeShort[];
  tags: string[];
}

export function Search() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const searchTerm = tag || q;

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    api.get<SearchResults>(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
      .then((res) => setResults(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to search"))
      .finally(() => setLoading(false));
  }, [searchTerm]);

  const isEmpty = results && results.positions.length === 0 && results.attributes.length === 0 && results.tags.length === 0;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="border-b border-slate-200 dark:border-slate-700 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {tag ? t("search.resultsForTag") : t("search.resultsFor")} <span className="text-sky-600 dark:text-sky-400">"{searchTerm}"</span>
        </h1>
      </header>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
        </div>
      )}

      {error && (
        <div className="p-8 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}

      {!loading && !error && isEmpty && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          {t("search.noResults").replace("{{term}}", searchTerm)}
        </div>
      )}

      {!loading && !error && results && !isEmpty && (
        <div className="space-y-12">
          {results.positions.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                {t("search.positions")}
              </h2>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("search.name")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("home.visibilityPublic")} / {t("home.visibilityRestricted")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
                    {results.positions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            to={`/positions/${pos.id}`}
                            className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:underline transition-colors block mb-1"
                          >
                            {pos.title}
                          </Link>
                          {pos.shortDescription && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                              {pos.shortDescription}
                            </p>
                          )}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {results.attributes.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                {t("search.attributes")}
              </h2>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("search.name")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("search.category")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("search.dataType")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
                    {results.attributes.map((attr) => (
                      <tr key={attr.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {attr.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {attr.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {attr.dataType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {results.tags.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                {t("search.tags")}
              </h2>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-2">
                {results.tags.map((tagItem) => (
                  <button
                    key={tagItem}
                    onClick={() => navigate(`/search?tag=${encodeURIComponent(tagItem)}`)}
                    className="px-3 py-1.5 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 rounded-full text-sm font-medium border border-sky-100 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                  >
                    {tagItem}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
