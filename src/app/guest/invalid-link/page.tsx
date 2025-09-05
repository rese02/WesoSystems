import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { AlertTriangle } from "lucide-react";

export default function InvalidLinkPage() {
  return (
    <Card className="w-full max-w-lg text-center shadow-2xl">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-headline">Ungültiger Link</CardTitle>
        <CardDescription>
          Der von Ihnen verwendete Buchungslink ist leider ungültig oder abgelaufen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">
          Bitte kontaktieren Sie das Hotel direkt, um einen neuen Link anzufordern oder Ihre Buchung zu besprechen.
        </p>
        <Button asChild>
          <Link href="/hotel/login">Zurück zum Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
