'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Table,
    Button,
    Space,
    Popconfirm,
    message,
    Input,
    Row,
    Col,
    Card,
    Typography,
    Tag,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    getCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
} from '@/lib/firebase/customers';
import { getInventoryItems } from '@/lib/firebase/firestore';
import { recordSale } from '@/lib/firebase/transactions';
import { Customer, CustomerFormData } from '@/types/customer';
import { InventoryItem } from '@/types/inventory';
import CustomerForm from '@/components/customers/CustomerForm';

const { Title } = Typography;

interface SelectedItem {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export default function CustomersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchText, setSearchText] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { customers: fetchedCustomers, error } = await getCustomers(user.uid);
        if (error) {
            message.error(error);
        } else {
            setCustomers(fetchedCustomers);
        }

        const { items: fetchedItems, error: itemsError } = await getInventoryItems(user.uid);
        if (itemsError) {
            message.error(itemsError);
        } else {
            setInventoryItems(fetchedItems);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [user, fetchData]);

    const filterCustomers = useCallback(() => {
        let filtered = [...customers];

        if (searchText) {
            filtered = filtered.filter(
                (customer) =>
                    customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    customer.businessName?.toLowerCase().includes(searchText.toLowerCase()) ||
                    customer.email?.toLowerCase().includes(searchText.toLowerCase()) ||
                    customer.phone.includes(searchText)
            );
        }

        setFilteredCustomers(filtered);
    }, [customers, searchText]);

    useEffect(() => {
        filterCustomers();
    }, [customers, searchText, filterCustomers]);

    const handleAdd = () => {
        setEditingCustomer(null);
        setFormVisible(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormVisible(true);
    };

    const handleDelete = async (id: string) => {
        const { error } = await deleteCustomer(id);
        if (error) {
            message.error(error);
        } else {
            message.success('Customer deleted successfully');
            fetchData();
        }
    };

    const handleFormSubmit = async (values: CustomerFormData, selectedItems?: SelectedItem[], amountPaid: number = 0): Promise<boolean> => {
        console.log('handleFormSubmit called with:', { values, selectedItems, amountPaid });
        if (!user) return false;

        setFormLoading(true);

        const customerData = {
            ...values,
            userId: user.uid,
        };

        let success = false;
        let customerId = editingCustomer?.id;
        const customerName = customerData.name;

        if (editingCustomer) {
            const { error } = await updateCustomer(editingCustomer.id, customerData);
            if (error) {
                message.error(error);
            } else {
                message.success('Customer updated successfully');
                success = true;
            }
        } else {
            const { id, error } = await addCustomer(customerData);
            if (error) {
                message.error(error);
            } else {
                message.success('Customer added successfully');
                customerId = id || undefined;
                success = true;
            }
        }

        // If customer saved successfully and items are selected, record the sale
        if (success && customerId && selectedItems && selectedItems.length > 0) {
            const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);

            // Map items to match transaction format (itemName instead of name)
            const transactionItems = selectedItems.map(item => ({
                itemId: item.itemId,
                itemName: item.name,
                quantity: item.quantity,
                price: item.price
            }));

            const saleData = {
                userId: user.uid,
                customerId: customerId,
                customerName: customerName,
                items: transactionItems,
                amount: totalAmount,
                amountPaid: amountPaid,
                date: new Date(),
                type: 'sale',
                status: totalAmount === amountPaid ? 'paid' : 'pending'
            };

            const { error: saleError } = await recordSale(saleData);
            if (saleError) {
                message.warning('Customer saved but failed to record items: ' + saleError);
            } else {
                message.success('Items recorded successfully');
            }
        }

        if (success) {
            setFormVisible(false);
            fetchData();
        }

        setFormLoading(false);
        return success;
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: Customer, b: Customer) => a.name.localeCompare(b.name),
            render: (text: string, record: Customer) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{text}</div>
                    {record.businessName && (
                        <div style={{ fontSize: 12, color: '#888' }}>{record.businessName}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email?: string) => email || '-',
        },
        {
            title: 'Total Purchases',
            dataIndex: 'totalPurchases',
            key: 'totalPurchases',
            sorter: (a: Customer, b: Customer) => a.totalPurchases - b.totalPurchases,
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            sorter: (a: Customer, b: Customer) => a.balance - b.balance,
            render: (balance: number) => {
                const color = balance === 0 ? 'green' : balance > 0 ? 'red' : 'blue';
                return (
                    <Tag color={color} style={{ fontWeight: 600 }}>
                        ${balance.toFixed(2)}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: Customer) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => router.push(`/customers/${record.id}`)}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete this customer?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>Customers</Title>
            </div>

            <Card
                variant="borderless"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    marginBottom: '24px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={18}>
                        <Input
                            placeholder="Search customers..."
                            prefix={<SearchOutlined />}
                            size="large"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ borderRadius: '8px' }}
                        />
                    </Col>
                    <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleAdd}
                            style={{ width: '100%', borderRadius: '8px', height: '40px' }}
                        >
                            Add Customer
                        </Button>
                    </Col>
                </Row>
            </Card>

            <Card
                variant="borderless"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    dataSource={filteredCustomers}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} customers`,
                        style: { padding: '16px' },
                    }}
                />
            </Card>

            <CustomerForm
                visible={formVisible}
                onCancel={() => setFormVisible(false)}
                onSubmit={handleFormSubmit}
                initialValues={editingCustomer || undefined}
                inventoryItems={inventoryItems}
                loading={formLoading}
            />
        </motion.div>
    );
}
