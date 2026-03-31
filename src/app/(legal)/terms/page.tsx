import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Property Manager",
  description: "Terms and conditions for using the Property Manager application.",
};

export default function TermsOfServicePage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: March 2026</p>

      <p>
        These Terms of Service ("Terms") govern your use of the Property Manager
        web application ("Service") operated by Property Manager ("we," "us," or
        "our"). By creating an account or using the Service, you agree to these
        Terms.
      </p>

      <h2>Acceptance of Terms</h2>
      <p>
        By accessing or using Property Manager, you agree to be bound by these
        Terms. If you do not agree, do not use the Service. We may update these
        Terms from time to time, and your continued use of the Service after
        changes are posted constitutes acceptance of the updated Terms.
      </p>

      <h2>Description of Service</h2>
      <p>
        Property Manager is a web-based property management application designed
        for small landlords and short-term rental hosts. The Service provides
        tools for managing rental properties, tenants, leases, rent collection,
        financial tracking, maintenance requests, and reporting.
      </p>
      <p>
        The Service is a management tool. It is not a licensed property
        management company, real estate brokerage, accounting firm, or legal
        service. The reports and features provided are tools to help you manage
        your properties — they are not a substitute for professional financial,
        legal, or tax advice.
      </p>

      <h2>Account Registration</h2>
      <p>To use Property Manager, you must:</p>
      <ul>
        <li>Provide accurate and complete information when creating your account.</li>
        <li>Keep your password secure and not share it with others.</li>
        <li>
          Notify us promptly if you suspect unauthorized access to your account.
        </li>
        <li>Be at least 18 years old.</li>
      </ul>
      <p>
        You are responsible for all activity that occurs under your account.
      </p>

      <h2>Free and Paid Plans</h2>
      <p>
        Property Manager offers a free plan and paid subscription plans. Here is
        how they work:
      </p>
      <ul>
        <li>
          <strong>Free plan:</strong> Includes up to 3 properties with core
          features including tenant management, rent tracking, maintenance
          requests, and basic reporting.
        </li>
        <li>
          <strong>Pro plan ($12/month):</strong> Includes unlimited properties,
          advanced reporting, Schedule E tax reports, document storage, and CSV/PDF
          export.
        </li>
        <li>
          <strong>Pro + STR plan ($18/month):</strong> Includes everything in
          Pro, plus booking management, guest management, cleaning task tracking,
          channel sync, and short-term rental analytics.
        </li>
      </ul>
      <p>
        Paid plans are billed monthly through Stripe. You can cancel at any time
        from your billing settings. When you cancel, your subscription remains
        active until the end of the current billing period. Refunds are not
        provided for partial billing periods.
      </p>

      <h2>Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the Service for any illegal purpose or in violation of any
          applicable laws or regulations.
        </li>
        <li>
          Scrape, crawl, or use automated tools to extract data from the
          Service.
        </li>
        <li>
          Attempt to gain unauthorized access to other users' accounts or our
          systems.
        </li>
        <li>
          Upload malicious code, viruses, or any content designed to disrupt the
          Service.
        </li>
        <li>
          Use the Service to store data unrelated to property management.
        </li>
        <li>
          Resell or redistribute the Service without our written permission.
        </li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts that violate these
        terms.
      </p>

      <h2>Your Data</h2>
      <p>
        You own the data you enter into Property Manager. We do not claim
        ownership of your property information, tenant details, financial
        records, or any other content you create in the Service.
      </p>
      <p>
        We do not sell your data to third parties. We do not use your data for
        advertising. We only access your data as needed to provide and improve
        the Service, or when required by law.
      </p>
      <p>
        You can export your data at any time using the export features in the
        application. If you close your account, we will delete your data in
        accordance with our Privacy Policy.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        The Service is provided "as is" and "as available" without warranties of
        any kind, either express or implied. We do not guarantee that the
        Service will be uninterrupted, error-free, or free of harmful
        components.
      </p>
      <p>
        Property Manager is a management tool, not a financial advisor. Reports
        generated by the Service (including Schedule E reports, cash flow
        statements, and tax-related summaries) are provided for informational
        purposes only. Always consult a qualified tax professional or accountant
        for financial and tax decisions.
      </p>
      <p>
        To the maximum extent permitted by law, we will not be liable for any
        indirect, incidental, special, consequential, or punitive damages,
        including loss of profits, data, or business opportunities, arising from
        your use of the Service.
      </p>

      <h2>Termination</h2>
      <p>
        You may close your account at any time through your account settings or
        by contacting us. We may also terminate or suspend your account if you
        violate these Terms.
      </p>
      <p>
        Before closing your account, we recommend exporting your data using the
        export features available in the application. After account closure, your
        data will be deleted in accordance with our Privacy Policy.
      </p>

      <h2>Changes to Terms</h2>
      <p>
        We may modify these Terms from time to time. When we make significant
        changes, we will notify you by email or through a notice in the
        application. The "Last updated" date at the top of this page indicates
        when these Terms were last revised.
      </p>
      <p>
        Your continued use of the Service after changes are posted constitutes
        your acceptance of the revised Terms.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about these Terms, please contact us at{" "}
        <a href="mailto:support@propertymanager.app">
          support@propertymanager.app
        </a>
        .
      </p>
    </article>
  );
}
