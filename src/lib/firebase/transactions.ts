import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    runTransaction,
    doc,
} from 'firebase/firestore';
import { db } from './config';
import { Transaction, SaleFormData, PaymentFormData } from '@/types/customer';

const COLLECTION_NAME = 'transactions';
const CUSTOMERS_COLLECTION = 'customers';

export const getTransactions = async (userId: string, customerId?: string) => {
    try {
        let q;
        if (customerId) {
            q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                where('customerId', '==', customerId),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        return { transactions, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { transactions: [], error: error.message };
        }
        return { transactions: [], error: 'An unknown error occurred' };
    }
};

export const recordSale = async (data: SaleFormData & { userId: string; customerName: string }) => {
    try {
        const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const amountDue = totalAmount - data.amountPaid;
        const paymentStatus = amountDue === 0 ? 'paid' : (data.amountPaid > 0 ? 'partial' : 'pending');

        let saleId = '';

        // Use transaction to ensure data consistency
        await runTransaction(db, async (transaction) => {
            // 1. READS: Fetch Customer
            const customerRef = doc(db, CUSTOMERS_COLLECTION, data.customerId);
            const customerSnap = await transaction.get(customerRef);

            if (!customerSnap.exists()) {
                throw new Error('Customer not found');
            }

            // 1. READS: Fetch Inventory Items and Validate Stock
            const itemRefs = data.items.map(item => ({
                ref: doc(db, 'inventory', item.itemId),
                requestedQty: item.quantity,
                name: item.itemName
            }));

            const itemSnaps = await Promise.all(itemRefs.map(item => transaction.get(item.ref)));

            // Validate all items exist and have sufficient stock
            itemSnaps.forEach((snap, index) => {
                if (!snap.exists()) {
                    throw new Error(`Item '${itemRefs[index].name}' not found`);
                }
                const itemData = snap.data();
                if (itemData.quantity < itemRefs[index].requestedQty) {
                    throw new Error(`Insufficient stock for '${itemRefs[index].name}'. Available: ${itemData.quantity}`);
                }
            });

            // 2. WRITES: Create sale transaction
            const saleRef = doc(collection(db, COLLECTION_NAME));
            saleId = saleRef.id;

            transaction.set(saleRef, {
                userId: data.userId,
                customerId: data.customerId,
                customerName: data.customerName,
                type: 'sale',
                amount: totalAmount,
                items: data.items,
                paymentStatus,
                amountPaid: data.amountPaid,
                amountDue,
                notes: data.notes || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 2. WRITES: Update customer balance and total purchases
            const customerData = customerSnap.data();
            transaction.update(customerRef, {
                balance: customerData.balance + amountDue,
                totalPurchases: customerData.totalPurchases + totalAmount,
                updatedAt: serverTimestamp(),
            });

            // 2. WRITES: Update inventory quantities
            itemSnaps.forEach((snap, index) => {
                const itemData = snap.data();
                if (!itemData) return;
                const newQuantity = itemData.quantity - itemRefs[index].requestedQty;
                transaction.update(itemRefs[index].ref, {
                    quantity: newQuantity,
                    updatedAt: serverTimestamp(),
                });
            });
        });

        return { id: saleId, error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};

export const recordPayment = async (data: PaymentFormData & { userId: string; customerName: string }) => {
    try {
        await runTransaction(db, async (transaction) => {
            // 1. READS: Fetch Customer
            const customerRef = doc(db, CUSTOMERS_COLLECTION, data.customerId);
            const customerSnap = await transaction.get(customerRef);

            if (!customerSnap.exists()) {
                throw new Error('Customer not found');
            }

            // Validate payment amount (optional: prevent overpayment, but strict rule requested was mostly Logic)
            const customerData = customerSnap.data();
            const newBalance = customerData.balance - data.amount;

            if (newBalance < 0) {
                // throw new Error('Payment amount exceeds outstanding balance'); 
                // Commenting out strict check if user wants to allow credit? 
                // Logic in original code threw error. I will Keep it.
                throw new Error('Payment amount exceeds outstanding balance');
            }

            // 2. WRITES: Create payment transaction
            const paymentRef = doc(collection(db, COLLECTION_NAME));
            transaction.set(paymentRef, {
                userId: data.userId,
                customerId: data.customerId,
                customerName: data.customerName,
                type: 'payment',
                amount: data.amount,
                paymentStatus: 'paid',
                amountPaid: data.amount,
                amountDue: 0,
                paymentMethod: data.paymentMethod || 'cash',
                notes: data.notes || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 2. WRITES: Update customer balance
            transaction.update(customerRef, {
                balance: newBalance,
                updatedAt: serverTimestamp(),
            });
        });

        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};
export const deleteTransaction = async (transactionId: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            const transRef = doc(db, COLLECTION_NAME, transactionId);
            const transSnap = await transaction.get(transRef);

            if (!transSnap.exists()) {
                throw new Error('Transaction not found');
            }

            const transData = transSnap.data() as Transaction;
            const customerRef = doc(db, CUSTOMERS_COLLECTION, transData.customerId);
            const customerSnap = await transaction.get(customerRef);

            if (!customerSnap.exists()) {
                throw new Error('Customer associated with this transaction not found');
            }
            const customerData = customerSnap.data();

            if (transData.type === 'payment') {
                // Revert payment: Add amount back to balance
                const newBalance = customerData.balance + transData.amount;
                transaction.update(customerRef, {
                    balance: newBalance,
                    updatedAt: serverTimestamp(),
                });
            } else if (transData.type === 'sale') {
                // Revert sale:
                // 1. Reduce balance by amountDue (remove the debt added)
                // 2. Reduce totalPurchases by amount
                // 3. Add back inventory items

                const newBalance = customerData.balance - transData.amountDue;
                const newTotalPurchases = customerData.totalPurchases - transData.amount;

                transaction.update(customerRef, {
                    balance: newBalance,
                    totalPurchases: newTotalPurchases,
                    updatedAt: serverTimestamp(),
                });

                // Add Items back to inventory
                if (transData.items && transData.items.length > 0) {
                    const itemRefs = transData.items.map(item => ({
                        ref: doc(db, 'inventory', item.itemId),
                        qtyToAdd: item.quantity,
                        name: item.itemName
                    }));

                    const itemSnaps = await Promise.all(itemRefs.map(item => transaction.get(item.ref)));

                    itemSnaps.forEach((snap, index) => {
                        if (snap.exists()) {
                            const itemData = snap.data();
                            transaction.update(itemRefs[index].ref, {
                                quantity: itemData.quantity + itemRefs[index].qtyToAdd,
                                updatedAt: serverTimestamp(),
                            });
                        }
                        // If item doesn't exist anymore, we skip restoring stock but proceed with deleting transaction
                    });
                }
            }

            // Delete the transaction document
            transaction.delete(transRef);
        });

        return { error: null };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred' };
    }
};
