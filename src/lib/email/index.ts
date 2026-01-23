// Email service using SendGrid for booking notifications
// Requires SENDGRID_API_KEY environment variable

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@powerlunch.jp'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://powerlunch.jp'

interface BookingEmailData {
    bookingId: string
    guestName: string
    guestEmail: string
    hostName: string
    hostEmail: string
    listingTitle: string
    bookingDate: string
    startTime: string
    endTime: string
    venue: string
    priceYen: number
    qrCode?: string
    hostResponseDeadline?: string
}

// Base function to send email via SendGrid
async function sendEmail(to: string, subject: string, htmlContent: string, textContent?: string) {
    if (!SENDGRID_API_KEY) {
        console.warn('[email] SendGrid API key not configured, skipping email')
        return { success: false, error: 'SendGrid not configured' }
    }

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: to }] }],
                from: { email: FROM_EMAIL, name: 'Power Lunch' },
                subject,
                content: [
                    { type: 'text/plain', value: textContent || htmlContent.replace(/<[^>]*>/g, '') },
                    { type: 'text/html', value: htmlContent },
                ],
            }),
        })

        if (response.ok || response.status === 202) {
            console.log('[email] Sent to:', to, 'Subject:', subject)
            return { success: true }
        } else {
            const error = await response.text()
            console.error('[email] SendGrid error:', error)
            return { success: false, error }
        }
    } catch (err: any) {
        console.error('[email] Failed to send:', err.message)
        return { success: false, error: err.message }
    }
}

// Format date for display (Japanese style)
function formatDate(dateStr: string, language: string = 'ja'): string {
    const date = new Date(dateStr)
    if (language === 'ja') {
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

// ============ EMAIL TEMPLATES ============

// 1. New Booking Request → Host
export async function sendBookingRequestToHost(data: BookingEmailData) {
    const acceptUrl = `${SITE_URL}/bookings/${data.bookingId}?action=accept`
    const declineUrl = `${SITE_URL}/bookings/${data.bookingId}?action=decline`
    const deadlineText = data.hostResponseDeadline
        ? `Please respond by ${formatDate(data.hostResponseDeadline, 'ja')}`
        : 'Please respond as soon as possible'

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">🍽️ New Booking Request!</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
            <p style="font-size: 16px;">Hi ${data.hostName},</p>
            <p><strong>${data.guestName}</strong> wants to book a session with you!</p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #1f2937;">${data.listingTitle}</h3>
                <p>📅 <strong>${formatDate(data.bookingDate, 'ja')}</strong></p>
                <p>⏰ ${data.startTime} - ${data.endTime}</p>
                <p>📍 ${data.venue}</p>
                <p style="font-size: 20px; color: #2563eb;">💴 ¥${data.priceYen.toLocaleString()}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: 500;">⚠️ ${deadlineText}</p>
            
            <div style="display: flex; gap: 12px; margin: 24px 0;">
                <a href="${acceptUrl}" style="flex: 1; background: #10b981; color: white; padding: 16px 24px; text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600;">✓ Accept Booking</a>
                <a href="${declineUrl}" style="flex: 1; background: #6b7280; color: white; padding: 16px 24px; text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600;">✗ Decline</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">The guest's payment is on hold. It will be captured when you accept, or released if you decline or don't respond in time.</p>
        </div>
    </div>
    `

    return sendEmail(data.hostEmail, `New Booking Request from ${data.guestName}`, html)
}

// 2. Booking Confirmed → Guest
export async function sendBookingConfirmedToGuest(data: BookingEmailData) {
    const bookingUrl = `${SITE_URL}/bookings/${data.bookingId}`

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Booking Confirmed!</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
            <p style="font-size: 16px;">Great news, ${data.guestName}!</p>
            <p><strong>${data.hostName}</strong> has accepted your booking request.</p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #1f2937;">${data.listingTitle}</h3>
                <p>📅 <strong>${formatDate(data.bookingDate, 'ja')}</strong></p>
                <p>⏰ ${data.startTime} - ${data.endTime}</p>
                <p>📍 ${data.venue}</p>
            </div>
            
            ${data.qrCode ? `
            <div style="background: #dcfce7; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: #166534; margin-top: 0;">Your Check-in Code</h3>
                <p style="font-family: monospace; font-size: 24px; font-weight: bold; background: white; padding: 16px; border-radius: 8px; border: 2px dashed #10b981;">${data.qrCode}</p>
                <p style="color: #166534; font-size: 14px;">Show this to your host at the start of your session</p>
            </div>
            ` : ''}
            
            <a href="${bookingUrl}" style="display: block; background: #2563eb; color: white; padding: 16px 24px; text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600; margin: 24px 0;">View Booking Details</a>
        </div>
    </div>
    `

    return sendEmail(data.guestEmail, `Booking Confirmed with ${data.hostName}!`, html)
}

// 3. Booking Declined → Guest
export async function sendBookingDeclinedToGuest(data: BookingEmailData, reason?: string) {
    const searchUrl = `${SITE_URL}/search`

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6b7280; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Not Available</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
            <p style="font-size: 16px;">Hi ${data.guestName},</p>
            <p>Unfortunately, ${data.hostName} was unable to accept your booking request for <strong>${data.listingTitle}</strong> on ${formatDate(data.bookingDate, 'ja')}.</p>
            
            ${reason ? `<p style="background: #f3f4f6; padding: 12px; border-radius: 8px;"><em>"${reason}"</em></p>` : ''}
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">💳 <strong>Your payment hold has been released.</strong> No charges were made to your card.</p>
            </div>
            
            <a href="${searchUrl}" style="display: block; background: #2563eb; color: white; padding: 16px 24px; text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600; margin: 24px 0;">Find Another Host</a>
        </div>
    </div>
    `

    return sendEmail(data.guestEmail, `Booking Update: ${data.listingTitle}`, html)
}

// 4. Booking Expired → Guest
export async function sendBookingExpiredToGuest(data: BookingEmailData) {
    const searchUrl = `${SITE_URL}/search`

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Request Expired</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
            <p style="font-size: 16px;">Hi ${data.guestName},</p>
            <p>The host didn't respond to your booking request for <strong>${data.listingTitle}</strong> in time.</p>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">💳 <strong>Your payment hold has been released.</strong> No charges were made to your card.</p>
            </div>
            
            <p>We apologize for the inconvenience. Please try booking with another host.</p>
            
            <a href="${searchUrl}" style="display: block; background: #2563eb; color: white; padding: 16px 24px; text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600; margin: 24px 0;">Find Another Host</a>
        </div>
    </div>
    `

    return sendEmail(data.guestEmail, `Booking Request Expired: ${data.listingTitle}`, html)
}

// 5. Booking Expired → Host (warning about missed opportunity)
export async function sendBookingExpiredToHost(data: BookingEmailData) {
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Missed Booking Opportunity</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
            <p style="font-size: 16px;">Hi ${data.hostName},</p>
            <p>You didn't respond to a booking request from <strong>${data.guestName}</strong> in time.</p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #1f2937;">${data.listingTitle}</h3>
                <p>📅 ${formatDate(data.bookingDate, 'ja')}</p>
                <p>💴 ¥${data.priceYen.toLocaleString()} (potential earnings)</p>
            </div>
            
            <p style="color: #6b7280;">Not responding to bookings affects your response rate and visibility to guests. Please check your notifications regularly.</p>
        </div>
    </div>
    `

    return sendEmail(data.hostEmail, `Missed Booking from ${data.guestName}`, html)
}

// 6. Reminder to Host (sent before deadline)
export async function sendHostReminder(data: BookingEmailData) {
    const bookingUrl = `${SITE_URL}/bookings/${data.bookingId}`

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">⏰ Booking Request Pending</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
            <p style="font-size: 16px;">Hi ${data.hostName},</p>
            <p>You have a pending booking request from <strong>${data.guestName}</strong> that needs your response.</p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #1f2937;">${data.listingTitle}</h3>
                <p>📅 ${formatDate(data.bookingDate, 'ja')}</p>
                <p>⏰ ${data.startTime} - ${data.endTime}</p>
                <p>💴 ¥${data.priceYen.toLocaleString()}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: 500;">⚠️ This request will expire soon if you don't respond.</p>
            
            <a href="${bookingUrl}" style="display: block; background: #2563eb; color: white; padding: 16px 24px; text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600; margin: 24px 0;">Respond Now</a>
        </div>
    </div>
    `

    return sendEmail(data.hostEmail, `Action Required: Booking from ${data.guestName}`, html)
}

// 7. Booking Cancelled → Other party
export async function sendBookingCancelled(
    recipientEmail: string,
    recipientName: string,
    cancelledBy: 'guest' | 'host',
    data: BookingEmailData
) {
    const cancellerName = cancelledBy === 'guest' ? data.guestName : data.hostName

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6b7280; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
            <p style="font-size: 16px;">Hi ${recipientName},</p>
            <p>The booking for <strong>${data.listingTitle}</strong> on ${formatDate(data.bookingDate, 'ja')} has been cancelled by ${cancellerName}.</p>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">Any payment has been refunded in full.</p>
            </div>
        </div>
    </div>
    `

    return sendEmail(recipientEmail, `Booking Cancelled: ${data.listingTitle}`, html)
}
