/**
 * Mail service wrapping around mailgun or fallback
 */

import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';

class Mail {
  constructor() {
    const mailgunKey = process.env.MAILGUN_API_KEY || process.env.MAILGUN_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const emailEnabled = process.env.EMAIL_ENABLED !== 'false';

    if (mailgunKey && mailgunDomain && emailEnabled) {
      const auth = {
        api_key: mailgunKey,
        domain: mailgunDomain
      };
      console.log('[Mailer] Mailgun-Transport aktiv.');
      this.client = nodemailer.createTransport(mg({ auth }));
    } else {
      console.warn('[Mailer] Dummy-Transport aktiv. Es werden keine E-Mails versendet.');
      this.client = nodemailer.createTransport({
        jsonTransport: true
      });
    }

    this.sendOptions = {
      from: process.env.EMAIL_SENDER || 'noreply@example.com'
    };
  }

  async sendMail(mailOptions) {
    try {
      const response = await this.client.sendMail(mailOptions);
      return response;
    } catch (error) {
      console.error('Failed to send email: ', error);
      throw new Error('Email failed to send.');
    }
  }

  async send(data) {
    const mailOptions = {
      to: data.to,
      subject: data.subject,
      from: this.sendOptions.from,
      html: data.html
    };

    try {
      const response = await this.sendMail(mailOptions);
      return response;
    } catch (error) {
      console.error('Error in prepping email.', error);
      throw new Error('Error in prepping email.');
    }
  }
}

export default new Mail();
