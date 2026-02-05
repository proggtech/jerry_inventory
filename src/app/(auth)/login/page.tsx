'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { signIn } from '@/lib/firebase/auth';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
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
        </motion.div>
    );
}
