import { getBookingsByHotelId } from "@/lib/data";
import { BookingsClient } from "./client";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { PlusCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: { hotelId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;

  const bookings = await getBookingsByHotelId(params.hotelId, { query, status });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Buchungsliste</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Ihre Buchungen an einem Ort.
          </p>
        </div>
        <Link href={`/dashboard/${params.hotelId}/bookings/create-booking`}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Neue Buchung
          </Button>
        </Link>
      </div>
      <BookingsClient bookings={bookings} hotelId={params.hotelId} />
    </div>
  );
}
