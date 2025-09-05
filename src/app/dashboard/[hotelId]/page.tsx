import { getDashboardStats } from "@/lib/data";
import type { Booking } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Users,
  DollarSign,
  CalendarPlus,
  ArrowRightLeft,
  CalendarCheck,
  CalendarX,
  BedDouble,
  CircleDollarSign
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: { hotelId: string } }) {
  const stats = await getDashboardStats(params.hotelId);

  const kpiCards = [
    { title: "Heutige Anreisen", value: stats.todaysArrivals, icon: CalendarCheck, color: "text-green-600" },
    { title: "Heutige Abreisen", value: stats.todaysDepartures, icon: CalendarX, color: "text-red-600" },
    { title: "Umsatz (Monat)", value: `€${stats.revenueThisMonth.toLocaleString('de-DE')}`, icon: CircleDollarSign, color: "text-blue-600" },
    { title: "Neue Buchungen (Monat)", value: stats.newBookingsThisMonth, icon: CalendarPlus, color: "text-purple-600" },
  ];

  const statusColors: { [key: string]: string } = {
    Confirmed: 'bg-green-100 text-green-800 border-green-200',
    PendingPayment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Sent: 'bg-blue-100 text-blue-800 border-blue-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200',
    CheckedIn: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    CheckedOut: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
           <Link href={`/dashboard/${params.hotelId}/bookings`} key={index}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-headline">Letzte Aktivitäten</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gast</TableHead>
                <TableHead className="hidden md:table-cell">Zeitraum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Erstellt am</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentActivities.map((booking: Booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.prefillData.firstName} {booking.prefillData.lastName}</div>
                    <div className="text-sm text-muted-foreground hidden md:inline">{booking.prefillData.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(parseISO(booking.prefillData.checkInDate), 'dd. MMM')} - {format(parseISO(booking.prefillData.checkOutDate), 'dd. MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[booking.status]}>
                      {booking.status === 'PendingPayment' ? 'Ausstehend' : booking.status === 'Sent' ? 'Gesendet' : booking.status === 'Confirmed' ? 'Bestätigt' : booking.status === 'Cancelled' ? 'Storniert' : booking.status}
                    </Badge>
                  </TableCell>
                   <TableCell className="hidden lg:table-cell">
                    {format(parseISO(booking.createdAt), 'dd. MMMM yyyy, HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/${params.hotelId}/bookings/${booking.id}`}>
                      <Button variant="ghost" size="sm">Ansehen</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
