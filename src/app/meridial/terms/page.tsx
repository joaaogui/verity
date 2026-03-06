import Link from "next/link";

export default function TermsOfUsePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/meridial"
        className="mb-8 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        &larr; Back
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-gray-900">Terms of Use</h1>

      <div className="space-y-6 text-[15px] leading-relaxed text-gray-600">
        <p>
          <strong className="text-gray-900">Last updated:</strong> March 5, 2026
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          1. Acceptance of Terms
        </h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
          ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
          voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          2. Use of Service
        </h2>
        <p>
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
          officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde
          omnis iste natus error sit voluptatem accusantium doloremque
          laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
          veritatis et quasi architecto beatae vitae dicta sunt explicabo.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          3. User Responsibilities
        </h2>
        <p>
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut
          fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem
          sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor
          sit amet, consectetur, adipisci velit.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          4. Intellectual Property
        </h2>
        <p>
          Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis
          suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis
          autem vel eum iure reprehenderit qui in ea voluptate velit esse quam
          nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo
          voluptas nulla pariatur.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          5. Limitation of Liability
        </h2>
        <p>
          At vero eos et accusamus et iusto odio dignissimos ducimus qui
          blanditiis praesentium voluptatum deleniti atque corrupti quos dolores
          et quas molestias excepturi sint occaecati cupiditate non provident,
          similique sunt in culpa qui officia deserunt mollitia animi, id est
          laborum et dolorum fuga.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          6. Termination
        </h2>
        <p>
          Et harum quidem rerum facilis est et expedita distinctio. Nam libero
          tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo
          minus id quod maxime placeat facere possimus, omnis voluptas assumenda
          est, omnis dolor repellendus.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          7. Governing Law
        </h2>
        <p>
          Temporibus autem quibusdam et aut officiis debitis aut rerum
          necessitatibus saepe eveniet ut et voluptates repudiandae sint et
          molestiae non recusandae. These terms shall be governed by and
          construed in accordance with the applicable laws.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-gray-900">
          8. Contact
        </h2>
        <p>
          For any questions regarding these terms, please reach out to us at
          legal@meridial.com.
        </p>
      </div>
    </div>
  );
}
