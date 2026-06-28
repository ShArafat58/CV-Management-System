import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import api from "../lib/api";
import { CvField } from "../components/cvs/CvField";
import { useAuth } from "../context/AuthContext";

interface CvAttribute {
  attributeId: string;
  name: string;
  category: string;
  dataType: string;
  options: string[];
  value: string;
}

interface CvProject {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  tags: string[];
}

interface CvDetail {
  id: string;
  positionId: string;
  positionTitle: string;
  positionShortDescription: string;
  ownerId: string;
  canEdit: boolean;
  attributes: CvAttribute[];
  projects: CvProject[];
}

export function CvView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [cv, setCv] = useState<CvDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [likeData, setLikeData] = useState({ liked: false, count: 0 });
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    Promise.all([
      api.get<CvDetail>(`/cvs/${id}`),
      api.get<{ liked: boolean; count: number }>(`/likes/${id}`)
    ])
      .then(([cvRes, likeRes]) => {
        setCv(cvRes.data);
        setLikeData(likeRes.data);
      })
      .catch(err => setError(err.response?.data?.error || "Failed to load CV"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleLike = async () => {
    if (!id || isLiking) return;
    setIsLiking(true);
    try {
      const res = await api.post<{ liked: boolean; count: number }>(`/likes/${id}/toggle`);
      setLikeData(res.data);
    } catch (err) {
      console.error("Failed to toggle like", err);
    } finally {
      setIsLiking(false);
    }
  };

  const isRecruiterOrAdmin = user?.role === "RECRUITER" || user?.role === "ADMIN";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (error || !cv) {
    return (
      <div className="p-8 text-center text-red-500 dark:text-red-400">
        {error || "CV not found"}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <button
        onClick={() => navigate("/my-cvs")}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to My CVs
      </button>

      <header className="border-b border-slate-200 dark:border-slate-700 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {cv.positionTitle}
          </h1>
          {cv.positionShortDescription && (
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              {cv.positionShortDescription}
            </p>
          )}
        </div>
        
        <div className="flex items-center ml-4 shrink-0">
          {isRecruiterOrAdmin ? (
            <button
              onClick={toggleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                likeData.liked 
                  ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
              title={likeData.liked ? t("cv.unlike") : t("cv.like")}
            >
              <Heart className={`w-5 h-5 ${likeData.liked ? "fill-current" : ""}`} />
              <span className="font-medium">{likeData.count}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" title={t("cv.likesCount")}>
              <Heart className="w-5 h-5" />
              <span className="font-medium">{likeData.count}</span>
            </div>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 flex items-center justify-center mr-3 text-sm">
            1
          </span>
          {t("cv.attributes")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {cv.attributes.map(attr => (
            <CvField
              key={attr.attributeId}
              cvId={cv.id}
              attribute={attr}
              canEdit={cv.canEdit}
            />
          ))}
        </div>
      </section>

      {cv.projects.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 flex items-center justify-center mr-3 text-sm">
              2
            </span>
            {t("cv.projects")}
          </h2>
          <div className="space-y-6">
            {cv.projects.map(proj => (
              <article key={proj.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <header className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {proj.name}
                  </h3>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 sm:mt-0 bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-full">
                    {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "—"} 
                    {" – "} 
                    {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : "Present"}
                  </div>
                </header>
                
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm mb-4">
                  <ReactMarkdown>{proj.description || "*No description provided.*"}</ReactMarkdown>
                </div>
                
                {proj.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {proj.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 rounded-md text-xs font-medium border border-sky-100 dark:border-sky-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
