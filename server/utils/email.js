const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   'smtp-relay.brevo.com',
  port:   587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
})

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"HostelPro" <${process.env.SMTP_FROM || 'noreply@hostelpro.com'}>`,
      to, subject, html
    })
    console.log(`Email sent to ${to}`)
  } catch (err) {
    console.error('Email error:', err.message)
    // Don't throw — email failure should not break the main flow
  }
}

module.exports = { sendEmail }