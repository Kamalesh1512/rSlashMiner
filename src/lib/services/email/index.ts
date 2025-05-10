import nodemailer from "nodemailer"
// Configure email transporter

const isProduction = process.env.NODE_ENV === "production"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: isProduction? 465 : 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: isProduction
})

interface SendVerificationEmailParams {
  to: string
  token: string
  username: string
}

export async function sendVerificationEmail({ to, token, username }: SendVerificationEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL
  const verificationUrl = `${baseUrl}/api/auth/verify/${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_SERVER_USER || 'skroub.official@gmail.com',
    to,
    subject: "Verify your email address",
    text: `Hello ${username},\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nIf you did not request this email, please ignore it.\n\nThanks,\nThe Skroub Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8C00; padding: 20px; text-align: center; color: white;">
          <h1>Verify your email address</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Hello ${username},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          </div>
          <p>If the button doesn't work, you can also click on this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this email or if email is already verified, please ignore it.</p>
          <p>Thanks,<br>The Skroub Team</p>
        </div>
      </div>
    `,
  })
}

interface SendPasswordResetEmailParams {
  to: string
  token: string
  username: string
}

export async function sendPasswordResetEmail({ to, token, username }: SendPasswordResetEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL
  const resetUrl = `${baseUrl}/reset-password/${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_SERVER_USER || 'skroub.official@gmail.com',
    to,
    subject: "Reset your password",
    text: `Hello ${username},\n\nYou requested to reset your password. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this email, please ignore it.\n\nThanks,\nThe skroub Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8C00; padding: 20px; text-align: center; color: white;">
          <h1>Reset your password</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Hello ${username},</p>
          <p>You requested to reset your password. Please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, you can also click on this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this email, please ignore it.</p>
          <p>Thanks,<br>The skroub Team</p>
        </div>
      </div>
    `,
  })
}


interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const { to, subject, text, html } = options

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Skroub" <noreply@skroub.com>', 
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    })

    console.log(`Email sent to ${to}`)
  } catch (error) {
    console.error(`Error sending email: ${error}`)
    throw error
  }
}
