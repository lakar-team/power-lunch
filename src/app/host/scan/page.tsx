'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import FooterNav from '@/components/FooterNav'
import { useTranslation } from '@/lib/i18n/translations'

// Load html5-qrcode from CDN
const HTML5_QRCODE_CDN = 'https://unpkg.com/html5-qrcode'

export default function QRScannerPage() {
    const { t, language } = useTranslation()
    const router = useRouter()
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [manualCode, setManualCode] = useState('')
    const [scannedResult, setScannedResult] = useState<string | null>(null)
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const scannerRef = useRef<any>(null)

    useEffect(() => {
        // Load the scanner script
        const script = document.createElement('script')
        script.src = HTML5_QRCODE_CDN
        script.async = true
        script.onload = () => setIsScriptLoaded(true)
        document.body.appendChild(script)

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear()
            }
            document.body.removeChild(script)
        }
    }, [])

    const startScanner = () => {
        if (!isScriptLoaded) return

        setStatus('scanning')
        const html5QrCode = new (window as any).Html5Qrcode("reader")
        scannerRef.current = html5QrCode

        const config = { fps: 10, qrbox: { width: 250, height: 250 } }

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
                // Successfully scanned
                handleScanSuccess(decodedText)
            },
            (errorMessage: string) => {
                // Ignore frequent errors during scan
            }
        ).catch((err: any) => {
            console.error('Failed to start scanner:', err)
            setStatus('error')
            setMessage(language === 'ja' ? 'カメラの起動に失敗しました' : 'Failed to start camera')
        })
    }

    const handleScanSuccess = async (text: string) => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(console.error)
        }

        setScannedResult(text)
        verifyBooking(text)
    }

    const verifyBooking = async (code: string) => {
        setStatus('verifying')
        setMessage(language === 'ja' ? '検証中...' : 'Verifying...')

        try {
            // We first need to find the booking based on the hash (the scanner text)
            // Strategy: Decoded text is PL-HASH-JP
            // We search for a booking belonging to THIS host with this hash

            // First, find the booking ID
            const resFind = await fetch(`/api/bookings?role=host&status=confirmed`)
            const dataFind = await resFind.json()

            if (!resFind.ok) throw new Error(dataFind.error || 'Failed to fetch bookings')

            const booking = dataFind.bookings?.find((b: any) => `PL-${b.qr_code_hash}-JP` === code)

            if (!booking) {
                setStatus('error')
                setMessage(language === 'ja' ? '予約が見つかりません' : 'Booking not found or already verified')
                return
            }

            // Now call the verify API
            const resVerify = await fetch(`/api/bookings/${booking.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            })
            const dataVerify = await resVerify.json()

            if (resVerify.ok) {
                setStatus('success')
                setMessage(language === 'ja' ? 'チェックイン完了！' : 'Check-in successful!')
            } else {
                setStatus('error')
                setMessage(dataVerify.details || dataVerify.error || 'Verification failed')
            }
        } catch (err: any) {
            setStatus('error')
            setMessage(err.message)
        }
    }

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualCode) return
        verifyBooking(manualCode)
    }

    return (
        <div className="page-container">
            <Header />
            <main className="main-content">
                <div className="scanner-card">
                    <h1>{language === 'ja' ? 'チェックイン' : 'Check-in Scanner'}</h1>

                    {status === 'idle' && (
                        <div className="idle-state">
                            <p>{language === 'ja' ? 'ゲストのQRコードをスキャンして、セッションを開始します。' : 'Scan the guest\'s QR code to start the session.'}</p>
                            <button className="btn-primary" onClick={startScanner} disabled={!isScriptLoaded}>
                                {language === 'ja' ? 'スキャンを開始' : 'Start Scanning'}
                            </button>

                            <div className="manual-divider">
                                <span>{language === 'ja' ? 'または' : 'OR'}</span>
                            </div>

                            <form onSubmit={handleManualSubmit} className="manual-form">
                                <input
                                    type="text"
                                    placeholder="PL-XXXX-JP"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    className="input-code"
                                />
                                <button type="submit" className="btn-secondary">
                                    {language === 'ja' ? '手動入力' : 'Verify Manually'}
                                </button>
                            </form>
                        </div>
                    )}

                    {status === 'scanning' && (
                        <div className="scanning-state">
                            <div id="reader" className="qr-reader"></div>
                            <button className="btn-text" onClick={() => {
                                if (scannerRef.current) scannerRef.current.stop()
                                setStatus('idle')
                            }}>
                                {language === 'ja' ? 'キャンセル' : 'Cancel'}
                            </button>
                        </div>
                    )}

                    {(status === 'verifying' || status === 'success' || status === 'error') && (
                        <div className={`result-state ${status}`}>
                            <div className="result-icon">
                                {status === 'verifying' && <div className="spinner"></div>}
                                {status === 'success' && '✅'}
                                {status === 'error' && '❌'}
                            </div>
                            <p className="result-message">{message}</p>
                            {status !== 'verifying' && (
                                <button className="btn-primary" onClick={() => setStatus('idle')}>
                                    {language === 'ja' ? '戻る' : 'Back'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <FooterNav />

            <style jsx>{`
                .page-container {
                    min-height: 100vh;
                    background: #f3f4f6;
                }
                .main-content {
                    padding: 80px 16px 100px;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .scanner-card {
                    background: white;
                    border-radius: 20px;
                    padding: 32px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    text-align: center;
                }
                h1 {
                    font-size: 1.5rem;
                    margin-bottom: 24px;
                }
                .idle-state p {
                    color: #6b7280;
                    margin-bottom: 32px;
                }
                .btn-primary {
                    width: 100%;
                    padding: 16px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                }
                .manual-divider {
                    margin: 32px 0;
                    position: relative;
                    text-align: center;
                }
                .manual-divider::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: #e5e7eb;
                }
                .manual-divider span {
                    position: relative;
                    background: white;
                    padding: 0 12px;
                    color: #9ca3af;
                    font-size: 0.875rem;
                }
                .manual-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .input-code {
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    text-align: center;
                    font-family: monospace;
                    font-size: 1.125rem;
                }
                .btn-secondary {
                    padding: 12px;
                    background: #f3f4f6;
                    color: #4b5563;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                }
                .qr-reader {
                    width: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 20px;
                }
                .btn-text {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    font-weight: 500;
                }
                .result-state {
                    padding: 24px 0;
                }
                .result-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }
                .result-message {
                    font-size: 1.125rem;
                    font-weight: 500;
                    margin-bottom: 24px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e5e7eb;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .success .result-message { color: #059669; }
                .error .result-message { color: #dc2626; }
            `}</style>
        </div>
    )
}
