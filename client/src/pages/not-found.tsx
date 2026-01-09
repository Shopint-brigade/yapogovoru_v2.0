import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto border-border shadow-xl">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold font-display text-foreground">404 Страница не найдена</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            К сожалению, запрашиваемая вами страница не существует или была перемещена.
          </p>

          <div className="mt-8 flex justify-end">
            <Link href="/">
              <Button>Вернуться на главную</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
