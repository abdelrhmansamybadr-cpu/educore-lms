import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

interface WelcomeEmailData { to: string; name: string; role: string }
interface PasswordResetData { to: string; resetUrl: string }
interface GenericEmailData { to: string; subject: string; html: string }

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter: nodemailer.Transporter

  constructor(private config: ConfigService) {
    // In development use ethereal (fake SMTP), in production use SES
    if (config.get('NODE_ENV') === 'production') {
      this.transporter = nodemailer.createTransport({
        SES: { region: config.get('AWS_REGION') },
      } as any)
    } else {
      // Development: log emails to console
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: config.get('DEV_EMAIL_USER') || 'test@example.com',
          pass: config.get('DEV_EMAIL_PASS') || 'password',
        },
      })
    }
  }

  async sendWelcome({ to, name, role }: WelcomeEmailData) {
    return this.send({
      to,
      subject: 'Welcome to EduCore LMS | مرحباً بك في EduCore',
      html: `
        <div dir="auto" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1E3A5F; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">EduCore LMS</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Welcome, ${name}! / مرحباً، ${name}!</h2>
            <p>Your account has been created successfully with the role: <strong>${role}</strong></p>
            <p>تم إنشاء حسابك بنجاح بالدور: <strong>${role}</strong></p>
            <a href="${this.config.get('WEB_URL')}/auth/login"
               style="background: #1E3A5F; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
              Login / تسجيل الدخول
            </a>
          </div>
        </div>
      `,
    })
  }

  async sendPasswordReset({ to, resetUrl }: PasswordResetData) {
    return this.send({
      to,
      subject: 'Password Reset | إعادة تعيين كلمة المرور',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1E3A5F; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">EduCore LMS</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Password Reset Request</h2>
            <p>Click the button below to reset your password. This link expires in 1 hour.</p>
            <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور. الرابط صالح لمدة ساعة.</p>
            <a href="${resetUrl}"
               style="background: #1E3A5F; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
              Reset Password | إعادة التعيين
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              If you didn't request this, ignore this email.
            </p>
          </div>
        </div>
      `,
    })
  }

  async sendAttendanceAlert(data: { to: string; studentName: string; date: string; schoolName: string }) {
    return this.send({
      to: data.to,
      subject: `Absence Alert: ${data.studentName} | تنبيه غياب: ${data.studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E3A5F;">${data.schoolName}</h2>
          <p>Dear Parent / ولي الأمر الكريم،</p>
          <p>Your child <strong>${data.studentName}</strong> was marked absent on <strong>${data.date}</strong>.</p>
          <p>تم تسجيل غياب ابنك/ابنتك <strong>${data.studentName}</strong> بتاريخ <strong>${data.date}</strong>.</p>
        </div>
      `,
    })
  }

  private async send({ to, subject, html }: GenericEmailData) {
    try {
      const from = `${this.config.get('EMAIL_FROM_NAME') || 'EduCore LMS'} <${this.config.get('EMAIL_FROM') || 'noreply@educore.app'}>`
      await this.transporter.sendMail({ from, to, subject, html })
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err)
    }
  }
}
