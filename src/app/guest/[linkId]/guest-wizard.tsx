'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2, UploadCloud, File, Trash2, Banknote, ClipboardCopy } from "lucide-react";
import type { Booking, Hotel } from '@/lib/types';
import { submitGuestData } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInDays } from 'date-fns';

const MAX_STEPS = 4;

const guestSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich."),
  lastName: z.string().min(1, "Nachname ist erforderlich."),
  email: z.string().email("Ungültige E-Mail-Adresse."),
  address: z.string().min(1, "Adresse ist erforderlich."),
  city: z.string().min(1, "Stadt ist erforderlich."),
  zip: z.string().min(1, "Postleitzahl ist erforderlich."),
  country: z.string().min(1, "Land ist erforderlich."),
  phone: z.string().min(1, "Telefonnummer ist erforderlich."),
  idFile: z.any().refine(file => file instanceof File, "Bitte laden Sie eine Datei hoch.").optional(),
});

type GuestFormValues = z.infer<typeof guestSchema>;

function useWizardForm(booking: Booking, linkId: string) {
    const [step, setStep] = React.useState(1);
    
    const getInitialValues = () => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem(`wizard-${linkId}`);
            if (savedData) {
                return JSON.parse(savedData);
            }
        }
        return {
            ...booking.prefillData,
            address: '', city: '', zip: '', country: '', phone: '',
        };
    };

    const form = useForm<GuestFormValues>({
        resolver: zodResolver(guestSchema),
        defaultValues: getInitialValues(),
    });

    React.useEffect(() => {
        const subscription = form.watch((value) => {
            localStorage.setItem(`wizard-${linkId}`, JSON.stringify(value));
        });
        return () => subscription.unsubscribe();
    }, [form.watch, linkId]);

    return { form, step, setStep };
}

export function GuestWizard({ booking, hotel }: { booking: Booking; hotel: Hotel }) {
  const { form, step, setStep } = useWizardForm(booking, booking.linkId);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const nextStep = async () => {
    const isValid = await form.trigger(["firstName", "lastName", "email", "address", "city", "zip", "country", "phone"]);
    if(step === 1 && isValid) setStep(s => s + 1);
    else if(step === 2) setStep(s => s + 1);
    else if(step === 3) setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);
  
  const onSubmit = async (data: GuestFormValues) => {
    setIsLoading(true);
    const result = await submitGuestData(booking.id, data);
    setIsLoading(false);
    
    if (result.success) {
      localStorage.removeItem(`wizard-${booking.linkId}`);
      router.push(`/guest/${booking.linkId}/thank-you`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Fehler beim Senden der Daten',
        description: result.error || 'Ein unbekannter Fehler ist aufgetreten.',
      });
    }
  };

  const idFile = form.watch('idFile');

  const checkIn = parseISO(booking.prefillData.checkInDate);
  const checkOut = parseISO(booking.prefillData.checkOutDate);
  const nights = differenceInDays(checkOut, checkIn);

  return (
    <Card className="w-full max-w-3xl shadow-2xl">
      <CardHeader>
        <Progress value={(step / MAX_STEPS) * 100} className="mb-4" />
        <CardTitle className="text-2xl font-headline">Vervollständigen Sie Ihre Buchung</CardTitle>
        <CardDescription>Willkommen bei {hotel.name}! Bitte füllen Sie die folgenden Schritte aus.</CardDescription>
         <div className="text-sm bg-primary/10 p-3 rounded-lg mt-2 border border-primary/20">
            <p><strong>Buchungsübersicht:</strong> {booking.prefillData.roomType} für {nights} Nächte</p>
            <p><strong>Check-in:</strong> {format(checkIn, 'dd. MMM yyyy')}, <strong>Check-out:</strong> {format(checkOut, 'dd. MMM yyyy')}</p>
        </div>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="firstName" render={({ field }) => <FormItem><FormLabel>Vorname</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="lastName" render={({ field }) => <FormItem><FormLabel>Nachname</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="email" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>E-Mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="address" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="city" render={({ field }) => <FormItem><FormLabel>Stadt</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="zip" render={({ field }) => <FormItem><FormLabel>PLZ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="country" render={({ field }) => <FormItem><FormLabel>Land</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="phone" render={({ field }) => <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
            )}
            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Dokumenten-Upload</h3>
                    <p className="text-muted-foreground mb-4">Bitte laden Sie eine Kopie Ihres Personalausweises oder Reisepasses hoch.</p>
                    <FormField
                        control={form.control}
                        name="idFile"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                        <Input
                                            type="file"
                                            className="absolute w-full h-full opacity-0 cursor-pointer"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                        />
                                        {!idFile ? (
                                            <div className="text-center text-muted-foreground">
                                                <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                                                <p>Klicken oder ziehen Sie eine Datei hierher.</p>
                                                <p className="text-xs">JPG, PNG, PDF (max. 5MB)</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <File className="h-10 w-10 text-primary mb-2"/>
                                                <p className="font-semibold">{idFile.name}</p>
                                                <Button variant="ghost" size="sm" className="mt-2 text-red-500 hover:text-red-700" onClick={() => form.setValue('idFile', undefined)}>
                                                    <Trash2 className="h-4 w-4 mr-1"/> Entfernen
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
            {step === 3 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Zahlung per Banküberweisung</h3>
                    <p className="text-muted-foreground mb-4">Bitte überweisen Sie den Betrag auf das folgende Konto, um Ihre Buchung zu bestätigen.</p>
                     <Card className="bg-muted/50">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center"><span>Empfänger:</span><span className="font-mono">{hotel.name}</span></div>
                            <div className="flex justify-between items-center"><span>IBAN:</span><span className="font-mono">DE89 3704 0044 0532 0130 00</span></div>
                            <div className="flex justify-between items-center"><span>BIC:</span><span className="font-mono">COBADEFFXXX</span></div>
                            <div className="flex justify-between items-center"><span>Betrag:</span><span className="font-mono">€ {booking.revenue.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center"><span>Verwendungszweck:</span><span className="font-mono">Buchung {booking.id}</span></div>
                        </CardContent>
                     </Card>
                     <Button variant="outline" className="mt-4" onClick={() => { navigator.clipboard.writeText("DE89 3704 0044 0532 0130 00"); toast({title: "IBAN kopiert!"})}}><ClipboardCopy className="mr-2 h-4 w-4"/>IBAN kopieren</Button>
                </div>
            )}
            {step === 4 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Überprüfung und Abschluss</h3>
                    <p className="text-muted-foreground mb-4">Bitte überprüfen Sie Ihre Angaben vor dem Absenden.</p>
                    <div className="space-y-2 text-sm border p-4 rounded-md">
                        <p><strong>Name:</strong> {form.getValues('firstName')} {form.getValues('lastName')}</p>
                        <p><strong>E-Mail:</strong> {form.getValues('email')}</p>
                        <p><strong>Adresse:</strong> {form.getValues('address')}, {form.getValues('zip')} {form.getValues('city')}, {form.getValues('country')}</p>
                        <p><strong>Dokument:</strong> {idFile ? idFile.name : 'Nicht hochgeladen'}</p>
                    </div>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 && <Button type="button" variant="outline" onClick={prevStep}><ArrowLeft className="mr-2 h-4 w-4" />Zurück</Button>}
            {step < MAX_STEPS && <Button type="button" onClick={nextStep}>Weiter<ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {step === MAX_STEPS && <Button type="submit" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Senden...</> : 'Daten absenden & Buchung abschließen'}</Button>}
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
