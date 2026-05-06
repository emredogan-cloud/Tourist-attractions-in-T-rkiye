import { useTranslations } from "next-intl";
import { Badge } from "./ui/badge";

export function OpenNowBadge({ status }: { status: "OPEN" | "CLOSED" | "UNKNOWN" }) {
  const t = useTranslations("common");
  if (status === "UNKNOWN") return null;
  return (
    <Badge variant={status === "OPEN" ? "success" : "warning"}>
      {status === "OPEN" ? t("openNow") : t("closed")}
    </Badge>
  );
}
