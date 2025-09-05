'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Search, Trash2, Eye } from 'lucide-react';
import type { Booking, BookingStatus } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { deleteBookingById } from '@/lib/actions';
import { Card } from '@/components/ui/card';

const statusColors: { [key in BookingStatus]: string } = {
  Confirmed: 'bg-green-100 text-green-800 border-green-200',
  PendingPayment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Sent: 'bg-blue-100 text-blue-800 border-blue-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
  CheckedIn: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CheckedOut: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusTabs: { label: string, value: BookingStatus | 'all' }[] = [
    { label: 'Alle', value: 'all' },
    { label: 'Bestätigt', value: 'Confirmed' },
    { label: 'Ausstehend', value: 'PendingPayment' },
    { label: 'Gesendet', value: 'Sent' },
    { label: 'Storniert', value: 'Cancelled' },
];

export function BookingsClient({ bookings, hotelId }: { bookings: Booking[], hotelId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = React.useState(searchParams.get('query') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [bookingToDelete, setBookingToDelete] = React.useState<Booking | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearchTerm) {
      params.set('query', debouncedSearchTerm);
    } else {
      params.delete('query');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, pathname, router, searchParams]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    const result = await deleteBookingById(bookingToDelete.id, hotelId);

    if (result.success) {
        toast({
            title: "Buchung gelöscht",
            description: `Die Buchung für ${bookingToDelete.prefillData.firstName} ${bookingToDelete.prefillData.lastName} wurde erfolgreich gelöscht.`,
        });
        router.refresh();
    } else {
        toast({
            variant: "destructive",
            title: "Fehler",
            description: result.error,
        });
    }
    setIsDeleteDialogOpen(false);
    setBookingToDelete(null);
  }

  const currentStatus = searchParams.get('status') || 'all';

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Suche nach Name, E-Mail oder Buchungs-ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
         <Tabs value={currentStatus} onValueChange={handleStatusChange}>
            <TabsList>
                {statusTabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
      </div>
      <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gast</TableHead>
              <TableHead>Zeitraum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.prefillData.firstName} {booking.prefillData.lastName}</div>
                    <div className="text-sm text-muted-foreground">{booking.prefillData.email}</div>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(booking.prefillData.checkInDate), 'dd.MM.yy')} - {format(parseISO(booking.prefillData.checkOutDate), 'dd.MM.yy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[booking.status]}>
                      {booking.status === 'PendingPayment' ? 'Ausstehend' : booking.status === 'Sent' ? 'Gesendet' : booking.status === 'Confirmed' ? 'Bestätigt' : booking.status === 'Cancelled' ? 'Storniert' : booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(parseISO(booking.createdAt), 'dd.MM.yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menü öffnen</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/${hotelId}/bookings/${booking.id}`}><Eye className="mr-2 h-4 w-4" />Details ansehen</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(booking)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" /> Buchung löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Keine Buchungen gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination would go here */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie absolut sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird die Buchung von
              <span className="font-semibold"> {bookingToDelete?.prefillData.firstName} {bookingToDelete?.prefillData.lastName} </span>
              dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
