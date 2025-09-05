export type Hotel = {
  id: string;
  name: string;
};

export type BookingStatus = 'Sent' | 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'CheckedIn' | 'CheckedOut';

export type Booking = {
  id: string;
  hotelId: string;
  status: BookingStatus;
  guestData: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    phone: string;
    idUrl: string;
  } | null;
  prefillData: {
    firstName: string;
    lastName: string;
    email: string;
    roomType: string;
    checkInDate: string;
    checkOutDate: string;
  };
  internalNotes: string | null;
  createdAt: string;
  linkId: string;
  revenue: number;
};

export type GuestLink = {
  id: string;
  hotelId: string;
  bookingId: string;
  status: 'Active' | 'Used' | 'Expired';
  expiresAt: string;
};
