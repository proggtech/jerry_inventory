'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Table,
    Button,
    Space,
    Tag,
    Popconfirm,
    message,
    Input,
    Select,
    Row,
    Col,
    Card,
    Typography,
    Radio,
    Empty,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
    getInventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
} from '@/lib/firebase/firestore';
import { uploadItemImage } from '@/lib/firebase/storage';
import { InventoryItem } from '@/types/inventory';
import InventoryForm from '@/components/inventory/InventoryForm';
import { PRODUCT_CATEGORIES } from '@/constants/categories';

const { Title } = Typography;

interface InventoryFormData {
    name: string;
    category: string;
    quantity: number;
    price: number;
    description?: string;
    lowStockThreshold: number;
}

export default function InventoryPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const fetchItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { items: fetchedItems, error } = await getInventoryItems(user.uid);
        if (error) {
            message.error(error);
        } else {
            setItems(fetchedItems);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchItems();
    }, [user, fetchItems]);

    const filterItems = useCallback(() => {
        let filtered = [...items];

        if (searchText) {
            filtered = filtered.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.description?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter((item) => item.category === categoryFilter);
        }

        setFilteredItems(filtered);
    }, [items, searchText, categoryFilter]);

    useEffect(() => {
        filterItems();
    }, [items, searchText, categoryFilter, filterItems]);

    const handleAdd = () => {
        setEditingItem(null);
        setFormVisible(true);
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setFormVisible(true);
    };

    const handleDelete = async (id: string) => {
        const { error } = await deleteInventoryItem(id);
        if (error) {
            message.error(error);
        } else {
            message.success('Item deleted successfully');
            fetchItems();
        }
    };

    const handleFormSubmit = async (values: InventoryFormData, image?: File) => {
        if (!user) return;

        setFormLoading(true);
        let imageUrl = editingItem?.imageUrl;

        // Upload image if provided
        if (image) {
            const itemId = editingItem?.id || Date.now().toString();
            const { url, error } = await uploadItemImage(image, itemId);
            if (error) {
                message.error('Failed to upload image');
                setFormLoading(false);
                return;
            }
            imageUrl = url || undefined;
        }

        const itemData = {
            ...values,
            userId: user.uid,
            imageUrl,
        };

        if (editingItem) {
            const { error } = await updateInventoryItem(editingItem.id, itemData);
            if (error) {
                message.error(error);
            } else {
                message.success('Item updated successfully');
                setFormVisible(false);
                fetchItems();
            }
        } else {
            const { error } = await addInventoryItem(itemData);
            if (error) {
                message.error(error);
            } else {
                message.success('Item added successfully');
                setFormVisible(false);
                fetchItems();
            }
        }

        setFormLoading(false);
    };

    const columns = [
        {
            title: 'Image',
            key: 'image',
            render: (_: unknown, record: InventoryItem) => (
                <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {record.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={record.imageUrl} alt={record.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <InboxOutlined style={{ color: '#ccc', fontSize: 20 }} />
                    )}
                </div>
            ),
            width: 80,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: InventoryItem, b: InventoryItem) => a.name.localeCompare(b.name),
            render: (text: string, record: InventoryItem) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{record.description?.substring(0, 30)}{record.description && record.description.length > 30 ? '...' : ''}</div>
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => <Tag color="blue">{category}</Tag>,
            filters: PRODUCT_CATEGORIES.map(cat => ({ text: cat.label, value: cat.value })),
            onFilter: (value: unknown, record: InventoryItem) => record.category === (value as string),
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: (a: InventoryItem, b: InventoryItem) => a.quantity - b.quantity,
            render: (quantity: number, record: InventoryItem) => {
                const isLowStock = quantity <= record.lowStockThreshold;
                return (
                    <Tag color={isLowStock ? 'red' : 'green'}>
                        {quantity}
                        {isLowStock && ' (Low)'}
                    </Tag>
                );
            },
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            sorter: (a: InventoryItem, b: InventoryItem) => a.price - b.price,
            render: (price: number) => `$${price.toFixed(2)}`,
        },
        {
            title: 'Total Value',
            key: 'totalValue',
            render: (_: unknown, record: InventoryItem) =>
                `$${(record.price * record.quantity).toFixed(2)}`,
            sorter: (a: InventoryItem, b: InventoryItem) =>
                a.price * a.quantity - b.price * b.quantity,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: InventoryItem) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete this item?"
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            <AnimatePresence>
                {filteredItems.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        layout
                    >
                        <Card
                            hoverable
                            cover={
                                <div style={{ height: 160, overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {item.imageUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img alt={item.name} src={item.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <InboxOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
                                    )}
                                    {item.quantity <= item.lowStockThreshold && (
                                        <div style={{ position: 'absolute', top: 10, right: 10 }}>
                                            <Tag color="red">Low Stock</Tag>
                                        </div>
                                    )}
                                </div>
                            }
                            actions={[
                                <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                                <Popconfirm
                                    key="delete"
                                    title="Delete this item?"
                                    onConfirm={() => handleDelete(item.id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                                </Popconfirm>,
                            ]}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <Card.Meta
                                title={<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={item.name}>{item.name}</span>
                                    <span style={{ color: '#667eea' }}>${item.price}</span>
                                </div>}
                                description={
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            <Tag color="blue">{item.category}</Tag>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span>Qty: <b>{item.quantity}</b></span>
                                            <span style={{ color: '#888' }}>Total: ${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                }
                            />
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>

            {filteredItems.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                    <Empty description="No items found" />
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
                <Title level={2} style={{ margin: 0 }}>Inventory</Title>
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
                    backdropFilter: 'blur(10px)'
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={10}>
                        <Input
                            placeholder="Search items..."
                            prefix={<SearchOutlined />}
                            size="large"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ borderRadius: '8px' }}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Select
                            placeholder="Filter by category"
                            size="large"
                            style={{ width: '100%', borderRadius: '8px' }}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            allowClear
                        >
                            {PRODUCT_CATEGORIES.map(cat => (
                                <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleAdd}
                            style={{ width: '100%', borderRadius: '8px', height: '40px' }}
                        >
                            Add Item
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
                        dataSource={filteredItems}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 8,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} items`,
                            style: { padding: '16px' }
                        }}
                    />
                </Card>
            ) : (
                renderGridView()
            )}

            <InventoryForm
                visible={formVisible}
                onCancel={() => setFormVisible(false)}
                onSubmit={handleFormSubmit}
                initialValues={editingItem || undefined}
                loading={formLoading}
            />
        </motion.div>
    );
}
