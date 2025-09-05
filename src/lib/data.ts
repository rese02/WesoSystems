import type { Booking, Hotel, GuestLink, BookingStatus } from './types';
import { add, format } from 'date-fns';

let hotels: Hotel[] = [
  { id: 'weso-hotel-1', name: 'WesoMountain Resort' },
];

let bookings: Booking[] = [
  {
    id: 'booking-1',
    hotelId: 'weso-hotel-1',
    status: 'Confirmed',
    prefillData: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      roomType: 'Deluxe Suite',
      checkInDate: format(new Date(), 'yyyy-MM-dd'),
      checkOutDate: format(add(new Date(), { days: 5 }), 'yyyy-MM-dd'),
    },
    guestData: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      address: '123 Alpine Way',
      city: 'Mountain View',
      zip: '94043',
      country: 'USA',
      phone: '123-456-7890',
      idUrl: '#',
    },
    internalNotes: 'VIP Guest, requires late checkout.',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    linkId: 'link-1',
    revenue: 1250.00,
  },
  {
    id: 'booking-2',
    hotelId: 'weso-hotel-1',
    status: 'PendingPayment',
    prefillData: {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      roomType: 'Standard Room',
      checkInDate: format(add(new Date(), { days: 1 }), 'yyyy-MM-dd'),
      checkOutDate: format(add(new Date(), { days: 3 }), 'yyyy-MM-dd'),
    },
    guestData: null,
    internalNotes: 'Awaiting payment confirmation.',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    linkId: 'link-2-guest',
    revenue: 450.00,
  },
  {
    id: 'booking-3',
    hotelId: 'weso-hotel-1',
    status: 'Sent',
    prefillData: {
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@example.com',
      roomType: 'Family Room',
      checkInDate: format(add(new Date(), { days: 10 }), 'yyyy-MM-dd'),
      checkOutDate: format(add(new Date(), { days: 17 }), 'yyyy-MM-dd'),
    },
    guestData: null,
    internalNotes: null,
    createdAt: new Date().toISOString(),
    linkId: 'link-3',
    revenue: 2100.00,
  },
    {
    id: 'booking-4',
    hotelId: 'weso-hotel-1',
    status: 'Cancelled',
    prefillData: {
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'diana@example.com',
      roomType: 'Deluxe Suite',
      checkInDate: format(add(new Date(), { days: -20 }), 'yyyy-MM-dd'),
      checkOutDate: format(add(new Date(), { days: -15 }), 'yyyy-MM-dd'),
    },
    guestData: null,
    internalNotes: 'Cancelled due to travel changes.',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    linkId: 'link-4',
    revenue: 0,
  },
  {
    id: 'booking-5',
    hotelId: 'weso-hotel-1',
    status: 'CheckedIn',
    prefillData: {
      firstName: 'Ethan',
      lastName: 'Hunt',
      email: 'ethan@example.com',
      roomType: 'Penthouse',
      checkInDate: format(add(new Date(), { days: -1 }), 'yyyy-MM-dd'),
      checkOutDate: format(add(new Date(), { days: 4 }), 'yyyy-MM-dd'),
    },
    guestData: {
        firstName: 'Ethan',
        lastName: 'Hunt',
        email: 'ethan@example.com',
        address: 'Secret Location',
        city: 'Langley',
        zip: '20505',
        country: 'USA',
        phone: '007-007-0007',
        idUrl: '#',
    },
    internalNotes: 'High-profile guest.',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    linkId: 'link-5',
    revenue: 5000.00,
  },
];

let guestLinks: GuestLink[] = [
  {
    id: 'link-1',
    hotelId: 'weso-hotel-1',
    bookingId: 'booking-1',
    status: 'Used',
    expiresAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: 'link-2-guest',
    hotelId: 'weso-hotel-1',
    bookingId: 'booking-2',
    status: 'Active',
    expiresAt: add(new Date(), { days: 3 }).toISOString(),
  },
  {
    id: 'link-3',
    hotelId: 'weso-hotel-1',
    bookingId: 'booking-3',
    status: 'Active',
    expiresAt: add(new Date(), { days: 3 }).toISOString(),
  },
   {
    id: 'link-invalid',
    hotelId: 'weso-hotel-1',
    bookingId: 'booking-x',
    status: 'Expired',
    expiresAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
  },
];


// Simulate DB operations with latency
const dbLatency = () => new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));

export async function getHotelById(hotelId: string): Promise<Hotel | undefined> {
  await dbLatency();
  return hotels.find(h => h.id === hotelId);
}

export async function getBookingsByHotelId(hotelId: string, { query, status }: { query?: string, status?: string }): Promise<Booking[]> {
  await dbLatency();
  let hotelBookings = bookings.filter(b => b.hotelId === hotelId);

  if (status) {
    hotelBookings = hotelBookings.filter(b => b.status === status);
  }

  if (query) {
    const lowerCaseQuery = query.toLowerCase();
    hotelBookings = hotelBookings.filter(b => 
      b.prefillData.firstName.toLowerCase().includes(lowerCaseQuery) ||
      b.prefillData.lastName.toLowerCase().includes(lowerCaseQuery) ||
      b.prefillData.email.toLowerCase().includes(lowerCaseQuery) ||
      b.id.toLowerCase().includes(lowerCaseQuery)
    );
  }
  
  return hotelBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBookingById(bookingId: string, hotelId: string): Promise<Booking | undefined> {
  await dbLatency();
  return bookings.find(b => b.id === bookingId && b.hotelId === hotelId);
}

export async function getLinkById(linkId: string): Promise<GuestLink | undefined> {
  await dbLatency();
  return guestLinks.find(l => l.id === linkId);
}

export async function createNewBooking(hotelId: string, prefillData: Booking['prefillData'], internalNotes: string | null): Promise<Booking> {
    await dbLatency();
    const newBookingId = `booking-${Date.now()}`;
    const newLinkId = `link-${Date.now()}`;

    const newBooking: Booking = {
        id: newBookingId,
        hotelId,
        status: 'Sent',
        prefillData,
        guestData: null,
        internalNotes,
        createdAt: new Date().toISOString(),
        linkId: newLinkId,
        revenue: 0, // Revenue is calculated later
    };

    const newLink: GuestLink = {
        id: newLinkId,
        hotelId,
        bookingId: newBookingId,
        status: 'Active',
        expiresAt: add(new Date(), { hours: 72 }).toISOString(),
    };
    
    bookings.unshift(newBooking);
    guestLinks.push(newLink);
    
    return newBooking;
}

export async function updateBookingWithGuestData(bookingId: string, guestData: NonNullable<Booking['guestData']>, newStatus: BookingStatus): Promise<Booking | undefined> {
    await dbLatency();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return undefined;

    bookings[bookingIndex].guestData = guestData;
    bookings[bookingIndex].status = newStatus;

    const linkIndex = guestLinks.findIndex(l => l.bookingId === bookingId);
    if(linkIndex !== -1) {
        guestLinks[linkIndex].status = 'Used';
    }

    return bookings[bookingIndex];
}

export async function getDashboardStats(hotelId: string) {
    await dbLatency();
    const today = format(new Date(), 'yyyy-MM-dd');
    const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

    const hotelBookings = bookings.filter(b => b.hotelId === hotelId);

    const todaysArrivals = hotelBookings.filter(b => b.prefillData.checkInDate === today && (b.status === 'Confirmed' || b.status === 'CheckedIn')).length;
    const todaysDepartures = hotelBookings.filter(b => b.prefillData.checkOutDate === today && b.status === 'CheckedIn').length;
    
    const revenueThisMonth = hotelBookings.reduce((acc, b) => {
        const bookingDate = new Date(b.createdAt);
        const firstOfMonthDate = new Date(firstDayOfMonth);
        if (bookingDate >= firstOfMonthDate && (b.status === 'Confirmed' || b.status === 'CheckedIn')) {
            return acc + b.revenue;
        }
        return acc;
    }, 0);

    const newBookingsThisMonth = hotelBookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        const firstOfMonthDate = new Date(firstDayOfMonth);
        return bookingDate >= firstOfMonthDate;
    }).length;

    const recentActivities = hotelBookings.slice(0, 5);
    
    return {
        todaysArrivals,
        todaysDepartures,
        revenueThisMonth,
        newBookingsThisMonth,
        recentActivities
    }
}

export async function deleteBookingById(bookingId: string, hotelId: string): Promise<boolean> {
    await dbLatency();
    const index = bookings.findIndex(b => b.id === bookingId && b.hotelId === hotelId);
    if (index > -1) {
        bookings.splice(index, 1);
        return true;
    }
    return false;
}
