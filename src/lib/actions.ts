'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNewBooking as dbCreateNewBooking, updateBookingWithGuestData as dbUpdateBooking, getHotelById, deleteBookingById as dbDeleteBookingById } from './data';
import type { Booking } from './types';
import { generateConfirmationEmail } from '@/ai/flows/ai-powered-email-confirmation';

const createBookingSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  roomType: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
});

export async function createBookingWithLink(
  hotelId: string,
  prefillData: z.infer<typeof createBookingSchema>,
  internalNotes: string | null
) {
  try {
    const validatedData = createBookingSchema.parse(prefillData);
    const newBooking = await dbCreateNewBooking(hotelId, validatedData, internalNotes);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    
    revalidatePath(`/dashboard/${hotelId}/bookings`);

    return {
      success: true,
      link: `${baseUrl}/guest/${newBooking.linkId}`,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: 'Fehler beim Erstellen der Buchung.',
    };
  }
}

const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
  idFile: z.any().optional(),
});


export async function submitGuestData(bookingId: string, data: unknown) {
    try {
        const validatedData = guestSchema.parse(data);

        // In a real app, you would handle file upload to Firebase Storage here
        // and get back a URL. For now, we'll use a placeholder.
        const idUrl = validatedData.idFile ? `/uploads/${bookingId}/${(validatedData.idFile as File).name}` : '#';

        const guestDataForDb = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            address: validatedData.address,
            city: validatedData.city,
            zip: validatedData.zip,
            country: validatedData.country,
            phone: validatedData.phone,
            idUrl,
        };
        
        // Assuming payment is confirmed upon data submission for this demo.
        const updatedBooking = await dbUpdateBooking(bookingId, guestDataForDb, 'Confirmed');

        if (!updatedBooking) {
            throw new Error('Booking not found');
        }

        const hotel = await getHotelById(updatedBooking.hotelId);
        if (!hotel) {
            throw new Error('Hotel not found');
        }

        // Trigger AI email generation
        const emailContent = await generateConfirmationEmail({
            hotelName: hotel.name,
            guestFirstName: updatedBooking.guestData!.firstName,
            guestLastName: updatedBooking.guestData!.lastName,
            checkInDate: updatedBooking.prefillData.checkInDate,
            checkOutDate: updatedBooking.prefillData.checkOutDate,
            roomType: updatedBooking.prefillData.roomType,
            bookingId: updatedBooking.id,
            specialRequests: '', // This could be a field in the guest form
        });

        // In a real app, you would use a service like SendGrid to send the email.
        console.log("---- AI-Generated Email ----");
        console.log("Subject:", emailContent.emailSubject);
        console.log("Body:", emailContent.emailBody);
        console.log("--------------------------");

        revalidatePath(`/dashboard/${updatedBooking.hotelId}/bookings`);
        revalidatePath(`/dashboard/${updatedBooking.hotelId}/bookings/${bookingId}`);
        revalidatePath(`/guest/${updatedBooking.linkId}/thank-you`);

        return { success: true };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: 'Fehler beim Senden der Gästedaten.',
        };
    }
}


export async function deleteBookingById(bookingId: string, hotelId: string) {
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
