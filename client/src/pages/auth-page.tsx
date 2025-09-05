import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { Gavel, Shield, Globe, Users } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "bidder" as const,
    organizationName: "",
    contactPerson: "",
    phone: "",
    address: "",
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(loginForm);
      setLocation("/");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.mutateAsync(registerForm);
      setLocation("/");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Gavel className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">NGO Procurement</h1>
            </div>
            <p className="text-muted-foreground">
              {t('auth.welcome', 'Secure e-procurement platform for NGOs')}
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">
                {t('auth.login', 'Login')}
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">
                {t('auth.register', 'Register')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.signIn', 'Sign In')}</CardTitle>
                  <CardDescription>
                    {t('auth.signInDescription', 'Enter your credentials to access your account')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">{t('auth.username', 'Username')}</Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        type="text"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">{t('auth.password', 'Password')}</Label>
                      <Input
                        id="login-password"
                        data-testid="input-login-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-login"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? t('common.loading', 'Loading...') : t('auth.signIn', 'Sign In')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.createAccount', 'Create Account')}</CardTitle>
                  <CardDescription>
                    {t('auth.createAccountDescription', 'Register your organization to start using the platform')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reg-username">{t('auth.username', 'Username')}</Label>
                        <Input
                          id="reg-username"
                          data-testid="input-register-username"
                          type="text"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reg-email">{t('auth.email', 'Email')}</Label>
                        <Input
                          id="reg-email"
                          data-testid="input-register-email"
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-password">{t('auth.password', 'Password')}</Label>
                      <Input
                        id="reg-password"
                        data-testid="input-register-password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-role">{t('auth.role', 'Role')}</Label>
                      <Select
                        value={registerForm.role}
                        onValueChange={(value: "bidder" | "procurement_officer") => 
                          setRegisterForm({ ...registerForm, role: value })
                        }
                      >
                        <SelectTrigger data-testid="select-register-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bidder">{t('roles.bidder', 'Bidder/Supplier')}</SelectItem>
                          <SelectItem value="procurement_officer">{t('roles.procurementOfficer', 'Procurement Officer')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-org">{t('auth.organizationName', 'Organization Name')}</Label>
                      <Input
                        id="reg-org"
                        data-testid="input-register-organization"
                        type="text"
                        value={registerForm.organizationName}
                        onChange={(e) => setRegisterForm({ ...registerForm, organizationName: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-contact">{t('auth.contactPerson', 'Contact Person')}</Label>
                      <Input
                        id="reg-contact"
                        data-testid="input-register-contact"
                        type="text"
                        value={registerForm.contactPerson}
                        onChange={(e) => setRegisterForm({ ...registerForm, contactPerson: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-phone">{t('auth.phone', 'Phone')}</Label>
                      <Input
                        id="reg-phone"
                        data-testid="input-register-phone"
                        type="tel"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-address">{t('auth.address', 'Address')}</Label>
                      <Textarea
                        id="reg-address"
                        data-testid="textarea-register-address"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                        rows={3}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-register"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? t('common.loading', 'Loading...') : t('auth.createAccount', 'Create Account')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
        <div className="max-w-lg text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-primary">
              {t('hero.title', 'Streamlined Procurement for NGOs')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('hero.description', 'Secure, transparent, and efficient e-procurement platform designed specifically for non-governmental organizations.')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('features.secure', 'Secure')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.secureDesc', 'GDPR compliant with encrypted bid storage')}
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('features.multilingual', 'Multilingual')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.multilingualDesc', 'Full support for Arabic and English')}
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('features.rolesBased', 'Role-Based')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.rolesBasedDesc', 'Controlled access for different user types')}
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Gavel className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('features.transparent', 'Transparent')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.transparentDesc', 'Audit trails and clear processes')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
