import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  FileBarChart
} from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch tenders for analysis
  const { data: tenders } = useQuery({
    queryKey: ["/api/tenders"],
  });

  // Mock data for charts (in a real app, this would come from the API)
  const tendersByStatus = [
    { name: t('tender.status.active', 'Active'), value: stats?.activeTenders || 0, color: COLORS[0] },
    { name: t('tender.status.completed', 'Completed'), value: stats?.completedTenders || 0, color: COLORS[1] },
    { name: t('tender.status.draft', 'Draft'), value: stats?.draftTenders || 0, color: COLORS[2] },
    { name: t('tender.status.cancelled', 'Cancelled'), value: stats?.cancelledTenders || 0, color: COLORS[3] },
  ];

  const monthlyTrend = [
    { month: 'Jan', tenders: 12, bids: 48 },
    { month: 'Feb', tenders: 18, bids: 72 },
    { month: 'Mar', tenders: 25, bids: 95 },
    { month: 'Apr', tenders: 22, bids: 88 },
    { month: 'May', tenders: 30, bids: 120 },
    { month: 'Jun', tenders: 28, bids: 112 },
  ];

  const categoryData = [
    { category: 'IT Services', count: 15, value: 250000 },
    { category: 'Construction', count: 8, value: 1200000 },
    { category: 'Consulting', count: 12, value: 180000 },
    { category: 'Equipment', count: 6, value: 75000 },
    { category: 'Training', count: 4, value: 32000 },
  ];

  const handleGenerateReport = async (type: string) => {
    try {
      // In a real app, this would call an API to generate and download the report
      toast({
        title: t('reports.generating', 'Generating Report'),
        description: t('reports.generatingDesc', 'Your report is being prepared for download'),
      });

      // Simulate report generation
      setTimeout(() => {
        toast({
          title: t('reports.reportReady', 'Report Ready'),
          description: t('reports.reportReadyDesc', 'Your report has been generated successfully'),
        });
      }, 2000);
    } catch (error) {
      toast({
        title: t('reports.error', 'Report Generation Failed'),
        description: t('reports.errorDesc', 'Failed to generate report. Please try again.'),
        variant: "destructive",
      });
    }
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case 'last_7_days': return t('reports.last7Days', 'Last 7 Days');
      case 'last_30_days': return t('reports.last30Days', 'Last 30 Days');
      case 'last_3_months': return t('reports.last3Months', 'Last 3 Months');
      case 'last_year': return t('reports.lastYear', 'Last Year');
      case 'all_time': return t('reports.allTime', 'All Time');
      default: return range;
    }
  };

  // Check permissions
  if (user?.role !== 'admin' && user?.role !== 'procurement_officer') {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <FileBarChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('common.accessDenied', 'Access Denied')}
            </h3>
            <p className="text-muted-foreground">
              {t('reports.permissionError', 'You do not have permission to view reports')}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('reports.title', 'Reports & Analytics')}</h1>
            <p className="text-muted-foreground">
              {t('reports.description', 'Generate reports and analyze procurement data')}
            </p>
          </div>
          <Button
            onClick={() => handleGenerateReport(reportType)}
            data-testid="button-generate-report"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('reports.generateReport', 'Generate Report')}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('reports.filters', 'Filters')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">
                {t('reports.reportType', 'Report Type')}
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">{t('reports.overview', 'Overview')}</SelectItem>
                  <SelectItem value="tender_analysis">{t('reports.tenderAnalysis', 'Tender Analysis')}</SelectItem>
                  <SelectItem value="bid_analysis">{t('reports.bidAnalysis', 'Bid Analysis')}</SelectItem>
                  <SelectItem value="financial">{t('reports.financial', 'Financial Report')}</SelectItem>
                  <SelectItem value="audit">{t('reports.audit', 'Audit Trail')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">
                {t('reports.dateRange', 'Date Range')}
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">{getDateRangeLabel('last_7_days')}</SelectItem>
                  <SelectItem value="last_30_days">{getDateRangeLabel('last_30_days')}</SelectItem>
                  <SelectItem value="last_3_months">{getDateRangeLabel('last_3_months')}</SelectItem>
                  <SelectItem value="last_year">{getDateRangeLabel('last_year')}</SelectItem>
                  <SelectItem value="all_time">{getDateRangeLabel('all_time')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">
                {t('reports.status', 'Status Filter')}
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                  <SelectItem value="active">{t('tender.status.active', 'Active')}</SelectItem>
                  <SelectItem value="completed">{t('tender.status.completed', 'Completed')}</SelectItem>
                  <SelectItem value="draft">{t('tender.status.draft', 'Draft')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="metric-total-tenders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.totalTenders', 'Total Tenders')}</p>
                  <p className="text-2xl font-bold">{(stats?.activeTenders || 0) + (stats?.completedTenders || 0)}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+12% </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-total-bids">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.totalBids', 'Total Bids')}</p>
                  <p className="text-2xl font-bold">{stats?.totalBids || 156}</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+8% </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-total-value">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.totalValue', 'Total Value')}</p>
                  <p className="text-2xl font-bold">$2.4M</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+15% </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-active-bidders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.activeBidders', 'Active Bidders')}</p>
                  <p className="text-2xl font-bold">{stats?.totalBidders || 42}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+5% </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tender Status Distribution */}
          <Card data-testid="chart-tender-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                {t('reports.tenderStatusDistribution', 'Tender Status Distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tendersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tendersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-4">
                {tendersByStatus.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card data-testid="chart-monthly-trend">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t('reports.monthlyTrend', 'Monthly Trend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="tenders" 
                    stroke={COLORS[0]} 
                    strokeWidth={3}
                    name={t('reports.tenders', 'Tenders')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bids" 
                    stroke={COLORS[1]} 
                    strokeWidth={3}
                    name={t('reports.bids', 'Bids')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis */}
        <Card data-testid="chart-category-analysis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('reports.categoryAnalysis', 'Category Analysis')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[0]} name={t('reports.tenderCount', 'Tender Count')} />
                <Bar dataKey="value" fill={COLORS[1]} name={t('reports.totalValue', 'Total Value ($)')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <Card data-testid="quick-reports">
          <CardHeader>
            <CardTitle>{t('reports.quickReports', 'Quick Reports')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
                onClick={() => handleGenerateReport('tender_summary')}
                data-testid="button-tender-summary-report"
              >
                <FileText className="w-8 h-8" />
                <div className="text-center">
                  <p className="font-medium">{t('reports.tenderSummary', 'Tender Summary')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('reports.tenderSummaryDesc', 'Overview of all tenders')}
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
                onClick={() => handleGenerateReport('bid_evaluation')}
                data-testid="button-bid-evaluation-report"
              >
                <Target className="w-8 h-8" />
                <div className="text-center">
                  <p className="font-medium">{t('reports.bidEvaluation', 'Bid Evaluation')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('reports.bidEvaluationDesc', 'Detailed bid analysis')}
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
                onClick={() => handleGenerateReport('financial_report')}
                data-testid="button-financial-report"
              >
                <DollarSign className="w-8 h-8" />
                <div className="text-center">
                  <p className="font-medium">{t('reports.financialReport', 'Financial Report')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('reports.financialReportDesc', 'Financial analytics')}
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}