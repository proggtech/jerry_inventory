import React from 'react';
import { Modal, Button, Typography, Divider } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { Transaction, Customer } from '@/types/customer';
import dayjs from 'dayjs';

interface TransactionReceiptProps {
    visible: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    customer: Customer | null;
}

const { Title, Text } = Typography;

const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
    visible,
    onClose,
    transaction,
    customer
}) => {
    if (!transaction || !customer) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose} className="no-print">
                    Close
                </Button>,
                <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint} className="no-print">
                    Print Receipt
                </Button>
            ]}
            width={400}
            centered
            className="receipt-modal"
        >
            <div className="receipt-content" style={{ padding: '20px', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <img
                        src="/images/ideviceCare-logo.png"
                        alt="iDeviceCare"
                        style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
                    />
                </div>
                <Title level={4} style={{ textAlign: 'center', margin: 0 }}>OFFICIAL RECEIPT</Title>

                <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>Date:</Text>
                        <Text>{transaction.createdAt?.toDate ? dayjs(transaction.createdAt.toDate()).format('DD/MM/YYYY HH:mm') : dayjs().format('DD/MM/YYYY HH:mm')}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>Receipt #:</Text>
                        <Text>{transaction.id.slice(0, 8).toUpperCase()}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>Customer:</Text>
                        <Text>{customer.name}</Text>
                    </div>
                </div>

                <Divider style={{ margin: '10px 0' }} dashed />

                <div style={{ marginBottom: '15px' }}>
                    {transaction.items?.map((item, index) => (
                        <div key={index} style={{ marginBottom: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>{item.itemName}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '10px' }}>
                                <Text style={{ fontSize: '12px' }}>{item.quantity} x GH₵{item.price.toFixed(2)}</Text>
                                <Text>GH₵{(item.quantity * item.price).toFixed(2)}</Text>
                            </div>
                        </div>
                    ))}
                    {!transaction.items && transaction.type === 'payment' && (
                        <div>
                            <Text>Payment on Account</Text>
                        </div>
                    )}
                </div>

                <Divider style={{ margin: '10px 0' }} dashed />

                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                    <Text strong>Total:</Text>
                    <Text strong>GH₵{transaction.amount.toFixed(2)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                    <Text>Amount Paid:</Text>
                    <Text>GH₵{transaction.amountPaid.toFixed(2)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                    <Text>Change/Due:</Text>
                    <Text>GH₵{(transaction.amountPaid - transaction.amount).toFixed(2)}</Text>
                </div>

                <Divider style={{ margin: '10px 0' }} dashed />

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Text style={{ fontSize: '12px' }}>Thank you for your patronage!</Text>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body, html {
                        visibility: hidden;
                        height: 100vh !important;
                        overflow: hidden !important;
                    }
                    
                    /* Hide everything by default */
                    body * {
                        visibility: hidden;
                    }

                    /* Unhide the modal root and specific content */
                    :global(.ant-modal-root),
                    :global(.ant-modal-wrap),
                    :global(.ant-modal),
                    :global(.ant-modal-content),
                    :global(.ant-modal-body),
                    .receipt-content,
                    .receipt-content * {
                        visibility: visible !important;
                    }

                    /* Position the modal content at the very top-left of the page */
                    :global(.ant-modal-wrap) {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                        background: white !important;
                        z-index: 99999 !important;
                        /* Force strict dimensions to avoid spillover */
                        max-height: 100vh !important;
                        overflow: hidden !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    :global(.ant-modal) {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        transform: none !important;
                        /* Ensure no extra height */
                        height: auto !important;
                    }
                    
                    /* Force no margins on page itself */
                    @page {
                        margin: 0 !important;
                        size: auto;
                    }

                    :global(.ant-modal-content) {
                        box-shadow: none !important;
                        padding: 0 !important;
                    }

                    .receipt-content {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 5px !important; /* Minimal padding */
                    }

                    /* Ensure paragraphs don't add extra space */
                    .receipt-content p, .receipt-content div {
                         margin-bottom: 2px !important;
                    }
                    
                    :global(.ant-modal-footer), 
                    :global(.ant-modal-close) {
                        display: none !important;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default TransactionReceipt;
