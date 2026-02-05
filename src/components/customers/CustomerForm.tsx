import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Table, Select, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Customer } from '@/types/customer';
import { InventoryItem } from '@/types/inventory';

const { TextArea } = Input;
const { Option } = Select;

interface SelectedItem {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface CustomerFormData {
    name: string;
    businessName?: string;
    phone: string;
    email?: string;
    address?: string;
    initialBalance?: number;
    balance?: number;
}

interface CustomerFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: CustomerFormData, selectedItems?: SelectedItem[], amountPaid?: number) => Promise<boolean>;
    initialValues?: Partial<Customer>;
    inventoryItems: InventoryItem[];
    loading: boolean;
}

export default function CustomerForm({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    inventoryItems,
    loading,
}: CustomerFormProps) {
    const [form] = Form.useForm();
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [saleAmountPaid, setSaleAmountPaid] = useState<number>(0);

    // Item selection state
    const [currentItemId, setCurrentItemId] = useState<string | null>(null);
    const [currentQuantity, setCurrentQuantity] = useState<number>(1);
    const [currentPrice, setCurrentPrice] = useState<number>(0);

    // Reset when modal opens
    useEffect(() => {
        if (visible) {
            if (initialValues) {
                form.setFieldsValue(initialValues);
            } else {
                form.resetFields();
            }
            setSelectedItems([]);
            // remove setShowSaleSection
            setCurrentItemId(null);
            setCurrentQuantity(1);
            setCurrentQuantity(1);
            setCurrentPrice(0);
            setSaleAmountPaid(0);
        }
    }, [visible, initialValues, form]);

    const handleItemSelect = (itemId: string) => {
        const item = inventoryItems.find(i => i.id === itemId);
        if (item) {
            setCurrentItemId(itemId);
            setCurrentPrice(item.price);
        }
    };

    const handleAddItem = () => {
        if (!currentItemId || currentQuantity <= 0) return;

        const item = inventoryItems.find(i => i.id === currentItemId);
        if (!item) return;

        const newItem = {
            itemId: item.id,
            name: item.name,
            quantity: currentQuantity,
            price: currentPrice,
            total: currentQuantity * currentPrice
        };

        setSelectedItems([...selectedItems, newItem]);

        // Reset inputs
        setCurrentItemId(null);
        setCurrentQuantity(1);
        setCurrentPrice(0);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...selectedItems];
        newItems.splice(index, 1);
        setSelectedItems(newItems);
    };

    const itemsTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const success = await onSubmit(values, selectedItems, saleAmountPaid);
            if (success) {
                form.resetFields();
                setSelectedItems([]);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title={initialValues ? 'Edit Customer' : 'Add New Customer'}
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={loading}
            width={600}
            okText={initialValues ? 'Update' : 'Add'}
            centered
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
            >
                <Form.Item
                    name="name"
                    label="Customer Name"
                    rules={[{ required: true, message: 'Please enter customer name' }]}
                >
                    <Input placeholder="Enter customer name" size="large" style={{ borderRadius: '8px' }} allowClear />
                </Form.Item>

                <Form.Item
                    name="businessName"
                    label="Business Name"
                >
                    <Input placeholder="Business name (optional)" size="large" style={{ borderRadius: '8px' }} allowClear />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                        name="phone"
                        label="Phone"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                    >
                        <Input placeholder="Phone number" size="large" style={{ borderRadius: '8px' }} allowClear />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                    >
                        <Input placeholder="Email address" size="large" style={{ borderRadius: '8px' }} allowClear />
                    </Form.Item>
                </div>

                <Form.Item
                    name="address"
                    label="Address"
                >
                    <TextArea
                        rows={2}
                        placeholder="Enter address"
                        style={{ borderRadius: '8px' }}
                        allowClear
                    />
                </Form.Item>

                <div style={{ marginBottom: '24px', border: '1px solid #f0f0f0', padding: '16px', borderRadius: '8px', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600 }}>Add New Items (Sale)</div>
                        {initialValues && (
                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                To view/edit history, go to customer details.
                            </Typography.Text>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 2 }}>
                            <div style={{ marginBottom: '4px', fontSize: '12px' }}>Item</div>
                            <Select
                                placeholder="Select Item to Add"
                                style={{ width: '100%' }}
                                value={currentItemId}
                                onChange={handleItemSelect}
                                showSearch
                                optionFilterProp="children"
                                allowClear
                            >
                                {inventoryItems.map(item => (
                                    <Option key={item.id} value={item.id}>
                                        {item.name} (Stock: {item.quantity})
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '4px', fontSize: '12px' }}>Qty</div>
                            <InputNumber
                                min={1}
                                value={currentQuantity}
                                onChange={(val) => setCurrentQuantity(val || 1)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '4px', fontSize: '12px' }}>Price</div>
                            <InputNumber
                                min={0}
                                value={currentPrice}
                                onChange={(val) => setCurrentPrice(val || 0)}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddItem}
                            disabled={!currentItemId}
                        />
                    </div>

                    {selectedItems.length > 0 && (
                        <>
                            <Table
                                dataSource={selectedItems}
                                rowKey={(record, index) => index?.toString() || '0'}
                                pagination={false}
                                size="small"
                                bordered
                                columns={[
                                    { title: 'Item', dataIndex: 'name' },
                                    { title: 'Qty', dataIndex: 'quantity', width: 60 },
                                    {
                                        title: 'Total',
                                        dataIndex: 'total',
                                        width: 100,
                                        render: (val: number) => `$${val.toFixed(2)}`
                                    },
                                    {
                                        title: '',
                                        width: 40,
                                        render: (_: unknown, __: unknown, index: number) => (
                                            <Button
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveItem(index)}
                                            />
                                        )
                                    }
                                ]}
                            />
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                                <div style={{ fontSize: '14px' }}>
                                    Amount Paid:
                                    <InputNumber
                                        min={0}
                                        max={itemsTotal}
                                        defaultValue={0}
                                        style={{ width: '120px', marginLeft: '8px' }}
                                        prefix="$"
                                        placeholder="Amount Paid"
                                        onChange={(val) => {
                                            setSaleAmountPaid(val || 0);
                                        }}
                                    // Wait, cannot bind to state freely inside replacement if I don't initiate it. 
                                    // I need to add state first.
                                    />
                                </div>
                                <div style={{ fontWeight: 600 }}>
                                    Total Value: <span style={{ color: '#1890ff' }}>${itemsTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Balance Field - Initial (New) or Override (Edit) */}
                <Form.Item
                    name={initialValues ? "balance" : "initialBalance"}
                    label={initialValues ? "Outstanding Balance (Override)" : "Initial Balance"}
                    tooltip={initialValues
                        ? "Manually correct the balance if the calculated amount is wrong."
                        : "Use this if the customer has an existing outstanding balance."}
                    extra={initialValues ? "Warning: Editing this overrides the calculated transaction history." : undefined}
                >
                    <InputNumber
                        placeholder="0.00"
                        size="large"
                        style={{ width: '100%', borderRadius: '8px' }}
                        min={0}
                        precision={2}
                        prefix="$"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
