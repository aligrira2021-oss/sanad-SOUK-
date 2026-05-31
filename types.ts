export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: string;
    userRole?: string;
    avatar?: string;
    image?: string;
}

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    imageUrls: string[];
    sellerId: string;
    sellerName: string;
    sellerAvatar?: string;
    location: string;
    createdAt: string;
    isVip?: boolean;
    plan?: 'vip' | 'bronze' | 'free';
    status: 'active' | 'sold' | 'pending';
    comments?: Comment[];
    views?: number;
    likes?: number;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    phone?: string;
    role: 'user' | 'admin';
    subscription: 'free' | 'bronze' | 'vip';
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    createdAt: string;
}

export interface Story {
    id: string;
    sellerId: string;
    sellerName: string;
    title?: string;
    sellerAvatar: string;
    imageUrl: string;
    imageUrls?: string[];
    createdAt: string;
    expiresAt: string;
    isVip?: boolean;
    views?: number;
    price?: number;
    category?: string;
}
