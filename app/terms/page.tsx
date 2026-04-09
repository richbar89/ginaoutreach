export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. About Collabi</h2>
            <p>
              Collabi is a B2B outreach platform for content creators and influencers, helping them manage brand partnership campaigns. By creating an account, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Your account</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You must provide accurate information when signing up</li>
              <li>You are responsible for keeping your login credentials secure</li>
              <li>You must be at least 18 years old to use Collabi</li>
              <li>One account per person — do not share accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Acceptable use</h2>
            <p>You may use Collabi to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Send professional outreach emails to brand contacts in your own name</li>
              <li>Manage your own brand deals, campaigns, and partnerships</li>
              <li>Create and share your own media kit</li>
            </ul>
            <p className="mt-3">You may <strong>not</strong> use Collabi to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Send spam, unsolicited bulk marketing, or misleading emails</li>
              <li>Scrape, export, or redistribute the contact database</li>
              <li>Use the platform on behalf of clients or third parties without consent</li>
              <li>Attempt to reverse engineer, copy, or resell any part of the platform</li>
              <li>Harass, impersonate, or deceive any brand contact</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Contact database</h2>
            <p>
              The brand contact database is provided for professional outreach purposes only. Contacts are sourced from publicly available information. You may use the contacts to send genuine partnership enquiries relevant to your creator business. You may not extract, store, or redistribute contact data outside of Collabi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Subscription and billing</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Collabi is available for £29/month after a 7-day free trial</li>
              <li>No credit card is required to start your trial</li>
              <li>You can cancel at any time — your access continues until the end of the billing period</li>
              <li>We do not offer refunds for partial months</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Intellectual property</h2>
            <p>
              Collabi and all its content, features, and functionality are owned by us. You retain ownership of any content you create within the platform (media kits, templates, notes).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of liability</h2>
            <p>
              Collabi is provided &ldquo;as is&rdquo;. We are not responsible for the outcome of any outreach you send, any brand deals made or lost, or any third-party responses. Our total liability to you shall not exceed the amount you paid in the 3 months prior to any claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. We will notify you by email if we make material changes. Continued use of Collabi after changes take effect constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Governing law</h2>
            <p>
              These terms are governed by the laws of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              Questions?{" "}
              <a href="mailto:hello@collabi.io" className="text-orange-500 hover:underline">hello@collabi.io</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
