import { useSearchParams } from "react-router-dom";

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold dark:text-white">Results for: {query}</h1>
    </div>
  );
}
