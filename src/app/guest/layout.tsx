
import { Hotel } from 'lucide-react';
import Image from 'next/image';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full bg-slate-50">
        <Image
            src="https://picsum.photos/1920/1080?grayscale"
            alt="Hotel background"
            fill
            className="object-cover opacity-20"
            data-ai-hint="hotel interior"
        />
        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
             <div className="flex items-center gap-3 mb-6 text-slate-800">
                <Hotel className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-headline font-bold">Weso<span className="text-primary">Systems</span></h1>
            </div>
            {children}
        </main>
    </div>
  )
}
