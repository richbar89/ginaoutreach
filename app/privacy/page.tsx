export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p>
              Collabi is a B2B SaaS platform that helps content creators and influencers manage brand partnership outreach. We are based in the United Kingdom.
            </p>
            <p className="mt-2">
              For questions about this policy or your data, contact us at{" "}
              <a href="mailto:hello@collabi.io" className="text-orange-500 hover:underline">hello@collabi.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Data we collect about you (platform users)</h2>
            <p>When you create a Collabi account, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Your name and email address (via Clerk authentication)</li>
              <li>OAuth tokens for Gmail or Outlook — stored locally in your browser, never on our servers</li>
              <li>Your Instagram analytics data if you choose to connect your account</li>
              <li>Media kit content you create within the platform</li>
              <li>Emails you send and deals you create — stored in our database solely for your use</li>
            </ul>
            <p className="mt-3">We use this data solely to provide the Collabi service to you. We do not sell it.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Brand contact data</h2>
            <p>
              Collabi maintains a database of brand marketing contacts to help creators identify partnership opportunities. This data consists of:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Business names and professional job titles</li>
              <li>Work email addresses</li>
              <li>LinkedIn profile URLs</li>
              <li>Company and industry information</li>
            </ul>
            <p className="mt-3">
              <strong>Lawful basis:</strong> We process this data under <strong>legitimate interest</strong> (UK GDPR Article 6(1)(f)). Brand marketing managers and partnership leads are employed specifically to receive collaboration and sponsorship enquiries. Our outreach tools are used to contact them in their professional capacity, about matters directly relevant to their role.
            </p>
            <p className="mt-3">
              All contact data is sourced from publicly available professional sources (company websites, LinkedIn, press releases, and industry directories).
            </p>
            <p className="mt-3">
              If you are a brand contact and would like to be removed from our database, please use our{" "}
              <a href="/data-removal" className="text-orange-500 hover:underline">data removal request form</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Cookies and tracking</h2>
            <p>
              We use strictly necessary cookies for authentication (via Clerk). We do not use advertising cookies or third-party tracking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Third-party services</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong>Clerk</strong> — authentication and user management</li>
              <li><strong>Supabase</strong> — database hosting (EU region)</li>
              <li><strong>Google / Gmail API</strong> — email sending on your behalf</li>
              <li><strong>Microsoft Graph API</strong> — email sending on your behalf</li>
              <li><strong>Meta Ad Library API</strong> — publicly available ad spend data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account, your personal data is removed within 30 days. Brand contact data is reviewed and updated periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Your rights</h2>
            <p>Under UK GDPR, you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing based on legitimate interest</li>
              <li>Lodge a complaint with the ICO (ico.org.uk)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:hello@collabi.io" className="text-orange-500 hover:underline">hello@collabi.io</a>{" "}
              or use our <a href="/data-removal" className="text-orange-500 hover:underline">data removal form</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
