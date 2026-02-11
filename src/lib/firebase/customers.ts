import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Customer, CustomerFormData } from '@/types/customer';

import { CUSTOMERS_COLLECTION as COLLECTION_NAME } from './collections';

export const getCustomers = async (userId: string) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            orderBy('name', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const customers: Customer[] = [];
        querySnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() } as Customer);
        });
        return { customers, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { customers: [], error: error.message };
        }
        return { customers: [], error: 'An unknown error occurred' };
    }
};

export const getCustomer = async (id: string) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { customer: { id: docSnap.id, ...docSnap.data() } as Customer, error: null };
        }
        return { customer: null, error: 'Customer not found' };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { customer: null, error: error.message };
        }
        return { customer: null, error: 'An unknown error occurred' };
    }
};

export const addCustomer = async (data: CustomerFormData & { userId: string }) => {
    try {
        const initialBalance = data.initialBalance || 0;
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            name: data.name,
            businessName: data.businessName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            userId: data.userId,
            balance: initialBalance,
            totalPurchases: initialBalance,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { id: null, error: error.message };
        }
        return { id: null, error: 'An unknown error occurred' };
    }
};

export const updateCustomer = async (id: string, data: Partial<CustomerFormData> & { balance?: number }) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const updateCustomerBalance = async (customerId: string, amountChange: number) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, customerId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { error: 'Customer not found' };
        }

        const currentData = docSnap.data() as Customer;
        const newBalance = currentData.balance + amountChange;

        await updateDoc(docRef, {
            balance: newBalance,
            updatedAt: serverTimestamp(),
        });

        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const deleteCustomer = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const getCustomerStats = async (userId: string) => {
    try {
        const { customers, error } = await getCustomers(userId);
        if (error) throw new Error(error);

        const stats = {
            totalCustomers: customers.length,
            totalReceivables: customers.reduce((sum, customer) => sum + (customer.balance > 0 ? customer.balance : 0), 0),
            totalPaid: customers.reduce((sum, customer) => sum + (customer.totalPurchases - customer.balance), 0),
        };

        return { stats, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { stats: null, error: error.message };
        }
        return { stats: null, error: 'An unknown error occurred' };
    }
};
