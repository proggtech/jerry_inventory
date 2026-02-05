import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Supplier, SupplierFormData } from '@/types/supplier';

const COLLECTION_NAME = 'suppliers';

export const getSuppliers = async (userId: string) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            orderBy('name', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const suppliers: Supplier[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            suppliers.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Supplier);
        });
        return { suppliers, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { suppliers: [], error: error.message };
        }
        return { suppliers: [], error: 'An unknown error occurred' };
    }
};

export const addSupplier = async (data: SupplierFormData & { userId: string; imageUrl?: string }) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
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

export const updateSupplier = async (id: string, data: Partial<SupplierFormData> & { imageUrl?: string }) => {
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

export const deleteSupplier = async (id: string) => {
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
