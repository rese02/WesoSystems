// src/ai/flows/ai-powered-email-confirmation.ts
'use server';
/**
 * @fileOverview Generates and sends personalized booking confirmation emails using AI when a booking is confirmed.
 *
 * - generateConfirmationEmail - A function that generates and sends confirmation emails based on booking details.
 * - GenerateConfirmationEmailInput - The input type for the generateConfirmationEmail function.
 * - GenerateConfirmationEmailOutput - The return type for the generateConfirmationEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateConfirmationEmailInputSchema = z.object({
  hotelName: z.string().describe('The name of the hotel.'),
  guestFirstName: z.string().describe('The first name of the guest.'),
  guestLastName: z.string().describe('The last name of the guest.'),
  checkInDate: z.string().describe('The check-in date (e.g., YYYY-MM-DD).'),
  checkOutDate: z.string().describe('The check-out date (e.g., YYYY-MM-DD).'),
  roomType: z.string().describe('The type of room booked.'),
  bookingId: z.string().describe('The unique booking ID.'),
  specialRequests: z.string().optional().describe('Any special requests made by the guest.'),
});
export type GenerateConfirmationEmailInput = z.infer<typeof GenerateConfirmationEmailInputSchema>;

const GenerateConfirmationEmailOutputSchema = z.object({
  emailSubject: z.string().describe('The subject line of the confirmation email.'),
  emailBody: z.string().describe('The HTML body of the confirmation email.'),
});
export type GenerateConfirmationEmailOutput = z.infer<typeof GenerateConfirmationEmailOutputSchema>;

export async function generateConfirmationEmail(input: GenerateConfirmationEmailInput): Promise<GenerateConfirmationEmailOutput> {
  return generateConfirmationEmailFlow(input);
}

const confirmationEmailPrompt = ai.definePrompt({
  name: 'confirmationEmailPrompt',
  input: {schema: GenerateConfirmationEmailInputSchema},
  output: {schema: GenerateConfirmationEmailOutputSchema},
  prompt: `You are an AI assistant specialized in generating personalized booking confirmation emails for hotels.

  Based on the following booking details, create a confirmation email with a warm and welcoming tone.
  Include a subject line and the email body in HTML format.

  Booking Details:
  Hotel Name: {{{hotelName}}}
  Guest Name: {{{guestFirstName}}} {{{guestLastName}}}
  Check-in Date: {{{checkInDate}}}
  Check-out Date: {{{checkOutDate}}}
  Room Type: {{{roomType}}}
  Booking ID: {{{bookingId}}}
  Special Requests: {{{specialRequests}}}

  Email should include:
  - A thank you message for choosing the hotel.
  - Booking details summary.
  - Information about hotel amenities.
  - Contact information for any inquiries.
  - A friendly and professional closing.
`,
});

const generateConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'generateConfirmationEmailFlow',
    inputSchema: GenerateConfirmationEmailInputSchema,
    outputSchema: GenerateConfirmationEmailOutputSchema,
  },
  async input => {
    const {output} = await confirmationEmailPrompt(input);
    return output!;
  }
);

