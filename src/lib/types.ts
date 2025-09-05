
export type Hotel = {
  id: string;
  name: string;
};

export type BookingStatus = 'Pending Guest Information' | 'Confirmed' | 'Cancelled' | 'CheckedIn' | 'CheckedOut' | 'Sent' | 'PendingPayment';

export type GuestData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number | null;
  idFrontUrl: string;
  idBackUrl: string;
  notes: string | null;
};

export type Companion = {
  firstName: string;
  lastName:string;
  idFrontUrl: string;
  idBackUrl: string;
};

export type PaymentDetails = {
  paymentOption: 'deposit' | 'full';
  amountDue: number;
  paymentProofUrl: string;
};

export type RoomConfiguration = {
    roomType: 'Standard' | 'Familienzimmer' | 'Komfort' | 'Superior' | 'Economy';
    adults: number;
    children: number;
    infants: number;
    childrenAges: string | null;
};

export type Booking = {
  id: string;
  hotelId: string;
  status: BookingStatus;
  bookingToken: string;
  
  // Data entered by hotelier
  guestInfo: {
    firstName: string;
    lastName: string;
  };
  bookingPeriod: {
    checkInDate: string;
    checkOutDate: string;
  };
  coreData: {
    catering: 'Keine' | 'Frühstück' | 'Halbpension' | 'Vollpension';
    totalPrice: number;
    guestFormLanguage: 'de' | 'it' | 'en';
  };
  rooms: RoomConfiguration[];
  internalNotes: string | null;

  // Data entered by guest
  guestData: GuestData | null;
  companions: Companion[];
  paymentDetails: PaymentDetails | null;
  
  createdAt: string;
};

export type GuestLink = {
  id: string;
  hotelId: string;
  bookingId: string;
  status: 'Active' | 'Used' | 'Expired';
  expiresAt: string;
};
