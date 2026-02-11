'use client';

import { Layout, Menu, Avatar, Dropdown, Typography, Drawer } from 'antd';
import {
    DashboardOutlined,
    AppstoreOutlined,
    BarChartOutlined,
    LogoutOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import Link from 'next/link';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobile?: boolean;
}

const SidebarContent = ({
    collapsed,
    user,
    handleLogout,
    pathname,
    menuItems,
    userMenuItems,
    mobile
}: any) => {
    return (
        <>
            <div
                style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <motion.div
                    initial={false}
                    animate={{
                        scale: collapsed && !mobile ? 0.8 : 1,
                        opacity: 1
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <img
                        src="/images/ideviceCare-logo.png"
                        alt="iDeviceCare"
                        style={{
                            maxHeight: '40px',
                            maxWidth: collapsed && !mobile ? '40px' : '160px',
                            objectFit: 'contain',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                        }}
                    />
                </motion.div>
            </div>

            <Menu
                mode="inline"
                selectedKeys={[pathname]}
                items={menuItems}
                style={{
                    background: 'transparent',
                    border: 'none',
                    marginTop: '16px',
                }}
                theme="dark"
            />

            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    padding: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'background 0.3s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <Avatar icon={<UserOutlined />} style={{ flexShrink: 0 }} />
                        {(!collapsed || mobile) && (
                            <div style={{ marginLeft: '12px', overflow: 'hidden' }}>
                                <Text strong style={{ color: '#fff', display: 'block', fontSize: '14px' }}>
                                    {user?.displayName || 'User'}
                                </Text>
                                <Text
                                    type="secondary"
                                    style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: '12px',
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {user?.email}
                                </Text>
                            </div>
                        )}
                    </div>
                </Dropdown>
            </div>
        </>
    );
}

export default function Sidebar({ collapsed, setCollapsed, mobile }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: <Link href="/">Dashboard</Link>,
        },
        {
            key: '/inventory',
            icon: <AppstoreOutlined />,
            label: <Link href="/inventory">Inventory</Link>,
        },
        {
            key: '/suppliers',
            icon: <UserOutlined />,
            label: <Link href="/suppliers">Suppliers</Link>,
        },
        {
            key: '/customers',
            icon: <UserOutlined />,
            label: <Link href="/customers">Customers</Link>,
        },
        {
            key: '/analytics',
            icon: <BarChartOutlined />,
            label: <Link href="/analytics">Analytics</Link>,
        },
    ];

    const userMenuItems = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
        },
    ];

    const sidebarContentProps = {
        collapsed,
        user,
        handleLogout,
        pathname,
        menuItems,
        userMenuItems,
        mobile
    };

    if (mobile) {
        return (
            <Drawer
                placement="left"
                onClose={() => setCollapsed(true)}
                open={!collapsed}
                width={250}
                styles={{
                    body: {
                        padding: 0,
                        background: 'linear-gradient(180deg, #1e1e2e 0%, #27293d 100%)',
                        overflow: 'hidden'
                    }
                }}
                closable={false}
            >
                <div style={{ height: '100%', position: 'relative' }}>
                    <SidebarContent {...sidebarContentProps} />
                </div>
            </Drawer>
        );
    }

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            onBreakpoint={(broken) => {
                // If not mobile prop handled, keep this behavior?
                // Actually layout manages this mainly now
            }}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, #1e1e2e 0%, #27293d 100%)',
                zIndex: 100,
            }}
            width={240}
            collapsedWidth={80}
        >
            <SidebarContent {...sidebarContentProps} />
        </Sider>
    );
}
