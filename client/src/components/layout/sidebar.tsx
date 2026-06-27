import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@/lib/api-types";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  File,
  Plus,
  HelpCircle,
  BarChart3,
  Users,
  Settings,
  ClipboardList,
  FileText,
  Scale,
  Building2,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const navigate = (path: string) => {
    setLocation(path);
    onClose(); // Close sidebar on mobile after navigation
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const adminNavItems: NavItem[] = [
    {
      label: t('nav.dashboard', 'Dashboard'),
      icon: Home,
      path: '/',
    },
    {
      label: t('nav.userManagement', 'User Management'),
      icon: Users,
      path: '/users',
    },
    {
      label: t('nav.tenders', 'All Tenders'),
      icon: File,
      path: '/tenders',
    },
    {
      label: t('nav.clarifications', 'Clarifications'),
      icon: HelpCircle,
      path: '/clarifications',
      badge: stats?.pendingClarifications,
    },
    {
      label: t('nav.auditLogs', 'Audit Logs'),
      icon: ClipboardList,
      path: '/audit',
    },
    {
      label: t('nav.systemSettings', 'System Settings'),
      icon: Settings,
      path: '/settings',
    },
  ];

  const procurementNavItems: NavItem[] = [
    {
      label: t('nav.dashboard', 'Dashboard'),
      icon: Home,
      path: '/',
    },
    {
      label: t('nav.manageTenders', 'Manage Tenders'),
      icon: File,
      path: '/tenders',
    },
    {
      label: t('nav.createTender', 'Create Tender'),
      icon: Plus,
      path: '/create-tender',
    },
    {
      label: t('nav.clarifications', 'Clarifications'),
      icon: HelpCircle,
      path: '/clarifications',
      badge: stats?.pendingClarifications,
    },
    {
      label: t('nav.bidEvaluation', 'Bid Evaluation'),
      icon: Scale,
      path: '/evaluation',
    },
    {
      label: t('nav.reports', 'Reports'),
      icon: BarChart3,
      path: '/reports',
    },
  ];

  const bidderNavItems: NavItem[] = [
    {
      label: t('nav.dashboard', 'Dashboard'),
      icon: Home,
      path: '/',
    },
    {
      label: t('nav.availableTenders', 'Available Tenders'),
      icon: FileText,
      path: '/tenders',
    },
    {
      label: t('nav.myBids', 'My Bids'),
      icon: File,
      path: '/my-bids',
    },
    {
      label: t('nav.askClarifications', 'Ask Clarifications'),
      icon: HelpCircle,
      path: '/clarifications',
    },
    {
      label: t('nav.companyProfile', 'Company Profile'),
      icon: Building2,
      path: '/profile',
    },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminNavItems;
      case 'procurement_officer':
        return procurementNavItems;
      case 'bidder':
        return bidderNavItems;
      default:
        return [];
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'admin':
        return t('nav.administration', 'Administration');
      case 'procurement_officer':
        return t('nav.procurement', 'Procurement');
      case 'bidder':
        return t('nav.bidding', 'Bidding');
      default:
        return '';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar",
          isOpen && "open"
        )}
        data-testid="sidebar"
      >
        <nav className="p-4 space-y-2">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {getRoleTitle()}
            </h3>
          </div>

          {getNavItems().map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Button
                key={item.path}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                )}
                onClick={() => navigate(item.path)}
                data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full"
                    data-testid={`badge-${item.path.replace('/', '')}`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
