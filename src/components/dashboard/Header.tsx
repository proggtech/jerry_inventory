'use client';

import { Layout, Button, Input } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SearchOutlined,
} from '@ant-design/icons';


const { Header: AntHeader } = Layout;

interface HeaderProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobile?: boolean;
}

export default function Header({ collapsed, setCollapsed, mobile }: HeaderProps) {
    return (
        <AntHeader
            style={{
                padding: mobile ? '0 16px' : '0 24px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                position: 'sticky',
                top: 0,
                zIndex: 99,
                width: '100%'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        fontSize: '18px',
                        width: 40,
                        height: 40,
                    }}
                />

                <Input
                    placeholder="Search..."
                    prefix={<SearchOutlined />}
                    style={{
                        width: mobile ? '100%' : '300px',
                        maxWidth: '400px',
                        borderRadius: '8px',
                    }}
                    size="large"
                />
            </div>
        </AntHeader>
    );
}
