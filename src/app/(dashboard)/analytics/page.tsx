'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { motion } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { getInventoryItems } from '@/lib/firebase/firestore';

const { Title } = Typography;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

interface CategoryData {
    name: string;
    value: number;
}

interface ValueData {
    category: string;
    value: number;
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [valueData, setValueData] = useState<ValueData[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;

            const { items } = await getInventoryItems(user.uid);

            // Category distribution
            const categoryMap = new Map<string, number>();
            items.forEach((item) => {
                const count = categoryMap.get(item.category) || 0;
                categoryMap.set(item.category, count + 1);
            });

            const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
                name,
                value,
            }));
            setCategoryData(catData);

            // Value by category
            const valueMap = new Map<string, number>();
            items.forEach((item) => {
                const value = valueMap.get(item.category) || 0;
                valueMap.set(item.category, value + item.price * item.quantity);
            });

            const valData = Array.from(valueMap.entries()).map(([category, value]) => ({
                category,
                value: parseFloat(value.toFixed(2)),
            }));
            setValueData(valData);
        };

        fetchAnalytics();
    }, [user]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Title level={2} style={{ marginBottom: '24px' }}>
                Analytics Dashboard
            </Title>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card
                            title="Category Distribution"
                            bordered={false}
                            style={{
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: { name?: string; percent?: number }) =>
                                            `${name || 'Unknown'}: ${((percent || 0) * 100).toFixed(0)}%`
                                        }
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                </Col>

                <Col xs={24} lg={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card
                            title="Total Value by Category"
                            bordered={false}
                            style={{
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={valueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `$${value}`} />
                                    <Legend />
                                    <Bar dataKey="value" fill="#667eea" name="Total Value ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                </Col>
            </Row>
        </motion.div>
    );
}
