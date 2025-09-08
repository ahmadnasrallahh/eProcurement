import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { Gavel } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <img src="/public/logo.png" alt="NABNI" className="h-15 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">NABNI eProcurement</h1>
          </div>

          <div className="w-full">
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
          </div>
        </div>
      </div>
  );
}
