import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { FileText, ArrowLeft, Download, Calendar, DollarSign } from "lucide-react";

export default function TenderView(): JSX.Element {
  const { tenderId } = useParams();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: tender, isLoading, error } = useQuery({
    queryKey: ["/api/tenders", tenderId],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${tenderId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tender");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !tender) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">{t('common.error', 'Error')}</h3>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/tenders')} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back', 'Back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tender.title}</h1>
            <p className="text-muted-foreground">{t('tender.referenceNumber', 'Reference')}: {tender.referenceNumber}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('tender.details', 'Tender Details')}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('tender.category', 'Category')}</p>
              <p className="font-medium">{tender.category || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="w-4 h-4" />{t('tender.estimatedValue', 'Estimated Value')}</p>
              <p className="font-medium">{tender.currency} {tender.estimatedValue || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-4 h-4" />{t('tender.submissionDeadline', 'Submission Deadline')}</p>
              <p className="font-medium">{tender.submissionDeadline ? new Date(tender.submissionDeadline).toLocaleString() : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tender.documents', 'Documents')}</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(tender.documents) && tender.documents.length > 0 ? (
              <div className="grid gap-2">
                {tender.documents.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                    <div className="text-sm">
                      <p className="font-medium">{d.originalName}</p>
                      <p className="text-xs text-muted-foreground">{(d.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const res = await fetch(`/api/documents/${d.id}/download`, { credentials: 'include' });
                        if (!res.ok) return;
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = d.originalName || 'document';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" /> {t('common.download', 'Download')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('tender.noDocuments', 'No documents uploaded')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


