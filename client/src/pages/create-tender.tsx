import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, CalendarDays, FileText, Save, ArrowLeft, Upload, X } from "lucide-react";

const tenderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  estimatedValue: z.string().optional(),
  currency: z.string().default('USD'),
  publishDate: z.string().optional(),
  submissionDeadline: z.string().min(1, 'Submission deadline is required'),
  openingDate: z.string().min(1, 'Opening date is required'),
  language: z.enum(['en', 'ar']).default('en'),
  requirements: z.string().optional(),
  evaluationCriteria: z.string().optional(),
});

type TenderFormData = z.infer<typeof tenderSchema>;

export default function CreateTender() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [isDraft, setIsDraft] = useState(true);
  const [documents, setDocuments] = useState<File[]>([]);

  const form = useForm<TenderFormData>({
    resolver: zodResolver(tenderSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      estimatedValue: "",
      currency: "USD",
      language: user?.language || "en",
      requirements: "",
      evaluationCriteria: "",
    },
  });

  const createTenderMutation = useMutation({
    mutationFn: async (data: TenderFormData & { status: string }) => {
      // First create the tender
      const res = await apiRequest("POST", "/api/tenders", data);
      const tender = await res.json();
      
      // Then upload documents if any
      if (documents.length > 0) {
        for (const file of documents) {
          const formData = new FormData();
          formData.append('file', file);
          await apiRequest("POST", `/api/tenders/${tender.id}/documents`, formData, {
            headers: {}, // Let browser set Content-Type for FormData
          });
        }
      }
      
      return tender;
    },
    onSuccess: (tender) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({
        title: t('tender.createSuccess', 'Tender created successfully'),
        description: t('tender.createSuccessDesc', 'Your tender has been created and can be managed from the tenders page'),
      });
      setLocation('/tenders');
    },
    onError: (error: any) => {
      toast({
        title: t('tender.createError', 'Failed to create tender'),
        description: error.message || t('tender.createErrorDesc', 'Please check your input and try again'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TenderFormData) => {
    // Parse requirements and evaluation criteria as JSON if provided
    const payload = {
      ...data,
      status: isDraft ? 'draft' : 'active',
      requirements: data.requirements ? { text: data.requirements } : undefined,
      evaluationCriteria: data.evaluationCriteria ? { text: data.evaluationCriteria } : undefined,
    };

    createTenderMutation.mutate(payload);
  };

  const handleSaveAsDraft = () => {
    setIsDraft(true);
    form.handleSubmit(onSubmit)();
  };

  const handlePublish = () => {
    setIsDraft(false);
    form.handleSubmit(onSubmit)();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
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
              {t('tender.createPermissionError', 'You do not have permission to create tenders')}
            </p>
          </CardContent>
        </Card>
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
            <h1 className="text-2xl font-bold" data-testid="page-title">
              {t('tender.createTitle', 'Create New Tender')}
            </h1>
            <p className="text-muted-foreground">
              {t('tender.createSubtitle', 'Set up a new procurement tender for your organization')}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {t('tender.basicInformation', 'Basic Information')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tender.title', 'Title')} *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('tender.titlePlaceholder', 'Enter tender title')}
                              data-testid="input-title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tender.description', 'Description')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('tender.descriptionPlaceholder', 'Describe the procurement requirements')}
                              rows={4}
                              data-testid="textarea-description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tender.category', 'Category')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder={t('tender.selectCategory', 'Select category')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="goods">{t('tender.category.goods', 'Goods & Supplies')}</SelectItem>
                                <SelectItem value="services">{t('tender.category.services', 'Services')}</SelectItem>
                                <SelectItem value="construction">{t('tender.category.construction', 'Construction')}</SelectItem>
                                <SelectItem value="consulting">{t('tender.category.consulting', 'Consulting')}</SelectItem>
                                <SelectItem value="it">{t('tender.category.it', 'IT & Technology')}</SelectItem>
                                <SelectItem value="other">{t('tender.category.other', 'Other')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tender.language', 'Language')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-language">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">{t('language.english', 'English')}</SelectItem>
                                <SelectItem value="ar">{t('language.arabic', 'العربية')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="estimatedValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tender.estimatedValue', 'Estimated Value')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                data-testid="input-estimated-value"
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
                            <FormLabel>{t('tender.currency', 'Currency')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-currency">
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
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {t('tender.timeline', 'Timeline')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="publishDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tender.publishDate', 'Publish Date')}</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                data-testid="input-publish-date"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="submissionDeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tender.submissionDeadline', 'Submission Deadline')} *</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                data-testid="input-submission-deadline"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openingDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tender.openingDate', 'Opening Date')} *</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                data-testid="input-opening-date"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements & Evaluation */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tender.requirementsAndEvaluation', 'Requirements & Evaluation')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tender.requirements', 'Requirements')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('tender.requirementsPlaceholder', 'List the technical and commercial requirements')}
                              rows={4}
                              data-testid="textarea-requirements"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="evaluationCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tender.evaluationCriteria', 'Evaluation Criteria')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('tender.evaluationCriteriaPlaceholder', 'Describe how bids will be evaluated')}
                              rows={4}
                              data-testid="textarea-evaluation-criteria"
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
                      {t('tender.documents', 'Tender Documents')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor="tender-documents" className="block text-sm font-medium mb-2">
                        {t('tender.uploadDocuments', 'Upload Documents')}
                      </label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          {t('tender.uploadDesc', 'Click to upload tender documents')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('tender.fileTypes', 'PDF, Word, Excel files up to 10MB')}
                        </p>
                        <input
                          id="tender-documents"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={handleFileUpload}
                          className="hidden"
                          data-testid="input-tender-documents"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => document.getElementById('tender-documents')?.click()}
                          data-testid="button-upload-documents"
                        >
                          {t('tender.selectFiles', 'Select Files')}
                        </Button>
                      </div>
                    </div>

                    {/* Uploaded Documents */}
                    {documents.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">{t('tender.uploadedDocuments', 'Uploaded Documents')}</h4>
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
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tender.actions', 'Actions')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleSaveAsDraft}
                      disabled={createTenderMutation.isPending}
                      data-testid="button-save-draft"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {createTenderMutation.isPending && isDraft 
                        ? t('common.saving', 'Saving...') 
                        : t('tender.saveAsDraft', 'Save as Draft')
                      }
                    </Button>
                    
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handlePublish}
                      disabled={createTenderMutation.isPending}
                      data-testid="button-publish"
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {createTenderMutation.isPending && !isDraft 
                        ? t('common.publishing', 'Publishing...') 
                        : t('tender.publish', 'Publish Tender')
                      }
                    </Button>
                  </CardContent>
                </Card>

                {/* Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tender.guidelines', 'Guidelines')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        {t('tender.timeline', 'Timeline')}
                      </h4>
                      <p>{t('tender.timelineGuideline', 'Ensure adequate time between submission deadline and opening date for bid review.')}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        {t('tender.requirements', 'Requirements')}
                      </h4>
                      <p>{t('tender.requirementsGuideline', 'Be specific and clear about technical specifications and delivery requirements.')}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        {t('tender.evaluation', 'Evaluation')}
                      </h4>
                      <p>{t('tender.evaluationGuideline', 'Define clear, objective criteria for evaluating submitted bids.')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
