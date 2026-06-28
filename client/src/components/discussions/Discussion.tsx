import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import api from "../../lib/api";
import socket from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorRole: string;
}

interface DiscussionProps {
  positionId: string;
}

export function Discussion({ positionId }: DiscussionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";

  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      try {
        const res = await api.get<Post[]>(`/discussions/${positionId}`);
        if (mounted) {
          setPosts(res.data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch discussions", error);
        if (mounted) setLoading(false);
      }
    };

    fetchPosts();

    socket.emit("join_position", positionId);

    const handleNewPost = (newPost: Post) => {
      setPosts((prev) => {
        if (prev.find((p) => p.id === newPost.id)) {
          return prev;
        }
        return [...prev, newPost];
      });
    };

    socket.on("new_post", handleNewPost);

    return () => {
      mounted = false;
      socket.emit("leave_position", positionId);
      socket.off("new_post", handleNewPost);
    };
  }, [positionId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      await api.post(`/discussions/${positionId}`, { content });
      setContent("");
    } catch (error) {
      console.error("Failed to post discussion", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 py-4">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-500 py-4">{t("pos.noPosts")}</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {isRecruiter ? (
                  <Link to={`/users/${post.authorId}`} className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                    {post.authorName}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{post.authorName}</span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                  {post.authorRole}
                </span>
                <span className="text-xs text-slate-500 ml-auto">
                  {format(new Date(post.createdAt), "MMM d, yyyy HH:mm")}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("pos.writePost")}
            className="w-full min-h-[80px] p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
            disabled={isSending}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending || !content.trim()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSending ? t("pos.sending") : t("pos.post")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
