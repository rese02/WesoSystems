
import { getBookingByToken, getHotelById } from "@/lib/data";
import { redirect } from 'next/navigation';
import { GuestWizard } from './guest-wizard';
import { parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

// The linkId is now the bookingToken
export default async function GuestPage({ params }: { params: { linkId: string } }) {
  const bookingToken = params.linkId;
  const booking = await getBookingByToken(bookingToken);

  // Simple check if booking exists and is pending guest info
  if (!booking || booking.status !== 'Pending Guest Information') {
    redirect('/guest/invalid-link');
  }

  const hotel = await getHotelById(booking.hotelId);

  if (!hotel) {
    redirect('/guest/invalid-link');
  }

  return (
    <GuestWizard booking={booking} hotel={hotel} />
  );
}
