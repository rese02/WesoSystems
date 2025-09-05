
import { getBookingById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { EditBookingForm } from './edit-booking-form';

export const dynamic = 'force-dynamic';

export default async function EditBookingPage({ params }: { params: { hotelId: string, bookingId: string } }) {
  const booking = await getBookingById(params.bookingId);

  if (!booking || booking.hotelId !== params.hotelId) {
    notFound();
  }

  return <EditBookingForm booking={booking} />;
}
