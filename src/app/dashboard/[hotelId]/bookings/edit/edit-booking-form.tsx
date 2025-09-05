
'use client';
import * as React from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { de } from 'date-fns/locale';
import { updateBooking } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cateringOptions, guestFormLanguages, roomTypes, type Booking } from '@/lib/types';


const bookingFormSchema = z.object({
  guestInfo: z.object({
    firstName: z.string().min(1, "Vorname ist erforderlich"),
    lastName: z.string().min(1, "Nachname ist erforderlich"),
  }),
  bookingPeriod: z.object({
    from: z.date({ required_error: "Anreisedatum ist erforderlich." }),
    to: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  }).refine(data => data.to > data.from, {
    message: "Abreisedatum muss nach dem Anreisedatum liegen.",
    path: ["to"],
  }),
  coreData: z.object({
      catering: z.enum(cateringOptions, { required_error: "Verpflegung ist ein Pflichtfeld."}),
      totalPrice: z.coerce.number().positive({ message: "Preis muss eine positive Zahl sein."}),
      guestFormLanguage: z.enum(guestFormLanguages, { required_error: "Sprache ist ein Pflichtfeld."}),
  }),
  rooms: z.array(z.object({
      roomType: z.enum(roomTypes, { required_error: "Zimmertyp ist ein Pflichtfeld."}),
      adults: z.coerce.number().min(1, "Mind. 1 Erwachsener."),
      children: z.coerce.number().min(0).default(0),
      infants: z.coerce.number().min(0).default(0),
      childrenAges: z.string().nullable().default(null),
  })).min(1, "Mindestens ein Zimmer muss hinzugefügt werden."),
  internalNotes: z.string().nullable().default(null),
});

type EditBookingFormValues = z.infer<typeof bookingFormSchema>;

export function EditBookingForm({ booking }: { booking: Booking }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EditBookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestInfo: { 
        firstName: booking.guestInfo.firstName, 
        lastName: booking.guestInfo.lastName 
      },
      bookingPeriod: {
        from: parseISO(booking.bookingPeriod.checkInDate),
        to: parseISO(booking.bookingPeriod.checkOutDate)
      },
      coreData: { 
        catering: booking.coreData.catering,
        totalPrice: booking.coreData.totalPrice,
        guestFormLanguage: booking.coreData.guestFormLanguage
      },
      rooms: booking.rooms.map(room => ({
          ...room,
          childrenAges: room.childrenAges ?? null
      })),
      internalNotes: booking.internalNotes ?? null,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms"
  });

  const onSubmit = async (data: EditBookingFormValues) => {
    setIsLoading(true);
    const result = await updateBooking(booking.id, booking.hotelId, data);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Buchung aktualisiert',
        description: `Die Buchung für ${result.booking?.guestInfo.firstName} ${result.booking?.guestInfo.lastName} wurde erfolgreich gespeichert.`,
      });
      router.push(`/dashboard/${booking.hotelId}/bookings/${booking.id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Fehler beim Aktualisieren der Buchung',
        description: result.error || 'Ein unbekannter Fehler ist aufgetreten.',
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/${booking.hotelId}/bookings/${booking.id}`}>
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Buchung bearbeiten</h1>
            <p className="text-muted-foreground">Ändern Sie die Details für Buchung #{booking.id.substring(0,6)}</p>
        </div>
      </div>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gastinformationen</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="guestInfo.firstName" render={({ field }) => <FormItem><FormLabel>Vorname</FormLabel><FormControl><Input placeholder="Max" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="guestInfo.lastName" render={({ field }) => <FormItem><FormLabel>Nachname</FormLabel><FormControl><Input placeholder="Mustermann" {...field} /></FormControl><FormMessage /></FormItem>} />
                </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buchungsdetails</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="bookingPeriod" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>An- und Abreisedatum</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                          {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "dd. LLL, y", { locale: de })} - {format(field.value.to, "dd. LLL, y", { locale: de })}</>) : (format(field.value.from, "dd. LLL, y"))) : (<span>Wählen Sie einen Zeitraum</span>)}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="range" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus locale={de}/>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coreData.catering" render={({ field }) => (
                <FormItem>
                    <FormLabel>Verpflegung</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Wählen Sie die Verpflegung" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {cateringOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="coreData.totalPrice" render={({ field }) => (<FormItem><FormLabel>Gesamtpreis (€)</FormLabel><FormControl><Input type="number" placeholder="z.B. 500.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="coreData.guestFormLanguage" render={({ field }) => (
                <FormItem>
                    <FormLabel>Sprache für Gastformular</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sprache wählen" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {guestFormLanguages.map(lang => <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Zimmerkonfiguration</CardTitle>
                    <CardDescription>Bearbeiten Sie die für diese Buchung benötigten Zimmer.</CardDescription>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ roomType: 'Standard', adults: 1, children: 0, infants: 0, childrenAges: null })}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Zimmer hinzufügen
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 md:grid-cols-6 gap-4 border p-4 rounded-md relative">
                        <FormField control={form.control} name={`rooms.${index}.roomType`} render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Zimmertyp</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {roomTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name={`rooms.${index}.adults`} render={({ field }) => <FormItem><FormLabel>Erw.</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={form.control} name={`rooms.${index}.children`} render={({ field }) => <FormItem><FormLabel>Kinder (3+)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormMessage>} />
                        <FormField control={form.control} name={`rooms.${index}.infants`} render={({ field }) => <FormItem><FormLabel>Kleink. (0-2)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={form.control} name={`rooms.${index}.childrenAges`} render={({ field }) => <FormItem><FormLabel>Alter Kinder</FormLabel><FormControl><Input placeholder="z.B. 4, 8" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />

                        {fields.length > 1 && <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                ))}
                <FormMessage>{form.formState.errors.rooms?.message}</FormMessage>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader>
                <CardTitle>Optionale Angaben</CardTitle>
             </CardHeader>
             <CardContent>
                <FormField control={form.control} name="internalNotes" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Interne Bemerkungen</FormLabel>
                    <FormControl><Textarea placeholder="Notizen, die nur für das Hotelpersonal sichtbar sind..." {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
             </CardContent>
             <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gespeichert...</>) : ('Änderungen speichern')}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </>
  );
}
