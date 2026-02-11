import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    onAuthStateChanged,
    sendPasswordResetEmail,
    User,
} from 'firebase/auth';
import { auth } from './config';

export const signUp = async (email: string, password: string, displayName: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update user profile with display name
        if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
        }

        return { user: userCredential.user, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { user: null, error: error.message };
        }
        return { user: null, error: 'An unknown error occurred' };
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { user: null, error: error.message };
        }
        return { user: null, error: 'An unknown error occurred' };
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};
