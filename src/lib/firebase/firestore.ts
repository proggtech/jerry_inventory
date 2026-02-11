import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,

    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { InventoryItem, InventoryStats, InventoryFilters } from '@/types/inventory';

import { INVENTORY_COLLECTION } from './collections';

export const addInventoryItem = async (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const docRef = await addDoc(collection(db, INVENTORY_COLLECTION), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return { id: docRef.id, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { id: null, error: error.message };
        }
        return { id: null, error: 'An unknown error occurred' };
    }
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
    try {
        const docRef = doc(db, INVENTORY_COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const deleteInventoryItem = async (id: string) => {
    try {
        const docRef = doc(db, INVENTORY_COLLECTION, id);
        await deleteDoc(docRef);
        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const getInventoryItems = async (userId: string, filters?: InventoryFilters) => {
    try {
        let q = query(
            collection(db, INVENTORY_COLLECTION),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        if (filters?.category) {
            q = query(q, where('category', '==', filters.category));
        }

        const querySnapshot = await getDocs(q);
        const items: InventoryItem[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as InventoryItem);
        });

        // Apply client-side filters
        let filteredItems = items;

        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            filteredItems = filteredItems.filter((item) =>
                item.name.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower)
            );
        }

        if (filters?.lowStock) {
            filteredItems = filteredItems.filter((item) => item.quantity <= item.lowStockThreshold);
        }

        return { items: filteredItems, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { items: [], error: error.message };
        }
        return { items: [], error: 'An unknown error occurred' };
    }
};

export const getInventoryStats = async (userId: string): Promise<{ stats: InventoryStats | null; error: string | null }> => {
    try {
        const { items, error } = await getInventoryItems(userId);

        if (error) {
            return { stats: null, error };
        }

        const categories = new Set(items.map((item) => item.category));
        const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const lowStockItems = items.filter((item) => item.quantity <= item.lowStockThreshold).length;

        const stats: InventoryStats = {
            totalItems: items.length,
            totalValue,
            lowStockItems,
            categories: categories.size,
        };

        return { stats, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { stats: null, error: error.message };
        }
        return { stats: null, error: 'An unknown error occurred' };
    }
};

export const subscribeToInventory = (
    userId: string,
    callback: (items: InventoryItem[]) => void
) => {
    const q = query(
        collection(db, INVENTORY_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const items: InventoryItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as InventoryItem);
        });
        callback(items);
    });
};
