'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, Copy, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from 'date-fns/locale';
import { createBookingWithLink } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

const createBookingSchema = z.object({
  firstName: z.string().min(1, { message: "Vorname ist ein Pflichtfeld." }),
  lastName: z.string().min(1, { message: "Nachname ist ein Pflichtfeld." }),
  email: z.string().email({ message: "Gültige E-Mail ist erforderlich." }),
  dates: z.object({
    from: z.date({ required_error: "Anreisedatum ist erforderlich." }),
    to: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  }),
  roomType: z.string().min(1, { message: "Zimmertyp ist ein Pflichtfeld." }),
  internalNotes: z.string().optional(),
}).refine(data => data.dates.to > data.dates.from, {
  message: "Abreisedatum muss nach dem Anreisedatum liegen.",
  path: ["dates"],
});

type CreateBookingFormValues = z.infer<typeof createBookingSchema>;

export default function CreateBookingPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingSchema),
  });

  const onSubmit = async (data: CreateBookingFormValues) => {
    setIsLoading(true);
    const result = await createBookingWithLink(hotelId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      roomType: data.roomType,
      checkInDate: format(data.dates.from, 'yyyy-MM-dd'),
      checkOutDate: format(data.dates.to, 'yyyy-MM-dd'),
    }, data.internalNotes ?? null);

    setIsLoading(false);
    if (result.success && result.link) {
      setGeneratedLink(result.link);
    } else {
      toast({
        variant: 'destructive',
        title: 'Fehler beim Erstellen der Buchung',
        description: result.error || 'Ein unbekannter Fehler ist aufgetreten.',
      });
    }
  };
  
  const copyToClipboard = () => {
    if (generatedLink) {
        navigator.clipboard.writeText(generatedLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast({ title: "Link in Zwischenablage kopiert!" });
    }
  }

  const handleDialogClose = () => {
    setGeneratedLink(null);
    router.push(`/dashboard/${hotelId}/bookings`);
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/${hotelId}/bookings`}>
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Neue Buchung erstellen</h1>
            <p className="text-muted-foreground">Erstellen Sie eine vorläufige Buchung und generieren Sie einen Link für den Gast.</p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Gastinformationen (Prefill)</CardTitle>
              <CardDescription>Diese Daten werden im Gastformular vorausgefüllt.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vorname</FormLabel>
                  <FormControl><Input placeholder="Max" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nachname</FormLabel>
                  <FormControl><Input placeholder="Mustermann" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl><Input type="email" placeholder="max.mustermann@email.de" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buchungsdetails</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="dates" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>An- und Abreisedatum</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "dd. LLL, y", { locale: de })} -{" "}
                                {format(field.value.to, "dd. LLL, y", { locale: de })}
                              </>
                            ) : (
                              format(field.value.from, "dd. LLL, y")
                            )
                          ) : (
                            <span>Wählen Sie einen Zeitraum</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="roomType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Zimmertyp</FormLabel>
                  <FormControl><Input placeholder="z.B. Doppelzimmer mit Meerblick" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="internalNotes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Interne Notizen</FormLabel>
                  <FormControl><Textarea placeholder="Notizen, die nur für das Hotelpersonal sichtbar sind..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  'Buchung erstellen & Link generieren'
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      <Dialog open={!!generatedLink} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buchung erfolgreich erstellt!</DialogTitle>
            <DialogDescription>
              Der eindeutige Link für den Gast wurde generiert. Senden Sie diesen Link an den Gast, damit er seine Daten vervollständigen kann.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Input value={generatedLink || ''} readOnly className="flex-1"/>
            <Button type="button" size="icon" onClick={copyToClipboard}>
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
