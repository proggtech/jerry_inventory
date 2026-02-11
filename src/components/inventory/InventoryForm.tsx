'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, message, Button } from 'antd';
import { DeleteOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { InventoryItem } from '@/types/inventory';
import type { UploadFile } from 'antd';
import { PRODUCT_CATEGORIES } from '@/constants/categories';

const { TextArea } = Input;
const { Dragger } = Upload;

interface InventoryFormData {
    name: string;
    category: string;
    quantity: number;
    price: number;
    description?: string;
    lowStockThreshold: number;
}

interface InventoryFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: InventoryFormData, image?: File) => Promise<void>;
    initialValues?: Partial<InventoryItem>;
    loading: boolean;
}

export default function InventoryForm({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    loading,
}: InventoryFormProps) {
    const [form] = Form.useForm();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(initialValues?.imageUrl || null);

    // Reset/Update form when visible or initialValues change
    useEffect(() => {
        if (visible) {
            if (initialValues) {
                form.setFieldsValue(initialValues);
                setPreviewImage(initialValues.imageUrl || null);
            } else {
                form.resetFields();
                setImageFile(null);
                setFileList([]);
                setPreviewImage(null);
            }
        }
    }, [visible, initialValues, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await onSubmit(values, imageFile || undefined);
            // Only reset after successful submission
            resetForm();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const resetForm = () => {
        form.resetFields();
        setImageFile(null);
        setFileList([]);
        setPreviewImage(null);
    };

    const handleCancel = () => {
        resetForm();
        onCancel();
    };

    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }
        setImageFile(file);
        setPreviewImage(URL.createObjectURL(file));
        return false; // Prevent auto upload
    };

    return (
        <Modal
            title={initialValues ? 'Edit Item' : 'Add New Item'}
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={loading}
            width={600}
            okText={initialValues ? 'Update' : 'Add'}
            centered
            className="inventory-modal"
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
            >
                <Form.Item
                    name="name"
                    label="Item Name"
                    rules={[{ required: true, message: 'Please enter item name' }]}
                >
                    <Input placeholder="Enter item name" size="large" style={{ borderRadius: '8px' }} allowClear />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select placeholder="Select category" size="large" options={PRODUCT_CATEGORIES} style={{ borderRadius: '8px' }} allowClear />
                    </Form.Item>

                    <Form.Item
                        name="quantity"
                        label="Quantity"
                        rules={[{ required: true, message: 'Please enter quantity' }]}
                    >
                        <InputNumber
                            min={0}
                            placeholder="0"
                            size="large"
                            style={{ width: '100%', borderRadius: '8px' }}
                        />
                    </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                        name="price"
                        label="Price (GH₵)"
                        rules={[{ required: true, message: 'Please enter price' }]}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            size="large"
                            style={{ width: '100%', borderRadius: '8px' }}
                            prefix="GH₵"
                        />
                    </Form.Item>

                    <Form.Item
                        name="lowStockThreshold"
                        label="Low Stock Threshold"
                        rules={[{ required: true, message: 'Please enter low stock threshold' }]}
                    >
                        <InputNumber
                            min={0}
                            placeholder="Alert level"
                            size="large"
                            style={{ width: '100%', borderRadius: '8px' }}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter item description' }]}
                >
                    <TextArea
                        rows={3}
                        placeholder="Enter item description"
                        style={{ borderRadius: '8px' }}
                        allowClear
                    />
                </Form.Item>

                <Form.Item label="Item Image">
                    {!previewImage ? (
                        <Dragger
                            fileList={fileList}
                            beforeUpload={beforeUpload}
                            showUploadList={false}
                            style={{ padding: '20px', background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: '8px' }}
                        >
                            <p className="ant-upload-drag-icon">
                                <CloudUploadOutlined style={{ color: '#667eea', fontSize: '32px' }} />
                            </p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                            <p className="ant-upload-hint">Support for a single image upload (Max 2MB)</p>
                        </Dragger>
                    ) : (
                        <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewImage}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            <Button
                                shape="circle"
                                icon={<DeleteOutlined />}
                                danger
                                style={{ position: 'absolute', top: '10px', right: '10px' }}
                                onClick={() => {
                                    setPreviewImage(null);
                                    setImageFile(null);
                                    setFileList([]);
                                }}
                            />
                        </div>
                    )}
                </Form.Item>
            </Form>
        </Modal>
    );
}
