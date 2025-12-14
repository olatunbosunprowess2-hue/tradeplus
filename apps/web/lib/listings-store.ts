import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Listing } from './types';

interface ListingsState {
    listings: Listing[];
    addListing: (listing: Listing) => void;
    setListings: (listings: Listing[]) => void;
    getListings: (search?: string) => Listing[];
    getPaginatedListings: (page: number, limit: number, search?: string, type?: string, condition?: string, paymentMode?: string, minPrice?: string, maxPrice?: string, category?: string) => { data: Listing[], total: number, hasMore: boolean };
}

// Initial mock data with enhanced details
// Static UUIDs matching backend seed data
const USERS = {
    JOHN: 'a0000000-0000-0000-0000-000000000001',
    SARAH: 'a0000000-0000-0000-0000-000000000002',
    MIKE: 'a0000000-0000-0000-0000-000000000003',
    FIXIT: 'a0000000-0000-0000-0000-000000000004',
    DEV: 'a0000000-0000-0000-0000-000000000005',
    MUSIC: 'a0000000-0000-0000-0000-000000000006',
};

const LISTINGS = {
    IPHONE: '11111111-1111-1111-1111-111111111111',
    TV: '22222222-2222-2222-2222-222222222222',
    MACBOOK: '33333333-3333-3333-3333-333333333333',
    PS5: '44444444-4444-4444-4444-444444444444',
    HANDBAG: '88888888-8888-8888-8888-888888888888',
    PLUMBING: '10101010-1010-1010-1010-101010101010',
    WEBDEV: '10201020-1020-1020-1020-102010201020',
    PIANO: '10301030-1030-1030-1030-103010301030',
};

const initialListings: Listing[] = [
    {
        id: LISTINGS.IPHONE,
        title: 'iPhone 13 Pro Max - 256GB',
        description: 'Excellent condition iPhone 13 Pro Max with 256GB storage. Barely used for 6 months, comes with original box, charger, and protective case. Battery health at 98%. No scratches or dents. Perfect for anyone looking for a premium smartphone at a great price!',
        priceCents: 85000000,
        type: 'PHYSICAL',
        condition: 'used',
        allowCash: true,
        allowBarter: false,
        images: [
            { id: '1-1', url: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '1-2', url: 'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=800&h=800&fit=crop', sortOrder: 1 },
            { id: '1-3', url: 'https://images.unsplash.com/photo-1592286927505-2fd0c3a0e3d6?w=800&h=800&fit=crop', sortOrder: 2 }
        ],
        region: { id: 1, name: 'Lagos', city: 'Lekki' },
        sellerId: USERS.JOHN,
        seller: {
            id: USERS.JOHN,
            email: 'john@example.com',
            profile: {
                displayName: 'John Doe',
                region: { id: 1, name: 'Lagos', city: 'Lekki' },
                rating: 4.8,
                reviewCount: 24,
                responseRate: 95
            }
        },
        quantity: 1,
        categoryId: 3,
        category: { id: 3, name: 'Mobile Phones & Tablets', slug: 'mobile-phones' },
        currencyCode: 'NGN',
        allowCashPlusBarter: false,
        shippingMeetInPerson: true,
        shippingShipItem: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    },
    {
        id: LISTINGS.TV,
        title: 'Samsung 55" 4K Smart TV',
        description: 'Brand new Samsung 55-inch 4K UHD Smart TV, still sealed in original packaging. Features HDR10+, Crystal Processor 4K, and built-in streaming apps. Perfect for your home entertainment setup. Comes with 2-year warranty.',
        priceCents: 45000000,
        type: 'PHYSICAL',
        condition: 'new',
        allowCash: true,
        allowBarter: true,
        preferredBarterNotes: 'Looking to trade for iPhone 14 Pro Max or MacBook Air M2. Open to other high-value electronics as well. Must be in excellent condition.',
        images: [
            { id: '2-1', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '2-2', url: 'https://images.unsplash.com/photo-1593359863503-f598b8f4e3d5?w=800&h=800&fit=crop', sortOrder: 1 }
        ],
        region: { id: 2, name: 'Abuja', city: 'Garki' },
        sellerId: USERS.SARAH,
        seller: {
            id: USERS.SARAH,
            email: 'sarah@example.com',
            profile: {
                displayName: 'Sarah Smith',
                region: { id: 2, name: 'Abuja', city: 'Garki' },
                rating: 4.9,
                reviewCount: 18,
                responseRate: 98
            }
        },
        quantity: 5,
        categoryId: 4,
        category: { id: 4, name: 'Electronics', slug: 'electronics' },
        currencyCode: 'NGN',
        allowCashPlusBarter: true,
        shippingMeetInPerson: true,
        shippingShipItem: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    },
    {
        id: LISTINGS.MACBOOK,
        title: 'MacBook Pro M2 - 16GB RAM',
        description: 'MacBook Pro 14-inch with M2 chip, 16GB RAM, and 512GB SSD. Used for only 8 months, in pristine condition. Perfect for developers, designers, and content creators. Includes original charger and USB-C cable. AppleCare+ valid until 2025.',
        priceCents: 200000000,
        type: 'PHYSICAL',
        condition: 'used',
        allowCash: false,
        allowBarter: true,
        preferredBarterNotes: 'Interested in trading for a high-end Gaming PC with RTX 4090, 32GB RAM, and liquid cooling. Also open to trading for a complete music production setup (MIDI keyboard, audio interface, studio monitors).',
        images: [
            { id: '3-1', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '3-2', url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop', sortOrder: 1 },
            { id: '3-3', url: 'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=800&h=800&fit=crop', sortOrder: 2 },
            { id: '3-4', url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop', sortOrder: 3 }
        ],
        region: { id: 1, name: 'Lagos', city: 'Lekki' },
        sellerId: USERS.JOHN,
        seller: {
            id: USERS.JOHN,
            email: 'john@example.com',
            profile: {
                displayName: 'John Doe',
                region: { id: 1, name: 'Lagos', city: 'Lekki' },
                rating: 4.8,
                reviewCount: 24,
                responseRate: 95
            }
        },
        quantity: 1,
        categoryId: 4,
        category: { id: 4, name: 'Electronics', slug: 'electronics' },
        currencyCode: 'NGN',
        allowCashPlusBarter: false,
        shippingMeetInPerson: true,
        shippingShipItem: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    },
    {
        id: LISTINGS.PS5,
        title: 'PlayStation 5 Console',
        description: 'Brand new PlayStation 5 console with disc drive. Comes with 2 DualSense wireless controllers (white and midnight black), charging station, and 3 AAA games (FIFA 24, Spider-Man 2, God of War Ragnarök). Never opened, perfect gift for gamers!',
        priceCents: 55000000,
        type: 'PHYSICAL',
        condition: 'new',
        allowCash: true,
        allowBarter: true,
        preferredBarterNotes: 'Will trade for MacBook Air M1 or M2 in excellent condition. Also interested in high-end cameras (Sony A7 series, Canon R series) or professional drones (DJI Mavic 3 Pro).',
        images: [
            { id: '4-1', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '4-2', url: 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800&h=800&fit=crop', sortOrder: 1 },
            { id: '4-3', url: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&h=800&fit=crop', sortOrder: 2 }
        ],
        region: { id: 3, name: 'Rivers', city: 'Port Harcourt' },
        sellerId: USERS.MIKE,
        seller: {
            id: USERS.MIKE,
            email: 'mike@example.com',
            profile: {
                displayName: 'Mike Johnson',
                region: { id: 3, name: 'Rivers', city: 'Port Harcourt' },
                rating: 5.0,
                reviewCount: 32,
                responseRate: 100
            }
        },
        quantity: 10,
        categoryId: 4,
        category: { id: 4, name: 'Electronics', slug: 'electronics' },
        currencyCode: 'NGN',
        allowCashPlusBarter: true,
        shippingMeetInPerson: true,
        shippingShipItem: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    },
    {
        id: LISTINGS.HANDBAG,
        title: 'Designer Leather Handbag',
        description: 'Authentic luxury leather handbag from premium Italian brand. Gently used, in excellent condition with minimal signs of wear. Comes with authenticity certificate, dust bag, and original packaging. Perfect accessory for any occasion.',
        priceCents: 12000000,
        type: 'PHYSICAL',
        condition: 'used',
        allowCash: true,
        allowBarter: true,
        preferredBarterNotes: 'Interested in trading for gold jewelry (necklaces, bracelets, or rings - 18k or higher). Also open to designer watches or other luxury handbags of similar value.',
        images: [
            { id: '8-1', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '8-2', url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&h=800&fit=crop', sortOrder: 1 }
        ],
        region: { id: 2, name: 'Abuja', city: 'Garki' },
        sellerId: USERS.SARAH,
        seller: {
            id: USERS.SARAH,
            email: 'sarah@example.com',
            profile: {
                displayName: 'Sarah Smith',
                region: { id: 2, name: 'Abuja', city: 'Garki' },
                rating: 4.9,
                reviewCount: 18,
                responseRate: 98
            }
        },
        quantity: 1,
        categoryId: 6,
        category: { id: 6, name: 'Fashion', slug: 'fashion' },
        currencyCode: 'NGN',
        allowCashPlusBarter: false,
        shippingMeetInPerson: true,
        shippingShipItem: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    },
    // NEW SERVICE LISTINGS
    {
        id: LISTINGS.PLUMBING,
        title: 'Professional Plumbing Services',
        description: 'Expert plumbing services for residential and commercial properties. Leak repairs, pipe installation, water heater maintenance, and emergency services. Over 10 years of experience. Available 24/7 in Lagos Island and Mainland.',
        priceCents: 1500000, // 15,000 NGN per hour/visit
        type: 'SERVICE',
        allowCash: true,
        allowBarter: true,
        preferredBarterNotes: 'Open to bartering for electrical work, carpentry, or professional website design services.',
        images: [
            { id: '101-1', url: 'https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '101-2', url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=800&fit=crop', sortOrder: 1 }
        ],
        region: { id: 1, name: 'Lagos', city: 'Ikeja' },
        sellerId: USERS.FIXIT,
        seller: {
            id: USERS.FIXIT,
            email: 'fixit@example.com',
            profile: {
                displayName: 'FixIt Pro Services',
                region: { id: 1, name: 'Lagos', city: 'Ikeja' },
                rating: 4.7,
                reviewCount: 45,
                responseRate: 92
            }
        },
        quantity: 1,
        categoryId: 8,
        category: { id: 8, name: 'Services', slug: 'services' },
        currencyCode: 'NGN',
        allowCashPlusBarter: true,
        shippingMeetInPerson: true,
        shippingShipItem: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    },
    {
        id: LISTINGS.WEBDEV,
        title: 'Full Stack Web Development',
        description: 'Custom website and web application development using React, Next.js, and Node.js. I build responsive, fast, and SEO-friendly websites for businesses and individuals. Package includes design, development, and 1 month of support.',
        priceCents: 25000000, // 250,000 NGN
        type: 'SERVICE',
        allowCash: true,
        allowBarter: true,
        preferredBarterNotes: 'Willing to trade for a high-end laptop (MacBook Pro), professional photography gear, or a used car in good condition.',
        images: [
            { id: '102-1', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '102-2', url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=800&fit=crop', sortOrder: 1 }
        ],
        region: { id: 2, name: 'Abuja', city: 'Wuse' },
        sellerId: USERS.DEV,
        seller: {
            id: USERS.DEV,
            email: 'dev@example.com',
            profile: {
                displayName: 'CodeMaster Devs',
                region: { id: 2, name: 'Abuja', city: 'Wuse' },
                rating: 5.0,
                reviewCount: 12,
                responseRate: 100
            }
        },
        quantity: 1,
        categoryId: 8,
        category: { id: 8, name: 'Services', slug: 'services' },
        currencyCode: 'NGN',
        allowCashPlusBarter: true,
        shippingMeetInPerson: false,
        shippingShipItem: false,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    },
    {
        id: LISTINGS.PIANO,
        title: 'Piano & Music Theory Lessons',
        description: 'Private piano lessons for all ages and skill levels. Learn classical, jazz, or contemporary styles. I also teach music theory and composition. Lessons can be in-person (at your home) or online via Zoom. First lesson is free!',
        priceCents: 500000, // 5,000 NGN per lesson
        type: 'SERVICE',
        allowCash: true,
        allowBarter: false,
        images: [
            { id: '103-1', url: 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=800&h=800&fit=crop', sortOrder: 0 },
            { id: '103-2', url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&h=800&fit=crop', sortOrder: 1 }
        ],
        region: { id: 1, name: 'Lagos', city: 'Victoria Island' },
        sellerId: USERS.MUSIC,
        seller: {
            id: USERS.MUSIC,
            email: 'music@example.com',
            profile: {
                displayName: 'Melody Music',
                region: { id: 1, name: 'Lagos', city: 'Victoria Island' },
                rating: 4.9,
                reviewCount: 8,
                responseRate: 90
            }
        },
        quantity: 1,
        categoryId: 14,
        category: { id: 14, name: 'Jobs', slug: 'jobs' },
        currencyCode: 'NGN',
        allowCashPlusBarter: false,
        shippingMeetInPerson: true,
        shippingShipItem: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    }
];

export const useListingsStore = create<ListingsState>()(
    persist(
        (set, get) => ({
            listings: initialListings,

            addListing: (listing) => {
                set((state) => ({
                    listings: [listing, ...state.listings]
                }));
            },

            setListings: (listings) => {
                set({ listings });
            },

            getListings: (search) => {
                const { listings } = get();
                if (!search) return listings;

                const lowerSearch = search.toLowerCase();
                return listings.filter(item =>
                    item.title.toLowerCase().includes(lowerSearch) ||
                    item.description?.toLowerCase().includes(lowerSearch) ||
                    item.category.name.toLowerCase().includes(lowerSearch)
                );
            },

            getPaginatedListings: (page: number, limit: number, search?: string, type?: string, condition?: string, paymentMode?: string, minPrice?: string, maxPrice?: string, category?: string) => {
                const { listings } = get();
                let filtered = listings;

                // Filter by Search
                if (search) {
                    const lowerSearch = search.toLowerCase();
                    filtered = filtered.filter(item =>
                        item.title.toLowerCase().includes(lowerSearch) ||
                        item.description?.toLowerCase().includes(lowerSearch) ||
                        item.category.name.toLowerCase().includes(lowerSearch)
                    );
                }

                // Filter by Category
                if (category && category !== 'All') {
                    filtered = filtered.filter(item => item.category.name === category);
                }

                // Filter by Type
                if (type) {
                    filtered = filtered.filter(item => item.type === type);
                }

                // Filter by Condition
                if (condition) {
                    filtered = filtered.filter(item => item.condition === condition);
                }

                // Filter by Payment Mode
                if (paymentMode) {
                    if (paymentMode === 'cash') filtered = filtered.filter(item => item.allowCash);
                    else if (paymentMode === 'barter') filtered = filtered.filter(item => item.allowBarter);
                    else if (paymentMode === 'cash_plus_barter') filtered = filtered.filter(item => item.allowCashPlusBarter);
                }

                // Filter by Price
                if (minPrice) {
                    filtered = filtered.filter(item => (item.priceCents || 0) >= parseInt(minPrice) * 100);
                }
                if (maxPrice) {
                    filtered = filtered.filter(item => (item.priceCents || 0) <= parseInt(maxPrice) * 100);
                }

                const start = (page - 1) * limit;
                const end = start + limit;
                return {
                    data: filtered.slice(start, end),
                    total: filtered.length,
                    hasMore: end < filtered.length
                };
            }
        }),
        {
            name: 'listings-storage-v3',
        }
    )
);
