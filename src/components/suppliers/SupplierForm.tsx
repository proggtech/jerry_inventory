'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, message, Button, Select } from 'antd';
import { CloudUploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { Supplier } from '@/types/supplier';
import { InventoryItem } from '@/types/inventory';
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import type { UploadFile } from 'antd';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

interface SupplierFormData {
    name: string;
    contactPerson?: string;
    email?: string;
    phone: string;
    address?: string;
    notes?: string;
    categories?: string[];
    itemsSupplied?: string[];
}

interface SupplierFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: SupplierFormData, image?: File) => Promise<boolean>;
    initialValues?: Partial<Supplier>;
    inventoryItems: InventoryItem[];
    loading: boolean;
}

export default function SupplierForm({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    inventoryItems,
    loading,
}: SupplierFormProps) {
    const [form] = Form.useForm();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(initialValues?.imageUrl || null);

    // Reset form when modal opens or initialValues change
    useEffect(() => {
        if (visible) {
            if (initialValues) {
                form.setFieldsValue(initialValues);
                setPreviewImage(initialValues.imageUrl || null);
            } else {
                form.resetFields();
                setPreviewImage(null);
                setImageFile(null);
                setFileList([]);
            }
        }
    }, [visible, initialValues, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const success = await onSubmit(values, imageFile || undefined);
            if (success) {
                resetForm();
            }
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
        if (!initialValues) {
            resetForm();
        }
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
            title={initialValues ? 'Edit Supplier' : 'Add New Supplier'}
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
                    label="Supplier Name"
                    rules={[{ required: true, message: 'Please enter supplier name' }]}
                >
                    <Input placeholder="Enter supplier name" size="large" style={{ borderRadius: '8px' }} allowClear />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                        name="contactPerson"
                        label="Contact Person"
                        rules={[{ required: true, message: 'Please enter contact person name' }]}
                    >
                        <Input placeholder="Contact name" size="large" style={{ borderRadius: '8px' }} allowClear />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Phone"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                    >
                        <Input placeholder="Phone number" size="large" style={{ borderRadius: '8px' }} allowClear />
                    </Form.Item>
                </div>

                <Form.Item
                    name="categories"
                    label="Product Categories Supplied"
                    rules={[{ required: false }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select categories"
                        size="large"
                        style={{ borderRadius: '8px' }}
                        options={PRODUCT_CATEGORIES}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    name="itemsSupplied"
                    label="Specific Items Supplied"
                    rules={[{ required: false }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select specific items"
                        size="large"
                        style={{ borderRadius: '8px' }}
                        optionFilterProp="children"
                        allowClear
                    >
                        {inventoryItems.map(item => (
                            <Option key={item.id} value={item.name}>{item.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, message: 'Please enter email address' }, { type: 'email', message: 'Please enter a valid email' }]}
                >
                    <Input placeholder="Email address" size="large" style={{ borderRadius: '8px' }} allowClear />
                </Form.Item>

                <Form.Item
                    name="address"
                    label="Address"
                    rules={[{ required: true, message: 'Please enter address' }]}
                >
                    <TextArea
                        rows={2}
                        placeholder="Enter address"
                        style={{ borderRadius: '8px' }}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="Notes"
                    rules={[{ required: true, message: 'Please enter notes' }]}
                >
                    <TextArea
                        rows={3}
                        placeholder="Additional notes"
                        style={{ borderRadius: '8px' }}
                        allowClear
                    />
                </Form.Item>

                <Form.Item label="Supplier Logo/Image">
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
