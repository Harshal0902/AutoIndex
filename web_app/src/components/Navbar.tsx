"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bot, Menu, X, Bell, Settings } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
];

const Navbar = () => {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className='z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl'>
            <div className='container flex h-14 items-center justify-between px-4'>
                <Link href='/' className='flex items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20'>
                        <Bot className='h-4 w-4 text-primary' />
                    </div>
                    <span className='text-base font-bold tracking-tight'>
                        Auto<span className='text-primary'>Index</span>
                    </span>
                    <span className='text-[10px] text-muted-foreground hidden sm:inline'>
                        Autonomous Crypto Index Management
                    </span>
                </Link>

                <div className='hidden md:flex items-center gap-3'>
                    <span className='text-xs text-muted-foreground font-mono'>
                        📡 24/7 Monitoring
                    </span>
                    <span className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium'>
                        <span className='h-1.5 w-1.5 rounded-full bg-success animate-pulse' />
                        Agent Active
                    </span>
                    <span className='text-xs text-muted-foreground font-mono'>
                        0x7a3...3f5E
                    </span>
                    <button className='p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground'>
                        <Bell className='h-4 w-4' />
                    </button>
                    <button className='p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground'>
                        <Settings className='h-4 w-4' />
                    </button>
                </div>

                <button
                    className='md:hidden text-foreground'
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? (
                        <X className='h-6 w-6' />
                    ) : (
                        <Menu className='h-6 w-6' />
                    )}
                </button>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className='md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl'
                    >
                        <div className='container py-4 flex flex-col gap-2'>
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Button
                                        variant={pathname === item.path ? 'secondary' : 'ghost'}
                                        className='w-full justify-start'
                                    >
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
