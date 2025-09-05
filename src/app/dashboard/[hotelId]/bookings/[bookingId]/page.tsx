import { getBookingById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowLeft, User, BedDouble, Calendar, FileText, Banknote, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

const statusColors: { [key: string]: string } = {
  Confirmed: 'bg-green-100 text-green-800 border-green-200',
  PendingPayment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Sent: 'bg-blue-100 text-blue-800 border-blue-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
  CheckedIn: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CheckedOut: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusTranslations: { [key: string]: string } = {
    Confirmed: 'Bestätigt',
    PendingPayment: 'Ausstehende Zahlung',
    Sent: 'Link gesendet',
    Cancelled: 'Storniert',
    CheckedIn: 'Eingecheckt',
    CheckedOut: 'Ausgecheckt'
};


function InfoField({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-start">
            <Icon className="h-5 w-5 text-muted-foreground mr-3 mt-1 flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-base font-semibold">{value}</p>
            </div>
        </div>
    );
}

export default async function BookingDetailsPage({ params }: { params: { hotelId: string, bookingId: string } }) {
  const booking = await getBookingById(params.bookingId, params.hotelId);

  if (!booking) {
    notFound();
  }
  
  const checkIn = parseISO(booking.prefillData.checkInDate);
  const checkOut = parseISO(booking.prefillData.checkOutDate);
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
                    Details für {booking.prefillData.firstName} {booking.prefillData.lastName}
                </p>
            </div>
        </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="guest">Gästedaten</TabsTrigger>
          <TabsTrigger value="payment">Zahlungen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
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
              <InfoField icon={User} label="Gast" value={`${booking.prefillData.firstName} ${booking.prefillData.lastName}`} />
              <InfoField icon={BedDouble} label="Zimmertyp" value={booking.prefillData.roomType} />
              <InfoField icon={Calendar} label="Zeitraum" value={`${format(checkIn, 'dd.MM.yyyy')} - ${format(checkOut, 'dd.MM.yyyy')}`} />
              <InfoField icon={Clock} label="Aufenthalt" value={`${nights} Nächte`} />
              <InfoField icon={Banknote} label="Umsatz" value={booking.revenue > 0 ? `€${booking.revenue.toLocaleString('de-DE')}` : 'N/A'} />
              <InfoField icon={Clock} label="Erstellt am" value={format(parseISO(booking.createdAt), "dd.MM.yyyy 'um' HH:mm", { locale: de })} />
            </CardContent>
          </Card>
           <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Interne Notizen</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {booking.internalNotes || "Keine internen Notizen für diese Buchung vorhanden."}
                    </p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="guest">
          <Card>
            <CardHeader>
              <CardTitle>Gästedaten</CardTitle>
              <CardDescription>Vom Gast übermittelte Informationen.</CardDescription>
            </CardHeader>
            <CardContent>
              {booking.guestData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField icon={User} label="Vollständiger Name" value={`${booking.guestData.firstName} ${booking.guestData.lastName}`} />
                  <InfoField icon={User} label="E-Mail" value={booking.guestData.email} />
                  <InfoField icon={User} label="Telefon" value={booking.guestData.phone} />
                  <InfoField icon={User} label="Land" value={booking.guestData.country} />
                  <InfoField icon={User} label="Adresse" value={`${booking.guestData.address}, ${booking.guestData.zip} ${booking.guestData.city}`} />
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
                <p className="text-muted-foreground text-center py-8">Der Zahlungs-Tab ist für zukünftige Integrationen vorgesehen.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Dokumente</CardTitle>
              <CardDescription>Vom Gast hochgeladene Dokumente.</CardDescription>
            </CardHeader>
            <CardContent>
              {booking.guestData && booking.guestData.idUrl !== '#' ? (
                <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary"/>
                        <div>
                            <p className="font-semibold">Personalausweis</p>
                            <p className="text-sm text-muted-foreground">Hochgeladen am {format(parseISO(booking.createdAt), 'dd.MM.yyyy')}</p>
                        </div>
                    </div>
                    <Button disabled>Sicherer Download</Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Keine Dokumente hochgeladen.</p>
              )}
               <p className="text-xs text-muted-foreground mt-4 text-center">In einer realen Anwendung würde der Klick auf "Sicherer Download" eine zeitlich begrenzte, signierte URL von Firebase Storage generieren und den Download starten.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
