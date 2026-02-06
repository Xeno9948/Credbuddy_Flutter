import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import { useWebReportStatus } from "@/lib/webApi";

export default function Report() {
  const { data, isLoading } = useWebReportStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <FileText className="w-5 h-5 text-emerald-600" />
        Assessment Report
      </h2>

      <Card className="shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          {data?.available ? (
            <>
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-slate-700" data-testid="text-report-available">
                Your assessment report is available.
              </p>
              <p className="text-sm text-slate-500" data-testid="text-report-note">
                For PDF downloads, please use the partner portal or contact your
                lending partner.
              </p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-600" data-testid="text-no-report">
                No report available yet. Submit more daily entries to generate
                your first assessment.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
