
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
    createNewBooking,
    updateBookingWithGuestData, 
    getHotelById, 
    deleteBookingById as dbDeleteBookingById, 
    getBookingById, 
    updateBooking as dbUpdateBooking 
} from './data';
import type { Booking, GuestData, Companion, PaymentDetails } from './types';
import { generateConfirmationEmail } from '@/ai/flows/ai-powered-email-confirmation';
import { storage } from './firebase'; // Firebase Storage importieren
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Echte Upload-Funktion, die Firebase Storage nutzt
async function uploadFile(file: File, bookingId: string): Promise<string> {
    const storageRef = ref(storage, `bookings/${bookingId}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
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
    const newBooking = await createNewBooking(hotelId, validatedData);
    
    revalidatePath(`/dashboard/${hotelId}/bookings`);

    return {
      success: true,
      booking: newBooking,
    };
  } catch (error) {
    console.error("Error in createBooking action:", error);
    if (error instanceof z.ZodError) {
        return { success: false, error: "Validierungsfehler: " + error.errors.map(e => e.path.join('.') + ': ' + e.message).join(', ') };
    }
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
    return {
      success: false,
      error: `Fehler beim Erstellen der Buchung: ${errorMessage}`,
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
    console.error("Error in updateBooking action:", error);
    if (error instanceof z.ZodError) {
        return { success: false, error: "Validierungsfehler: " + error.errors.map(e => e.path.join('.') + ': ' + e.message).join(', ') };
    }
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
    return {
      success: false,
      error: `Fehler beim Aktualisieren der Buchung: ${errorMessage}`,
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

        // 1. Upload all files to Firebase Storage
        const idFrontUrl = await uploadFile(validatedData.guestData.idFrontFile, bookingId);
        const idBackUrl = await uploadFile(validatedData.guestData.idBackFile, bookingId);
        const paymentProofUrl = await uploadFile(validatedData.paymentProofFile, bookingId);

        const companionUploads = await Promise.all(validatedData.companions.map(async (comp) => ({
            ...comp,
            idFrontUrl: await uploadFile(comp.idFrontFile, bookingId),
            idBackUrl: await uploadFile(comp.idBackFile, bookingId),
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
        const updatedBooking = await updateBookingWithGuestData(bookingId, guestDataForDb, companionsForDb, paymentDetailsForDb);

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

        console.log("---- AI-Generated Email Sent (Simulation) ----");
        console.log("To:", updatedBooking.guestData?.email);
        console.log("Subject:", emailContent.emailSubject);
        console.log("------------------------------------------");
        
        revalidatePath(`/dashboard/${updatedBooking.hotelId}/bookings`);
        revalidatePath(`/dashboard/${updatedBooking.hotelId}/bookings/${bookingId}`);
        revalidatePath(`/guest/${updatedBooking.bookingToken}/thank-you`);

        return { success: true };
    } catch (error) {
        console.error("Error in submitGuestData:", error);
         if (error instanceof z.ZodError) {
            return { success: false, error: "Validierungsfehler: " + error.errors.map(e => e.path.join('.') + ': ' + e.message).join(', ') };
        }
        const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
        return {
            success: false,
            error: `Fehler beim Senden der Gästedaten: ${errorMessage}`,
        };
    }
}

// Helper to delete a file from Firebase Storage from a URL
async function deleteFileFromStorage(fileUrl: string) {
    if (!fileUrl || !fileUrl.startsWith('https://firebasestorage.googleapis.com')) return;
    try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
    } catch (error: any) {
        // Ignore "object not found" errors, as they might have been deleted already
        if (error.code !== 'storage/object-not-found') {
            console.error("Error deleting file from storage:", error);
        }
    }
}

export async function deleteBookingByIdAction(bookingId: string, hotelId: string) {
    try {
        // First, get the booking to find associated files
        const booking = await getBookingById(bookingId);
        
        if (booking) {
            // Delete main guest files
            if (booking.guestData?.idFrontUrl) await deleteFileFromStorage(booking.guestData.idFrontUrl);
            if (booking.guestData?.idBackUrl) await deleteFileFromStorage(booking.guestData.idBackUrl);
            
            // Delete companion files
            for (const companion of booking.companions) {
                if (companion.idFrontUrl) await deleteFileFromStorage(companion.idFrontUrl);
                if (companion.idBackUrl) await deleteFileFromStorage(companion.idBackUrl);
            }

            // Delete payment proof
            if (booking.paymentDetails?.paymentProofUrl) await deleteFileFromStorage(booking.paymentDetails.paymentProofUrl);
        }

        // After deleting files, delete the Firestore document
        await dbDeleteBookingById(bookingId);
        
        revalidatePath(`/dashboard/${hotelId}/bookings`);
        return { success: true };
    } catch(error: any) {
        return { success: false, error: error.message };
    }
}
