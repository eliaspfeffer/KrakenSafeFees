import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Legal Notice | ${config.appName}`,
  canonicalUrlRelative: "/impressum",
});

const Impressum = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">Legal Notice</h1>

        <div className="prose max-w-none">
          <p>
            In accordance with legal requirements, we provide the following
            information:
          </p>

          <h2 className="text-xl font-bold mt-6">
            Information according to § 5 TMG
          </h2>

          <p>
            <strong>Service provided by:</strong>
            <br />
            SaveKrakenFees is a service platform operated by:
          </p>

          <p>
            Elias Pfeffer
            <br />
            Pestalozzistr. 65
            <br />
            72762 Reutlingen
            <br />
            Germany
          </p>

          <h2 className="text-xl font-bold mt-6">Contact</h2>
          <p>
            Email: EliasPfeffer[at]gmail.com
            <br />
            Phone: +49 176 6389 5331
          </p>

          <h2 className="text-xl font-bold mt-6">Disclaimer of Liability</h2>

          <h3 className="text-lg font-semibold mt-4">Content Liability</h3>
          <p>
            The contents of this website have been created with the utmost care.
            However, we cannot guarantee the accuracy, completeness, or
            timeliness of the content provided. As a service provider, we are
            responsible for our own content on these pages according to general
            laws. However, we are not obligated to monitor transmitted or stored
            third-party information or to investigate circumstances that
            indicate illegal activity.
          </p>

          <h3 className="text-lg font-semibold mt-4">External Links</h3>
          <p>
            Our website contains links to external websites of third parties,
            the content of which we have no influence over. Therefore, we cannot
            assume any liability for this external content. The respective
            provider or operator of the linked pages is always responsible for
            their content. The linked pages were checked for possible legal
            violations at the time of linking. No illegal content was
            discernible at the time the link was established. However, permanent
            monitoring of the content of the linked pages is not reasonable
            without concrete evidence of a violation of law. Upon notification
            of violations, we will remove such links immediately.
          </p>

          <h3 className="text-lg font-semibold mt-4">Copyright</h3>
          <p>
            The content and works created by the site operators on these pages
            are subject to German copyright law. The reproduction, editing,
            distribution, and any kind of exploitation outside the limits of
            copyright require the written consent of the respective author or
            creator. Downloads and copies of this site are only permitted for
            private, non-commercial use.
          </p>

          <h2 className="text-xl font-bold mt-6">
            Note on Online Dispute Resolution
          </h2>
          <p>
            The European Commission provides a platform for online dispute
            resolution (OS) which is available at
            https://ec.europa.eu/consumers/odr/. We are not obliged and not
            willing to participate in dispute settlement proceedings before a
            consumer arbitration board.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Impressum;
