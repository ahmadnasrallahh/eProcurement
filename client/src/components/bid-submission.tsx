import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { FileText, DollarSign, Upload, Send, AlertCircle } from "lucide-react";

const bidSchema = z.object({
  bidAmount: z.string().min(1, 'Bid amount is required'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

type BidFormData = z.infer<typeof bidSchema>;

interface BidSubmissionProps {
  tender: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BidSubmission({ tender, onSuccess, onCancel }: BidSubmissionProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [documents, setDocuments] = useState<File[]>([]);

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      bidAmount: "",
      currency: tender.currency || "USD",
      notes: "",
    },
  });

  const submitBidMutation = useMutation({
    mutationFn: async (data: BidFormData) => {
      const bidData = {
        ...data,
        documents: documents.map(doc => ({
          name: doc.name,
          size: doc.size,
          type: doc.type,
        })),
      };
      
      const res = await apiRequest("POST", `/api/tenders/${tender.id}/bids`, bidData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-bids"] });
      toast({
        title: t('bid.submitSuccess', 'Bid submitted successfully'),
        description: t('bid.submitSuccessDesc', 'Your bid has been encrypted and stored securely until the opening date'),
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: t('bid.submitError', 'Failed to submit bid'),
        description: error.message || t('bid.submitErrorDesc', 'Please check your input and try again'),
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: BidFormData) => {
    submitBidMutation.mutate(data);
  };

  const isDeadlinePassed = () => {
    if (!tender.submissionDeadline) return false;
    return new Date(tender.submissionDeadline) < new Date();
  };

  if (isDeadlinePassed()) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-destructive mb-2">
            {t('bid.deadlinePassed', 'Submission Deadline Passed')}
          </h3>
          <p className="text-muted-foreground">
            {t('bid.deadlinePassedDesc', 'The submission deadline for this tender has passed. No new bids can be submitted.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                {t('bid.importantNotice', 'Important Notice')}
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t('bid.encryptionNotice', 'Your bid will be encrypted and stored securely until the opening date. Once submitted, you cannot modify your bid.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bid Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('bid.bidDetails', 'Bid Details')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bid.amount', 'Bid Amount')} *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-bid-amount"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bid.currency', 'Currency')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bid-currency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                            <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                            <SelectItem value="JOD">JOD - Jordanian Dinar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bid.notes', 'Additional Notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('bid.notesPlaceholder', 'Any additional information or comments about your bid')}
                          rows={4}
                          data-testid="textarea-bid-notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('bid.documents', 'Supporting Documents')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="bid-documents" className="block text-sm font-medium mb-2">
                    {t('bid.uploadDocuments', 'Upload Documents')}
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('bid.uploadDesc', 'Click to upload or drag and drop')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('bid.fileTypes', 'PDF, Word, Excel files up to 10MB')}
                    </p>
                    <input
                      id="bid-documents"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="input-bid-documents"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => document.getElementById('bid-documents')?.click()}
                      data-testid="button-upload-documents"
                    >
                      {t('bid.selectFiles', 'Select Files')}
                    </Button>
                  </div>
                </div>

                {/* Uploaded Documents */}
                {documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">{t('bid.uploadedDocuments', 'Uploaded Documents')}</h4>
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                        data-testid={`uploaded-document-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          data-testid={`button-remove-document-${index}`}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                data-testid="button-cancel-bid"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitBidMutation.isPending}
              data-testid="button-submit-bid"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitBidMutation.isPending 
                ? t('bid.submitting', 'Submitting...') 
                : t('bid.submitBid', 'Submit Bid')
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
