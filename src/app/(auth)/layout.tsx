'use client';

import { Layout, Typography } from 'antd';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
                {/* Left Side - Brand/Image */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '40px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    className="auth-brand-side"
                >
                    {/* Decorative Circles */}
                    <div style={{
                        position: 'absolute',
                        top: '-10%',
                        left: '-10%',
                        width: '40%',
                        height: '40%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-10%',
                        right: '-10%',
                        width: '50%',
                        height: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%',
                    }} />

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <img
                            src="/images/ideviceCare-logo.png"
                            alt="iDeviceCare"
                            style={{
                                maxWidth: '300px',
                                marginBottom: '20px',
                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                padding: '20px',
                                borderRadius: '16px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.2rem', marginTop: '10px', display: 'block' }}>
                            Manage your stock with elegance and efficiency.
                        </Text>
                    </motion.div>
                </motion.div>

                {/* Right Side - Form */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#fff',
                    padding: '40px',
                }}>
                    <div style={{ width: '100%', maxWidth: '450px' }}>
                        {children}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media (max-width: 768px) {
          .auth-brand-side {
            display: none !important;
          }
        }
      `}</style>
        </Layout>
    );
}
