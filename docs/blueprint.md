# **App Name**: WesoWizard

## Core Features:

- Hotel Login: Secure login for hotel staff with role and hotel ID verification using Firebase Authentication.
- Dashboard Overview: Display key performance indicators (KPIs) such as daily arrivals, revenue, and recent activities in an interactive dashboard.
- Booking Management: Enable hotel staff to manage bookings with filtering, search, and batch processing capabilities. Reflect filter status in URL for easy sharing and bookmarking.
- New Booking Creation: Create new bookings and generate unique, time-limited links for guests to complete their information. Use Firestore transactions to ensure all operations succeed or fail together.
- Booking Details View: Display all relevant booking information with tabs for overview, guest data, payments, and documents.
- Guest Data Collection: Guide guests through a multi-step form (wizard) to collect necessary information, with local storage to prevent data loss and responsive design for mobile devices.
- AI-Powered Email Confirmation: Utilize a tool for generative AI, using Gemini API via Firebase, to generate personalized confirmation emails based on booking details and automatically send these emails via SMTP (e.g., SendGrid) when the booking status is updated to 'Confirmed'.

## Style Guidelines:

- Primary color: A muted blue (#6699CC), conveying trust and professionalism.
- Background color: Very light blue (#F0F8FF), providing a clean and airy feel.
- Accent color: A vibrant purple (#A06CD5) to highlight interactive elements and calls to action.
- Body and headline font: 'PT Sans' (sans-serif) for a modern and readable design. Note: currently only Google Fonts are supported.
- Use clean, minimalist icons to represent different booking statuses, actions, and data types.
- Implement a clear, tabbed layout for detailed views and a card-based layout for dashboard overviews to organize information effectively.
- Incorporate subtle transitions and animations to provide feedback during form submissions and data updates, enhancing the user experience.