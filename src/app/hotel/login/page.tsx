'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Loader2, Hotel } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
  password: z.string().min(1, { message: 'Bitte geben Sie Ihr Passwort ein.' }),
  remember: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function HotelLoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (data.email === 'hotelier@weso.de' && data.password === 'password') {
      toast({
        title: 'Anmeldung erfolgreich',
        description: 'Sie werden zum Dashboard weitergeleitet.',
      });
      // In a real app, a server action would set a secure cookie.
      // We simulate success by redirecting.
      router.push('/dashboard/weso-hotel-1');
    } else {
      toast({
        variant: 'destructive',
        title: 'Anmeldung fehlgeschlagen',
        description: 'Die E-Mail-Adresse oder das Passwort ist ungültig.',
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-6">
        <Hotel className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-headline font-bold">Weso<span className="text-primary">Wizard</span></h1>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Hotel-Login</CardTitle>
          <CardDescription>Geben Sie Ihre Zugangsdaten ein, um sich anzumelden.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="hotelier@weso.de" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Passwort</FormLabel>
                        <Link href="#" className="text-sm font-medium text-primary hover:underline">
                            Passwort vergessen?
                        </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Angemeldet bleiben
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Melde an...
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
       <p className="text-center text-sm text-muted-foreground mt-8">
            Demo-Zugang: <br/> E-Mail: <code className="font-mono bg-muted p-1 rounded-sm">hotelier@weso.de</code> <br/> Passwort: <code className="font-mono bg-muted p-1 rounded-sm">password</code>
        </p>
    </main>
  );
}
