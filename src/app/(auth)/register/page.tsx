'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { signUp } from '@/lib/firebase/auth';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onFinish = async (values: { name: string; email: string; password: string }) => {
        setLoading(true);
        const { error } = await signUp(values.email, values.password, values.name);

        if (error) {
            message.error(error);
            setLoading(false);
        } else {
            message.success('Account created successfully!');
            router.push('/');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <Title level={2} style={{ marginBottom: '8px' }}>Create Account</Title>
                <Text type="secondary">Start managing your inventory today</Text>
            </div>

            <Form
                name="register"
                onFinish={onFinish}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="name"
                    rules={[{ required: true, message: 'Please enter your name' }]}
                >
                    <Input
                        prefix={<UserOutlined className="site-form-item-icon" />}
                        placeholder="Full Name"
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>

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
                    rules={[
                        { required: true, message: 'Please enter your password' },
                        { min: 6, message: 'Password must be at least 6 characters' },
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined className="site-form-item-icon" />}
                        placeholder="Password"
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                        { required: true, message: 'Please confirm your password' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Passwords do not match'));
                            },
                        }),
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined className="site-form-item-icon" />}
                        placeholder="Confirm Password"
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>

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
                        Create Account
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text>
                        Already have an account?{' '}
                        <Link href="/login" style={{ fontWeight: '600', color: '#667eea' }}>
                            Sign in
                        </Link>
                    </Text>
                </div>
            </Form>
        </motion.div>
    );
}
