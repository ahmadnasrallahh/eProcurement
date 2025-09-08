import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-provider";
import { BidSubmission } from "@/components/bid-submission";
import { ArrowLeft, File } from "lucide-react";

export default function SubmitBid(): JSX.Element {
  const { tenderId } = useParams();
  const { user } = useAuth();
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

  if (user?.role !== 'bidder') {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('common.accessDenied', 'Access Denied')}
            </h3>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

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
            <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('common.error', 'Error')}
            </h3>
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
            <h1 className="text-2xl font-bold">
              {t('bid.submitBid', 'Submit Bid')}
            </h1>
            <p className="text-muted-foreground">{tender.title}</p>
          </div>
        </div>

        <BidSubmission tender={tender} onSuccess={() => setLocation('/tenders')} />
      </div>
    </MainLayout>
  );
}


