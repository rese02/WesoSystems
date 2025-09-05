
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

export type RoomType = 'Standard' | 'Familienzimmer' | 'Komfort' | 'Superior' | 'Economy';

export const roomTypes: RoomType[] = ["Standard", "Familienzimmer", "Komfort", "Superior", "Economy"];

export type CateringOption = "Keine" | "Frühstück" | "Halbpension" | "Vollpension";

export const cateringOptions: CateringOption[] = ["Keine", "Frühstück", "Halbpension", "Vollpension"];

export type GuestFormLanguage = 'de' | 'it' | 'en';

export const guestFormLanguages: GuestFormLanguage[] = ['de', 'it', 'en'];


export type RoomConfiguration = {
    roomType: RoomType;
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
    catering: CateringOption;
    totalPrice: number;
    guestFormLanguage: GuestFormLanguage;
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


export type Translations = {
  wizardTitle: string;
  wizardDescription: (hotelName: string) => string;
  step1Title: string;
  bookingSummary: string;
  nights: string;
  period: string;
  totalPrice: string;
  step1Subtitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  idFront: string;
  idBack: string;
  notes: string;
  step2Title: string;
  companion: string;
  addCompanion: string;
  step3Title: string;
  step3Description: string;
  depositOption: (amount: string) => string;
  fullOption: (amount: string) => string;
  amountDue: string;
  step4Title: string;
  step4Description: (amount: string) => string;
  accountHolder: string;
  iban: string;
  bic: string;
  reference: string;
  referenceText: (bookingId: string, type: string) => string;
  paymentProof: string;
  fileSelect: string;
  step5Title: string;
  step5Description: string;
  summaryYourData: string;
  summaryName: string;
  summaryDocs: string;
  summaryCompanions: string;
  summaryPaymentInfo: string;
  summaryPaymentOption: string;
  summaryPaymentProof: string;
  acceptTerms: string;
  submitButton: string;
  backButton: string;
agb: string;
and: string;
privacy: string;
  nextButton: string;
  copied: string;
};
