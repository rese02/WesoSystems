import { db } from './firebase';
import { collection, query as firestoreQuery, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import type { Booking, Hotel, BookingStatus, GuestData, Companion, PaymentDetails, RoomConfiguration } from './types';
import { formatISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// HINWEIS: Die Hotel-Daten werden vorerst hartcodiert, da es keine UI zur Verwaltung gibt.
const hotels: Hotel[] = [
  { id: 'weso-hotel-1', name: 'WesoMountain Resort' },
];

export async function getHotelById(hotelId: string): Promise<Hotel | undefined> {
  return hotels.find(h => h.id === hotelId);
}

// Wandelt ein Firestore-Dokument in ein Booking-Objekt um
const toBookingObject = (doc: any): Booking => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        // Konvertiere Timestamp-Objekte sicher in ISO-Strings
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
    } as Booking;
}

export async function getBookingsByHotelId(hotelId: string, { query, status }: { query?: string, status?: string }): Promise<Booking[]> {
  const bookingsRef = collection(db, 'bookings');
  
  let q = firestoreQuery(bookingsRef, where('hotelId', '==', hotelId), orderBy('createdAt', 'desc'));

  if (status && status !== 'all') {
    q = firestoreQuery(q, where('status', '==', status));
  }
  
  const querySnapshot = await getDocs(q);
  let bookings = querySnapshot.docs.map(toBookingObject);

  if (query) {
    const lowerCaseQuery = query.toLowerCase();
    bookings = bookings.filter(b => 
      b.guestInfo.firstName.toLowerCase().includes(lowerCaseQuery) ||
      b.guestInfo.lastName.toLowerCase().includes(lowerCaseQuery) ||
      (b.guestData?.email || '').toLowerCase().includes(lowerCaseQuery) ||
      b.id.toLowerCase().includes(lowerCaseQuery)
    );
  }
  
  return bookings;
}

export async function getBookingById(bookingId: string): Promise<Booking | undefined> {
  const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
  if (!bookingDoc.exists()) {
    return undefined;
  }
  return toBookingObject(bookingDoc);
}

export async function getBookingByToken(token: string): Promise<Booking | undefined> {
  const q = firestoreQuery(collection(db, 'bookings'), where('bookingToken', '==', token));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
      return undefined;
  }
  return toBookingObject(querySnapshot.docs[0]);
}

type CreateBookingData = {
    guestInfo: { firstName: string; lastName: string; };
    bookingPeriod: { from: Date; to: Date; };
    coreData: { catering: "Keine" | "Frühstück" | "Halbpension" | "Vollpension"; totalPrice: number; guestFormLanguage: "de" | "it" | "en"; };
    rooms: RoomConfiguration[];
    internalNotes: string | null;
}

export async function createNewBooking(hotelId: string, data: CreateBookingData): Promise<Booking> {
    const newBookingData = {
        hotelId,
        status: 'Pending Guest Information' as BookingStatus,
        bookingToken: uuidv4(),
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
        createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'bookings'), newBookingData);
    
    return {
        id: docRef.id,
        ...newBookingData,
        createdAt: newBookingData.createdAt.toISOString()
    };
}

export async function updateBooking(bookingId: string, hotelId: string, data: CreateBookingData): Promise<Booking | undefined> {
    const bookingRef = doc(db, 'bookings', bookingId);
    
    const updatedData = {
        guestInfo: data.guestInfo,
        bookingPeriod: {
            checkInDate: formatISO(data.bookingPeriod.from, { representation: 'date' }),
            checkOutDate: formatISO(data.bookingPeriod.to, { representation: 'date' }),
        },
        coreData: data.coreData,
        rooms: data.rooms,
        internalNotes: data.internalNotes,
    };

    await updateDoc(bookingRef, updatedData);
    
    return getBookingById(bookingId);
}

export async function updateBookingWithGuestData(bookingId: string, guestData: GuestData, companions: Companion[], paymentDetails: PaymentDetails): Promise<Booking | undefined> {
    const bookingRef = doc(db, 'bookings', bookingId);

    const updateData = {
        guestData,
        companions,
        paymentDetails,
        status: 'Confirmed' as BookingStatus,
    };
    
    await updateDoc(bookingRef, updateData);
    
    return getBookingById(bookingId);
}

export async function getDashboardStats(hotelId: string) {
    const today = formatISO(new Date(), { representation: 'date' });
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const bookingsRef = collection(db, 'bookings');
    const q = firestoreQuery(bookingsRef, where('hotelId', '==', hotelId));
    const querySnapshot = await getDocs(q);
    const allBookings = querySnapshot.docs.map(toBookingObject);

    const todaysArrivals = allBookings.filter(b => b.bookingPeriod.checkInDate === today && (b.status === 'Confirmed' || b.status === 'CheckedIn')).length;
    const todaysDepartures = allBookings.filter(b => b.bookingPeriod.checkOutDate === today && b.status === 'CheckedIn').length;
    
    const revenueThisMonth = allBookings.reduce((acc, b) => {
        const bookingDate = new Date(b.createdAt);
        if (bookingDate >= startOfMonth && (b.status === 'Confirmed' || b.status === 'CheckedIn')) {
            return acc + b.coreData.totalPrice;
        }
        return acc;
    }, 0);

    const newBookingsThisMonth = allBookings.filter(b => new Date(b.createdAt) >= startOfMonth).length;

    const recentActivities = allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    
    return {
        todaysArrivals,
        todaysDepartures,
        revenueThisMonth,
        newBookingsThisMonth,
        recentActivities
    }
}

export async function deleteBookingById(bookingId: string): Promise<void> {
    const bookingRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingRef);
}
