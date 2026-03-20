import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ---------------------------------------------------------------------------
// Refined Design Tokens (Minimalist + Subtle Brand Accent)
// ---------------------------------------------------------------------------
const colors = {
  bg: '#FAFAFA',         
  card: '#FFFFFF',       
  textMain: '#111111',   
  textMuted: '#666666',  
  faint: '#999999',      
  border: '#EAEAEA',     
  brandAccent: '#4F46E5', // A sophisticated, vibrant indigo
  brandTint: '#EEF2FF',   // A 5% opacity wash of the accent color
};

const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const mono = "'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared Layout Wrapper
// ---------------------------------------------------------------------------
function EmailShell({
  previewText,
  title,
  label,
  otp,
  children,
}: {
  previewText: string;
  title: string;
  label: string;
  otp: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          
         {/* ── Brand Header ── */}
          <Section style={styles.header}>
            <Img
              src="https://res.cloudinary.com/dwfm8zqvt/image/upload/v1773976428/logo_vd4e8c.png" 
              alt="VIEL Logo"
              width="32"
              height="32"
              style={styles.logo}
            />
          </Section>

          {/* ── Content Body ── */}
          <Section style={styles.content}>
            <Heading style={styles.title}>{title}</Heading>
            
            {children}

            {/* ── Tinted OTP Block ── */}
            <Section style={styles.otpContainer}>
              <Text style={styles.otpLabel}>{label}</Text>
              <Text style={styles.otpCode}>{otp}</Text>
            </Section>
          </Section>

          {/* ── Divider ── */}
          <Hr style={styles.divider} />

          {/* ── Footer ── */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This is an automated message from VIEL. If you did not request this, please ignore this email.
            </Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} VIEL Inc. All rights reserved.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Verification Email
// ---------------------------------------------------------------------------
interface VerificationEmailProps {
  firstname: string;
  otp: string;
}

export function VerificationEmail({ firstname, otp }: VerificationEmailProps) {
  const formattedOtp = `V-${otp}`;
  return (
    <EmailShell
      previewText={`Your VIEL verification code is ${formattedOtp}.`}
      title="Verify your email"
      label="Verification Code"
      otp={formattedOtp}
    >
      <Text style={styles.bodyText}>
        Hi {firstname},
      </Text>
      <Text style={styles.bodyText}>
        Please use the verification code below to confirm your email address. This code is valid for <strong>10 minutes</strong>.
      </Text>
    </EmailShell>
  );
}

// ---------------------------------------------------------------------------
// Forgot Password Email
// ---------------------------------------------------------------------------
interface ForgotPasswordEmailProps {
  firstname: string;
  otp: string;
}

export function ForgotPasswordEmail({ firstname, otp }: ForgotPasswordEmailProps) {
  return (
    <EmailShell
      previewText={`Your VIEL password reset code is ${otp}.`}
      title="Reset your password"
      label="Reset Code"
      otp={otp}
    >
      <Text style={styles.bodyText}>
        Hi {firstname},
      </Text>
      <Text style={styles.bodyText}>
        We received a request to reset the password for your VIEL account. Enter the code below to proceed. It will expire in <strong>10 minutes</strong>.
      </Text>
    </EmailShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: colors.bg,
    fontFamily: font,
    margin: 0,
    padding: '40px 0',
  },
  container: {
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    margin: '0 auto',
    maxWidth: '480px',
    padding: '0',
  },
  header: {
    padding: '32px 32px 0',
  },
  brand: {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: colors.brandAccent, // Injected brand color here
    margin: 0,
  },
  content: {
    padding: '24px 32px 32px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: colors.textMain,
    margin: '0 0 16px',
    lineHeight: '1.4',
  },
  bodyText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: colors.textMuted,
    margin: '0 0 16px',
  },
  otpContainer: {
    backgroundColor: colors.brandTint, // Soft colored background wash
    borderRadius: '6px',
    padding: '24px',
    marginTop: '24px',
    textAlign: 'center',
  },
  otpLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.brandAccent, // Tying the label to the accent
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px',
  },
  otpCode: {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.brandAccent, // Code pops in the brand color
    fontFamily: mono,
    letterSpacing: '4px',
    margin: 0,
  },
  divider: {
    borderColor: colors.border,
    margin: '0',
  },
  footer: {
    padding: '24px 32px',
  },
  footerText: {
    fontSize: '12px',
    color: colors.faint,
    lineHeight: '1.5',
    margin: '0 0 8px',
  },
};