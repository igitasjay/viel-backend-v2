import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ---------------------------------------------------------------------------
// Shared design tokens
// ---------------------------------------------------------------------------
const colors = {
  bg: '#0f0f14',
  card: '#18181f',
  purple: '#6c47ff',
  purpleLight: '#9b6dff',
  red: '#ff4757',
  redLight: '#ff6b7a',
  white: '#ffffff',
  muted: '#a0a0b8',
  faint: '#555566',
  border: 'rgba(255,255,255,0.08)',
};

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'Courier New', Courier, monospace";

// ---------------------------------------------------------------------------
// Shared layout wrappers
// ---------------------------------------------------------------------------
function EmailShell({
  previewText,
  accentColor,
  accentColorLight,
  label,
  otp,
  children,
}: {
  previewText: string;
  accentColor: string;
  accentColorLight: string;
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

          {/* ── Brand header ── */}
          <Section style={{ ...styles.header, background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColorLight} 100%)` }}>
            <Text style={styles.brand}>VIEL</Text>
            <Text style={styles.tagline}>Secure · Simple · Swift</Text>
          </Section>

          {/* ── Body ── */}
          <Section style={styles.body_section}>
            {children}

            {/* ── OTP Pill ── */}
            <Section style={{ ...styles.otp_pill, borderColor: accentColor, background: `linear-gradient(135deg, ${accentColor}22, ${accentColorLight}22)` }}>
              <Text style={{ ...styles.otp_label, color: accentColorLight }}>{label}</Text>
              <Text style={styles.otp_code}>{otp}</Text>
            </Section>
          </Section>

          {/* ── Divider ── */}
          <Hr style={styles.divider} />

          {/* ── Footer ── */}
          <Section style={styles.footer}>
            <Text style={styles.footer_text}>
              This email was sent by VIEL. If you did not initiate this, you can safely ignore it.
            </Text>
            <Text style={styles.footer_text}>
              © {new Date().getFullYear()} VIEL. All rights reserved.
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
      previewText={`Your VIEL verification code is ${formattedOtp}. It expires in 10 minutes.`}
      accentColor={colors.purple}
      accentColorLight={colors.purpleLight}
      label="Verification Code"
      otp={formattedOtp}
    >
      <Heading style={styles.heading}>Hey {firstname} 👋</Heading>
      <Text style={styles.body_text}>
        Use the code below to verify your email address. It&apos;s only valid for{' '}
        <strong style={{ color: colors.white }}>10 minutes</strong>.
      </Text>
      <Text style={styles.disclaimer}>
        Do not share this code with anyone, including VIEL support.
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
      previewText={`Your VIEL password reset code is ${otp}. It expires in 10 minutes.`}
      accentColor={colors.red}
      accentColorLight={colors.redLight}
      label="Reset Code"
      otp={otp}
    >
      <Heading style={styles.heading}>Password Reset</Heading>
      <Text style={styles.body_text}>
        Hi <strong style={{ color: colors.white }}>{firstname}</strong>, we received a request to
        reset your VIEL password. Use the code below — it expires in{' '}
        <strong style={{ color: colors.white }}>10 minutes</strong>.
      </Text>
      <Text style={styles.disclaimer}>
        If you did not request a password reset, please ignore this email — your account is safe.
      </Text>
    </EmailShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: colors.bg,
    fontFamily: font,
  },
  container: {
    maxWidth: '520px',
    margin: '40px auto',
    backgroundColor: colors.card,
    borderRadius: '16px',
    overflow: 'hidden',
  },
  header: {
    padding: '32px 40px 28px',
    textAlign: 'center',
  },
  brand: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '4px',
    color: colors.white,
    textTransform: 'uppercase',
  },
  tagline: {
    margin: '6px 0 0',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  body_section: {
    padding: '36px 40px 28px',
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '22px',
    fontWeight: 700,
    color: colors.white,
  },
  body_text: {
    margin: '0 0 28px',
    fontSize: '15px',
    lineHeight: '1.7',
    color: colors.muted,
  },
  otp_pill: {
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderRadius: '12px',
    padding: '18px 40px',
    textAlign: 'center',
    margin: '0 0 24px',
  },
  otp_label: {
    margin: '0 0 8px',
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
  },
  otp_code: {
    margin: 0,
    fontSize: '36px',
    fontWeight: 800,
    letterSpacing: '8px',
    color: colors.white,
    fontFamily: mono,
  },
  disclaimer: {
    margin: 0,
    fontSize: '13px',
    color: colors.faint,
    textAlign: 'center',
  },
  divider: {
    borderColor: colors.border,
    margin: '0 40px',
  },
  footer: {
    padding: '24px 40px 32px',
    textAlign: 'center',
  },
  footer_text: {
    margin: '0 0 4px',
    fontSize: '12px',
    color: colors.faint,
  },
};
