import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Search, Users, UserCheck, UserX, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { formatInTimezone } from "@/lib/timezone";
import { apiRequest } from "@/lib/queryClient";

export default function UserManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "bidder" as const,
    organizationName: "",
    contactPerson: "",
    phone: "",
    address: "",
  });

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin',
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t('user.updateSuccess', 'User updated successfully'),
        description: t('user.updateSuccessDesc', 'User information has been updated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('user.updateError', 'Failed to update user'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof createUserForm) => {
      const res = await apiRequest("POST", "/api/admin/create-user", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      setCreateUserForm({
        username: "",
        email: "",
        password: "",
        role: "bidder",
        organizationName: "",
        contactPerson: "",
        phone: "",
        address: "",
      });
      toast({
        title: t('user.createSuccess', 'User created successfully'),
        description: t('user.createSuccessDesc', 'New user has been created'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((u: any) => {
    const matchesSearch = u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.organizationName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && u.isActive) ||
                         (statusFilter === "inactive" && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const toggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserMutation.mutate({
      userId,
      updates: { isActive: !currentStatus }
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'procurement_officer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'bidder': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    const roleMap = {
      admin: t('roles.admin', 'Administrator'),
      procurement_officer: t('roles.procurementOfficer', 'Procurement Officer'),
      bidder: t('roles.bidder', 'Bidder'),
    };
    return roleMap[role] || role;
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(createUserForm);
  };

  // Check permissions
  if (user?.role !== 'admin') {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('common.accessDenied', 'Access Denied')}
            </h3>
            <p className="text-muted-foreground">
              {t('user.adminOnly', 'Only administrators can access user management')}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">
              {t('user.managementTitle', 'User Management')}
            </h1>
            <p className="text-muted-foreground">
              {t('user.managementSubtitle', 'Manage user accounts, roles, and permissions')}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('user.management', 'User Management')}
                </CardTitle>
                <CardDescription>
                  {t('user.managementDesc', 'Manage user accounts and permissions')}
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-user">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('user.createUser', 'Create User')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('user.createNewUser', 'Create New User')}</DialogTitle>
                    <DialogDescription>
                      {t('user.createUserDesc', 'Add a new user to the system')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="create-username">{t('auth.username', 'Username')}</Label>
                        <Input
                          id="create-username"
                          type="text"
                          value={createUserForm.username}
                          onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="create-email">{t('auth.email', 'Email')}</Label>
                        <Input
                          id="create-email"
                          type="email"
                          value={createUserForm.email}
                          onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="create-password">{t('auth.password', 'Password')}</Label>
                      <Input
                        id="create-password"
                        type="password"
                        value={createUserForm.password}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="create-role">{t('auth.role', 'Role')}</Label>
                      <Select
                        value={createUserForm.role}
                        onValueChange={(value: "bidder" | "procurement_officer" | "admin") => 
                          setCreateUserForm({ ...createUserForm, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bidder">{t('roles.bidder', 'Bidder/Supplier')}</SelectItem>
                          <SelectItem value="procurement_officer">{t('roles.procurementOfficer', 'Procurement Officer')}</SelectItem>
                          <SelectItem value="admin">{t('roles.admin', 'Administrator')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="create-org">{t('auth.organizationName', 'Organization Name')}</Label>
                      <Input
                        id="create-org"
                        type="text"
                        value={createUserForm.organizationName}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, organizationName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="create-contact">{t('auth.contactPerson', 'Contact Person')}</Label>
                      <Input
                        id="create-contact"
                        type="text"
                        value={createUserForm.contactPerson}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, contactPerson: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="create-phone">{t('auth.phone', 'Phone')}</Label>
                      <Input
                        id="create-phone"
                        type="tel"
                        value={createUserForm.phone}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="create-address">{t('auth.address', 'Address')}</Label>
                      <Textarea
                        id="create-address"
                        value={createUserForm.address}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, address: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        {t('common.cancel', 'Cancel')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={createUserMutation.isPending}
                        className="flex-1"
                      >
                        {createUserMutation.isPending ? t('common.loading', 'Loading...') : t('user.createUser', 'Create User')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('user.searchPlaceholder', 'Search users...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t('user.searchPlaceholder', 'Search users by name, email, or organization...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48" data-testid="select-role-filter">
                    <SelectValue placeholder={t('user.filterByRole', 'Filter by role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('user.allRoles', 'All Roles')}</SelectItem>
                    <SelectItem value="admin">{t('roles.admin', 'Administrator')}</SelectItem>
                    <SelectItem value="procurement_officer">{t('roles.procurementOfficer', 'Procurement Officer')}</SelectItem>
                    <SelectItem value="bidder">{t('roles.bidder', 'Bidder')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36" data-testid="select-status-filter">
                    <SelectValue placeholder={t('user.filterByStatus', 'Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('user.allStatuses', 'All Status')}</SelectItem>
                    <SelectItem value="active">{t('user.active', 'Active')}</SelectItem>
                    <SelectItem value="inactive">{t('user.inactive', 'Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('user.totalUsers', 'Total Users')}</p>
                  <p className="text-xl font-bold" data-testid="stat-total-users">
                    {users?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('user.bidders', 'Bidders')}</p>
                  <p className="text-xl font-bold" data-testid="stat-bidders">
                    {users?.filter((u: any) => u.role === 'bidder').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('user.procurementOfficers', 'Procurement Officers')}</p>
                  <p className="text-xl font-bold" data-testid="stat-procurement-officers">
                    {users?.filter((u: any) => u.role === 'procurement_officer').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('user.activeUsers', 'Active Users')}</p>
                  <p className="text-xl font-bold" data-testid="stat-active-users">
                    {users?.filter((u: any) => u.isActive).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('user.userList', 'User List')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg animate-pulse">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium text-destructive mb-2">
                  {t('common.error', 'Error')}
                </h3>
                <p className="text-muted-foreground">
                  {t('user.loadError', 'Failed to load users. Please try again.')}
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8" data-testid="no-users-message">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? t('user.noResults', 'No users match your search')
                    : t('user.noUsers', 'No users found')
                  }
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? t('user.tryDifferentSearch', 'Try adjusting your search criteria')
                    : t('user.noUsersDesc', 'Users will appear here as they register')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((u: any) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`user-card-${u.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">
                          {u.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium truncate" data-testid={`user-username-${u.id}`}>
                            {u.username}
                          </h4>
                          <Badge className={getRoleColor(u.role)} data-testid={`user-role-${u.id}`}>
                            {getRoleText(u.role)}
                          </Badge>
                          <Badge variant={u.isActive ? "default" : "secondary"} data-testid={`user-status-${u.id}`}>
                            {u.isActive ? t('user.active', 'Active') : t('user.inactive', 'Inactive')}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {u.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate" data-testid={`user-email-${u.id}`}>{u.email}</span>
                            </div>
                          )}
                          {u.organizationName && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate" data-testid={`user-organization-${u.id}`}>{u.organizationName}</span>
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span data-testid={`user-phone-${u.id}`}>{u.phone}</span>
                            </div>
                          )}
                        </div>

                        {u.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            {t('user.joinedOn', 'Joined')}: {formatInTimezone(new Date(u.createdAt), user?.timezone || 'UTC')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant={u.isActive ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleUserStatus(u.id, u.isActive)}
                        disabled={updateUserMutation.isPending || u.id === user?.id}
                        data-testid={`button-toggle-status-${u.id}`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            {t('user.deactivate', 'Deactivate')}
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            {t('user.activate', 'Activate')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Summary */}
            {!isLoading && !error && filteredUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground text-center" data-testid="results-summary">
                  {filteredUsers.length === users?.length 
                    ? t('user.showingAll', 'Showing all {{count}} user(s)', { count: filteredUsers.length })
                    : t('user.showingFiltered', 'Showing {{filtered}} of {{total}} user(s)', { 
                        filtered: filteredUsers.length, 
                        total: users?.length || 0 
                      })
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}