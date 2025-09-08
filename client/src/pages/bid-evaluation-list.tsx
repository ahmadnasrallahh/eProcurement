import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { FileText, ArrowRight, AlertTriangle } from "lucide-react";

export default function BidEvaluationList(): JSX.Element {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: tenders, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/tenders"],
  });

  if (user?.role !== 'admin' && user?.role !== 'procurement_officer') {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium">{t('common.accessDenied', 'Access Denied')}</h3>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('bid.evaluation', 'Bid Evaluation')}</h1>
          <p className="text-muted-foreground">{t('bid.evaluationSubtitle', 'Select a tender to review and score bids')}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">{t('common.error', 'Error')}</h3>
            </CardContent>
          </Card>
        ) : !tenders || tenders.filter((x: any) => x.status === 'active').length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">{t('tenders.noTenders', 'No tenders available')}</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tenders.filter((x: any) => x.status === 'active').map((tender: any) => (
              <Card key={tender.id}>
                <CardHeader>
                  <CardTitle>{tender.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {tender.referenceNumber}
                  </div>
                  <Button onClick={() => setLocation(`/tenders/${tender.id}/evaluate`)} data-testid={`button-evaluate-${tender.id}`}>
                    {t('bid.evaluate', 'Evaluate')} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}


