import { useState, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Search, ShieldAlert } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  blocked: boolean;
  provider: string;
  createdAt: string;
}

export function AdminUsers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (searchQuery: string = "") => {
    try {
      setLoading(true);
      const res = await api.get<User[]>(`/users?search=${encodeURIComponent(searchQuery)}`);
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  const handleRoleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    if (!selectedUserId) return;
    const newRole = e.target.value as UserRole;
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await api.patch(`/users/${selectedUserId}/role`, { role: newRole });
      fetchUsers(search);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedUserId) return;
    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser) return;
    const newBlockedState = !selectedUser.blocked;
    if (!window.confirm(`Are you sure you want to ${newBlockedState ? "block" : "unblock"} this user?`)) return;
    try {
      await api.patch(`/users/${selectedUserId}/block`, { blocked: newBlockedState });
      fetchUsers(search);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedUserId((prev) => (prev === id ? null : id));
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <ShieldAlert className="w-16 h-16 mb-4 text-rose-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t("admin.accessDenied")}</h2>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const getRoleLabel = (role: UserRole) => {
    if (role === "ADMIN") return t("admin.roleAdmin");
    if (role === "RECRUITER") return t("admin.roleRecruiter");
    return t("admin.roleCandidate");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t("admin.title")}</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.search")}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedUser ? (
              <>
                <select
                  value={selectedUser.role}
                  onChange={handleRoleChange}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="CANDIDATE">{t("admin.roleCandidate")}</option>
                  <option value="RECRUITER">{t("admin.roleRecruiter")}</option>
                  <option value="ADMIN">{t("admin.roleAdmin")}</option>
                </select>
                <button
                  onClick={handleToggleBlock}
                  style={{
                    backgroundColor: selectedUser.blocked ? "#10b981" : "#f43f5e",
                    color: "#ffffff",
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
                >
                  {selectedUser.blocked ? t("admin.unblock") : t("admin.block")}
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                {t("admin.selectHint")}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("admin.name")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("admin.email")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("admin.role")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("admin.status")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("admin.joined")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => toggleSelect(u.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-sky-50 dark:bg-sky-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(u.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 bg-white dark:bg-slate-900 dark:border-slate-600 dark:checked:bg-sky-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {u.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500 dark:text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            : u.role === "RECRUITER"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                        >
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.blocked
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            }`}
                        >
                          {u.blocked ? t("admin.blocked") : t("admin.active")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
