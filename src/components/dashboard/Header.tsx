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
}

export default function Header({ collapsed, setCollapsed }: HeaderProps) {


    return (
        <AntHeader
            style={{
                padding: '0 24px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                position: 'sticky',
                top: 0,
                zIndex: 99,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                    placeholder="Search inventory..."
                    prefix={<SearchOutlined />}
                    style={{
                        width: '300px',
                        borderRadius: '8px',
                    }}
                    size="large"
                />
            </div>

            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Badge count={3} offset={[-5, 5]}>
                    <Button
                        type="text"
                        icon={<BellOutlined style={{ fontSize: '20px' }} />}
                        style={{
                            width: 40,
                            height: 40,
                        }}
                    />
                </Badge>
            </div> */}
        </AntHeader>
    );
}
