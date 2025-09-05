
import type { Booking, Hotel, GuestLink, BookingStatus, GuestData, Companion, PaymentDetails, RoomConfiguration } from './types';
import { add, format, formatISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';


let hotels: Hotel[] = [
  { id: 'weso-hotel-1', name: 'WesoMountain Resort' },
];

let bookings: Booking[] = [
  {
    id: 'booking-1',
    hotelId: 'weso-hotel-1',
    status: 'Confirmed',
    bookingToken: 'token-confirmed-123',
    guestInfo: {
        firstName: 'Alice',
        lastName: 'Johnson',
    },
    bookingPeriod: {
        checkInDate: formatISO(new Date(), { representation: 'date' }),
        checkOutDate: formatISO(add(new Date(), { days: 5 }), { representation: 'date' }),
    },
    coreData: {
        catering: 'Frühstück',
        totalPrice: 1250.00,
        guestFormLanguage: 'de',
    },
    rooms: [{
        roomType: 'Superior',
        adults: 2,
        children: 0,
        infants: 0,
        childrenAges: null,
    }],
    internalNotes: 'VIP Guest, requires late checkout.',
    guestData: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: '123-456-7890',
      age: 34,
      idFrontUrl: '#',
      idBackUrl: '#',
      notes: 'Looking forward to our stay!',
    },
    companions: [],
    paymentDetails: {
        paymentOption: 'full',
        amountDue: 1250.00,
        paymentProofUrl: '#',
    },
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  },
  {
    id: 'booking-2',
    hotelId: 'weso-hotel-1',
    status: 'Pending Guest Information',
    bookingToken: 'token-pending-456',
    guestInfo: {
        firstName: 'Bob',
        lastName: 'Smith',
    },
    bookingPeriod: {
        checkInDate: formatISO(add(new Date(), { days: 1 }), { representation: 'date' }),
        checkOutDate: formatISO(add(new Date(), { days: 3 }), { representation: 'date' }),
    },
    coreData: {
        catering: 'Keine',
        totalPrice: 450.00,
        guestFormLanguage: 'en',
    },
    rooms: [{
        roomType: 'Standard',
        adults: 2,
        children: 0,
        infants: 0,
        childrenAges: null,
    }],
    internalNotes: 'Awaiting payment confirmation.',
    guestData: null,
    companions: [],
    paymentDetails: null,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
];


// Simulate DB operations with latency
const dbLatency = () => new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

export async function getHotelById(hotelId: string): Promise<Hotel | undefined> {
  await dbLatency();
  return hotels.find(h => h.id === hotelId);
}

export async function getBookingsByHotelId(hotelId: string, { query, status }: { query?: string, status?: string }): Promise<Booking[]> {
  await dbLatency();
  let hotelBookings = bookings.filter(b => b.hotelId === hotelId);

  if (status && status !== 'all') {
    hotelBookings = hotelBookings.filter(b => b.status === status);
  }

  if (query) {
    const lowerCaseQuery = query.toLowerCase();
    hotelBookings = hotelBookings.filter(b => 
      b.guestInfo.firstName.toLowerCase().includes(lowerCaseQuery) ||
      b.guestInfo.lastName.toLowerCase().includes(lowerCaseQuery) ||
      (b.guestData?.email || '').toLowerCase().includes(lowerCaseQuery) ||
      b.id.toLowerCase().includes(lowerCaseQuery)
    );
  }
  
  return hotelBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBookingById(bookingId: string): Promise<Booking | undefined> {
  await dbLatency();
  return bookings.find(b => b.id === bookingId);
}

export async function getBookingByToken(token: string): Promise<Booking | undefined> {
    await dbLatency();
    return bookings.find(b => b.bookingToken === token);
}

type CreateBookingData = {
    guestInfo: { firstName: string; lastName: string; };
    bookingPeriod: { from: Date; to: Date; };
    coreData: { catering: "Keine" | "Frühstück" | "Halbpension" | "Vollpension"; totalPrice: number; guestFormLanguage: "de" | "it" | "en"; };
    rooms: RoomConfiguration[];
    internalNotes: string | null;
}

export async function createNewBooking(hotelId: string, data: CreateBookingData): Promise<Booking> {
    await dbLatency();
    const newBookingId = `booking-${Date.now()}`;
    const newBookingToken = uuidv4();

    const newBooking: Booking = {
        id: newBookingId,
        hotelId,
        status: 'Pending Guest Information',
        bookingToken: newBookingToken,
        guestInfo: data.guestInfo,
        bookingPeriod: {
            checkInDate: formatISO(data.bookingPeriod.from, { representation: 'date' }),
            checkOutDate: formatISO(data.bookingPeriod.to, { representation: 'date' }),
        },
        coreData: data.coreData,
        rooms: data.rooms,
        internalNotes: data.internalNotes,
        guestData: null,
        companions: [],
        paymentDetails: null,
        createdAt: new Date().toISOString(),
    };
    
    bookings.unshift(newBooking);
    
    return newBooking;
}

export async function updateBookingWithGuestData(bookingId: string, guestData: GuestData, companions: Companion[], paymentDetails: PaymentDetails): Promise<Booking | undefined> {
    await dbLatency();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return undefined;

    bookings[bookingIndex].guestData = guestData;
    bookings[bookingIndex].companions = companions;
    bookings[bookingIndex].paymentDetails = paymentDetails;
    bookings[bookingIndex].status = 'Confirmed';

    return bookings[bookingIndex];
}

export async function getDashboardStats(hotelId: string) {
    await dbLatency();
    const today = format(new Date(), 'yyyy-MM-dd');
    const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

    const hotelBookings = bookings.filter(b => b.hotelId === hotelId);

    const todaysArrivals = hotelBookings.filter(b => b.bookingPeriod.checkInDate === today && (b.status === 'Confirmed' || b.status === 'CheckedIn')).length;
    const todaysDepartures = hotelBookings.filter(b => b.bookingPeriod.checkOutDate === today && b.status === 'CheckedIn').length;
    
    const revenueThisMonth = hotelBookings.reduce((acc, b) => {
        const bookingDate = new Date(b.createdAt);
        const firstOfMonthDate = new Date(firstDayOfMonth);
        if (bookingDate >= firstOfMonthDate && (b.status === 'Confirmed' || b.status === 'CheckedIn')) {
            return acc + b.coreData.totalPrice;
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
