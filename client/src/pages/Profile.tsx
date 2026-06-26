import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Check, AlertCircle, Plus, RefreshCw } from "lucide-react";
import api from "../lib/api";
import { ProjectsTab } from "../components/profile/ProjectsTab";

type AttributeDataType = "STRING" | "TEXT" | "IMAGE" | "NUMERIC" | "DATE" | "PERIOD" | "BOOLEAN" | "ONE_OF_MANY";

interface Attribute {
  id: string;
  name: string;
  category: string;
  dataType: AttributeDataType;
  options: string[];
  isBuiltIn: boolean;
}

interface ProfileValue {
  id?: string;
  attributeId: string;
  value: string;
  attribute: Attribute;
}

interface ProfileResponse {
  profile: {
    id: string;
    version: number;
    updatedAt: string;
    values: ProfileValue[];
    projects: any[];
  };
  builtInAttributes: Attribute[];
}

function ProfileField({ 
  attribute, 
  value, 
  onChange 
}: { 
  attribute: Attribute; 
  value: string; 
  onChange: (val: string) => void;
}) {
  const commonClasses = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors";

  switch (attribute.dataType) {
    case "TEXT":
      return (
        <textarea
          className={commonClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      );
    case "NUMERIC":
      return (
        <input
          type="number"
          className={commonClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "DATE":
      return (
        <input
          type="date"
          className={commonClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "BOOLEAN":
      return (
        <div className="flex items-center h-full pt-2">
          <input
            type="checkbox"
            className="w-5 h-5 text-sky-600 rounded border-gray-300 focus:ring-sky-500 dark:bg-gray-700 dark:border-gray-600"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          />
        </div>
      );
    case "ONE_OF_MANY":
      return (
        <select
          className={commonClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value=""></option>
          {attribute.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case "STRING":
    case "IMAGE":
    case "PERIOD":
    default:
      return (
        <input
          type="text"
          className={commonClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export function Profile() {
  const { t } = useTranslation();
  
  const [version, setVersion] = useState<number>(0);
  const [builtInAttributes, setBuiltInAttributes] = useState<Attribute[]>([]);
  const [libraryAttributes, setLibraryAttributes] = useState<Attribute[]>([]);
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [conflict, setConflict] = useState(false);
  const [activeTab, setActiveTab] = useState<"me" | "info" | "projects">("me");

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get<ProfileResponse>("/profile");
      setVersion(data.profile.version);
      setBuiltInAttributes(data.builtInAttributes);
      
      const newValues: Record<string, string> = {};
      data.profile.values.forEach(v => {
        newValues[v.attributeId] = v.value;
      });
      setValues(newValues);
      setProjects(data.profile.projects);
      
      const libAttrs = data.profile.values
        .map(v => v.attribute)
        .filter(a => !a.isBuiltIn);
      setLibraryAttributes(libAttrs);
      
      setConflict(false);
      setIsDirty(false);
      setSavingStatus("idle");
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  }, []);

  const fetchAllAttributes = useCallback(async () => {
    try {
      const { data } = await api.get<Attribute[]>("/attributes");
      setAllAttributes(data);
    } catch (error) {
      console.error("Failed to fetch attributes", error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAllAttributes();
  }, [fetchProfile, fetchAllAttributes]);

  const handleValueChange = (attributeId: string, val: string) => {
    setValues(prev => ({ ...prev, [attributeId]: val }));
    setIsDirty(true);
  };

  const saveValues = useCallback(async (currentValues: Record<string, string>, currentVersion: number) => {
    try {
      setSavingStatus("saving");
      const valuesArray = Object.entries(currentValues).map(([attributeId, value]) => ({ attributeId, value }));
      const { data } = await api.put("/profile/values", { version: currentVersion, values: valuesArray });
      setVersion(data.version);
      setIsDirty(false);
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setConflict(true);
        setSavingStatus("idle");
      } else {
        setSavingStatus("idle");
      }
    }
  }, []);

  useEffect(() => {
    if (!isDirty || conflict) return;
    
    const timer = setTimeout(() => {
      saveValues(values, version);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [values, isDirty, conflict, version, saveValues]);

  const handleAddAttribute = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const attrId = e.target.value;
    if (!attrId) return;
    
    const attr = allAttributes.find(a => a.id === attrId);
    if (attr && !libraryAttributes.find(a => a.id === attrId)) {
      setLibraryAttributes(prev => [...prev, attr]);
      handleValueChange(attr.id, "");
    }
    e.target.value = "";
  };

  const availableAttributes = allAttributes.filter(
    a => !a.isBuiltIn && !libraryAttributes.find(la => la.id === a.id)
  );

  return (
    <div className="max-w-5xl mx-auto p-4 animate-in fade-in duration-300">
      {conflict && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-700 dark:text-red-400 p-4 mb-6 rounded flex items-center justify-between shadow-sm">
          <div className="flex items-center font-medium">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p>{t("profile.conflictMsg")}</p>
          </div>
          <button
            onClick={() => { fetchProfile(); fetchAllAttributes(); }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap ml-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("profile.reload")}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t("nav.profile")}</h1>
        
        <div className="flex items-center space-x-2 text-sm font-medium h-6">
          {savingStatus === "saving" && (
            <span className="flex items-center text-sky-600 dark:text-sky-400 animate-pulse">
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              {t("profile.saving")}
            </span>
          )}
          {savingStatus === "saved" && (
            <span className="flex items-center text-green-600 dark:text-green-400">
              <Check className="w-4 h-4 mr-1" />
              {t("profile.saved")}
            </span>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
        {(["me", "info", "projects"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {t(`profile.${tab}`)}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 md:p-8">
        {activeTab === "me" && (
          <div className="space-y-6 max-w-2xl">
            {builtInAttributes.map(attr => (
              <div key={attr.id} className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
                  {attr.name}
                </label>
                <ProfileField
                  attribute={attr}
                  value={values[attr.id] || ""}
                  onChange={(val) => handleValueChange(attr.id, val)}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "info" && (
          <div className="space-y-6 max-w-2xl">
            {libraryAttributes.map(attr => (
              <div key={attr.id} className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
                  {attr.name} <span className="text-xs font-normal text-gray-400 ml-2">({attr.category})</span>
                </label>
                <ProfileField
                  attribute={attr}
                  value={values[attr.id] || ""}
                  onChange={(val) => handleValueChange(attr.id, val)}
                />
              </div>
            ))}
            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
              <label className="flex items-center text-sm font-semibold text-sky-600 dark:text-sky-400 mb-3">
                <Plus className="w-4 h-4 mr-1.5" />
                {t("profile.addAttribute")}
              </label>
              <select
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                value=""
                onChange={handleAddAttribute}
              >
                <option value="" disabled>{t("profile.selectAttribute")}</option>
                {availableAttributes.map(attr => (
                  <option key={attr.id} value={attr.id}>{attr.name} ({attr.category})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <ProjectsTab projects={projects} onRefresh={fetchProfile} />
        )}
      </div>
    </div>
  );
}
