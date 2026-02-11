'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Modal } from 'antd';
import { signIn, resetPassword } from '@/lib/firebase/auth';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const router = useRouter();

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true);
        const { error } = await signIn(values.email, values.password);

        if (error) {
            message.error(error);
            setLoading(false);
        } else {
            message.success('Login successful!');
            router.push('/');
        }
    };

    const onResetPassword = async (values: { email: string }) => {
        setResetLoading(true);
        const { error } = await resetPassword(values.email);

        if (error) {
            message.error(error);
        } else {
            message.success('Password reset link sent! Check your email.');
            setResetModalVisible(false);
        }
        setResetLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <img
                        src="/images/ideviceCare-logo.png"
                        alt="iDeviceCare"
                        style={{ maxHeight: '60px', objectFit: 'contain' }}
                    />
                </div>
                <Title level={2} style={{ marginBottom: '8px' }}>Welcome Back</Title>
                <Text type="secondary">Sign in to your inventory account</Text>
            </div>

            <Form
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                    ]}
                >
                    <Input
                        prefix={<MailOutlined className="site-form-item-icon" />}
                        placeholder="Email"
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password' }]}
                >
                    <Input.Password
                        prefix={<LockOutlined className="site-form-item-icon" />}
                        placeholder="Password"
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>

                <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                    <a
                        onClick={(e) => {
                            e.preventDefault();
                            setResetModalVisible(true);
                        }}
                        style={{ color: '#667eea', cursor: 'pointer' }}
                    >
                        Forgot Password?
                    </a>
                </div>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        style={{
                            height: '50px',
                            fontSize: '16px',
                            fontWeight: '600',
                            borderRadius: '8px',
                            marginTop: '10px'
                        }}
                    >
                        Sign In
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text>
                        Don&apos;t have an account?{' '}
                        <Link href="/register" style={{ fontWeight: '600', color: '#667eea' }}>
                            Register now
                        </Link>
                    </Text>
                </div>
            </Form>

            <Modal
                title="Reset Password"
                open={resetModalVisible}
                onCancel={() => setResetModalVisible(false)}
                footer={null}
            >
                <div style={{ marginBottom: '20px' }}>
                    <Text>Enter your email address and we&apos;ll send you a link to reset your password.</Text>
                </div>
                <Form
                    onFinish={onResetPassword}
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Email"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={resetLoading} block>
                            Send Reset Link
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </motion.div>
    );
}
