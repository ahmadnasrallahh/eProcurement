import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { formatInTimezone } from "@/lib/timezone";
import { File, Eye, Edit, Download, Calendar, DollarSign, Building2 } from "lucide-react";

interface TenderCardProps {
  tender: any;
  userRole?: string;
  canEdit?: boolean;
  onView?: () => void;
  onEdit?: () => void;
}

export function TenderCard({ tender, userRole, canEdit, onView, onEdit }: TenderCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'evaluation': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      active: t('tender.status.active', 'Active'),
      draft: t('tender.status.draft', 'Draft'),
      evaluation: t('tender.status.evaluation', 'Evaluation'),
      completed: t('tender.status.completed', 'Completed'),
      cancelled: t('tender.status.cancelled', 'Cancelled'),
    };
    return statusMap[status] || status;
  };

  const isDeadlineApproaching = () => {
    if (!tender.submissionDeadline) return false;
    const deadline = new Date(tender.submissionDeadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 48 && hoursUntilDeadline > 0;
  };

  const isDeadlinePassed = () => {
    if (!tender.submissionDeadline) return false;
    return new Date(tender.submissionDeadline) < new Date();
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200" 
      data-testid={`tender-card-${tender.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <File className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0 space-y-3">
              {/* Title and Reference */}
              <div>
                <h3 className="font-semibold text-lg leading-tight truncate" data-testid={`tender-title-${tender.id}`}>
                  {tender.title}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid={`tender-reference-${tender.id}`}>
                  {t('tender.reference', 'Reference')}: {tender.referenceNumber}
                </p>
              </div>

              {/* Description */}
              {tender.description && (
                <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`tender-description-${tender.id}`}>
                  {tender.description}
                </p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {tender.category && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('tender.category', 'Category')}:</span>
                    <span className="font-medium">{tender.category}</span>
                  </div>
                )}
                
                {tender.estimatedValue && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('tender.estimatedValue', 'Value')}:</span>
                    <span className="font-medium">
                      {tender.estimatedValue} {tender.currency}
                    </span>
                  </div>
                )}

                {tender.submissionDeadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('tender.deadline', 'Deadline')}:</span>
                    <span className={`font-medium ${
                      isDeadlinePassed() ? 'text-destructive' : 
                      isDeadlineApproaching() ? 'text-amber-600' : 
                      'text-foreground'
                    }`}>
                      {formatInTimezone(new Date(tender.submissionDeadline), user?.timezone || 'UTC')}
                    </span>
                  </div>
                )}
              </div>

              {/* Deadline Warning */}
              {isDeadlineApproaching() && !isDeadlinePassed() && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    ⚠️ {t('tender.deadlineWarning', 'Deadline approaching - Less than 48 hours remaining!')}
                  </p>
                </div>
              )}

              {isDeadlinePassed() && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    🔒 {t('tender.deadlinePassed', 'Submission deadline has passed')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions and Status */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <Badge 
              className={getStatusColor(tender.status)} 
              data-testid={`tender-status-${tender.id}`}
            >
              {getStatusText(tender.status)}
            </Badge>

            <div className="flex items-center gap-2">
              {userRole === 'bidder' && tender.status === 'active' && !isDeadlinePassed() && (
                <Button 
                  size="sm" 
                  className="h-8"
                  onClick={onView}
                  data-testid={`button-bid-${tender.id}`}
                >
                  {t('tender.submitBid', 'Submit Bid')}
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={onView}
                data-testid={`button-view-${tender.id}`}
              >
                <Eye className="w-4 h-4" />
              </Button>

              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={onEdit}
                  data-testid={`button-edit-${tender.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}

              {(userRole === 'admin' || (userRole === 'procurement_officer' && canEdit)) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => window.location.href = `/tenders/${tender.id}/evaluate`}
                  data-testid={`button-evaluate-${tender.id}`}
                  title={t('bid.evaluate', 'Evaluate Bids')}
                >
                  <Scale className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
