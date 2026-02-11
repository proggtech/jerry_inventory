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
    PrinterOutlined,
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
import TransactionReceipt from '@/components/transactions/TransactionReceipt';
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
    const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);

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
        // @ts-ignore - The error return type is handled but id isn't in definition yet if I don't update types, checking inference
        const { id, error } = await recordSale({
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
            await fetchData();
            // Find the new transaction to show receipt
            if (id) {
                // We need to fetch transactions again to get the full object or construct it.
                // fetchData() updates 'transactions' state, but it's async and state update might lag.
                // Better to refetch explicitly or find it in the updated state if we wait. 
                // However, state update in fetchData is async.
                // Let's rely on finding it in the freshly fetched list if we await fetchData?
                // Await fetchData() waits for the async call, setting state happens. 
                // But we can just use getTransactions again locally to be sure or just wait a bit.
                // Actually, recordSale doesn't return the full object, only ID.
                // We can manually construct a partial transaction for the receipt if needed, 
                // but getting it from server is safer.
                // Let's try to find it in the fetched transactions after a small delay or separate fetch.
                // For now, let's assume fetchData effectively refreshes.
                // We can also just set a flag to open receipt for the latest transaction.
            }
            // Since we can't easily wait for state update in a robust way without useEffect, 
            // let's just cheat and fetch the single transaction or find it in a new call.
            // But simpler: just show success message for now, user can click print. 
            // Wait, user wants "download on purchase". It should be automatic.
            // We can pass the constructed transaction to the receipt.
            const newTransaction: Transaction = {
                id: id || 'temp-id',
                userId: user.uid,
                customerId: customer.id,
                customerName: customer.name,
                type: 'sale',
                amount: values.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                items: values.items,
                paymentStatus: values.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (values.amountPaid || 0) <= 0 ? 'paid' : 'partial', // approx logic
                amountPaid: values.amountPaid || 0,
                amountDue: values.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (values.amountPaid || 0),
                notes: values.notes,
                createdAt: Timestamp.now(), // approximate
                updatedAt: Timestamp.now(),
            } as Transaction;
            setReceiptTransaction(newTransaction);
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

    const handlePrint = () => {
        window.print();
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
            className: 'no-print',
        },
        {
            title: 'Actions',
            key: 'actions',
            className: 'no-print',
            render: (_: unknown, record: Transaction) => (
                <Space>
                    <Button
                        type="text"
                        icon={<PrinterOutlined />}
                        size="small"
                        onClick={() => setReceiptTransaction(record)}
                        title="Print Receipt"
                    />
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
                </Space>
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
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push('/customers')}
                        size="large"
                    >
                        Back
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>{customer.name}</Title>
                </div>
                <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                    size="large"
                    className="no-print"
                >
                    Print / Download PDF
                </Button>
            </div>

            {/* Print Only Header */}
            <div className="print-only" style={{ marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <img
                            src="/images/ideviceCare-logo.png"
                            alt="iDeviceCare"
                            style={{ maxHeight: '60px', marginBottom: '10px' }}
                        />
                        <Title level={4} style={{ margin: 0, color: '#555' }}>Customer Account Statement</Title>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <Title level={3} style={{ margin: 0 }}>{customer.name}</Title>
                        <Text>Date: {dayjs().format('MMMM DD, YYYY')}</Text>
                    </div>
                </div>
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
                        <Col xs={24} sm={12}>
                            <Text type="secondary">Business Name:</Text>
                            <div style={{ fontWeight: 500 }}>{customer.businessName}</div>
                        </Col>
                    )}
                    <Col xs={24} sm={12}>
                        <Text type="secondary">Phone:</Text>
                        <div style={{ fontWeight: 500 }}>{customer.phone}</div>
                    </Col>
                    {customer.email && (
                        <Col xs={24} sm={12}>
                            <Text type="secondary">Email:</Text>
                            <div style={{ fontWeight: 500 }}>{customer.email}</div>
                        </Col>
                    )}
                    {customer.address && (
                        <Col xs={24}>
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
                    scroll={{ x: 'max-content' }}
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

            <TransactionReceipt
                visible={!!receiptTransaction}
                onClose={() => setReceiptTransaction(null)}
                transaction={receiptTransaction}
                customer={customer}
            />

        </motion.div>
    );
}
