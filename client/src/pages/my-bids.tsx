import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DollarSign, FileText, Calendar, ArrowLeft } from "lucide-react";

function getStatusColor(status: string) {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'under_review': return 'bg-amber-100 text-amber-800';
    case 'accepted': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default function MyBids(): JSX.Element {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: bids, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/my-bids"],
  });

  if (user?.role !== 'bidder') {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('common.accessDenied', 'Access Denied')}</h3>
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
            <h1 className="text-2xl font-bold">{t('nav.myBids', 'My Bids')}</h1>
            <p className="text-muted-foreground">{t('bid.myBidsSubtitle', 'Track bids you have submitted')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('common.error', 'Error')}</h3>
            </CardContent>
          </Card>
        ) : !bids || bids.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('bid.noBids', 'No Bids Submitted')}</h3>
              <p className="text-muted-foreground">{t('bid.noBidsDesc', 'You have not submitted any bids yet')}</p>
              <Button className="mt-4" onClick={() => setLocation('/tenders')}>
                {t('tenders.browse', 'Browse Tenders')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bids!.map((bid: any) => (
              <Card key={bid.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {bid.tenderTitle || t('bid.untitledTender', 'Untitled Tender')}
                    </CardTitle>
                    <Badge className={getStatusColor(bid.status)}>{bid.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {t('bid.amount', 'Bid Amount')}
                    </p>
                    <p className="font-medium">{bid.currency} {parseFloat(bid.bidAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {t('bid.submittedAt', 'Submitted')}
                    </p>
                    <p className="font-medium">{new Date(bid.submittedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bid.technicalScore', 'Technical Score')}</p>
                    <p className="font-medium">{bid.technicalScore ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bid.financialScore', 'Financial Score')}</p>
                    <p className="font-medium">{bid.financialScore ?? '-'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}


