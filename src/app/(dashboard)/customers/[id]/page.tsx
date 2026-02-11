'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Card,
    Typography,
    Row,
    Col,
    Statistic,
    Table,
    Button,
    Tag,
    message,
    Spin,
    Space,
    Popconfirm,
} from 'antd';
import {
    ArrowLeftOutlined,
    DollarOutlined,
    ShoppingOutlined,
    WalletOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomer } from '@/lib/firebase/customers';
import { getTransactions, recordPayment, recordSale, deleteTransaction } from '@/lib/firebase/transactions';
import { getInventoryItems } from '@/lib/firebase/firestore';
import { Customer, Transaction, PaymentFormData, SaleFormData } from '@/types/customer';
import { InventoryItem } from '@/types/inventory';
import PaymentForm from '@/components/transactions/PaymentForm';
import SaleForm from '@/components/transactions/SaleForm';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';

const { Title, Text } = Typography;

type SaleItem = SaleFormData['items'][0];

export default function CustomerDetailsPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentFormVisible, setPaymentFormVisible] = useState(false);
    const [saleFormVisible, setSaleFormVisible] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [saleLoading, setSaleLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const { customer: fetchedCustomer, error: customerError } = await getCustomer(customerId);
        if (customerError) {
            message.error(customerError);
            router.push('/customers');
            return;
        }

        const { transactions: fetchedTransactions, error: transactionsError } = await getTransactions(
            user.uid,
            customerId
        );
        if (transactionsError) {
            message.error(transactionsError);
        }

        const { items: fetchedItems, error: itemsError } = await getInventoryItems(user.uid);
        if (itemsError) {
            message.error(itemsError);
        }

        setCustomer(fetchedCustomer);
        setTransactions(fetchedTransactions);
        setInventoryItems(fetchedItems);
        setLoading(false);
    }, [customerId, router, user]);

    useEffect(() => {
        fetchData();
    }, [customerId, user, fetchData]);

    const handleRecordPayment = async (values: Omit<PaymentFormData, 'customerId'>) => {
        if (!user || !customer) return;

        setPaymentLoading(true);
        const { error } = await recordPayment({
            ...values,
            userId: user.uid,
            customerId: customer.id,
            customerName: customer.name,
        });

        if (error) {
            message.error(error);
        } else {
            message.success('Payment recorded successfully');
            setPaymentFormVisible(false);
            fetchData();
        }
        setPaymentLoading(false);
    };

    const handleRecordSale = async (values: Omit<SaleFormData, 'customerId' | 'items'> & { items: SaleItem[] }) => {
        if (!user || !customer) return;

        setSaleLoading(true);
        // Ensure items are properly typed or use as is if they match
        const { error } = await recordSale({
            ...values,
            items: values.items,
            userId: user.uid,
            customerId: customer.id,
            customerName: customer.name,
        });

        if (error) {
            message.error(error);
        } else {
            message.success('Sale recorded successfully');
            setSaleFormVisible(false);
            fetchData();
        }
        setSaleLoading(false);
    };




    const handleDeleteTransaction = async (transactionId: string) => {
        if (!user) return;
        const { error } = await deleteTransaction(transactionId);
        if (error) {
            message.error(error);
        } else {
            message.success('Transaction deleted successfully');
            fetchData();
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (timestamp: Timestamp) => {
                if (timestamp?.toDate) {
                    return dayjs(timestamp.toDate()).format('MMM DD, YYYY HH:mm');
                }
                return '-';
            },
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'sale' ? 'blue' : 'green'}>
                    {type.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            render: (items: SaleItem[]) => {
                if (!items || items.length === 0) return '-';
                return (
                    <div style={{ fontSize: '13px' }}>
                        {items.map((item: SaleItem, index: number) => (
                            <div key={index}>
                                {item.quantity}x {item.itemName}
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `GH₵${amount.toFixed(2)}`,
        },
        {
            title: 'Paid',
            dataIndex: 'amountPaid',
            key: 'amountPaid',
            render: (paid: number) => `GH₵${paid.toFixed(2)}`,
        },
        {
            title: 'Due',
            dataIndex: 'amountDue',
            key: 'amountDue',
            render: (due: number) => (
                <Text style={{ color: due > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
                    GH₵{due.toFixed(2)}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status: string) => {
                const colorMap: Record<string, string> = {
                    paid: 'green',
                    partial: 'orange',
                    pending: 'red',
                };
                return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method?: string, record?: Transaction) => {
                if (record?.type === 'sale') return '-';
                return method ? <Tag>{method.toUpperCase()}</Tag> : '-';
            },
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            render: (notes?: string) => notes || '-',
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: Transaction) => (
                <Popconfirm
                    title="Delete this transaction?"
                    description="This will revert the balance and inventory adjustments."
                    onConfirm={() => handleDeleteTransaction(record.id)}
                    okText="Yes"
                    cancelText="No"
                    placement="left"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!customer) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/customers')}
                    size="large"
                >
                    Back
                </Button>
                <Title level={2} style={{ margin: 0 }}>{customer.name}</Title>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                    >
                        <Statistic
                            title="Total Purchases"
                            value={customer.totalPurchases}
                            precision={2}
                            styles={{ content: { color: '#1890ff' } }}
                            prefix={<ShoppingOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                    >
                        <Statistic
                            title="Amount Paid"
                            value={customer.totalPurchases - customer.balance}
                            precision={2}
                            styles={{ content: { color: '#52c41a' } }}
                            prefix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                    >
                        <Statistic
                            title="Outstanding Balance"
                            value={customer.balance}
                            precision={2}
                            styles={{ content: { color: customer.balance > 0 ? '#ff4d4f' : '#52c41a' } }}
                            prefix={<WalletOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                variant="borderless"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    marginBottom: '24px',
                }}
            >
                <div style={{ marginBottom: '16px' }}>
                    <Title level={4}>Customer Information</Title>
                </div>
                <Row gutter={[16, 16]}>
                    {customer.businessName && (
                        <Col span={12}>
                            <Text type="secondary">Business Name:</Text>
                            <div style={{ fontWeight: 500 }}>{customer.businessName}</div>
                        </Col>
                    )}
                    <Col span={12}>
                        <Text type="secondary">Phone:</Text>
                        <div style={{ fontWeight: 500 }}>{customer.phone}</div>
                    </Col>
                    {customer.email && (
                        <Col span={12}>
                            <Text type="secondary">Email:</Text>
                            <div style={{ fontWeight: 500 }}>{customer.email}</div>
                        </Col>
                    )}
                    {customer.address && (
                        <Col span={24}>
                            <Text type="secondary">Address:</Text>
                            <div style={{ fontWeight: 500 }}>{customer.address}</div>
                        </Col>
                    )}
                </Row>
            </Card>

            <Card
                variant="borderless"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                title="Transaction History"
                extra={
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => setSaleFormVisible(true)}
                        >
                            Record Sale
                        </Button>
                        {customer.balance > 0 && (
                            <Button
                                onClick={() => setPaymentFormVisible(true)}
                            >
                                Record Payment
                            </Button>
                        )}
                    </Space>
                }
            >
                <Table
                    dataSource={transactions}
                    columns={columns}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} transactions`,
                    }}
                />
            </Card>

            <PaymentForm
                visible={paymentFormVisible}
                onCancel={() => setPaymentFormVisible(false)}
                onSubmit={handleRecordPayment}
                customerName={customer.name}
                currentBalance={customer.balance}
                loading={paymentLoading}
            />

            <SaleForm
                visible={saleFormVisible}
                onCancel={() => setSaleFormVisible(false)}
                onSubmit={handleRecordSale}
                customerId={customer.id}
                customerName={customer.name}
                inventoryItems={inventoryItems}
                loading={saleLoading}
            />
        </motion.div>
    );
}
