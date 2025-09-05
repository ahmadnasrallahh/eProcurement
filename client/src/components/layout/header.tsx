import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/language-provider";
import { formatInTimezone } from "@/lib/timezone";
import { Gavel, Bell, Menu, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageToggle = (lang: "en" | "ar") => {
    setLanguage(lang);
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      admin: t('roles.admin', 'Administrator'),
      procurement_officer: t('roles.procurementOfficer', 'Procurement Officer'),
      bidder: t('roles.bidder', 'Bidder'),
    };
    return roleMap[role] || role;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-card border-b border-border px-4 lg:px-6 h-16 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onSidebarToggle}
          data-testid="button-sidebar-toggle"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Gavel className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="app-title">
              {t('app.title', 'NGO Procurement')}
            </h1>
            <p className="text-xs text-muted-foreground" data-testid="organization-name">
              {user?.organizationName || t('app.defaultOrg', 'Global Relief Foundation')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <div className="flex items-center border border-border rounded-lg p-1">
          <Button
            variant={language === "en" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handleLanguageToggle("en")}
            data-testid="button-language-en"
          >
            EN
          </Button>
          <Button
            variant={language === "ar" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handleLanguageToggle("ar")}
            data-testid="button-language-ar"
          >
            العربية
          </Button>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
            0
          </Badge>
        </Button>

        {/* Current Time */}
        <div className="hidden md:block text-sm text-muted-foreground" data-testid="current-time">
          {formatInTimezone(new Date(), user?.timezone || 'UTC')}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 h-auto p-2" data-testid="button-user-menu">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium" data-testid="user-name">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="user-role">
                  {getRoleDisplayName(user?.role || 'user')}
                </p>
              </div>
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium" data-testid="user-initials">
                  {getInitials(user?.username || 'User')}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              {t('auth.logout', 'Logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
