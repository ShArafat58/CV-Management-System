import { useTranslation } from "react-i18next";

export function MyCvs() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold dark:text-white">{t("nav.myCvs")}</h1>
    </div>
  );
}
