import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TenderCard } from "@/components/tender-card";
import { BidSubmission } from "@/components/bid-submission";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Calendar, DollarSign, MapPin, Clock, File, FileText, Users, Gavel, ArrowLeft, Download } from "lucide-react";

export default function Tenders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tenders, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/tenders"],
  });

  const filteredTenders = tenders?.filter((tender: any) => {
    const matchesSearch = tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tender.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      case 'evaluation': return 'bg-amber-100 text-amber-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: t('tender.status.active', 'Active'),
      draft: t('tender.status.draft', 'Draft'),
      evaluation: t('tender.status.evaluation', 'Evaluation'),
      completed: t('tender.status.completed', 'Completed'),
      cancelled: t('tender.status.cancelled', 'Cancelled'),
    };
    return statusMap[status] || status;
  };

  const canCreateTender = user?.role === 'admin' || user?.role === 'procurement_officer';
  const canEditTender = (tender: any) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'procurement_officer' && tender.createdById === user.id) return true;
    return false;
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName; 
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      toast({
        title: t('common.error', 'Error'),
        description: t('tender.downloadError', 'Failed to download document. Please try again.'),
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">
              {user?.role === 'bidder' 
                ? t('tenders.availableTitle', 'Available Tenders')
                : t('tenders.managementTitle', 'Tender Management')
              }
            </h1>
            <p className="text-muted-foreground">
              {user?.role === 'bidder' 
                ? t('tenders.availableSubtitle', 'Browse and bid on available procurement opportunities')
                : t('tenders.managementSubtitle', 'Create and manage procurement tenders')
              }
            </p>
          </div>
          {canCreateTender && (
            <Button onClick={() => setLocation('/create-tender')} data-testid="button-create-tender">
              <Plus className="w-4 h-4 mr-2" />
              {t('tender.createNew', 'Create New Tender')}
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t('tenders.searchPlaceholder', 'Search tenders by title or reference...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tenders"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                  data-testid="select-status-filter"
                >
                  <option value="all">{t('common.allStatuses', 'All Statuses')}</option>
                  <option value="active">{t('tender.status.active', 'Active')}</option>
                  <option value="draft">{t('tender.status.draft', 'Draft')}</option>
                  <option value="evaluation">{t('tender.status.evaluation', 'Evaluation')}</option>
                  <option value="completed">{t('tender.status.completed', 'Completed')}</option>
                  <option value="cancelled">{t('tender.status.cancelled', 'Cancelled')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenders List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-muted rounded-lg"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-5 bg-muted rounded w-1/3"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 bg-muted rounded w-20"></div>
                        <div className="h-8 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <File className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium text-destructive mb-2">
                  {t('common.error', 'Error')}
                </h3>
                <p className="text-muted-foreground">
                  {t('tenders.loadError', 'Failed to load tenders. Please try again.')}
                </p>
              </CardContent>
            </Card>
          ) : filteredTenders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || statusFilter !== 'all' 
                    ? t('tenders.noResults', 'No tenders match your search')
                    : t('tenders.noTenders', 'No tenders available')
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? t('tenders.tryDifferentSearch', 'Try adjusting your search criteria')
                    : user?.role === 'bidder'
                    ? t('tenders.checkBackLater', 'Check back later for new opportunities')
                    : t('tenders.createFirstTender', 'Create your first tender to get started')
                  }
                </p>
                {canCreateTender && !searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setLocation('/create-tender')} data-testid="button-create-first-tender">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('tender.createNew', 'Create New Tender')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTenders.map((tender: any) => (
              <TenderCard
                key={tender.id}
                tender={tender}
                userRole={user?.role}
                canEdit={canEditTender(tender)}
                onView={() => setLocation(`/tenders/${tender.id}`)}
                onEdit={() => setLocation(`/tenders/${tender.id}/edit`)}
              />
            ))
          )}
        </div>

        {/* Results Summary */}
        {!isLoading && !error && (
          <div className="text-center text-sm text-muted-foreground" data-testid="results-summary">
            {filteredTenders.length === tenders?.length 
              ? t('tenders.showingAll', 'Showing {{count}} tender(s)', { count: filteredTenders.length })
              : t('tenders.showingFiltered', 'Showing {{filtered}} of {{total}} tender(s)', { 
                  filtered: filteredTenders.length, 
                  total: tenders?.length || 0 
                })
            }
          </div>
        )}
      </div>
    </MainLayout>
  );
}
