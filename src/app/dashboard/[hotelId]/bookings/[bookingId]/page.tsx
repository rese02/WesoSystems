
import { getBookingById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowLeft, User, BedDouble, Calendar, FileText, Banknote, Clock, Users, Utensils, Languages } from 'lucide-react';
import type { BookingStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const statusColors: { [key in BookingStatus]: string } = {
  'Pending Guest Information': 'bg-blue-100 text-blue-800 border-blue-200',
  Confirmed: 'bg-green-100 text-green-800 border-green-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
  CheckedIn: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CheckedOut: 'bg-gray-100 text-gray-800 border-gray-200',
  // Keep old ones for safety
  PendingPayment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Sent: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusTranslations: { [key in BookingStatus]: string } = {
    'Pending Guest Information': 'Wartet auf Gast',
    Confirmed: 'Bestätigt',
    Cancelled: 'Storniert',
    CheckedIn: 'Eingecheckt',
    CheckedOut: 'Ausgecheckt',
    // Keep old ones for safety
    PendingPayment: 'Ausstehende Zahlung',
    Sent: 'Link gesendet'
};

function InfoField({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-start">
            <Icon className="h-5 w-5 text-muted-foreground mr-3 mt-1 flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-base font-semibold">{value || 'N/A'}</p>
            </div>
        </div>
    );
}

export default async function BookingDetailsPage({ params }: { params: { hotelId: string, bookingId: string } }) {
  const booking = await getBookingById(params.bookingId);

  if (!booking || booking.hotelId !== params.hotelId) {
    notFound();
  }
  
  const checkIn = parseISO(booking.bookingPeriod.checkInDate);
  const checkOut = parseISO(booking.bookingPeriod.checkOutDate);
  const nights = differenceInDays(checkOut, checkIn);

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href={`/dashboard/${params.hotelId}/bookings`}>
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Buchung #{booking.id.split('-')[1]}
                </h1>
                <p className="text-muted-foreground">
                    Details für {booking.guestInfo.firstName} {booking.guestInfo.lastName}
                </p>
            </div>
        </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="guest">Gäste & Dokumente</TabsTrigger>
          <TabsTrigger value="payment">Zahlungen</TabsTrigger>
          <TabsTrigger value="rooms">Zimmer</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Buchungsübersicht</CardTitle>
                    <CardDescription>Zentrale Informationen zur Buchung.</CardDescription>
                  </div>
                  <Badge className={`text-sm ${statusColors[booking.status]}`}>{statusTranslations[booking.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField icon={User} label="Hauptgast" value={`${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`} />
              <InfoField icon={Calendar} label="Zeitraum" value={`${format(checkIn, 'dd.MM.yyyy')} - ${format(checkOut, 'dd.MM.yyyy')}`} />
              <InfoField icon={Clock} label="Aufenthalt" value={`${nights} Nächte`} />
              <InfoField icon={Banknote} label="Gesamtpreis" value={`€${booking.coreData.totalPrice.toLocaleString('de-DE')}`} />
              <InfoField icon={Utensils} label="Verpflegung" value={booking.coreData.catering} />
              <InfoField icon={Languages} label="Gastsprache" value={booking.coreData.guestFormLanguage.toUpperCase()} />
              <InfoField icon={Clock} label="Erstellt am" value={format(parseISO(booking.createdAt), "dd.MM.yyyy 'um' HH:mm", { locale: de })} />
            </CardContent>
          </Card>
           <Card className="mt-6">
                <CardHeader><CardTitle>Interne Notizen</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{booking.internalNotes || "Keine internen Notizen für diese Buchung vorhanden."}</p></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="guest">
          <Card>
            <CardHeader>
              <CardTitle>Gästeliste</CardTitle>
              <CardDescription>Vom Gast übermittelte Informationen.</CardDescription>
            </CardHeader>
            <CardContent>
              {booking.guestData ? (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-2">Hauptgast</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-lg">
                           <InfoField icon={User} label="Vollständiger Name" value={`${booking.guestData.firstName} ${booking.guestData.lastName}`} />
                           <InfoField icon={User} label="E-Mail" value={booking.guestData.email} />
                           <InfoField icon={User} label="Telefon" value={booking.guestData.phone} />
                           <InfoField icon={User} label="Alter" value={booking.guestData.age} />
                           <InfoField icon={FileText} label="Ausweis" value="Vorder- & Rückseite hochgeladen" />
                        </div>
                    </div>
                    {booking.companions.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2">Mitreisende</h4>
                             {booking.companions.map((comp, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-lg mb-4">
                                   <InfoField icon={User} label="Vollständiger Name" value={`${comp.firstName} ${comp.lastName}`} />
                                   <InfoField icon={FileText} label="Ausweis" value="Vorder- & Rückseite hochgeladen" />
                                </div>
                             ))}
                        </div>
                    )}
                    {booking.guestData.notes && <div className="pt-4"><h4 className="font-semibold text-lg mb-2">Anmerkungen des Gastes</h4><p>{booking.guestData.notes}</p></div>}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Der Gast hat seine Daten noch nicht übermittelt.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
           <Card>
            <CardHeader>
              <CardTitle>Zahlungsinformationen</CardTitle>
            </CardHeader>
            <CardContent>
                 {booking.paymentDetails ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField icon={Banknote} label="Zahlungsoption" value={booking.paymentDetails.paymentOption === 'deposit' ? 'Anzahlung (30%)' : 'Gesamtbetrag (100%)'} />
                        <InfoField icon={Banknote} label="Fälliger Betrag" value={`€${booking.paymentDetails.amountDue.toLocaleString('de-DE')}`} />
                        <InfoField icon={FileText} label="Zahlungsbeleg" value={booking.paymentDetails.paymentProofUrl !== '#' ? 'Hochgeladen' : 'Nicht hochgeladen'} />
                     </div>
                 ) : (
                    <p className="text-muted-foreground text-center py-8">Der Gast hat seine Zahlungsinformationen noch nicht übermittelt.</p>
                 )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Zimmerdetails</CardTitle>
              <CardDescription>Für diese Buchung reservierte Zimmer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.rooms.map((room, index) => (
                <div key={index} className="border p-4 rounded-lg">
                    <h4 className="font-semibold text-base mb-2">Zimmer {index + 1}: {room.roomType}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <InfoField icon={Users} label="Erwachsene" value={room.adults} />
                        <InfoField icon={Users} label="Kinder (3+)" value={room.children} />
                        <InfoField icon={Users} label="Kleinkinder (0-2)" value={room.infants} />
                        <InfoField icon={Users} label="Alter der Kinder" value={room.childrenAges} />
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
