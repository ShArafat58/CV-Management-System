import { useTranslation } from "react-i18next";
import type { AccessRule, LibAttribute } from "./PositionModal";
import { Trash2, Plus } from "lucide-react";

interface AccessRuleEditorProps {
  rules: AccessRule[];
  allAttributes: LibAttribute[];
  onChange: (rules: AccessRule[]) => void;
}

function getOperatorsForDataType(dataType: string): string[] {
  switch (dataType) {
    case "NUMERIC":
      return [">", ">=", "<", "<=", "="];
    case "BOOLEAN":
      return ["="];
    case "ONE_OF_MANY":
      return ["="];
    case "STRING":
    case "TEXT":
      return ["contains", "="];
    case "DATE":
      return [">", "<", "="];
    case "PERIOD":
    case "IMAGE":
    default:
      return ["="];
  }
}

function RuleValueInput({
  attribute,
  value,
  onChange,
}: {
  attribute: LibAttribute | undefined;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputClass =
    "w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm";

  if (!attribute) {
    return <input type="text" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />;
  }

  switch (attribute.dataType) {
    case "NUMERIC":
      return <input type="number" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />;
    case "BOOLEAN":
      return (
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">--</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    case "ONE_OF_MANY":
      return (
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">--</option>
          {attribute.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "DATE":
      return <input type="date" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input type="text" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function AccessRuleEditor({ rules, allAttributes, onChange }: AccessRuleEditorProps) {
  const { t } = useTranslation();

  const handleAdd = () => {
    onChange([...rules, { attributeId: "", operator: "=", value: "" }]);
  };

  const handleRemove = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof AccessRule, val: string) => {
    const updated = rules.map((r, i) => {
      if (i !== index) return r;
      const newRule = { ...r, [field]: val };
      if (field === "attributeId") {
        const attr = allAttributes.find((a) => a.id === val);
        const ops = attr ? getOperatorsForDataType(attr.dataType) : ["="];
        if (!ops.includes(newRule.operator)) {
          newRule.operator = ops[0];
        }
        newRule.value = "";
      }
      return newRule;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => {
        const attr = allAttributes.find((a) => a.id === rule.attributeId);
        const operators = attr ? getOperatorsForDataType(attr.dataType) : ["="];

        return (
          <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
            <select
              className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={rule.attributeId}
              onChange={(e) => handleUpdate(index, "attributeId", e.target.value)}
            >
              <option value="">{t("pos.selectAttribute")}</option>
              {allAttributes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              className="w-24 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={rule.operator}
              onChange={(e) => handleUpdate(index, "operator", e.target.value)}
            >
              {operators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <div className="flex-1">
              <RuleValueInput
                attribute={attr}
                value={rule.value}
                onChange={(v) => handleUpdate(index, "value", v)}
              />
            </div>

            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
      >
        <Plus className="w-4 h-4 mr-1" />
        {t("pos.addRule")}
      </button>
    </div>
  );
}
