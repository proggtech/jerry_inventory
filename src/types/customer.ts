import { Timestamp } from 'firebase/firestore';

export interface Customer {
    id: string;
    userId: string;
    name: string;
    businessName?: string;
    email?: string;
    phone: string;
    address?: string;
    balance: number; // Outstanding balance
    totalPurchases: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Transaction {
    id: string;
    userId: string;
    customerId: string;
    customerName: string;
    type: 'sale' | 'payment';
    amount: number;
    items?: Array<{
        itemId: string;
        itemName: string;
        quantity: number;
        price: number;
    }>;
    paymentStatus: 'paid' | 'pending' | 'partial';
    amountPaid: number;
    amountDue: number;
    paymentMethod?: string;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CustomerFormData {
    name: string;
    businessName?: string;
    email?: string;
    phone: string;
    address?: string;
    initialBalance?: number;
}

export interface SaleFormData {
    customerId: string;
    items: Array<{
        itemId: string;
        itemName: string;
        quantity: number;
        price: number;
    }>;
    amountPaid: number;
    notes?: string;
}

export interface PaymentFormData {
    customerId: string;
    amount: number;
    paymentMethod?: string;
    notes?: string;
}