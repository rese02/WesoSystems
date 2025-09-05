
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
    createNewBooking as dbCreateNewBooking, 
    updateBookingWithGuestData, 
    getHotelById, 
    deleteBookingById as dbDeleteBookingById, 
    getBookingById, 
    updateBooking as dbUpdateBooking 
} from './data';
import type { Booking, GuestData, Companion, PaymentDetails, RoomConfiguration, CateringOption, RoomType } from './types';
import { generateConfirmationEmail } from '@/ai/flows/ai-powered-email-confirmation';
// Assume a function to upload files to a storage service
// In a real app, this would upload to Firebase Storage, S3, etc.
async function uploadFile(file: File): Promise<string> {
    // This is a mock upload function.
    console.log(`Uploading file: ${file.name}`);
    await new Promise(res => setTimeout(res, 500)); // Simulate upload delay
    return `/uploads/mock/${Date.now()}-${file.name}`;
}

const roomSchema = z.object({
  roomType: z.enum(["Standard", "Familienzimmer", "Komfort", "Superior", "Economy"]),
  adults: z.coerce.number().min(1, "Mindestens ein Erwachsener pro Zimmer."),
  children: z.coerce.number().min(0),
  infants: z.coerce.number().min(0),
  childrenAges: z.string().nullable(),
});

const bookingFormSchema = z.object({
  guestInfo: z.object({
    firstName: z.string().min(1, "Vorname ist erforderlich"),
    lastName: z.string().min(1, "Nachname ist erforderlich"),
  }),
  bookingPeriod: z.object({
      from: z.date({ required_error: "Anreisedatum ist erforderlich." }),
      to: z.date({ required_error: "Abreisedatum ist erforderlich." }),
  }).refine(data => data.to > data.from, {
    message: "Abreisedatum muss nach dem Anreisedatum liegen.",
    path: ["to"],
  }),
  coreData: z.object({
      catering: z.enum(["Keine", "Frühstück", "Halbpension", "Vollpension"]),
      totalPrice: z.coerce.number().positive("Preis muss positiv sein."),
      guestFormLanguage: z.enum(['de', 'it', 'en']),
  }),
  rooms: z.array(roomSchema).min(1, "Mindestens ein Zimmer muss hinzugefügt werden."),
  internalNotes: z.string().nullable(),
});


export async function createBooking(hotelId: string, data: unknown) {
  try {
    const validatedData = bookingFormSchema.parse(data);
    const newBooking = await dbCreateNewBooking(hotelId, validatedData);
    
    revalidatePath(`/dashboard/${hotelId}/bookings`);

    return {
      success: true,
      booking: newBooking,
    };
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
        return { success: false, error: "Validierungsfehler: " + error.errors.map(e => e.path.join('.') + ': ' + e.message).join(', ') };
    }
    return {
      success: false,
      error: 'Fehler beim Erstellen der Buchung.',
    };
  }
}

export async function updateBooking(bookingId: string, hotelId: string, data: unknown) {
  try {
    const validatedData = bookingFormSchema.parse(data);
    const updatedBooking = await dbUpdateBooking(bookingId, hotelId, validatedData);
    
    revalidatePath(`/dashboard/${hotelId}/bookings`);
    revalidatePath(`/dashboard/${hotelId}/bookings/${bookingId}`);

    return {
      success: true,
      booking: updatedBooking,
    };
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
        return { success: false, error: "Validierungsfehler: " + error.errors.map(e => e.path.join('.') + ': ' + e.message).join(', ') };
    }
    return {
      success: false,
      error: 'Fehler beim Aktualisieren der Buchung.',
    };
  }
}

const guestWizardSchema = z.object({
  guestData: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    age: z.coerce.number().positive().optional().nullable(),
    idFrontFile: z.custom<File>(),
    idBackFile: z.custom<File>(),
    notes: z.string().optional().nullable(),
  }),
  companions: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    idFrontFile: z.custom<File>(),
    idBackFile: z.custom<File>(),
  })),
  paymentOption: z.enum(['deposit', 'full']),
  paymentProofFile: z.custom<File>(),
  acceptedTerms: z.literal(true),
});


export async function submitGuestData(bookingId: string, data: unknown) {
    try {
        const validatedData = guestWizardSchema.parse(data);
        const booking = await getBookingById(bookingId);
        if (!booking) throw new Error("Booking not found");

        // 1. Upload all files
        const idFrontUrl = await uploadFile(validatedData.guestData.idFrontFile);
        const idBackUrl = await uploadFile(validatedData.guestData.idBackFile);
        const paymentProofUrl = await uploadFile(validatedData.paymentProofFile);

        const companionUploads = await Promise.all(validatedData.companions.map(async (comp) => ({
            ...comp,
            idFrontUrl: await uploadFile(comp.idFrontFile),
            idBackUrl: await uploadFile(comp.idBackFile),
        })));

        // 2. Prepare data for DB
        const guestDataForDb: GuestData = {
            ...validatedData.guestData,
            age: validatedData.guestData.age ?? null,
            notes: validatedData.guestData.notes ?? null,
            idFrontUrl,
            idBackUrl,
        };

        const companionsForDb: Companion[] = companionUploads.map(comp => ({
            firstName: comp.firstName,
            lastName: comp.lastName,
            idFrontUrl: comp.idFrontUrl,
            idBackUrl: comp.idBackUrl,
        }));

        const totalPrice = booking.coreData.totalPrice;
        const amountDue = validatedData.paymentOption === 'deposit' ? totalPrice * 0.3 : totalPrice;
        
        const paymentDetailsForDb: PaymentDetails = {
            paymentOption: validatedData.paymentOption,
            amountDue: amountDue,
            paymentProofUrl,
        };

        // 3. Update booking in DB
        const updatedBooking = await updateBookingWithGuestData(bookingId, booking.hotelId, guestDataForDb, companionsForDb, paymentDetailsForDb);

        if (!updatedBooking) {
            throw new Error('Booking could not be updated');
        }

        const hotel = await getHotelById(updatedBooking.hotelId);
        if (!hotel) {
            throw new Error('Hotel not found');
        }

        // 4. Trigger AI email generation
        const emailContent = await generateConfirmationEmail({
            hotelName: hotel.name,
            guestFirstName: updatedBooking.guestData!.firstName,
            guestLastName: updatedBooking.guestData!.lastName,
            checkInDate: updatedBooking.bookingPeriod.checkInDate,
            checkOutDate: updatedBooking.bookingPeriod.checkOutDate,
            roomType: updatedBooking.rooms.map(r => r.roomType).join(', '),
            bookingId: updatedBooking.id,
            specialRequests: updatedBooking.guestData?.notes || '',
        });

        console.log("---- AI-Generated Email ----");
        console.log("Subject:", emailContent.emailSubject);
        console.log("Body:", emailContent.emailBody);
        console.log("--------------------------");

        revalidatePath(`/dashboard/${updatedBooking.hotelId}/bookings`);
        revalidatePath(`/dashboard/${updatedBooking.hotelId}/bookings/${bookingId}`);
        revalidatePath(`/guest/${updatedBooking.bookingToken}/thank-you`);

        return { success: true };
    } catch (error) {
        console.error(error);
         if (error instanceof z.ZodError) {
            return { success: false, error: "Validierungsfehler: " + error.errors.map(e => e.path.join('.') + ': ' + e.message).join(', ') };
        }
        return {
            success: false,
            error: 'Fehler beim Senden der Gästedaten.',
        };
    }
}


export async function deleteBookingByIdAction(bookingId: string, hotelId: string) {
    try {
        const success = await dbDeleteBookingById(bookingId, hotelId);
        if (!success) {
            throw new Error("Buchung nicht gefunden oder konnte nicht gelöscht werden.");
        }
        revalidatePath(`/dashboard/${hotelId}/bookings`);
        return { success: true };
    } catch(error: any) {
        return { success: false, error: error.message };
    }
}
