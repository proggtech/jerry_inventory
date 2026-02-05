

export interface Supplier {
    id: string;
    userId: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone: string;
    address?: string;
    imageUrl?: string;
    itemsSupplied?: string[]; // Array of inventory item IDs or names
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SupplierFormData {
    name: string;
    contactPerson?: string;
    email?: string;
    phone: string;
    itemsSupplied?: string[];
    address?: string;
    notes?: string;
}
