import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Sun, Moon, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleLang = () => {
    const newLang = i18n.language === "en" ? "bn" : "en";
    i18n.changeLanguage(newLang);
  };

  const loginGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const loginGithub = () => {
    window.location.href = "/api/auth/github";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-sky-600 dark:text-sky-400">
              {t("app.title")}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{t("nav.home")}</Link>
              <Link to="/positions" className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{t("nav.positions")}</Link>
              <Link to="/profile" className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{t("nav.profile")}</Link>
              <Link to="/my-cvs" className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{t("nav.myCvs")}</Link>
              <Link to="/attributes" className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{t("nav.attributes")}</Link>
            </nav>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-lg hidden sm:block">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-full leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:focus:ring-sky-400 dark:focus:border-sky-400 sm:text-sm transition-all"
              />
            </form>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={t("theme.toggle")}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              title={t("lang.toggle")}
              className="px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors min-w-[3rem]"
            >
              {i18n.language === "en" ? "EN" : "বাং"}
            </button>

            {/* Auth Controls */}
            {loading ? (
              <div className="w-20 h-8 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
                  {user.displayName}
                </span>
                <button
                  onClick={logout}
                  title={t("auth.logout")}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setLoginMenuOpen(!loginMenuOpen)}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors"
                >
                  {t("auth.login")}
                  <ChevronDown className={`h-4 w-4 transition-transform ${loginMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {loginMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <button
                      onClick={loginGoogle}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700"
                    >
                      {t("auth.loginGoogle")}
                    </button>
                    <button
                      onClick={loginGithub}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {t("auth.loginGithub")}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Mobile Search (Second Row) */}
        <div className="pb-3 sm:hidden px-2">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-full leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:focus:ring-sky-400 dark:focus:border-sky-400 sm:text-sm transition-all"
            />
          </form>
        </div>

      </div>
    </header>
  );
}
