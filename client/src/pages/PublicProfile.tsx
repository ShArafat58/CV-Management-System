import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import api from "../lib/api";

type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";

interface PublicUser {
  id: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

interface PublicCv {
  id: string;
  positionId: string;
  positionTitle: string;
  createdAt: string;
  likesCount: number;
}

interface PublicProfileData {
  user: PublicUser;
  cvs: PublicCv[];
}

export function PublicProfile() {
  const { authorId } = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<PublicProfileData>(`/public-profile/${authorId}`);
        setData(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError(t("public.notFound"));
        } else {
          setError(err.message || "An error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authorId, t]);

  const getRoleLabel = (role: UserRole) => {
    if (role === "ADMIN") return t("public.roleAdmin");
    if (role === "RECRUITER") return t("public.roleRecruiter");
    return t("public.roleCandidate");
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center p-12 text-slate-500">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{error || t("public.notFound")}</h2>
      </div>
    );
  }

  const { user, cvs } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{user.displayName}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    : user.role === "RECRUITER"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {getRoleLabel(user.role)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t("public.memberSince")} {format(new Date(user.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("public.cvs")}</h2>
        </div>

        <div className="overflow-x-auto">
          {cvs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              {t("public.noCvs")}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("public.position")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("public.likes")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("public.created")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {cvs.map((cv) => (
                  <tr key={cv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/cvs/${cv.id}`} className="text-sky-600 dark:text-sky-400 font-medium hover:underline">
                        {cv.positionTitle}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500 dark:text-slate-400">{cv.likesCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(cv.createdAt), "MMM d, yyyy")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
