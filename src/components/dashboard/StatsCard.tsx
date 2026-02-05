'use client';

import { Card, Statistic } from 'antd';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

interface StatsCardProps {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    icon: React.ReactNode;
    color: string;
    index: number;
}

export default function StatsCard({ title, value, prefix, suffix, icon, color, index }: StatsCardProps) {
    const formatter = (value: number | string) => <CountUp end={Number(value)} separator="," />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
            <Card
                variant="borderless"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                        transform: 'translate(30%, -30%)',
                    }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                        }}
                    >
                        <span style={{ color: '#8c8c8c', fontSize: '14px' }}>{title}</span>
                        <div
                            style={{
                                fontSize: '32px',
                                color: color,
                            }}
                        >
                            {icon}
                        </div>
                    </div>

                    <Statistic
                        value={value}
                        prefix={prefix}
                        suffix={suffix}
                        formatter={formatter}
                        styles={{
                            content: {
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: '#262626',
                            }
                        }}
                    />
                </div>
            </Card>
        </motion.div>
    );
}
