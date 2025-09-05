import { getLinkById, getBookingById, getHotelById } from "@/lib/data";
import { redirect } from 'next/navigation';
import { GuestWizard } from './guest-wizard';
import { parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function GuestPage({ params }: { params: { linkId: string } }) {
  const link = await getLinkById(params.linkId);

  if (!link || link.status !== 'Active' || parseISO(link.expiresAt) < new Date()) {
    redirect('/guest/invalid-link');
  }

  const booking = await getBookingById(link.bookingId, link.hotelId);
  const hotel = await getHotelById(link.hotelId);

  if (!booking || !hotel) {
    redirect('/guest/invalid-link');
  }

  return (
    <GuestWizard booking={booking} hotel={hotel} />
  );
}
