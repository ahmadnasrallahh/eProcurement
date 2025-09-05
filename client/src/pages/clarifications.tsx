import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { formatInTimezone } from "@/lib/timezone";
import { apiRequest } from "@/lib/queryClient";
import { 
  HelpCircle, 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle, 
  Globe,
  Plus,
  Eye
} from "lucide-react";

const clarificationSchema = z.object({
  tenderId: z.string().min(1, 'Please select a tender'),
  question: z.string().min(10, 'Question must be at least 10 characters'),
});

type ClarificationFormData = z.infer<typeof clarificationSchema>;

export default function Clarifications() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClarification, setSelectedClarification] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");

  const form = useForm<ClarificationFormData>({
    resolver: zodResolver(clarificationSchema),
    defaultValues: {
      tenderId: "",
      question: "",
    },
  });

  // Fetch clarifications based on user role
  const { data: clarifications, isLoading } = useQuery({
    queryKey: ["/api/clarifications"],
  });

  // Fetch tenders for dropdown (bidders only)
  const { data: tenders } = useQuery({
    queryKey: ["/api/tenders"],
    enabled: user?.role === 'bidder',
  });

  const createClarificationMutation = useMutation({
    mutationFn: async (data: ClarificationFormData) => {
      const res = await apiRequest("POST", "/api/clarifications", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clarifications"] });
      form.reset();
      toast({
        title: t('clarification.createSuccess', 'Clarification submitted'),
        description: t('clarification.createSuccessDesc', 'Your clarification request has been sent to the procurement team'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('clarification.createError', 'Failed to submit clarification'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const answerClarificationMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const res = await apiRequest("PATCH", `/api/clarifications/${id}`, {
        answer,
        status: 'answered',
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clarifications"] });
      setSelectedClarification(null);
      setAnswerText("");
      toast({
        title: t('clarification.answerSuccess', 'Clarification answered'),
        description: t('clarification.answerSuccessDesc', 'Your response has been recorded and will be visible to all bidders'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('clarification.answerError', 'Failed to answer clarification'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClarificationFormData) => {
    createClarificationMutation.mutate(data);
  };

  const handleAnswerSubmit = () => {
    if (!selectedClarification || !answerText.trim()) return;
    answerClarificationMutation.mutate({
      id: selectedClarification.id,
      answer: answerText,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'answered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'published': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: t('clarification.status.pending', 'Pending'),
      answered: t('clarification.status.answered', 'Answered'),
      published: t('clarification.status.published', 'Published'),
    };
    return statusMap[status] || status;
  };

  const canCreateClarification = user?.role === 'bidder';
  const canAnswerClarification = user?.role === 'admin' || user?.role === 'procurement_officer';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">
              {canCreateClarification 
                ? t('clarifications.askTitle', 'Ask Clarifications')
                : t('clarifications.manageTitle', 'Manage Clarifications')
              }
            </h1>
            <p className="text-muted-foreground">
              {canCreateClarification 
                ? t('clarifications.askSubtitle', 'Submit clarification requests for tender details')
                : t('clarifications.manageSubtitle', 'Review and respond to clarification requests')
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clarification Form (Bidders only) */}
          {canCreateClarification && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('clarifications.newRequest', 'New Clarification Request')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="tenderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('clarifications.selectTender', 'Select Tender')} *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-tender">
                                  <SelectValue placeholder={t('clarifications.selectTenderPlaceholder', 'Choose a tender')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tenders?.filter((tender: any) => tender.status === 'active').map((tender: any) => (
                                  <SelectItem key={tender.id} value={tender.id}>
                                    {tender.title} ({tender.referenceNumber})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="question"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('clarifications.question', 'Your Question')} *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('clarifications.questionPlaceholder', 'Please provide your clarification request in detail...')}
                                rows={5}
                                data-testid="textarea-question"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createClarificationMutation.isPending}
                        data-testid="button-submit-clarification"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {createClarificationMutation.isPending 
                          ? t('clarifications.submitting', 'Submitting...') 
                          : t('clarifications.submit', 'Submit Question')
                        }
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clarifications List */}
          <div className={canCreateClarification ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  {t('clarifications.requests', 'Clarification Requests')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                            <div className="h-3 bg-muted rounded w-1/4"></div>
                          </div>
                          <div className="h-6 bg-muted rounded w-20"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : clarifications && clarifications.length > 0 ? (
                  <div className="space-y-4">
                    {clarifications.map((clarification: any) => (
                      <div 
                        key={clarification.id} 
                        className="border border-border rounded-lg p-4"
                        data-testid={`clarification-${clarification.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {clarification.requester?.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium" data-testid={`clarification-requester-${clarification.id}`}>
                                {clarification.requester?.organizationName || clarification.requester?.username}
                              </p>
                              <p className="text-sm text-muted-foreground" data-testid={`clarification-date-${clarification.id}`}>
                                {formatInTimezone(new Date(clarification.createdAt), user?.timezone || 'UTC')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(clarification.status)} data-testid={`clarification-status-${clarification.id}`}>
                              {getStatusText(clarification.status)}
                            </Badge>
                            {clarification.isPublic && (
                              <Globe className="w-4 h-4 text-muted-foreground" title={t('clarifications.public', 'Public')} />
                            )}
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm" data-testid={`clarification-question-${clarification.id}`}>
                            {clarification.question}
                          </p>
                        </div>

                        {clarification.answer && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">
                                {t('clarifications.response', 'Response')}
                              </span>
                              {clarification.answeredAt && (
                                <span className="text-xs text-muted-foreground">
                                  {formatInTimezone(new Date(clarification.answeredAt), user?.timezone || 'UTC')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm" data-testid={`clarification-answer-${clarification.id}`}>
                              {clarification.answer}
                            </p>
                          </div>
                        )}

                        {canAnswerClarification && clarification.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => setSelectedClarification(clarification)}
                              data-testid={`button-answer-${clarification.id}`}
                            >
                              {t('clarifications.respond', 'Respond')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-clarifications-message">
                    <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {t('clarifications.noRequests', 'No clarification requests')}
                    </h3>
                    <p className="text-muted-foreground">
                      {canCreateClarification 
                        ? t('clarifications.noRequestsBidder', 'Submit a question about tender requirements')
                        : t('clarifications.noRequestsProcurement', 'No pending clarification requests at the moment')
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Answer Modal */}
        {selectedClarification && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  {t('clarifications.respondTo', 'Respond to Clarification')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">
                    {t('clarifications.originalQuestion', 'Original Question')}:
                  </p>
                  <p className="text-sm">{selectedClarification.question}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('clarifications.yourResponse', 'Your Response')} *
                  </label>
                  <Textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={t('clarifications.responsePlaceholder', 'Provide a clear and comprehensive answer...')}
                    rows={5}
                    data-testid="textarea-answer"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedClarification(null);
                      setAnswerText("");
                    }}
                    data-testid="button-cancel-answer"
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={!answerText.trim() || answerClarificationMutation.isPending}
                    data-testid="button-submit-answer"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {answerClarificationMutation.isPending 
                      ? t('clarifications.responding', 'Responding...') 
                      : t('clarifications.submitResponse', 'Submit Response')
                    }
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
