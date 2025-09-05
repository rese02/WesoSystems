
'use client';

import * as React from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2, UploadCloud, File, Banknote, ClipboardCopy, UserPlus, X } from "lucide-react";
import type { Booking, Hotel, RoomConfiguration } from '@/lib/types';
import { submitGuestData } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInDays } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { getTranslations } from '@/lib/translations';

const MAX_STEPS = 5;

const fileSchema = z.custom<File>(f => f instanceof File, "Bitte laden Sie eine Datei hoch.");

const guestWizardSchema = z.object({
  guestData: z.object({
    firstName: z.string().min(1, "Vorname ist erforderlich."),
    lastName: z.string().min(1, "Nachname ist erforderlich."),
    email: z.string().email("Ungültige E-Mail-Adresse."),
    phone: z.string().min(1, "Telefonnummer ist erforderlich."),
    age: z.coerce.number().positive().optional().nullable(),
    idFrontFile: fileSchema,
    idBackFile: fileSchema,
    notes: z.string().optional().nullable(),
  }),
  companions: z.array(z.object({
    firstName: z.string().min(1, "Vorname ist erforderlich."),
    lastName: z.string().min(1, "Nachname ist erforderlich."),
    idFrontFile: fileSchema,
    idBackFile: fileSchema,
  })),
  paymentOption: z.enum(['deposit', 'full'], { required_error: "Bitte wählen Sie eine Zahlungsoption." }),
  paymentProofFile: fileSchema,
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "Sie müssen die AGB und Datenschutzbestimmungen akzeptieren." }),
  }),
});

type GuestWizardFormValues = z.infer<typeof guestWizardSchema>;

const FileUploadField = ({ field, name, t }: { field: any, name: string, t: any }) => {
    return (
        <FormItem>
            <FormLabel>{name}</FormLabel>
            <FormControl>
                <div className="relative flex justify-center items-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                    <Input
                        type="file"
                        className="absolute w-full h-full opacity-0 cursor-pointer"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                    />
                    {!field.value ? (
                        <div className="text-center text-muted-foreground p-2">
                            <UploadCloud className="mx-auto h-6 w-6 mb-1" />
                            <p className="text-xs">{t.fileSelect}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center p-2">
                            <File className="h-6 w-6 text-primary mb-1"/>
                            <p className="text-xs font-semibold truncate max-w-full px-2">{field.value.name}</p>
                        </div>
                    )}
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
};


export function GuestWizard({ booking, hotel }: { booking: Booking; hotel: Hotel }) {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const t = getTranslations(booking.coreData.guestFormLanguage);

  const form = useForm<GuestWizardFormValues>({
    resolver: zodResolver(guestWizardSchema),
    defaultValues: {
      guestData: {
        firstName: booking.guestInfo.firstName,
        lastName: booking.guestInfo.lastName,
        email: '',
        phone: '',
        age: null,
        notes: '',
      },
      companions: [],
      acceptedTerms: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "companions",
  });

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await form.trigger(["guestData"]);
    if (step === 2) isValid = await form.trigger(["companions"]);
    if (step === 3) isValid = await form.trigger(["paymentOption"]);
    if (step === 4) isValid = await form.trigger(["paymentProofFile"]);
    
    if (step === MAX_STEPS - 1 && !isValid) return;
    
    if (isValid || step < 3 || (step === 3 && form.getValues("paymentOption"))) {
        setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => s - 1);
  
  const onSubmit = async (data: GuestWizardFormValues) => {
    setIsLoading(true);
    const result = await submitGuestData(booking.id, data);
    setIsLoading(false);
    
    if (result.success) {
      router.push(`/guest/${booking.bookingToken}/thank-you`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Fehler beim Senden der Daten',
        description: result.error || 'Ein unbekannter Fehler ist aufgetreten.',
      });
    }
  };

  const checkIn = parseISO(booking.bookingPeriod.checkInDate);
  const checkOut = parseISO(booking.bookingPeriod.checkOutDate);
  const nights = differenceInDays(checkOut, checkIn);
  const paymentOption = form.watch('paymentOption');
  const totalPrice = booking.coreData.totalPrice;
  const depositPrice = totalPrice * 0.3;
  const amountDue = paymentOption === 'deposit' ? depositPrice : totalPrice;


  const BookingSummary = () => (
    <div className="text-sm bg-primary/10 p-3 rounded-lg mt-2 border border-primary/20 space-y-1">
        <p><strong>{t.bookingSummary}:</strong> {booking.rooms.map((r: RoomConfiguration) => r.roomType).join(', ')} für {nights} {t.nights}</p>
        <p><strong>{t.period}:</strong> {format(checkIn, 'dd. MMM yyyy')} - {format(checkOut, 'dd. MMM yyyy')}</p>
        <p><strong>{t.totalPrice}:</strong> €{totalPrice.toFixed(2)}</p>
    </div>
  );

  return (
    <Card className="w-full max-w-3xl shadow-2xl">
      <CardHeader>
        <Progress value={(step / MAX_STEPS) * 100} className="mb-4" />
        <CardTitle className="text-2xl font-headline">{t.wizardTitle}</CardTitle>
        <CardDescription>{t.wizardDescription(hotel.name)}</CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="min-h-[350px]">
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.step1Title}</h3>
                <BookingSummary />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField control={form.control} name="guestData.firstName" render={({ field }) => <FormItem><FormLabel>{t.firstName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="guestData.lastName" render={({ field }) => <FormItem><FormLabel>{t.lastName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormMessage>} />
                  <FormField control={form.control} name="guestData.email" render={({ field }) => <FormItem><FormLabel>{t.email}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="guestData.phone" render={({ field }) => <FormItem><FormLabel>{t.phone}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="guestData.age" render={({ field }) => <FormItem><FormLabel>{t.age}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? null : +e.target.value)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="guestData.idFrontFile" render={({ field }) => <FileUploadField field={field} name={t.idFront} t={t} />} />
                     <FormField control={form.control} name="guestData.idBackFile" render={({ field }) => <FileUploadField field={field} name={t.idBack} t={t} />} />
                  </div>
                  <FormField control={form.control} name="guestData.notes" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>{t.notes}</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t.step2Title}</h3>
                {fields.map((field, index) => (
                    <Card key={field.id} className="mb-4 relative">
                        <CardHeader><CardTitle className="text-base">{t.companion} {index + 1}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`companions.${index}.firstName`} render={({ field }) => <FormItem><FormLabel>{t.firstName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                            <FormField control={form.control} name={`companions.${index}.lastName`} render={({ field }) => <FormItem><FormLabel>{t.lastName}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                            <FormField control={form.control} name={`companions.${index}.idFrontFile`} render={({ field }) => <FileUploadField field={field} name={t.idFront} t={t} />} />
                            <FormField control={form.control} name={`companions.${index}.idBackFile`} render={({ field }) => <FileUploadField field={field} name={t.idBack} t={t} />} />
                        </CardContent>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><X className="h-4 w-4" /></Button>
                    </Card>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ firstName: '', lastName: '', idFrontFile: undefined, idBackFile: undefined })}>
                    <UserPlus className="mr-2 h-4 w-4" /> {t.addCompanion}
                </Button>
              </div>
            )}
            {step === 3 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">{t.step3Title}</h3>
                    <p className="text-muted-foreground mb-4">{t.step3Description}</p>
                    <FormField control={form.control} name="paymentOption" render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                           <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4 has-[[data-state=checked]]:border-primary">
                                <FormControl><RadioGroupItem value="deposit" /></FormControl>
                                <FormLabel className="font-normal w-full">{t.depositOption(`€${depositPrice.toFixed(2)}`)}</FormLabel>
                           </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4 has-[[data-state=checked]]:border-primary">
                                <FormControl><RadioGroupItem value="full" /></FormControl>
                                <FormLabel className="font-normal w-full">{t.fullOption(`€${totalPrice.toFixed(2)}`)}</FormLabel>
                            </FormItem>
                        </RadioGroup>
                    )} />
                    {paymentOption && <div className="mt-6 p-4 bg-accent/50 rounded-lg text-center"><p className="text-lg font-semibold">{t.amountDue}: €{amountDue.toFixed(2)}</p></div>}
                </div>
            )}
            {step === 4 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">{t.step4Title}</h3>
                    <p className="text-muted-foreground mb-4">{t.step4Description(`€${amountDue.toFixed(2)}`)}</p>
                     <Card className="bg-muted/50">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center"><span>{t.accountHolder}:</span><span className="font-mono">Pradell GMBH</span></div>
                            <div className="flex justify-between items-center"><span>{t.iban}:</span><span className="font-mono">DE89 3704 0044 0532 0130 00</span><Button type="button" size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText("DE89370400440532013000"); toast({title: `${t.iban} ${t.copied}`})}}><ClipboardCopy className="h-4 w-4"/></Button></div>
                            <div className="flex justify-between items-center"><span>{t.bic}:</span><span className="font-mono">COBADEFFXXX</span></div>
                            <div className="flex justify-between items-center"><span>{t.reference}:</span><span className="font-mono">{t.referenceText(booking.id, paymentOption)}</span><Button type="button" size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(t.referenceText(booking.id, paymentOption)); toast({title: `${t.reference} ${t.copied}`})}}><ClipboardCopy className="h-4 w-4"/></Button></div>
                        </CardContent>
                     </Card>
                     <div className="mt-4">
                        <FormField control={form.control} name="paymentProofFile" render={({ field }) => <FileUploadField field={field} name={t.paymentProof} t={t} />} />
                     </div>
                </div>
            )}
            {step === 5 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">{t.step5Title}</h3>
                    <p className="text-muted-foreground mb-4">{t.step5Description}</p>
                    <div className="space-y-4 text-sm border p-4 rounded-md max-h-80 overflow-y-auto">
                        <h4 className="font-bold">{t.summaryYourData}</h4>
                        <p><strong>{t.summaryName}:</strong> {form.getValues('guestData.firstName')} {form.getValues('guestData.lastName')}</p>
                        <p><strong>{t.email}:</strong> {form.getValues('guestData.email')}</p>
                        <p><strong>{t.summaryDocs}:</strong> {form.getValues('guestData.idFrontFile')?.name}, {form.getValues('guestData.idBackFile')?.name}</p>
                        
                        {form.getValues('companions').length > 0 && <h4 className="font-bold pt-2 border-t">{t.summaryCompanions}</h4>}
                        {form.getValues('companions').map((comp, i) => (
                           <div key={i} className="pl-2 border-l-2">
                             <p><strong>{t.summaryName}:</strong> {comp.firstName} {comp.lastName}</p>
                             <p><strong>{t.summaryDocs}:</strong> {comp.idFrontFile?.name}, {comp.idBackFile?.name}</p>
                           </div>
                        ))}

                        <h4 className="font-bold pt-2 border-t">{t.summaryPaymentInfo}</h4>
                        <p><strong>{t.summaryPaymentOption}:</strong> {form.getValues('paymentOption') === 'deposit' ? t.depositOption('') : t.fullOption('')}</p>
                        <p><strong>{t.summaryPaymentProof}:</strong> {form.getValues('paymentProofFile')?.name}</p>
                    </div>
                     <FormField
                        control={form.control}
                        name="acceptedTerms"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                             <div className="flex items-center space-x-2">
                                <FormControl>
                                    <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="form-checkbox h-4 w-4 text-primary" />
                                </FormControl>
                                <FormLabel className="text-sm !mt-0">{t.acceptTerms} <a href="#" className="underline">{t.agb}</a> {t.and} <a href="#" className="underline">{t.privacy}</a>.</FormLabel>
                             </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
                {step > 1 && <Button type="button" variant="outline" onClick={prevStep}><ArrowLeft className="mr-2 h-4 w-4" />{t.backButton}</Button>}
            </div>
            <div>
                {step < MAX_STEPS && <Button type="button" onClick={nextStep}>{t.nextButton}<ArrowRight className="ml-2 h-4 w-4" /></Button>}
                {step === MAX_STEPS && <Button type="submit" disabled={isLoading || !form.getValues('acceptedTerms')}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Senden...</> : t.submitButton}</Button>}
            </div>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
