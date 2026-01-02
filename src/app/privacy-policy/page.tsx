export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8 font-sans text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: January 02, 2026</p>
      
      <p className="mb-6">
        <strong>MoiV Interactive</strong> ("We", "Us", "Company") is committed to protecting the privacy of individuals ("User", "You") who use the <strong>Fallio</strong> mobile application ("App").
      </p>

      <p className="mb-6">
        This Privacy Policy has been prepared in full compliance with the General Data Protection Regulation (GDPR), CCPA, and Google Play / App Store developer policies. By downloading or using our App, you agree to the data collection and use practices outlined in this policy.
      </p>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Information We Collect and How We Collect It</h2>
      <p className="mb-4">To provide our services, we process the following types of data:</p>
      
      <h3 className="text-lg font-bold mt-4 mb-2">1.1. Automatically Collected Data (Device and Usage)</h3>
      <ul className="list-disc ml-6 mb-4 space-y-1 text-gray-700">
        <li><strong>Device IDs:</strong> utilized for ad delivery (Google AdMob) and sending push notifications.</li>
        <li><strong>Usage Statistics:</strong> In-app interactions, crash logs, and performance data (via Sentry & Expo).</li>
        <li><strong>Network Information:</strong> IP address, internet connection type, and carrier information.</li>
      </ul>

      <h3 className="text-lg font-bold mt-4 mb-2">1.2. Data You Provide</h3>
      <ul className="list-disc ml-6 mb-4 space-y-1 text-gray-700">
        <li><strong>Account Information:</strong> Name, email address, date of birth, and gender (via Google Auth or Email sign-up).</li>
        <li><strong>User Content:</strong> Photos (e.g., coffee cup images, palm photos) and notes uploaded for fortune-telling purposes.</li>
        <li><strong>Purchase History:</strong> Records of credit or subscription purchases (Financial data is processed directly by payment providers; we only store the transaction result).</li>
      </ul>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Purpose of Data Use</h2>
      <p className="mb-4">Your collected personal data is processed for the following purposes:</p>
      <ul className="list-disc ml-6 mb-4 space-y-2 text-gray-700">
        <li><strong>Service Provision:</strong> Analyzing uploaded photos using AI algorithms to generate fortune interpretations.</li>
        <li><strong>Account Management:</strong> Verifying user identity, storing past fortunes, and tracking credit balances.</li>
        <li><strong>Advertising & Marketing:</strong> Displaying relevant and personalized advertisements (via Google AdMob).</li>
        <li><strong>Communication:</strong> Sending notifications when your fortune result is ready or for promotional updates.</li>
        <li><strong>Security & Improvement:</strong> Detecting errors, preventing fraud, and improving application performance.</li>
      </ul>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Data Sharing with Third Parties</h2>
      <p className="mb-4">We share your data with the following trusted service providers to maintain our service:</p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 mb-6">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-2 px-4 text-left font-medium text-gray-600">Service Provider</th>
              <th className="py-2 px-4 text-left font-medium text-gray-600">Purpose</th>
              <th className="py-2 px-4 text-left font-medium text-gray-600">Shared Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 px-4">Google AdMob</td>
              <td className="py-2 px-4">Ad Display</td>
              <td className="py-2 px-4">Device ID (Advertising ID), Location (Coarse), Cookies</td>
            </tr>
            <tr>
              <td className="py-2 px-4">RevenueCat</td>
              <td className="py-2 px-4">Payments Infrastructure</td>
              <td className="py-2 px-4">User ID, Purchase History</td>
            </tr>
            <tr>
              <td className="py-2 px-4">Supabase</td>
              <td className="py-2 px-4">Database & Auth</td>
              <td className="py-2 px-4">All encrypted user data</td>
            </tr>
            <tr>
              <td className="py-2 px-4">AI Providers</td>
              <td className="py-2 px-4">Fortune Analysis</td>
              <td className="py-2 px-4">Anonymized text and image data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Data Security and Retention</h2>
      <p className="mb-4">
        Your data is protected by industry-standard <strong>SSL/TLS encryption</strong> protocols. Our database (Supabase) is hosted on highly secure servers. However, no data transmission over the internet can be guaranteed to be 100% secure.
      </p>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. User Rights and Account Deletion</h2>
      <p className="mb-4">
        Under GDPR and applicable privacy laws, you have the following rights:
      </p>
      <ul className="list-disc ml-6 mb-6 space-y-1 text-gray-700">
        <li>To know whether your data is being processed,</li>
        <li>To request a copy of the data held about you,</li>
        <li>To request correction of inaccurate or incomplete data,</li>
        <li><strong>Right to be Forgotten (Account Deletion):</strong> To request the permanent deletion of your account and all associated data.</li>
      </ul>

      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <h3 className="font-bold text-red-700 mb-2">How to Delete Your Account?</h3>
        <p className="text-sm text-red-600 mb-2">
          You can delete your account directly within the app by following these steps:
        </p>
        <ol className="list-decimal ml-6 text-sm text-red-700 font-medium">
          <li>Go to the <strong>Profile</strong> tab.</li>
          <li>Tap on <strong>Settings</strong> (Gear Icon) at the top right.</li>
          <li>Scroll to the bottom and tap on <strong>"Delete My Account"</strong>.</li>
          <li>Confirm the action in the pop-up window.</li>
        </ol>
        <p className="text-xs text-red-500 mt-2">
          Alternatively, you can send an email with the subject "Delete Account" to <strong>support@fallio.com</strong>. This action is irreversible; all your credits, fortune history, and personal information will be instantly deleted from our servers.
        </p>
      </div>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Children's Privacy</h2>
      <p className="mb-4">
        Our services are not intended for individuals under the age of 13 ("Children"). We do not knowingly collect personal data from children under 13. If you are a parent or guardian and become aware that your child has provided us with personal data, please contact us.
      </p>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Contact Us</h2>
      <p className="mb-4">
        If you have any questions, comments, or requests regarding this policy, please contact our Data Protection Officer:
      </p>
      <p className="font-medium text-gray-800">
        Email: <a href="mailto:support@fallio.com" className="text-blue-600 hover:underline">support@fallio.com</a><br/>
        Developer: MoiV Interactive
      </p>
    </div>
  );
}
