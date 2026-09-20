import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/meridial"
        className="mb-8 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        &larr; Back
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-gray-900">Privacy Policy</h1>

      <div className="space-y-6 text-[15px] leading-relaxed text-gray-600">
        <p>
          <strong className="text-gray-900">Last updated:</strong> September 19, 2026
        </p>
        <p>
          Meridial is a <strong className="text-gray-900">demo product experience</strong>{" "}
          built on Verity. It is not a production identity or compliance service.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          1. What we process
        </h2>
        <p>
          When you upload a document, the file and the extraction request are sent to
          this app&apos;s server and then to Google Gemini for address-field extraction.
          We ask you not to upload highly sensitive documents you are not prepared to
          share with a third-party AI provider.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          2. Retention
        </h2>
        <p>
          This demo does not operate a durable document store. Uploaded files are
          handled in memory for the request and are not saved to an application
          database by us. Provider-side processing and any provider logs follow{" "}
          <a
            href="https://policies.google.com/privacy"
            className="underline hover:text-gray-900"
            target="_blank"
            rel="noreferrer"
          >
            Google&apos;s privacy policy
          </a>
          .
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          3. Cookies and local storage
        </h2>
        <p>
          A simple cookie-consent preference may be stored in your browser so the
          banner is not shown repeatedly. No advertising trackers are used by this
          demo.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          4. Your choices
        </h2>
        <p>
          Do not upload documents you do not want processed by Gemini. Clear site
          data in your browser to remove local preferences. Contact the site operator
          if you believe a demo deployment is retaining data beyond this description.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          5. Contact
        </h2>
        <p>
          For questions about this demo, contact the site operator through{" "}
          <a
            href="https://joaog.space"
            className="underline hover:text-gray-900"
          >
            joaog.space
          </a>
          .
        </p>
      </div>
    </div>
  );
}
