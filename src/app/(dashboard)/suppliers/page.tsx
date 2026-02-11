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
    Radio,
    Empty,
    Avatar,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
} from '@/lib/firebase/suppliers';
import { getInventoryItems } from '@/lib/firebase/firestore';
import { uploadItemImage } from '@/lib/firebase/storage';
import { Supplier } from '@/types/supplier';
import { InventoryItem } from '@/types/inventory';
import SupplierForm from '@/components/suppliers/SupplierForm';

const { Title } = Typography;

interface SupplierFormData {
    name: string;
    contactPerson?: string;
    email?: string;
    phone: string;
    address?: string;
}

export default function SuppliersPage() {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchText, setSearchText] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { suppliers: fetchedSuppliers, error: supplierError } = await getSuppliers(user.uid);
        if (supplierError) {
            message.error(supplierError);
        } else {
            setSuppliers(fetchedSuppliers);
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

    const filterSuppliers = useCallback(() => {
        let filtered = [...suppliers];

        if (searchText) {
            filtered = filtered.filter(
                (supplier) =>
                    supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    supplier.email?.toLowerCase().includes(searchText.toLowerCase()) ||
                    supplier.phone.includes(searchText) ||
                    supplier.contactPerson?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        setFilteredSuppliers(filtered);
    }, [suppliers, searchText]);

    useEffect(() => {
        filterSuppliers();
    }, [suppliers, searchText, filterSuppliers]);

    const handleAdd = () => {
        setEditingSupplier(null);
        setFormVisible(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormVisible(true);
    };

    const handleDelete = async (id: string) => {
        const { error } = await deleteSupplier(id);
        if (error) {
            message.error(error);
        } else {
            message.success('Supplier deleted successfully');
            fetchData();
        }
    };

    const handleFormSubmit = async (values: SupplierFormData, image?: File): Promise<boolean> => {
        if (!user) return false;

        setFormLoading(true);
        let imageUrl = editingSupplier?.imageUrl;

        // Upload image if provided
        if (image) {
            const supplierId = editingSupplier?.id || Date.now().toString();
            const { url, error } = await uploadItemImage(image, `supplier_${supplierId}`);
            if (error) {
                message.error('Failed to upload image');
                setFormLoading(false);
                return false;
            }
            imageUrl = url || undefined;
        }

        const supplierData = {
            ...values,
            userId: user.uid,
            imageUrl,
        };

        if (editingSupplier) {
            const { error } = await updateSupplier(editingSupplier.id, supplierData);
            if (error) {
                message.error(error);
                setFormLoading(false);
                return false;
            } else {
                message.success('Supplier updated successfully');
                setFormVisible(false);
                fetchData();
                setFormLoading(false);
                return true;
            }
        } else {
            const { error } = await addSupplier(supplierData);
            if (error) {
                message.error(error);
                setFormLoading(false);
                return false;
            } else {
                message.success('Supplier added successfully');
                setFormVisible(false);
                fetchData();
                setFormLoading(false);
                return true;
            }
        }
    };

    const columns = [
        {
            title: 'Logo',
            key: 'logo',
            render: (_: unknown, record: Supplier) => (
                <Avatar
                    size={50}
                    src={record.imageUrl}
                    icon={!record.imageUrl && <UserOutlined />}
                    style={{ background: record.imageUrl ? 'transparent' : '#667eea' }}
                />
            ),
            width: 80,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: Supplier, b: Supplier) => a.name.localeCompare(b.name),
            render: (text: string, record: Supplier) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{text}</div>
                    {record.contactPerson && (
                        <div style={{ fontSize: 12, color: '#888' }}>Contact: {record.contactPerson}</div>
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
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (address?: string) => address || '-',
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: Supplier) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete this supplier?"
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

    const renderGridView = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            <AnimatePresence>
                {filteredSuppliers.map((supplier) => (
                    <motion.div
                        key={supplier.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        layout
                    >
                        <Card
                            hoverable
                            actions={[
                                <EditOutlined key="edit" onClick={() => handleEdit(supplier)} />,
                                <Popconfirm
                                    key="delete"
                                    title="Delete this supplier?"
                                    onConfirm={() => handleDelete(supplier.id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                                </Popconfirm>,
                            ]}
                            bodyStyle={{ padding: '20px', textAlign: 'center' }}
                        >
                            <Avatar
                                size={80}
                                src={supplier.imageUrl}
                                icon={!supplier.imageUrl && <UserOutlined />}
                                style={{ background: supplier.imageUrl ? 'transparent' : '#667eea', marginBottom: '16px' }}
                            />
                            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>{supplier.name}</div>
                            {supplier.contactPerson && (
                                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
                                    Contact: {supplier.contactPerson}
                                </div>
                            )}
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>{supplier.phone}</div>
                            {supplier.email && (
                                <div style={{ fontSize: '12px', color: '#888', wordBreak: 'break-word' }}>{supplier.email}</div>
                            )}
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>

            {filteredSuppliers.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                    <Empty description="No suppliers found" />
                </div>
            )}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2} style={{ margin: 0 }}>Suppliers</Title>
                <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
                    <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
                </Radio.Group>
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
                            placeholder="Search suppliers..."
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
                            Add Supplier
                        </Button>
                    </Col>
                </Row>
            </Card>

            {viewMode === 'list' ? (
                <Card
                    variant="borderless"
                    style={{
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    bodyStyle={{ padding: 0 }}
                >
                    <Table
                        dataSource={filteredSuppliers}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} suppliers`,
                            style: { padding: '16px' },
                        }}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            ) : (
                renderGridView()
            )}

            <SupplierForm
                visible={formVisible}
                onCancel={() => setFormVisible(false)}
                onSubmit={handleFormSubmit}
                initialValues={editingSupplier || undefined}
                inventoryItems={inventoryItems}
                loading={formLoading}
            />
        </motion.div>
    );
}
