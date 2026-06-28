import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Heart, Download, FileText } from "lucide-react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const handleDownloadCSV = () => {
    if (!cv) return;

    const data: any[][] = [];
    data.push(["CV", cv.positionTitle]);
    data.push([]);
    data.push(["Field", "Value"]);
    cv.attributes.forEach((attr) => {
      data.push([attr.name, attr.value || ""]);
    });

    if (cv.projects.length > 0) {
      data.push([]);
      data.push(["Projects"]);
      data.push(["Name", "Start Date", "End Date", "Tags", "Description"]);
      cv.projects.forEach((proj) => {
        data.push([
          proj.name,
          proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "",
          proj.endDate ? new Date(proj.endDate).toLocaleDateString() : "Present",
          proj.tags.join(";"),
          proj.description || ""
        ]);
      });
    }

    const csvString = Papa.unparse(data);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = cv.positionTitle ? cv.positionTitle.replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-") : "cv";
    link.href = url;
    link.setAttribute("download", `${safeTitle}-cv.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!cv || isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;
      let yPos = margin;

      const checkPageBreak = (height: number) => {
        if (yPos + height > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
      };

      const qrUrl = `${window.location.origin}/cvs/${cv.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 });
      const qrSize = 25;
      
      doc.addImage(qrDataUrl, "PNG", pageWidth - margin - qrSize, margin, qrSize, qrSize);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Scan to view online", pageWidth - margin - qrSize, margin + qrSize + 4);

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      const titleLines = doc.splitTextToSize(cv.positionTitle, maxWidth - qrSize - 10);
      doc.text(titleLines, margin, yPos + 8);
      yPos += titleLines.length * 9 + 5;

      if (cv.positionShortDescription) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const descLines = doc.splitTextToSize(cv.positionShortDescription, maxWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 6 + 8;
      } else {
        yPos += 8;
      }

      if (cv.attributes.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text("Details", margin, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50);
        
        cv.attributes.forEach((attr) => {
          const val = attr.value ? attr.value : "(empty)";
          const line = `${attr.name}: ${val}`;
          const splitLine = doc.splitTextToSize(line, maxWidth);
          checkPageBreak(splitLine.length * 5 + 2);
          doc.text(splitLine, margin, yPos);
          yPos += splitLine.length * 5 + 2;
        });
        
        yPos += 8;
      }

      if (cv.projects.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text("Projects", margin, yPos);
        yPos += 10;

        cv.projects.forEach((proj) => {
          checkPageBreak(25);
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0);
          const projName = doc.splitTextToSize(proj.name, maxWidth);
          doc.text(projName, margin, yPos);
          yPos += projName.length * 5 + 1;

          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100);
          const start = proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "—";
          const end = proj.endDate ? new Date(proj.endDate).toLocaleDateString() : "Present";
          doc.text(`${start} – ${end}`, margin, yPos);
          yPos += 6;

          if (proj.tags.length > 0) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            const tagsText = doc.splitTextToSize(`Tags: ${proj.tags.join(", ")}`, maxWidth);
            doc.text(tagsText, margin, yPos);
            yPos += tagsText.length * 4 + 2;
          }

          if (proj.description) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50);
            const desc = doc.splitTextToSize(proj.description, maxWidth);
            checkPageBreak(desc.length * 5 + 5);
            doc.text(desc, margin, yPos);
            yPos += desc.length * 5;
          }
          
          yPos += 8;
        });
      }

      const safeTitle = cv.positionTitle ? cv.positionTitle.replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-") : "cv";
      doc.save(`${safeTitle}-cv.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
        
        <div className="flex items-center ml-4 shrink-0 gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title={t("cv.downloadPdf")}
          >
            {isGeneratingPdf ? (
              <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="text-sm font-medium hidden sm:inline">{t("cv.downloadPdf")}</span>
          </button>
          
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            title={t("cv.downloadCsv")}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{t("cv.downloadCsv")}</span>
          </button>
          
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
