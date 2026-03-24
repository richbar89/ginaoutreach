export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-navy">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 2025</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <p className="text-gray-700">
          GinaOS is a private, internal outreach tool used solely by its owner for professional
          communication purposes. It is not a public-facing product and does not collect, store,
          or share personal data from third parties.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data We Access</h2>
        <p className="text-gray-700">
          This application may access the following data solely on behalf of its authorised user:
        </p>
        <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
          <li>Microsoft account email and display name (for authentication)</li>
          <li>Outlook email messages (to send and read outreach emails)</li>
          <li>Publicly available Meta Ad Library data (to identify active advertisers)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Storage</h2>
        <p className="text-gray-700">
          All data is stored locally in the user&apos;s browser (localStorage) or within the private
          hosting environment. No personal data is sold, shared, or transferred to any third party.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Third-Party Services</h2>
        <p className="text-gray-700">
          This app integrates with Microsoft Graph API and Meta Ad Library API under their respective
          terms of service. OAuth2 tokens are handled via Microsoft MSAL and are never stored on
          any external server.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p className="text-gray-700">
          For any questions about this privacy policy, please contact the application owner directly.
        </p>
      </section>
    </div>
  )
}
