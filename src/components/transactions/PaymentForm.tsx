'use client';

import { Modal, Form, InputNumber, Input, Select } from 'antd';

const { Option } = Select;

const { TextArea } = Input;

interface PaymentFormData {
    amount: number;
    paymentMethod?: string;
    notes?: string;
}

interface PaymentFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: PaymentFormData) => void;
    customerName: string;
    currentBalance: number;
    loading: boolean;
}

export default function PaymentForm({
    visible,
    onCancel,
    onSubmit,
    customerName,
    currentBalance,
    loading,
}: PaymentFormProps) {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values);
            form.resetFields();
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
            title="Record Payment"
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={loading}
            width={500}
            okText="Record Payment"
            centered
        >
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Customer: <strong>{customerName}</strong></div>
                <div style={{ fontSize: '16px', color: currentBalance > 0 ? '#ff4d4f' : '#52c41a' }}>
                    Current Balance: <strong>GH₵{currentBalance.toFixed(2)}</strong>
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="amount"
                    label="Payment Amount"
                    rules={[
                        { required: true, message: 'Please enter payment amount' },
                        {
                            validator: (_, value) => {
                                if (value > currentBalance) {
                                    return Promise.reject('Payment cannot exceed outstanding balance');
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
                        max={currentBalance}
                        precision={2}
                        prefix="GH₵"
                    />
                </Form.Item>

                <Form.Item
                    name="paymentMethod"
                    label="Payment Method"
                >
                    <Select placeholder="Select Payment Method" size="large" style={{ borderRadius: '8px' }}>
                        <Option value="Cash">Cash</Option>
                        <Option value="Mobile Money">Mobile Money</Option>
                        <Option value="Bank Transfer">Bank Transfer</Option>
                        <Option value="Cheque">Cheque</Option>
                        <Option value="Credit Card">Credit Card</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="Notes"
                >
                    <TextArea
                        rows={3}
                        placeholder="Additional notes"
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
