
import { getBookingByToken, getHotelById } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function ThankYouPage({ params }: { params: { linkId: string } }) {
  const bookingToken = params.linkId;
  const booking = await getBookingByToken(bookingToken);
  
  if (!booking || booking.status !== 'Confirmed') {
    // If booking is not confirmed, redirect to the wizard.
    // This prevents accessing thank you page before submission.
    redirect(`/guest/${bookingToken}`);
  }

  const hotel = await getHotelById(booking.hotelId);

  if (!hotel || !booking.guestData) {
    notFound();
  }

  const checkIn = parseISO(booking.bookingPeriod.checkInDate);
  const checkOut = parseISO(booking.bookingPeriod.checkOutDate);
  const nights = differenceInDays(checkOut, checkIn);

  return (
    <Card className="w-full max-w-2xl text-center shadow-2xl">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-headline">Vielen Dank!</CardTitle>
        <CardDescription>
          Ihre Daten wurden erfolgreich übermittelt. Sie erhalten in Kürze eine Bestätigungs-E-Mail.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-left space-y-4">
        <h3 className="text-lg font-semibold text-center border-b pb-2">Ihre Buchungszusammenfassung</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div><p className="text-sm font-medium text-muted-foreground">Hotel</p><p>{hotel.name}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Buchungsnummer</p><p>#{booking.id.split('-')[1]}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Name</p><p>{booking.guestData.firstName} {booking.guestData.lastName}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">E-Mail</p><p>{booking.guestData.email}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Zimmer</p><p>{booking.rooms.map(r => r.roomType).join(', ')}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Aufenthalt</p><p>{nights} Nächte</p></div>
            <div className="sm:col-span-2"><p className="text-sm font-medium text-muted-foreground">Zeitraum</p><p>{format(checkIn, 'dd. MMMM yyyy')} bis {format(checkOut, 'dd. MMMM yyyy')}</p></div>
        </div>
        <p className="text-center text-muted-foreground pt-4">Wir freuen uns auf Ihren Besuch!</p>
        <div className="text-center pt-2">
            <Button asChild variant="outline">
                <Link href="/hotel/login">Zurück zum Portal</Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
