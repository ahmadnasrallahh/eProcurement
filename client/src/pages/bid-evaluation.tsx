import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Star, 
  DollarSign, 
  Calculator,
  User,
  Calendar,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function BidEvaluation() {
  const { tenderId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [technicalScore, setTechnicalScore] = useState("");
  const [financialScore, setFinancialScore] = useState("");

  // Fetch tender details
  const { data: tender } = useQuery({
    queryKey: ["/api/tenders", tenderId],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${tenderId}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch tender");
      return res.json();
    },
  });

  // Fetch bids for the tender
  const { data: bids, isLoading } = useQuery({
    queryKey: ["/api/tenders", tenderId, "bids"],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${tenderId}/bids`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch bids");
      return res.json();
    },
  });

  const updateBidMutation = useMutation({
    mutationFn: async (data: { bidId: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/bids/${data.bidId}`, data.updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders", tenderId, "bids"] });
      toast({
        title: t('bid.evaluationSuccess', 'Bid evaluated successfully'),
        description: t('bid.evaluationSuccessDesc', 'The bid evaluation has been saved'),
      });
      setSelectedBid(null);
      setEvaluationNotes("");
      setTechnicalScore("");
      setFinancialScore("");
    },
    onError: (error: any) => {
      toast({
        title: t('bid.evaluationError', 'Failed to evaluate bid'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEvaluateBid = (bid: any) => {
    setSelectedBid(bid);
    setEvaluationNotes(bid.evaluationNotes || "");
    setTechnicalScore(bid.technicalScore?.toString() || "");
    setFinancialScore(bid.financialScore?.toString() || "");
  };

  const handleSaveEvaluation = () => {
    if (!selectedBid) return;

    const tech = parseInt(technicalScore) || 0;
    const financial = parseInt(financialScore) || 0;
    const total = tech + financial;

    updateBidMutation.mutate({
      bidId: selectedBid.id,
      updates: {
        technicalScore: tech,
        financialScore: financial,
        totalScore: total,
        evaluationNotes,
        status: 'under_review',
        evaluatedAt: new Date().toISOString(),
        evaluatedById: user?.id,
      },
    });
  };

  const handleUpdateBidStatus = (bidId: string, status: string) => {
    updateBidMutation.mutate({
      bidId,
      updates: { status },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-amber-100 text-amber-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'under_review': return <Eye className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  // Check permissions
  if (user?.role !== 'admin' && user?.role !== 'procurement_officer') {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('common.accessDenied', 'Access Denied')}
            </h3>
            <p className="text-muted-foreground">
              {t('bid.evaluationPermissionError', 'You do not have permission to evaluate bids')}
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/tenders')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back', 'Back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t('bid.evaluation', 'Bid Evaluation')}
            </h1>
            <p className="text-muted-foreground">
              {tender?.title} - {bids?.length || 0} {t('bid.bidsSubmitted', 'bids submitted')}
            </p>
          </div>
        </div>

        {/* Tender Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('tender.details', 'Tender Details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('tender.referenceNumber', 'Reference Number')}</p>
              <p className="font-medium">{tender?.referenceNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('tender.estimatedValue', 'Estimated Value')}</p>
              <p className="font-medium">
                {tender?.estimatedValue 
                  ? formatCurrency(tender.estimatedValue, tender.currency || 'USD')
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('tender.submissionDeadline', 'Submission Deadline')}</p>
              <p className="font-medium">
                {tender?.submissionDeadline 
                  ? new Date(tender.submissionDeadline).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bids List */}
        <div className="grid gap-6">
          {bids && bids.length > 0 ? (
            bids.map((bid: any) => (
              <Card key={bid.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {t('bid.bidFrom', 'Bid from')} {bid.bidderName || 'Anonymous Bidder'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`flex items-center gap-1 ${getStatusColor(bid.status)}`}>
                        {getStatusIcon(bid.status)}
                        {bid.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bid Info Grid */}
                  <div className="grid md:grid-cols-4 gap-4 p-4 bg-secondary/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {t('bid.amount', 'Bid Amount')}
                      </p>
                      <p className="font-medium text-lg">
                        {formatCurrency(bid.bidAmount, bid.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {t('bid.technicalScore', 'Technical Score')}
                      </p>
                      <p className="font-medium">
                        {bid.technicalScore ? `${bid.technicalScore}/100` : 'Not scored'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calculator className="w-4 h-4" />
                        {t('bid.financialScore', 'Financial Score')}
                      </p>
                      <p className="font-medium">
                        {bid.financialScore ? `${bid.financialScore}/100` : 'Not scored'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {t('bid.totalScore', 'Total Score')}
                      </p>
                      <p className="font-medium text-lg">
                        {bid.totalScore ? `${bid.totalScore}/200` : 'Not scored'}
                      </p>
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('bid.submittedAt', 'Submitted')}: {new Date(bid.submittedAt).toLocaleString()}
                    </div>
                    {bid.evaluatedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('bid.evaluatedAt', 'Evaluated')}: {new Date(bid.evaluatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {bid.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">{t('bid.bidderNotes', 'Bidder Notes')}</p>
                      <p className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded">
                        {bid.notes}
                      </p>
                    </div>
                  )}

                  {/* Evaluation Notes */}
                  {bid.evaluationNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">{t('bid.evaluationNotes', 'Evaluation Notes')}</p>
                      <p className="text-sm text-muted-foreground bg-amber-50 p-3 rounded border-l-4 border-amber-300">
                        {bid.evaluationNotes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleEvaluateBid(bid)}
                      size="sm"
                      data-testid={`button-evaluate-${bid.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t('bid.evaluate', 'Evaluate')}
                    </Button>
                    
                    {bid.status !== 'accepted' && (
                      <Button
                        onClick={() => handleUpdateBidStatus(bid.id, 'accepted')}
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        data-testid={`button-accept-${bid.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('bid.accept', 'Accept')}
                      </Button>
                    )}
                    
                    {bid.status !== 'rejected' && (
                      <Button
                        onClick={() => handleUpdateBidStatus(bid.id, 'rejected')}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-reject-${bid.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {t('bid.reject', 'Reject')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {t('bid.noBids', 'No Bids Submitted')}
                </h3>
                <p className="text-muted-foreground">
                  {t('bid.noBidsDesc', 'No bids have been submitted for this tender yet.')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Evaluation Modal */}
        {selectedBid && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {t('bid.evaluateBid', 'Evaluate Bid')} - {selectedBid.bidderName || 'Anonymous'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <p className="font-medium">
                    {t('bid.amount', 'Bid Amount')}: {formatCurrency(selectedBid.bidAmount, selectedBid.currency)}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('bid.technicalScore', 'Technical Score')} (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={technicalScore}
                      onChange={(e) => setTechnicalScore(e.target.value)}
                      placeholder="0"
                      data-testid="input-technical-score"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('bid.financialScore', 'Financial Score')} (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={financialScore}
                      onChange={(e) => setFinancialScore(e.target.value)}
                      placeholder="0"
                      data-testid="input-financial-score"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">
                    {t('bid.totalScore', 'Total Score')}: {(parseInt(technicalScore) || 0) + (parseInt(financialScore) || 0)}/200
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('bid.evaluationNotes', 'Evaluation Notes')}
                  </label>
                  <Textarea
                    value={evaluationNotes}
                    onChange={(e) => setEvaluationNotes(e.target.value)}
                    placeholder={t('bid.evaluationNotesPlaceholder', 'Enter evaluation notes and feedback')}
                    rows={4}
                    data-testid="textarea-evaluation-notes"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBid(null)}
                    data-testid="button-cancel-evaluation"
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button
                    onClick={handleSaveEvaluation}
                    disabled={updateBidMutation.isPending}
                    data-testid="button-save-evaluation"
                  >
                    {updateBidMutation.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}