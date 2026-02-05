'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Table, Tag } from 'antd';
import {
    AppstoreOutlined,
    DollarOutlined,
    WarningOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getInventoryStats, getInventoryItems } from '@/lib/firebase/firestore';
import { InventoryStats, InventoryItem } from '@/types/inventory';
import StatsCard from '@/components/dashboard/StatsCard';

const { Title } = Typography;

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<InventoryStats>({
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        categories: 0,
    });
    const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            const { stats: fetchedStats } = await getInventoryStats(user.uid);
            if (fetchedStats) {
                setStats(fetchedStats);
            }

            const { items } = await getInventoryItems(user.uid);
            setRecentItems(items.slice(0, 5));
            setLoading(false);
        };

        fetchData();
    }, [user]);

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => <Tag color="blue">{category}</Tag>,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity: number, record: InventoryItem) => {
                const isLowStock = quantity <= record.lowStockThreshold;
                return (
                    <Tag color={isLowStock ? 'red' : 'green'}>
                        {quantity}
                        {isLowStock && ` (Low)`}
                    </Tag>
                );
            },
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `$${price.toFixed(2)}`,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Title level={2} style={{ marginBottom: '24px' }}>
                Dashboard Overview
            </Title>

            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        title="Total Items"
                        value={stats.totalItems}
                        icon={<AppstoreOutlined />}
                        color="#1890ff"
                        index={0}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        title="Total Value"
                        value={stats.totalValue}
                        prefix="$"
                        icon={<DollarOutlined />}
                        color="#52c41a"
                        index={1}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        title="Low Stock"
                        value={stats.lowStockItems}
                        icon={<WarningOutlined />}
                        color="#ff4d4f"
                        index={2}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        title="Categories"
                        value={stats.categories}
                        icon={<TagsOutlined />}
                        color="#722ed1"
                        index={3}
                    />
                </Col>
            </Row>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <Card
                    title="Recent Items"
                    variant="borderless"
                    style={{
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                >
                    <Table
                        dataSource={recentItems}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                    />
                </Card>
            </motion.div>
        </motion.div>
    );
}
