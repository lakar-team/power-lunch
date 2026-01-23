'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import FooterNav from '@/components/FooterNav'
import CheckoutForm from '@/components/CheckoutForm'
import { useTranslation } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'

interface Message {
    id: string
    sender_id: string
    message_text: string
    created_at: string
    sender?: {
        full_name: string
    }
}

interface Booking {
    id: string
    status: string
    booking_date: string
    start_time: string
    end_time: string
    venue_selected: string
    guest_note: string | null
    qr_code_hash: string
    stripe_payment_intent_id: string | null
    listing: {
        id: string
        title: string
        price_yen: number
    }
    host?: {
        profile: {
            full_name: string
            avatar_url: string
        }
    }
    guest?: {
        full_name: string
        avatar_url: string
    }
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
    const { t, language } = useTranslation()
    const router = useRouter()
    const [booking, setBooking] = useState<Booking | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<'guest' | 'host' | null>(null)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [isAccepting, setIsAccepting] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    // Review state
    const [hasReviewed, setHasReviewed] = useState(false)
    const [existingReview, setExistingReview] = useState<{ rating: number; comment: string } | null>(null)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewComment, setReviewComment] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)
    const [reviewMessage, setReviewMessage] = useState<string | null>(null)

    // Chat state
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isSendingMessage, setIsSendingMessage] = useState(false)
    const [isChatDay, setIsChatDay] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchBooking()
    }, [params.id])

    // Check review status when booking is loaded and completed
    useEffect(() => {
        async function checkReview() {
            if (!booking || booking.status !== 'completed') return
            try {
                const res = await fetch(`/api/reviews/${booking.id}`)
                const data = await res.json()
                setHasReviewed(data.hasReviewed)
                if (data.review) {
                    setExistingReview(data.review)
                }
            } catch (err) {
                console.error('Failed to check review status:', err)
            }
        }
        checkReview()
    }, [booking?.id, booking?.status])

    // Chat: Check if today is booking day, fetch messages, subscribe to realtime
    useEffect(() => {
        if (!booking || booking.status !== 'confirmed') return

        // Check if it's the day of the booking
        const today = new Date().toISOString().split('T')[0]
        const isToday = booking.booking_date === today
        setIsChatDay(isToday)

        if (!isToday) return

        // Get current user
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data?.user?.id || null)
        })

        // Fetch existing messages
        async function fetchMessages() {
            const res = await fetch(`/api/messages?booking_id=${booking!.id}`)
            const data = await res.json()
            if (data.messages) {
                setMessages(data.messages)
            }
        }
        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`messages:${booking.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `booking_id=eq.${booking.id}`
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages(prev => [...prev, newMsg])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [booking?.id, booking?.status, booking?.booking_date])

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !booking || isSendingMessage) return

        setIsSendingMessage(true)
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: booking.id,
                    message_text: newMessage.trim()
                })
            })
            if (res.ok) {
                setNewMessage('')
            }
        } catch (err) {
            console.error('Failed to send message:', err)
        } finally {
            setIsSendingMessage(false)
        }
    }

    const fetchBooking = async () => {
        try {
            // Try as guest first
            let res = await fetch(`/api/bookings?role=guest`)
            let data = await res.json()
            let found = data.bookings?.find((b: Booking) => b.id === params.id)

            if (found) {
                setBooking(found)
                setUserRole('guest')
            } else {
                // Try as host
                res = await fetch(`/api/bookings?role=host`)
                data = await res.json()
                found = data.bookings?.find((b: Booking) => b.id === params.id)

                if (found) {
                    setBooking(found)
                    setUserRole('host')
                } else {
                    setError('Booking not found')
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async () => {
        if (!booking) return
        setIsAccepting(true)

        try {
            const res = await fetch(`/api/bookings/${booking.id}/accept`, {
                method: 'POST',
            })
            const data = await res.json()

            if (res.ok) {
                // Refresh booking data
                await fetchBooking()
            } else {
                setError(data.error || 'Failed to accept booking')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsAccepting(false)
        }
    }

    const handleCancel = async () => {
        if (!booking) return
        if (!confirm('Are you sure you want to cancel this booking?')) return

        setIsCancelling(true)

        try {
            const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'User requested cancellation' }),
            })
            const data = await res.json()

            if (res.ok) {
                router.push('/bookings')
            } else {
                setError(data.error || 'Failed to cancel booking')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsCancelling(false)
        }
    }

    const handlePaymentSuccess = () => {
        // Refresh booking to show confirmed status
        fetchBooking()
    }

    const handleSubmitReview = async () => {
        if (!booking) return
        setIsSubmittingReview(true)
        setReviewMessage(null)

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: booking.id,
                    rating: reviewRating,
                    comment: reviewComment,
                }),
            })
            const data = await res.json()

            if (res.ok) {
                setHasReviewed(true)
                setExistingReview({ rating: reviewRating, comment: reviewComment })
                setReviewMessage(language === 'ja' ? 'レビューを投稿しました！' : 'Review submitted!')
            } else {
                setReviewMessage(data.error || 'Failed to submit review')
            }
        } catch (err: any) {
            setReviewMessage(err.message)
        } finally {
            setIsSubmittingReview(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: '#f59e0b',
            pending_payment: '#3b82f6',
            confirmed: '#10b981',
            completed: '#6366f1',
            cancelled: '#ef4444',
        }
        const statusLabels: Record<string, string> = {
            pending: language === 'ja' ? '承認待ち' : 'Pending Approval',
            pending_payment: language === 'ja' ? '支払い待ち' : 'Awaiting Payment',
            confirmed: language === 'ja' ? '確定' : 'Confirmed',
            completed: language === 'ja' ? '完了' : 'Completed',
            cancelled: language === 'ja' ? 'キャンセル' : 'Cancelled',
        }

        return (
            <span
                className="status-badge"
                style={{ background: statusColors[status] || '#6b7280' }}
            >
                {statusLabels[status] || status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="page-container">
                <Header />
                <main className="main-content">
                    <div className="loading">Loading...</div>
                </main>
                <FooterNav />
            </div>
        )
    }

    if (error || !booking) {
        return (
            <div className="page-container">
                <Header />
                <main className="main-content">
                    <div className="error-message">{error || 'Booking not found'}</div>
                </main>
                <FooterNav />
            </div>
        )
    }

    return (
        <div className="page-container">
            <Header />
            <main className="main-content">
                <div className="booking-detail">
                    <div className="booking-header">
                        <h1>{booking.listing.title}</h1>
                        {getStatusBadge(booking.status)}
                    </div>

                    <div className="booking-info">
                        <div className="info-row">
                            <span className="label">📅 {language === 'ja' ? '日付' : 'Date'}</span>
                            <span className="value">{booking.booking_date}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">⏰ {language === 'ja' ? '時間' : 'Time'}</span>
                            <span className="value">{booking.start_time} - {booking.end_time}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">📍 {language === 'ja' ? '場所' : 'Venue'}</span>
                            <span className="value">{booking.venue_selected}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">💴 {language === 'ja' ? '料金' : 'Price'}</span>
                            <span className="value price">¥{booking.listing.price_yen.toLocaleString()}</span>
                        </div>
                        {booking.guest_note && (
                            <div className="info-row">
                                <span className="label">📝 {language === 'ja' ? 'メモ' : 'Note'}</span>
                                <span className="value">{booking.guest_note}</span>
                            </div>
                        )}
                    </div>

                    {/* Host Actions: Accept pending booking */}
                    {userRole === 'host' && booking.status === 'pending' && (
                        <div className="action-section">
                            <button
                                className="btn-accept"
                                onClick={handleAccept}
                                disabled={isAccepting}
                            >
                                {isAccepting ? 'Processing...' : (language === 'ja' ? '予約を承認' : 'Accept Booking')}
                            </button>
                            <button
                                className="btn-cancel"
                                onClick={handleCancel}
                                disabled={isCancelling}
                            >
                                {language === 'ja' ? '拒否' : 'Decline'}
                            </button>
                        </div>
                    )}

                    {/* Guest Actions: Pay for accepted booking */}
                    {userRole === 'guest' && booking.status === 'pending_payment' && booking.stripe_payment_intent_id && (
                        <div className="payment-section">
                            <h2>{language === 'ja' ? '支払いを完了する' : 'Complete Payment'}</h2>
                            <CheckoutForm
                                clientSecret={booking.stripe_payment_intent_id + '_secret'} // This needs the actual client_secret
                                bookingId={booking.id}
                                amountYen={booking.listing.price_yen}
                                onSuccess={handlePaymentSuccess}
                            />
                        </div>
                    )}

                    {/* QR Code for confirmed bookings */}
                    {booking.status === 'confirmed' && (
                        <div className="qr-section">
                            <h2>{language === 'ja' ? 'チェックインコード' : 'Check-in Code'}</h2>
                            <div className="qr-code">
                                PL-{booking.qr_code_hash}-JP
                            </div>
                            <p className="qr-note">
                                {language === 'ja'
                                    ? 'セッション開始時にホストにこのコードを見せてください'
                                    : 'Show this code to your host at the start of your session'}
                            </p>
                        </div>
                    )}

                    {/* Chat Section - only on booking day for confirmed bookings */}
                    {booking.status === 'confirmed' && isChatDay && (
                        <div className="chat-section">
                            <h2>{language === 'ja' ? 'チャット' : 'Chat'}</h2>
                            <div className="chat-messages">
                                {messages.length === 0 ? (
                                    <p className="no-messages">
                                        {language === 'ja'
                                            ? '待ち合わせ場所などを相談しましょう'
                                            : 'Coordinate your meeting point here'}
                                    </p>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`message ${msg.sender_id === currentUserId ? 'own' : 'other'}`}
                                        >
                                            <div className="message-content">
                                                <span className="sender-name">
                                                    {msg.sender?.full_name || (msg.sender_id === currentUserId ? 'You' : 'Other')}
                                                </span>
                                                <p>{msg.message_text}</p>
                                                <span className="message-time">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="chat-input">
                                <input
                                    type="text"
                                    placeholder={language === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSendingMessage || !newMessage.trim()}
                                >
                                    {language === 'ja' ? '送信' : 'Send'}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* Cancel button for cancellable statuses */}
                    {['pending', 'pending_payment', 'confirmed'].includes(booking.status) && (
                        <div className="cancel-section">
                            <button
                                className="btn-cancel-booking"
                                onClick={handleCancel}
                                disabled={isCancelling}
                            >
                                {isCancelling ? 'Cancelling...' : (language === 'ja' ? '予約をキャンセル' : 'Cancel Booking')}
                            </button>
                        </div>
                    )}

                    {/* Review Section for completed bookings */}
                    {booking.status === 'completed' && (
                        <div className="review-section">
                            <h2>{language === 'ja' ? 'レビュー' : 'Leave a Review'}</h2>

                            {hasReviewed && existingReview ? (
                                <div className="existing-review">
                                    <div className="stars">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={star <= existingReview.rating ? 'filled' : ''}>★</span>
                                        ))}
                                    </div>
                                    {existingReview.comment && (
                                        <p className="review-comment">"{existingReview.comment}"</p>
                                    )}
                                    <p className="review-thanks">{language === 'ja' ? 'レビューありがとうございました！' : 'Thanks for your review!'}</p>
                                </div>
                            ) : (
                                <div className="review-form">
                                    <div className="star-picker">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${star <= reviewRating ? 'filled' : ''}`}
                                                onClick={() => setReviewRating(star)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder={language === 'ja' ? 'コメント（任意）' : 'Add a comment (optional)'}
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        rows={3}
                                        className="review-textarea"
                                    />
                                    <button
                                        className="btn-submit-review"
                                        onClick={handleSubmitReview}
                                        disabled={isSubmittingReview}
                                    >
                                        {isSubmittingReview ? 'Submitting...' : (language === 'ja' ? 'レビューを投稿' : 'Submit Review')}
                                    </button>
                                    {reviewMessage && (
                                        <p className="review-message">{reviewMessage}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <FooterNav />

            <style jsx>{`
                .page-container {
                    min-height: 100vh;
                    background: #f5f5f5;
                }

                .main-content {
                    padding: 80px 16px 100px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .booking-detail {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                }

                .booking-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    gap: 16px;
                }

                .booking-header h1 {
                    font-size: 1.5rem;
                    margin: 0;
                    flex: 1;
                }

                .status-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .booking-info {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 8px;
                }

                .label {
                    color: #6b7280;
                }

                .value {
                    font-weight: 500;
                }

                .value.price {
                    color: #2563eb;
                    font-size: 1.125rem;
                }

                .action-section {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .btn-accept {
                    flex: 2;
                    padding: 16px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 16px;
                    background: #f3f4f6;
                    color: #6b7280;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .payment-section {
                    margin: 24px 0;
                }

                .payment-section h2 {
                    text-align: center;
                    margin-bottom: 16px;
                }

                .qr-section {
                    text-align: center;
                    padding: 24px;
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border-radius: 12px;
                    margin: 24px 0;
                }

                .qr-section h2 {
                    margin: 0 0 16px 0;
                    color: #166534;
                }

                .qr-code {
                    font-family: monospace;
                    font-size: 1.5rem;
                    font-weight: 700;
                    padding: 16px;
                    background: white;
                    border-radius: 8px;
                    border: 2px dashed #10b981;
                    margin-bottom: 12px;
                }

                .qr-note {
                    color: #166534;
                    font-size: 0.875rem;
                    margin: 0;
                }

                .cancel-section {
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                }

                .btn-cancel-booking {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    color: #ef4444;
                    border: 1px solid #ef4444;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .btn-cancel-booking:hover {
                    background: #fef2f2;
                }

                .loading, .error-message {
                    text-align: center;
                    padding: 48px;
                    color: #6b7280;
                }

                .error-message {
                    color: #ef4444;
                }

                .review-section {
                    margin-top: 24px;
                    padding: 24px;
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border-radius: 12px;
                }

                .review-section h2 {
                    margin: 0 0 16px 0;
                    color: #92400e;
                    text-align: center;
                }

                .existing-review {
                    text-align: center;
                }

                .stars {
                    font-size: 2rem;
                    margin-bottom: 12px;
                }

                .stars span {
                    color: #d1d5db;
                }

                .stars span.filled {
                    color: #f59e0b;
                }

                .review-comment {
                    font-style: italic;
                    color: #78350f;
                    margin: 12px 0;
                }

                .review-thanks {
                    color: #92400e;
                    font-weight: 500;
                }

                .review-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .star-picker {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                }

                .star-btn {
                    background: none;
                    border: none;
                    font-size: 2.5rem;
                    color: #d1d5db;
                    cursor: pointer;
                    transition: transform 0.1s;
                }

                .star-btn:hover {
                    transform: scale(1.2);
                }

                .star-btn.filled {
                    color: #f59e0b;
                }

                .review-textarea {
                    padding: 12px;
                    border: 1px solid #fcd34d;
                    border-radius: 8px;
                    resize: none;
                    font-family: inherit;
                }

                .btn-submit-review {
                    padding: 14px;
                    background: #f59e0b;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .btn-submit-review:hover {
                    background: #d97706;
                }

                .btn-submit-review:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .review-message {
                    text-align: center;
                    color: #92400e;
                    font-weight: 500;
                }

                .chat-section {
                    margin-top: 24px;
                    padding: 16px;
                    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
                    border-radius: 12px;
                }

                .chat-section h2 {
                    margin: 0 0 12px 0;
                    color: #0369a1;
                    text-align: center;
                    font-size: 1rem;
                }

                .chat-messages {
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 12px;
                    background: white;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }

                .no-messages {
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.875rem;
                    padding: 24px 0;
                }

                .message {
                    margin-bottom: 12px;
                }

                .message.own {
                    text-align: right;
                }

                .message.other {
                    text-align: left;
                }

                .message-content {
                    display: inline-block;
                    max-width: 80%;
                    padding: 10px 14px;
                    border-radius: 16px;
                    text-align: left;
                }

                .message.own .message-content {
                    background: #2563eb;
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .message.other .message-content {
                    background: #f3f4f6;
                    color: #1f2937;
                    border-bottom-left-radius: 4px;
                }

                .sender-name {
                    display: block;
                    font-size: 0.7rem;
                    opacity: 0.7;
                    margin-bottom: 4px;
                }

                .message-content p {
                    margin: 0;
                    font-size: 0.9rem;
                }

                .message-time {
                    display: block;
                    font-size: 0.65rem;
                    opacity: 0.6;
                    margin-top: 4px;
                }

                .chat-input {
                    display: flex;
                    gap: 8px;
                }

                .chat-input input {
                    flex: 1;
                    padding: 12px;
                    border: 1px solid #7dd3fc;
                    border-radius: 24px;
                    font-size: 0.9rem;
                }

                .chat-input input:focus {
                    outline: none;
                    border-color: #0ea5e9;
                }

                .chat-input button {
                    padding: 12px 20px;
                    background: #0ea5e9;
                    color: white;
                    border: none;
                    border-radius: 24px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .chat-input button:hover {
                    background: #0284c7;
                }

                .chat-input button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    )
}
