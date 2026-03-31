import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Property Manager",
  description: "How Property Manager collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: March 2026</p>

      <p>
        Property Manager ("we," "us," or "our") operates the Property Manager
        web application. This Privacy Policy explains how we collect, use, and
        protect your information when you use our service.
      </p>

      <h2>Information We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li>
          <strong>Account information:</strong> Your name, email address, and
          password when you create an account.
        </li>
        <li>
          <strong>Property and tenant data:</strong> Information you enter about
          your rental properties, tenants, leases, financial transactions, and
          maintenance requests. This is the data you actively provide to use the
          service.
        </li>
        <li>
          <strong>Usage data:</strong> Basic information about how you interact
          with the application, such as pages visited and features used. We use
          this to improve the product.
        </li>
        <li>
          <strong>Payment information:</strong> If you subscribe to a paid plan,
          your payment details are collected and processed by Stripe. We do not
          store your credit card number on our servers.
        </li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve the Property Manager service.</li>
        <li>Process transactions and manage your subscription.</li>
        <li>
          Send you service-related communications, such as account
          confirmations, billing notices, and security alerts.
        </li>
        <li>
          Respond to your support requests and questions.
        </li>
        <li>
          Analyze usage patterns to improve the product and develop new features.
        </li>
      </ul>
      <p>
        We do not sell your personal information to third parties. We do not use
        your property or tenant data for advertising purposes.
      </p>

      <h2>Data Storage and Security</h2>
      <p>
        Your data is stored securely using industry-standard practices. We use
        Supabase for our database, which provides encryption at rest and in
        transit. Our application is hosted on Vercel. All connections to our
        service use HTTPS encryption.
      </p>
      <p>
        While no method of electronic storage is 100% secure, we take reasonable
        measures to protect your data, including encrypted passwords, secure
        session management, and regular security reviews.
      </p>

      <h2>Third-Party Services</h2>
      <p>We use the following third-party services to operate Property Manager:</p>
      <ul>
        <li>
          <strong>Stripe:</strong> For payment processing and subscription
          management. Stripe's privacy policy governs how they handle your
          payment information.
        </li>
        <li>
          <strong>Supabase:</strong> For database hosting and authentication
          services.
        </li>
        <li>
          <strong>Vercel:</strong> For application hosting and delivery.
        </li>
      </ul>

      <h2>Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Access your data:</strong> You can view all the data you have
          entered into Property Manager at any time through the application.
        </li>
        <li>
          <strong>Export your data:</strong> You can export your property,
          tenant, and financial data using the CSV export features available in
          the application.
        </li>
        <li>
          <strong>Delete your data:</strong> You can request deletion of your
          account and all associated data by contacting us. We will process
          deletion requests within 30 days.
        </li>
        <li>
          <strong>Correct your data:</strong> You can update or correct any
          information in your account at any time through the application.
        </li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        We retain your data for as long as your account is active. If you delete
        your account, we will delete your personal data and property management
        data within 30 days. We may retain anonymized, aggregated data for
        analytics purposes.
      </p>
      <p>
        Backup copies of your data may persist in our systems for up to 90 days
        after deletion, after which they are permanently removed.
      </p>

      <h2>Cookies</h2>
      <p>
        Property Manager uses session cookies to keep you signed in and manage
        your authentication state. These are essential cookies required for the
        application to function.
      </p>
      <p>
        We do not use tracking cookies, advertising cookies, or third-party
        analytics cookies.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we make
        changes, we will update the "Last updated" date at the top of this page.
        For significant changes, we will notify you by email or through a notice
        in the application.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or how we handle your
        data, please contact us at{" "}
        <a href="mailto:support@propertymanager.app">
          support@propertymanager.app
        </a>
        .
      </p>
    </article>
  );
}
