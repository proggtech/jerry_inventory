import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from 'firebase/storage';
import { storage } from './config';

export const uploadItemImage = async (file: File, itemId: string) => {
    try {
        const storageRef = ref(storage, `inventory-images/${itemId}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { url: downloadURL, path: snapshot.ref.fullPath, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { url: null, path: null, error: error.message };
        }
        return { url: null, path: null, error: 'An unknown error occurred' };
    }
};

export const deleteItemImage = async (imagePath: string) => {
    try {
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const getImageUrl = async (imagePath: string) => {
    try {
        const imageRef = ref(storage, imagePath);
        const url = await getDownloadURL(imageRef);
        return { url, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { url: null, error: error.message };
        }
        return { url: null, error: 'An unknown error occurred' };
    }
};
