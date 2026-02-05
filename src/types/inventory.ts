export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    description?: string;
    imageUrl?: string;
    lowStockThreshold: number;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface InventoryStats {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    categories: number;
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export interface InventoryFilters {
    search?: string;
    category?: string;
    lowStock?: boolean;
}
