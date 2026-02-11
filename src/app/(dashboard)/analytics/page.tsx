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
import {
    getAnalyticsData,
    CategoryData,
    ValueData,
    StockHealth
} from '@/lib/firebase/analytics';

const { Title } = Typography;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa8c16', '#eb2f96', '#13c2c2'];

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [valueData, setValueData] = useState<ValueData[]>([]);
    const [stockHealth, setStockHealth] = useState<StockHealth[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;

            setLoading(true);
            try {
                const analyticsData = await getAnalyticsData(user.uid);

                setCategoryData(analyticsData.categoryData);
                setValueData(analyticsData.valueData);
                setStockHealth(analyticsData.stockHealth);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
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
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) =>
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
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={valueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `GH₵${value}`} />
                                    <Legend />
                                    <Bar dataKey="value" fill="#667eea" name="Total Value (GH₵)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                </Col>

                <Col xs={24} lg={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card
                            title="Inventory Health"
                            bordered={false}
                            style={{
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stockHealth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="status" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#722ed1" name="Item Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                </Col>
            </Row>
        </motion.div>
    );
}
