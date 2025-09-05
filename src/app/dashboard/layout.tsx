
'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookCopy,
  LogOut,
  Hotel,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hotelId = pathname.split('/')[2];

  const menuItems = [
    {
      href: `/dashboard/${hotelId}`,
      label: 'Dashboard',
      icon: LayoutDashboard,
      tooltip: 'Dashboard',
    },
    {
      href: `/dashboard/${hotelId}/bookings`,
      label: 'Buchungen',
      icon: BookCopy,
      tooltip: 'Buchungen',
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar variant="inset" side="left" collapsible="icon">
        <SidebarHeader className="items-center justify-center text-center">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <Hotel className="h-6 w-6 text-primary" />
                <h2 className="font-bold text-lg font-headline">WesoSystems</h2>
            </div>
             <div className="hidden items-center gap-2 group-data-[collapsible=icon]:flex">
                <Hotel className="h-6 w-6 text-primary" />
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  as={Link}
                  href={item.href}
                  isActive={pathname === item.href}
                  tooltip={item.tooltip}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
            <div className="flex items-center gap-2">
                <Avatar className="size-8">
                    <AvatarImage src="https://picsum.photos/id/237/100/100" alt="Hotelier" data-ai-hint="person face" />
                    <AvatarFallback>H</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">Hotelier</span>
                    <span className="text-xs text-muted-foreground">WesoMountain Resort</span>
                </div>
            </div>
            <Button variant="ghost" className="justify-start w-full mt-2" asChild>
                <Link href="/hotel/login">
                    <LogOut className="mr-2" />
                    <span className="group-data-[collapsible=icon]:hidden">Abmelden</span>
                </Link>
            </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex-1">
                 <h1 className="font-semibold text-lg font-headline">WesoMountain Resort</h1>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background/50">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
