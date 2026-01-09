import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Users as UsersIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { user } = useAuth();

  // Redirect non-admins
  if (user?.access !== 'admin') {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Доступ запрещен!</strong> Эта страница доступна только администраторам.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Администрирование</h1>
            <p className="text-muted-foreground">Управление пользователями и системой</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all cursor-pointer border-border">
          <Link href="/admin/users">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Управление Пользователями</CardTitle>
              </div>
              <CardDescription>
                Просмотр и редактирование пользователей, их ролей и агентов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Перейти
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* Add more admin sections here in the future */}
      </div>
    </Layout>
  );
}
