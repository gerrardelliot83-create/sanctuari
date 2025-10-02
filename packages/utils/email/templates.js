/**
 * Email Templates
 * Purpose: Professional email templates for Sanctuari platform
 * Design: Clean, branded, mobile-responsive
 */

export const emailTemplates = {
  standard: {
    subject: 'Invitation to bid on {rfq_number} - {product_name}',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bid Invitation</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            background-color: #F5F4F5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
          }
          .header {
            background-color: #6F4FFF;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content p {
            color: #070921;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 20px 0;
          }
          .info-table {
            width: 100%;
            margin: 30px 0;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 12px 0;
            border-bottom: 1px solid #F5F4F5;
            font-size: 15px;
          }
          .info-table td:first-child {
            color: #6b7280;
            font-weight: 500;
            width: 40%;
          }
          .info-table td:last-child {
            color: #070921;
            font-weight: 600;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #6F4FFF;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
          }
          .note {
            padding: 20px;
            background-color: #F5F4F5;
            border-radius: 8px;
            margin: 30px 0;
          }
          .note p {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
          }
          .footer {
            padding: 30px;
            text-align: center;
            background-color: #F5F4F5;
          }
          .footer p {
            color: #6b7280;
            font-size: 13px;
            margin: 5px 0;
          }
          .footer a {
            color: #6F4FFF;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>You're Invited to Submit a Quote</h1>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Hello{contact_person_greeting},</p>

            <p>You have been invited to submit a quote for the following insurance requirement:</p>

            <!-- RFQ Details -->
            <table class="info-table">
              <tr>
                <td>RFQ Number:</td>
                <td>{rfq_number}</td>
              </tr>
              <tr>
                <td>Product:</td>
                <td>{product_name}</td>
              </tr>
              <tr>
                <td>Company:</td>
                <td>{company_name}</td>
              </tr>
              <tr>
                <td>Submission Deadline:</td>
                <td>{deadline}</td>
              </tr>
            </table>

            <!-- CTA Button -->
            <div class="button-container">
              <a href="{bid_url}" class="button">Submit Your Quote</a>
            </div>

            <!-- Important Note -->
            <div class="note">
              <p><strong>Important:</strong> This unique link is valid until {expiry_date}. Please submit your quote before the deadline to be considered.</p>
            </div>

            <p>If you have any questions about this RFQ, you can reply to this email or contact us through the platform.</p>

            <p>Best regards,<br>Sanctuari Platform Team</p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Sent from <a href="https://platform.sanctuari.io">Sanctuari Platform</a></p>
            <p>Simplifying insurance procurement for businesses</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `You're Invited to Submit a Quote

Hello{contact_person_greeting},

You have been invited to submit a quote for the following insurance requirement:

RFQ Number: {rfq_number}
Product: {product_name}
Company: {company_name}
Submission Deadline: {deadline}

Submit your quote here: {bid_url}

IMPORTANT: This unique link is valid until {expiry_date}. Please submit your quote before the deadline to be considered.

If you have any questions about this RFQ, you can reply to this email or contact us through the platform.

Best regards,
Sanctuari Platform Team

Sent from Sanctuari Platform
https://platform.sanctuari.io`
  },

  urgent: {
    subject: 'URGENT: Invitation to bid on {rfq_number} - {product_name}',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Urgent Bid Invitation</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            background-color: #F5F4F5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
          }
          .header {
            background-color: #FD5478;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 600;
          }
          .urgent-badge {
            display: inline-block;
            padding: 6px 12px;
            background-color: #FFFFFF;
            color: #FD5478;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .content {
            padding: 40px 30px;
          }
          .content p {
            color: #070921;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 20px 0;
          }
          .info-table {
            width: 100%;
            margin: 30px 0;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 12px 0;
            border-bottom: 1px solid #F5F4F5;
            font-size: 15px;
          }
          .info-table td:first-child {
            color: #6b7280;
            font-weight: 500;
            width: 40%;
          }
          .info-table td:last-child {
            color: #070921;
            font-weight: 600;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #FD5478;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
          }
          .note {
            padding: 20px;
            background-color: #FFF5F7;
            border: 2px solid #FD5478;
            border-radius: 8px;
            margin: 30px 0;
          }
          .note p {
            color: #FD5478;
            font-size: 14px;
            margin: 0;
            font-weight: 600;
          }
          .footer {
            padding: 30px;
            text-align: center;
            background-color: #F5F4F5;
          }
          .footer p {
            color: #6b7280;
            font-size: 13px;
            margin: 5px 0;
          }
          .footer a {
            color: #6F4FFF;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="urgent-badge">URGENT REQUEST</div>
            <h1>Time-Sensitive Bid Invitation</h1>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Hello{contact_person_greeting},</p>

            <p><strong>This is a time-sensitive request.</strong> You have been invited to submit a quote for an urgent insurance requirement:</p>

            <!-- RFQ Details -->
            <table class="info-table">
              <tr>
                <td>RFQ Number:</td>
                <td>{rfq_number}</td>
              </tr>
              <tr>
                <td>Product:</td>
                <td>{product_name}</td>
              </tr>
              <tr>
                <td>Company:</td>
                <td>{company_name}</td>
              </tr>
              <tr>
                <td>Submission Deadline:</td>
                <td><strong>{deadline}</strong></td>
              </tr>
            </table>

            <!-- CTA Button -->
            <div class="button-container">
              <a href="{bid_url}" class="button">Submit Your Quote Now</a>
            </div>

            <!-- Important Note -->
            <div class="note">
              <p>⚠ URGENT: This link expires on {expiry_date}. Please respond as soon as possible.</p>
            </div>

            <p>Due to the urgent nature of this request, prompt response is highly appreciated.</p>

            <p>Best regards,<br>Sanctuari Platform Team</p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Sent from <a href="https://platform.sanctuari.io">Sanctuari Platform</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `URGENT: You're Invited to Submit a Quote

Hello{contact_person_greeting},

This is a time-sensitive request. You have been invited to submit a quote for an urgent insurance requirement:

RFQ Number: {rfq_number}
Product: {product_name}
Company: {company_name}
Submission Deadline: {deadline}

Submit your quote here: {bid_url}

URGENT: This link expires on {expiry_date}. Please respond as soon as possible.

Due to the urgent nature of this request, prompt response is highly appreciated.

Best regards,
Sanctuari Platform Team`
  }
};

/**
 * Render email template with variables
 * @param {string} templateId - Template identifier ('standard', 'urgent')
 * @param {object} variables - Variables to replace in template
 * @returns {object} Rendered email with subject, html, and text
 */
export function renderTemplate(templateId, variables) {
  const template = emailTemplates[templateId] || emailTemplates.standard;

  // Create greeting suffix if contact person exists
  const contactPersonGreeting = variables.contact_person
    ? ` ${variables.contact_person}`
    : '';

  // Add computed variables
  const allVariables = {
    ...variables,
    contact_person_greeting: contactPersonGreeting
  };

  // Replace variables in subject
  let subject = template.subject;
  let html = template.html;
  let text = template.text;

  Object.keys(allVariables).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    const value = allVariables[key] || '';

    subject = subject.replace(regex, value);
    html = html.replace(regex, value);
    text = text.replace(regex, value);
  });

  return { subject, html, text };
}

/**
 * Get list of available templates
 * @returns {array} Array of template objects with id, name, and description
 */
export function getAvailableTemplates() {
  return [
    {
      id: 'standard',
      name: 'Standard Invitation',
      description: 'Professional invitation for regular RFQs'
    },
    {
      id: 'urgent',
      name: 'Urgent Request',
      description: 'Time-sensitive invitation with urgent styling'
    }
  ];
}
