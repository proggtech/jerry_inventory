'use client';

import { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const { Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <ProtectedRoute>
            <Layout style={{ minHeight: '100vh' }}>
                <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
                <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
                    <Header collapsed={collapsed} setCollapsed={setCollapsed} />
                    <Content
                        style={{
                            margin: '24px',
                            padding: '24px',
                            background: '#f5f5f5',
                            borderRadius: '12px',
                            minHeight: 'calc(100vh - 112px)',
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </ProtectedRoute>
    );
}
