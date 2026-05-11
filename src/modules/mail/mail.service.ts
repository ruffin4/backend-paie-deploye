/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not defined');
    }
    this.resend = new Resend(apiKey);
  }

  private async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: any,
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isDev = nodeEnv !== 'production';
    const testRecipient = this.configService.get<string>('MAIL_TEST_RECIPIENT');
    const finalTo = isDev && testRecipient ? testRecipient : to;
    const from =
      this.configService.get<string>('MAIL_FROM') || 'onboarding@resend.dev';

    try {
      // Path resolution relative to this file
      // Works in both dev (src) and prod (dist) because assets structure is preserved
      const templatePath = path.join(
        __dirname,
        'templates',
        `${templateName}.hbs`,
      );

      if (!fs.existsSync(templatePath)) {
        this.logger.error(`Template not found at ${templatePath}`);
        throw new Error(`Template ${templateName} not found`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // Add real recipient to context for dev debugging
      const finalContext = {
        ...context,
        realRecipient: isDev ? to : null,
      };

      const html = template(finalContext);

      const { data, error } = await this.resend.emails.send({
        from,
        to: finalTo,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Resend Error: ${error.message}`);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      this.logger.log(
        `Email sent successfully to ${finalTo} (Subject: ${subject})`,
      );
      return data;
    } catch (err) {
      this.logger.error(`Mail Service Error: ${err.message}`);
      throw err;
    }
  }

  async sendWelcomeManager(to: string, username: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const setupUrl = `${frontendUrl}/set-password?token=${token}`;
    await this.sendEmail(
      to,
      'Bienvenue - Configuration de votre compte',
      'welcome-manager',
      {
        username,
        setupUrl,
      },
    );
  }

  async sendPasswordReset(to: string, username: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    await this.sendEmail(
      to,
      'Réinitialisation de votre mot de passe',
      'reset-password',
      {
        username,
        resetUrl,
      },
    );
  }
}
