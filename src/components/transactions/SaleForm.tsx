import { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, Table, message, Space, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { InventoryItem } from '@/types/inventory';

interface SaleItem {
    key: string;
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
    total: number;
}

interface SaleFormData {
    customerId: string;
    customerName: string;
    items: {
        itemId: string;
        itemName: string;
        quantity: number;
        price: number;
    }[];
    amountPaid: number;
    notes: string;
}

interface SaleFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: SaleFormData) => void;
    customerId: string;
    customerName: string;
    inventoryItems: InventoryItem[];
    loading: boolean;
}

export default function SaleForm({
    visible,
    onCancel,
    onSubmit,
    customerId,
    customerName,
    inventoryItems,
    loading,
}: SaleFormProps) {
    const [form] = Form.useForm();
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(0);

    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);

    useEffect(() => {
        if (selectedItem) {
            const item = inventoryItems.find(i => i.id === selectedItem);
            if (item) {
                setPrice(item.price);
            }
        }
    }, [selectedItem, inventoryItems]);

    const handleAddItem = () => {
        if (!selectedItem || quantity <= 0 || price <= 0) {
            message.warning('Please select an item and enter valid quantity and price');
            return;
        }

        const item = inventoryItems.find(i => i.id === selectedItem);
        if (!item) return;

        // Check if item already exists in the list
        const existingItemIndex = saleItems.findIndex(si => si.itemId === selectedItem);
        if (existingItemIndex >= 0) {
            message.warning('Item already added. Please remove it first to add again.');
            return;
        }

        // Check if quantity is available
        if (quantity > item.quantity) {
            message.error(`Only ${item.quantity} units available in stock`);
            return;
        }

        const newItem: SaleItem = {
            key: Date.now().toString(),
            itemId: selectedItem,
            itemName: item.name,
            quantity,
            price,
            total: quantity * price,
        };

        setSaleItems([...saleItems, newItem]);
        setSelectedItem(null);
        setQuantity(1);
        setPrice(0);
    };

    const handleRemoveItem = (key: string) => {
        setSaleItems(saleItems.filter(item => item.key !== key));
    };

    const handleSubmit = async () => {
        // Check if there are unsaved item selections
        if (selectedItem !== null) {
            message.warning('You have an unsaved item selection. Please click "Add" or clear the selection before recording the sale');
            return;
        }

        if (saleItems.length === 0) {
            message.warning('Please add at least one item');
            return;
        }

        try {
            const values = await form.validateFields();

            const saleData = {
                customerId,
                customerName,
                items: saleItems.map(item => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    quantity: item.quantity,
                    price: item.price,
                })),
                amountPaid: values.amountPaid || 0,
                notes: values.notes || '',
            };

            onSubmit(saleData);
            resetForm();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const resetForm = () => {
        form.resetFields();
        setSaleItems([]);
        setSelectedItem(null);
        setQuantity(1);
        setPrice(0);
    };

    const handleCancel = () => {
        resetForm();
        onCancel();
    };

    const columns = [
        {
            title: 'Item',
            dataIndex: 'itemName',
            key: 'itemName',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `GH₵${price.toFixed(2)}`,
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (total: number) => `GH₵${total.toFixed(2)}`,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: SaleItem) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(record.key)}
                />
            ),
        },
    ];

    const availableItems = inventoryItems.filter(item =>
        item.quantity > 0 && !saleItems.some(si => si.itemId === item.id)
    );

    return (
        <Modal
            title={`Record Sale - ${customerName}`}
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={loading}
            width={800}
            okText="Record Sale"
            centered
        >
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px' }}>Add Items</h4>
                <Space.Compact style={{ width: '100%', marginBottom: '12px' }}>
                    <Select
                        placeholder="Select item"
                        style={{ width: '40%' }}
                        value={selectedItem}
                        onChange={setSelectedItem}
                        showSearch
                        optionFilterProp="children"
                    >
                        {availableItems.map(item => (
                            <Select.Option key={item.id} value={item.id}>
                                {item.name} (Stock: {item.quantity})
                            </Select.Option>
                        ))}
                    </Select>
                    <InputNumber
                        placeholder="Quantity"
                        style={{ width: '20%' }}
                        min={1}
                        value={quantity}
                        onChange={(val) => setQuantity(val || 1)}
                    />
                    <InputNumber
                        placeholder="Price"
                        style={{ width: '25%' }}
                        min={0}
                        precision={2}
                        prefix="GH₵"
                        value={price}
                        onChange={(val) => setPrice(val || 0)}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ width: '15%' }}
                        onClick={handleAddItem}
                    >
                        Add
                    </Button>
                </Space.Compact>

                <Table
                    dataSource={saleItems}
                    columns={columns}
                    pagination={false}
                    size="small"
                    locale={{ emptyText: 'No items added yet' }}
                />

                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    textAlign: 'right',
                    fontSize: '16px',
                    fontWeight: 600
                }}>
                    Total Amount: <span style={{ color: '#1890ff' }}>GH₵{totalAmount.toFixed(2)}</span>
                </div>
            </div>

            <Form form={form} layout="vertical">
                <Form.Item
                    name="amountPaid"
                    label="Amount Paid"
                    rules={[
                        {
                            validator: (_, value) => {
                                if (value > totalAmount) {
                                    return Promise.reject('Amount paid cannot exceed total amount');
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <InputNumber
                        placeholder="0.00"
                        size="large"
                        style={{ width: '100%', borderRadius: '8px' }}
                        min={0}
                        max={totalAmount}
                        precision={2}
                        prefix="GH₵"
                    />
                </Form.Item>

                <Form.Item name="notes" label="Notes">
                    <Input.TextArea
                        rows={2}
                        placeholder="Additional notes"
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
