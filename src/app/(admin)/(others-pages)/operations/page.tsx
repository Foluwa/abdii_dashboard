import SectionHub from "@/components/admin/navigation/SectionHub";

const operationsLinks = [
  { label: "Status", href: "/system/observability/status" },
  { label: "Metrics", href: "/system/observability/metrics" },
  { label: "Alerts", href: "/system/observability/alerts" },
  { label: "Cron Jobs", href: "/system/observability/cron-jobs" },
  { label: "ML Training", href: "/system/ml-training" },
  { label: "Configuration", href: "/system/configuration/platform" },
  { label: "Audit Log", href: "/system/audit-log" },
  { label: "Testing", href: "/system/testing" },
];

export default function OperationsHubPage() {
  return (
    <SectionHub
      title="Operations"
      description="Platform monitoring, observability, configuration, and internal tools."
      links={operationsLinks}
      variant="compact"
    />
  );
}
