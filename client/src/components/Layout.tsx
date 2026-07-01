import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "./Header";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (user?.blocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 px-4">
        <div className="max-w-md text-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-rose-500 text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold mb-2">{t("blocked.title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{t("blocked.message")}</p>
          <button
            onClick={logout}
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors"
          >
            {t("auth.logout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}