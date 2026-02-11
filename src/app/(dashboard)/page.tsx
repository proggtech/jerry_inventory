'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Table, Tag } from 'antd';
import {
    AppstoreOutlined,
    DollarOutlined,
    WarningOutlined,
    TagsOutlined,
    UserOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getInventoryStats, getInventoryItems } from '@/lib/firebase/firestore';
import { getCustomerStats } from '@/lib/firebase/customers';
import { InventoryStats, InventoryItem } from '@/types/inventory';
import { CustomerStats } from '@/types/customer';
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
    const [customerStats, setCustomerStats] = useState<CustomerStats>({
        totalCustomers: 0,
        totalReceivables: 0,
        totalPaid: 0,
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

            const { stats: fetchedCustomerStats } = await getCustomerStats(user.uid);
            if (fetchedCustomerStats) {
                setCustomerStats(fetchedCustomerStats);
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
            render: (price: number) => `GH₵${price.toFixed(2)}`,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Title level={4} style={{ marginBottom: '16px', color: '#8c8c8c', fontWeight: 500 }}>
                Inventory Overview
            </Title>
            <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
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
                        prefix="GH₵"
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

            <Title level={4} style={{ marginBottom: '16px', color: '#8c8c8c', fontWeight: 500 }}>
                Financial & Customer Overview
            </Title>
            <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={8}>
                    <StatsCard
                        title="Total Customers"
                        value={customerStats.totalCustomers}
                        icon={<UserOutlined />}
                        color="#fa8c16"
                        index={4}
                    />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <StatsCard
                        title="Total Paid"
                        value={customerStats.totalPaid}
                        prefix="GH₵"
                        icon={<DollarOutlined />}
                        color="#13c2c2"
                        index={5}
                    />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <StatsCard
                        title="Total Outstanding"
                        value={customerStats.totalReceivables}
                        prefix="GH₵"
                        icon={<WalletOutlined />}
                        color="#eb2f96"
                        index={6}
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
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                >
                    <Table
                        dataSource={recentItems}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            </motion.div>
        </motion.div>
    );
}
