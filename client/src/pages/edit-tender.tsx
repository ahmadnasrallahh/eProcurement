import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, FileText, Upload, X, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  estimatedValue: z.string().optional(),
  currency: z.string().default('USD'),
  publishDate: z.string().optional(),
  submissionDeadline: z.string().optional(),
  openingDate: z.string().optional(),
  language: z.enum(["en", "ar"]).default("en"),
  requirements: z.string().optional(),
  evaluationCriteria: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditTender(): JSX.Element {
  const { tenderId } = useParams();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tender, isLoading } = useQuery({
    queryKey: ["/api/tenders", tenderId],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${tenderId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tender");
      return res.json();
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      estimatedValue: "",
      currency: "USD",
      publishDate: "",
      submissionDeadline: "",
      openingDate: "",
      language: "en",
      requirements: "",
      evaluationCriteria: "",
    },
    values: tender ? {
      title: tender.title || "",
      description: tender.description || "",
      category: tender.category || "",
      estimatedValue: tender.estimatedValue || "",
      currency: tender.currency || "USD",
      publishDate: tender.publishDate ? new Date(tender.publishDate).toISOString().slice(0,16) : "",
      submissionDeadline: tender.submissionDeadline ? new Date(tender.submissionDeadline).toISOString().slice(0,16) : "",
      openingDate: tender.openingDate ? new Date(tender.openingDate).toISOString().slice(0,16) : "",
      language: tender.language || "en",
      requirements: tender.requirements?.text || "",
      evaluationCriteria: tender.evaluationCriteria?.text || "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = {
        ...data,
        // Convert date strings to ISO if present
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
        submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : undefined,
        openingDate: data.openingDate ? new Date(data.openingDate) : undefined,
        requirements: data.requirements ? { text: data.requirements } : undefined,
        evaluationCriteria: data.evaluationCriteria ? { text: data.evaluationCriteria } : undefined,
      };
      const res = await apiRequest("PATCH", `/api/tenders/${tenderId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders", tenderId] });
      toast({ title: t('tender.updateSuccess', 'Tender updated successfully') });
      setLocation(`/tenders/${tenderId}`);
    },
    onError: () => {
      toast({ title: t('tender.updateError', 'Failed to update tender'), variant: 'destructive' });
    }
  });

  const onSubmit = (data: FormData) => updateMutation.mutate(data);

  const [newDocuments, setNewDocuments] = React.useState<File[]>([]);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewDocuments(prev => [...prev, ...files]);
  };
  const removeDocument = (index: number) => setNewDocuments(prev => prev.filter((_, i) => i !== index));

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation(`/tenders/${tenderId}`)} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back', 'Back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('tender.update', 'Update Tender')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('tender.details', 'Tender Details')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tender.title', 'Title')}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title" />
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
                        <Textarea rows={4} {...field} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tender.category', 'Category')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tender.estimatedValue', 'Estimated Value')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-estimated-value" />
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

                {/* Timeline */}
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="publishDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tender.publishDate', 'Publish Date')}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-publish-date" />
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
                        <FormLabel>{t('tender.submissionDeadline', 'Submission Deadline')}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-submission-deadline" />
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
                        <FormLabel>{t('tender.openingDate', 'Opening Date')}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-opening-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Language */}
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

                {/* Requirements & Evaluation */}
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tender.requirements', 'Requirements')}</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} data-testid="textarea-requirements" />
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
                        <Textarea rows={4} {...field} data-testid="textarea-evaluation-criteria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
                    {updateMutation.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Documents: existing + upload new */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> {t('tender.documents', 'Tender Documents')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing */}
            {Array.isArray((tender as any)?.documents) && (tender as any).documents.length > 0 ? (
              <div className="grid gap-2">
                {(tender as any).documents.map((d: any) => (
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

            {/* Upload new */}
            <div>
              <label htmlFor="tender-documents" className="block text-sm font-medium mb-2">
                {t('tender.uploadDocuments', 'Upload Documents')}
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">{t('tender.uploadDesc', 'Click to upload tender documents')}</p>
                <input
                  id="tender-documents"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-tender-documents"
                />
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => document.getElementById('tender-documents')?.click()}>
                  {t('tender.selectFiles', 'Select Files')}
                </Button>
              </div>
            </div>

            {newDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">{t('tender.uploadedDocuments', 'Uploaded Documents')}</h4>
                {newDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={async () => {
                    for (const file of newDocuments) {
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await fetch(`/api/tenders/${tenderId}/documents`, { method: 'POST', body: formData, credentials: 'include' });
                      if (!res.ok) {
                        const text = await res.text();
                        throw new Error(text || 'Upload failed');
                      }
                    }
                    setNewDocuments([]);
                    queryClient.invalidateQueries({ queryKey: ["/api/tenders", tenderId] });
                    toast({ title: t('tender.uploadSuccess', 'Documents uploaded') });
                  }}
                >
                  {t('common.upload', 'Upload')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


