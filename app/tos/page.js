import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Contact information: eliaspfeffer@gmail.com
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - Ownership: when buying a package, users can download code to create apps. They own the code but they do not have the right to resell it. They can ask for a full refund within 7 day after the purchase.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://shipfa.st/privacy-policy
// - Governing Law: France
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  // Get current date formatted for the Terms of Service
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for SaveKrakenFees
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: ${currentDate}

TERMS AND CONDITIONS FOR SAVEKRAKENFEES

PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING OUR SERVICES.

1. ACCEPTANCE OF TERMS

By using the SaveKrakenFees website (the "Platform") or any part of our services, you expressly and unconditionally agree to these Terms and Conditions ("Terms"). If you disagree with any part of these Terms, YOU MUST NOT USE THE PLATFORM.

2. DESCRIPTION OF SERVICES

SaveKrakenFees is a platform that enables automated Bitcoin purchases via the Kraken API. The platform aims to help users perform Dollar-Cost-Averaging (DCA) strategies with lower fees.

2.1 RELATIONSHIP DISCLAIMER: 

SAVEKRAKENFEES IS NOT AFFILIATED WITH, ENDORSED BY, OR CONNECTED TO KRAKEN (PAYWARD, INC.) IN ANY WAY. We are an independent third-party service that utilizes Kraken's publicly available API. "Kraken" is a registered trademark owned by Payward, Inc. We do not attempt to impersonate, copy, or clone Kraken's services or brand. We simply provide a complementary service that helps users automate transactions through their own Kraken accounts. All Kraken-related services are performed through the user's own Kraken account using API keys provided by the user.

3. RISK DISCLOSURE AND DISCLAIMER

3.1 CRYPTOCURRENCY RISKS: The use of cryptocurrencies and related services involves substantial financial risks. Cryptocurrency values can fluctuate dramatically and are not regulated. YOU ACKNOWLEDGE THAT YOU FULLY UNDERSTAND AND ACCEPT THE RISKS ASSOCIATED WITH CRYPTOCURRENCIES.

3.2 NO FINANCIAL ADVICE: SaveKrakenFees does NOT provide financial advice, investment advice, or any other professional advisory services. All information provided through the Platform is for informational purposes only and does not constitute financial advice.

3.3 NO GUARANTEE OF SUCCESS: We do not guarantee that the use of our services will result in cost savings, financial gains, or any particular outcome. Past results are not a guarantee of future results.

3.4 COMPLETE DISCLAIMER OF LIABILITY:

TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAVEKRAKENFEES IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES. WE DISCLAIM ALL LIABILITY FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM, INCLUDING BUT NOT LIMITED TO:

- LOSS OF INVESTMENTS, PROFITS, USE, DATA, OR OTHER INTANGIBLE LOSSES
- ERRORS OR INACCURACIES IN CONTENT
- PERSONAL INJURY OR PROPERTY DAMAGE OF ANY KIND
- UNAUTHORIZED ACCESS TO OUR SERVICES OR SERVERS
- INTERRUPTIONS, BUGS, FAILURES, OR DELAYS IN OUR SERVICES
- ERRORS IN THE KRAKEN API OR OTHER THIRD-PARTY SERVICES
- ANY DAMAGES CAUSED BY THIRD PARTIES OF ANY KIND

4. USE OF KRAKEN API

4.1 OWN API KEYS: You are responsible for the security of your own Kraken API keys. We shall under no circumstances be liable for any damages arising from compromise, improper use, or abuse of your API keys.

4.2 THIRD-PARTY SERVICES: Our Platform accesses services from third parties such as Kraken. We have no control over these services and assume no responsibility for their availability, accuracy, or functionality.

5. PRIVACY AND SECURITY

5.1 API KEYS: We implement reasonable security measures to protect your API keys, but we cannot guarantee absolute security. You should use API keys with restricted permissions that only allow the functions necessary for our services.

5.2 DATA COLLECTION: We collect and store user data, including name, email, and, if applicable, payment information, as well as API keys with your explicit consent.

5.3 MARKETING COMMUNICATIONS: By using our services, you agree that we may use your email address to contact you regarding future Bitcoin-related projects and services that may be of interest to you. You can opt out of these communications at any time by contacting us or using the unsubscribe link in our emails.

6. FEES AND PAYMENTS

6.1 TRANSPARENT FEES: We charge a service fee for the use of our Platform as indicated on our website. This fee is in addition to any fees charged by Kraken or other third parties.

6.2 NO GUARANTEE OF FEE SAVINGS: While our Platform aims to reduce fees, we do not guarantee any specific savings compared to other services.

7. CHANGES TO TERMS

We reserve the right to modify these Terms at any time. Continued use of the Platform after such modifications constitutes your consent to the modified Terms.

8. GOVERNING LAW

These Terms are governed by the laws of Germany, without regard to its conflict of law provisions. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Germany.

9. SEVERABILITY

If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.

BY USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THESE TERMS AND AGREE TO BE BOUND BY THEM.

For any questions regarding these Terms of Service, please contact us at ${config.resend.supportEmail}.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
