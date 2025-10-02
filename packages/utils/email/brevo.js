/**
 * Brevo Email Service Integration
 * Purpose: Send transactional emails via Brevo API
 * Documentation: https://developers.brevo.com/reference/sendtransacemail
 */

import { renderTemplate } from './templates.js';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@sanctuari.io';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Sanctuari';
const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://platform.sanctuari.io';

/**
 * Send invitation email to bidder
 * @param {object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.contactPerson - Recipient name (optional)
 * @param {object} params.rfq - RFQ object with details
 * @param {string} params.token - Unique invitation token
 * @param {Date} params.expiresAt - Link expiry date
 * @param {Date} params.deadline - Submission deadline
 * @param {string} params.templateId - Template ID ('standard' or 'urgent')
 * @returns {Promise<object>} Result with success status, messageId, and error
 */
export async function sendInvitationEmail({
  to,
  contactPerson,
  rfq,
  token,
  expiresAt,
  deadline,
  templateId = 'standard'
}) {
  try {
    // Construct bid submission URL
    const bidUrl = `${PLATFORM_URL}/bid/${token}`;

    // Format dates for display
    const deadlineFormatted = new Date(deadline).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const expiryFormatted = new Date(expiresAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Render email template with variables
    const email = renderTemplate(templateId, {
      rfq_number: rfq.rfq_number,
      product_name: rfq.product_name || rfq.title,
      company_name: rfq.company_name || 'the requesting company',
      bid_url: bidUrl,
      deadline: deadlineFormatted,
      expiry_date: expiryFormatted,
      contact_person: contactPerson || ''
    });

    // Prepare Brevo API request
    const emailPayload = {
      sender: {
        email: BREVO_SENDER_EMAIL,
        name: BREVO_SENDER_NAME
      },
      to: [
        {
          email: to,
          name: contactPerson || to
        }
      ],
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
      tags: ['rfq-invitation', `rfq-${rfq.id}`]
    };

    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Brevo] Email send failed:', data);
      return {
        success: false,
        messageId: null,
        error: data.message || 'Failed to send email'
      };
    }

    console.log('[Brevo] Email sent successfully:', {
      to,
      messageId: data.messageId,
      rfqNumber: rfq.rfq_number
    });

    return {
      success: true,
      messageId: data.messageId,
      error: null
    };

  } catch (error) {
    console.error('[Brevo] Exception while sending email:', error);
    return {
      success: false,
      messageId: null,
      error: error.message || 'Unexpected error while sending email'
    };
  }
}

/**
 * Send reminder email to bidder who hasn't submitted yet
 * @param {object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.contactPerson - Recipient name (optional)
 * @param {object} params.rfq - RFQ object with details
 * @param {string} params.token - Unique invitation token
 * @param {Date} params.deadline - Submission deadline
 * @param {number} params.daysLeft - Days remaining until deadline
 * @returns {Promise<object>} Result with success status, messageId, and error
 */
export async function sendReminderEmail({
  to,
  contactPerson,
  rfq,
  token,
  deadline,
  daysLeft
}) {
  try {
    const bidUrl = `${PLATFORM_URL}/bid/${token}`;

    const deadlineFormatted = new Date(deadline).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const greeting = contactPerson ? ` ${contactPerson}` : '';
    const urgencyText = daysLeft <= 1 ? 'URGENT - FINAL REMINDER' : 'REMINDER';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
          .header { background: #F6C754; padding: 30px; text-align: center; }
          .header h1 { margin: 0; color: #070921; font-size: 22px; }
          .badge { display: inline-block; padding: 6px 12px; background: #070921; color: #F6C754; border-radius: 4px; font-size: 12px; font-weight: 700; margin-bottom: 10px; }
          .content { padding: 30px; }
          .content p { color: #070921; font-size: 16px; line-height: 1.6; }
          .button { display: inline-block; padding: 14px 28px; background: #6F4FFF; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 20px; background: #F5F4F5; text-align: center; color: #6b7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">${urgencyText}</div>
            <h1>Bid Deadline Approaching</h1>
          </div>
          <div class="content">
            <p>Hello${greeting},</p>
            <p>This is a friendly reminder that the deadline to submit your quote for <strong>${rfq.rfq_number}</strong> is approaching.</p>
            <p><strong>Deadline:</strong> ${deadlineFormatted}<br><strong>Days Remaining:</strong> ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}</p>
            <p style="text-align: center;">
              <a href="${bidUrl}" class="button">Submit Your Quote Now</a>
            </p>
            <p>If you have already submitted your quote, please disregard this reminder.</p>
            <p>Best regards,<br>Sanctuari Platform Team</p>
          </div>
          <div class="footer">
            Sent from Sanctuari Platform
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPayload = {
      sender: {
        email: BREVO_SENDER_EMAIL,
        name: BREVO_SENDER_NAME
      },
      to: [{ email: to, name: contactPerson || to }],
      subject: `Reminder: ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to submit quote for ${rfq.rfq_number}`,
      htmlContent: htmlContent,
      tags: ['rfq-reminder', `rfq-${rfq.id}`]
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Brevo] Reminder email failed:', data);
      return {
        success: false,
        messageId: null,
        error: data.message || 'Failed to send reminder'
      };
    }

    console.log('[Brevo] Reminder sent successfully:', {
      to,
      messageId: data.messageId,
      rfqNumber: rfq.rfq_number
    });

    return {
      success: true,
      messageId: data.messageId,
      error: null
    };

  } catch (error) {
    console.error('[Brevo] Exception while sending reminder:', error);
    return {
      success: false,
      messageId: null,
      error: error.message || 'Unexpected error'
    };
  }
}

/**
 * Test Brevo connection and credentials
 * @returns {Promise<object>} Test result with success status
 */
export async function testBrevoConnection() {
  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Invalid API key or connection failed'
      };
    }

    return {
      success: true,
      account: {
        email: data.email,
        companyName: data.companyName,
        plan: data.plan
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
