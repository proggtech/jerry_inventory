import { getInventoryItems } from './firestore';

export interface CategoryData {
    name: string;
    value: number;
}

export interface ValueData {
    category: string;
    value: number;
}

export interface StockHealth {
    status: string;
    count: number;
}

export interface AnalyticsData {
    categoryData: CategoryData[];
    valueData: ValueData[];
    stockHealth: StockHealth[];
}

export const getAnalyticsData = async (userId: string): Promise<AnalyticsData> => {
    // Fetch inventory data
    const { items } = await getInventoryItems(userId);

    // Category distribution
    const categoryMap = new Map<string, number>();
    items.forEach((item) => {
        const count = categoryMap.get(item.category) || 0;
        categoryMap.set(item.category, count + 1);
    });

    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
    }));

    // Value by category
    const valueMap = new Map<string, number>();
    items.forEach((item) => {
        const value = valueMap.get(item.category) || 0;
        valueMap.set(item.category, value + item.price * item.quantity);
    });

    const valueData = Array.from(valueMap.entries()).map(([category, value]) => ({
        category,
        value: parseFloat(value.toFixed(2)),
    }));

    // Stock Health
    const inStock = items.filter(item => item.quantity > item.lowStockThreshold).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;

    const stockHealth: StockHealth[] = [
        { status: 'In Stock', count: inStock },
        { status: 'Low Stock', count: lowStock },
        { status: 'Out of Stock', count: outOfStock },
    ];

    return {
        categoryData,
        valueData,
        stockHealth,
    };
};

