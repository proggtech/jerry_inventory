'use client';

import { useState, useEffect } from 'react';
import { Layout, Grid } from 'antd';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const screens = useBreakpoint();
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
        // If screen isxs (mobile), set mobile state
        // useBreakpoint might return empty object initially during SSR/mount?
        // Let's rely on standard breakpoint logic
        const isMobile = !screens.md; // md is 768px. If less than md, it's mobile/tablet portrait
        setMobile(isMobile);
        if (isMobile) {
            setCollapsed(true); // Default to collapsed/closed on mobile
        } else {
            setCollapsed(false); // Default to expanded on desktop (optional)
        }
    }, [screens]);

    // Handle margin calculation
    const marginLeft = mobile ? 0 : (collapsed ? 80 : 240);

    return (
        <ProtectedRoute>
            <Layout style={{ minHeight: '100vh' }}>
                <Sidebar
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    mobile={mobile}
                />
                <Layout style={{
                    marginLeft,
                    transition: 'margin-left 0.2s',
                    width: '100%'
                }}>
                    <Header collapsed={collapsed} setCollapsed={setCollapsed} mobile={mobile} />
                    <Content
                        style={{
                            margin: '24px',
                            padding: mobile ? '16px' : '24px', // Reduced padding on mobile
                            background: '#f5f5f5',
                            borderRadius: '12px',
                            minHeight: 'calc(100vh - 112px)',
                            overflow: 'initial' // Ensure sticky headers work if any, or just scroll behavior
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </ProtectedRoute>
    );
}
