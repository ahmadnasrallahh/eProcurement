import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { formatInTimezone } from "@/lib/timezone";
import { 
  File, 
  Users, 
  HelpCircle, 
  CheckCircle, 
  Plus, 
  Eye, 
  Edit, 
  BarChart3,
  Circle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { DashboardStats } from "@/lib/api-types";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: tenders, isLoading: tendersLoading } = useQuery<any[]>({
    queryKey: ["/api/tenders"],
  });

  if (!user) return null;

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">
              {user.role === 'admin' 
                ? t('dashboard.adminTitle', 'System Dashboard')
                : user.role === 'procurement_officer' 
                ? t('dashboard.procurementTitle', 'Procurement Dashboard')
                : t('dashboard.bidderTitle', 'Bidder Dashboard')
              }
            </h1>
            <p className="text-muted-foreground">
              {user.role === 'admin' 
                ? t('dashboard.adminSubtitle', 'Manage system users and oversight')
                : user.role === 'procurement_officer' 
                ? t('dashboard.procurementSubtitle', 'Manage your organization\'s procurement activities')
                : t('dashboard.bidderSubtitle', 'Track your bids and find new opportunities')
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground" data-testid="current-time">
              {formatInTimezone(new Date(), user.timezone || 'UTC')}
            </div>
            {(user.role === 'admin' || user.role === 'procurement_officer') && (
              <Button onClick={() => setLocation('/create-tender')} data-testid="button-create-tender">
                <Plus className="w-4 h-4 mr-2" />
                {t('tender.createNew', 'Create New Tender')}
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {user.role === 'admin' || user.role === 'procurement_officer' ? (
            <>
              <Card data-testid="card-active-tenders">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.activeTenders', 'Active Tenders')}
                      </p>
                      <p className="text-2xl font-bold" data-testid="stat-active-tenders">
                        {statsLoading ? '-' : stats?.activeTenders || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user.role === 'admin' && (
                <Card data-testid="card-total-bidders">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('dashboard.stats.totalBidders', 'Total Bidders')}
                        </p>
                        <p className="text-2xl font-bold" data-testid="stat-total-bidders">
                          {statsLoading ? '-' : stats?.totalBidders || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card data-testid="card-pending-clarifications">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.pendingClarifications', 'Pending Clarifications')}
                      </p>
                      <p className="text-2xl font-bold" data-testid="stat-pending-clarifications">
                        {statsLoading ? '-' : stats?.pendingClarifications || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-completed-tenders">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.completedTenders', 'Completed Tenders')}
                      </p>
                      <p className="text-2xl font-bold" data-testid="stat-completed-tenders">
                        {statsLoading ? '-' : stats?.completedTenders || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card data-testid="card-submitted-bids">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.submittedBids', 'Submitted Bids')}
                      </p>
                      <p className="text-2xl font-bold" data-testid="stat-submitted-bids">
                        {statsLoading ? '-' : stats?.submittedBids || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-accepted-bids">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.acceptedBids', 'Accepted Bids')}
                      </p>
                      <p className="text-2xl font-bold" data-testid="stat-accepted-bids">
                        {statsLoading ? '-' : stats?.acceptedBids || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tenders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle data-testid="recent-tenders-title">
                    {user.role === 'bidder' 
                      ? t('dashboard.availableTenders', 'Available Tenders')
                      : t('dashboard.recentTenders', 'Recent Tenders')
                    }
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation('/tenders')}
                    data-testid="button-view-all-tenders"
                  >
                    {t('common.viewAll', 'View All')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tendersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-48 bg-muted rounded"></div>
                            <div className="h-3 w-32 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : tenders && tenders.length > 0 ? (
                  <div className="space-y-4">
                    {tenders.slice(0, 5).map((tender: any) => (
                      <div key={tender.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg" data-testid={`tender-card-${tender.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <File className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium" data-testid={`tender-title-${tender.id}`}>
                              {tender.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              <span data-testid={`tender-reference-${tender.id}`}>{tender.referenceNumber}</span>
                              {tender.submissionDeadline && (
                                <>
                                  {' • '}
                                  <span data-testid={`tender-deadline-${tender.id}`}>
                                    {t('tender.deadline', 'Deadline')}: {formatInTimezone(new Date(tender.submissionDeadline), user.timezone || 'UTC')}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(tender.status)} data-testid={`tender-status-${tender.id}`}>
                            {getStatusText(tender.status)}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setLocation(`/tenders?id=${tender.id}`)}
                            data-testid={`button-view-tender-${tender.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-tenders-message">
                    <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {user.role === 'bidder' 
                        ? t('dashboard.noAvailableTenders', 'No tenders available at the moment')
                        : t('dashboard.noTenders', 'No tenders created yet')
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="quick-actions-title">
                  {t('dashboard.quickActions', 'Quick Actions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.role === 'admin' && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setLocation('/users')}
                    data-testid="button-manage-users"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{t('dashboard.actions.manageUsers', 'Manage Users')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('dashboard.actions.manageUsersDesc', 'Control user access and roles')}
                      </p>
                    </div>
                  </Button>
                )}
                
                {(user.role === 'admin' || user.role === 'procurement_officer') && (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setLocation('/create-tender')}
                      data-testid="button-create-tender-quick"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Plus className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{t('dashboard.actions.createTender', 'Create Tender')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('dashboard.actions.createTenderDesc', 'Start new procurement process')}
                        </p>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setLocation('/clarifications')}
                      data-testid="button-review-clarifications"
                    >
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{t('dashboard.actions.reviewClarifications', 'Review Clarifications')}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.pendingClarifications || 0} {t('dashboard.actions.pendingRequests', 'pending requests')}
                        </p>
                      </div>
                    </Button>
                  </>
                )}
                
                {user.role === 'bidder' && (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setLocation('/tenders')}
                      data-testid="button-browse-tenders"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <File className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{t('dashboard.actions.browseTenders', 'Browse Tenders')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('dashboard.actions.browseTendersDesc', 'Find new opportunities')}
                        </p>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setLocation('/clarifications')}
                      data-testid="button-ask-clarifications"
                    >
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{t('dashboard.actions.askClarifications', 'Ask Clarifications')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('dashboard.actions.askClarificationsDesc', 'Get tender details')}
                        </p>
                      </div>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="recent-activity-title">
                  {t('dashboard.recentActivity', 'Recent Activity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="activity-feed">
                  <div className="text-center py-4 text-muted-foreground">
                    <Circle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">
                      {t('dashboard.noActivity', 'No recent activity')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
