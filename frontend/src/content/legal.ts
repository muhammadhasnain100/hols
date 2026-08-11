/** Legal page copy sourced from House of Life Sciences Word docs (Aug 10, 2026). */

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  paragraphsAfter?: string[];
  listAfter?: string[];
};

export type LegalDocument = {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
};

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  effectiveDate: "August 10, 2026",
  intro: "House of Life Sciences LLC (\u201cCompany,\u201d \u201cwe,\u201d \u201cour,\u201d or \u201cus\u201d) values your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and the measures we take to safeguard it when you visit houseoflifesciences.com (the \u201cWebsite\u201d).",
  sections: [
    {
      heading: "1. Information We Collect",
      paragraphs: [
        "When you use the Website, we may collect the following personal information:",
      ],
      list: [
        "Full name",
        "Email address",
        "Phone number",
        "Billing and shipping address",
        "Payment details (handled securely by third-party processors)",
        "Membership information, including subscriptions, course enrollments, and downloads",
      ],
      paragraphsAfter: [
        "We also automatically collect certain non-identifying technical data, such as:",
      ],
      listAfter: [
        "IP address",
        "Browser type",
        "Device information",
        "How you use the site (pages viewed, time spent, and similar activity)",
      ],
    },
    {
      heading: "2. How We Use Your Information",
      paragraphs: [
        "We use the information we collect to:",
      ],
      list: [
        "Provide access to our educational content, memberships, courses, and downloads",
        "Process payments and manage subscriptions",
        "Send you account-related messages, such as confirmations and renewal reminders",
        "Monitor and improve the performance and usability of the Website",
        "Carry out marketing and promotional activities, including email campaigns, advertising, and retargeting",
        "Share information with trusted partners, including peptide eCommerce companies (for research purposes only) and affiliate networks",
      ],
    },
    {
      heading: "3. Cookies, Analytics, and Advertising Tools",
      paragraphs: [
        "We use cookies and similar technologies to improve your browsing experience and to gather analytics. We may also rely on third-party services such as Google Analytics, Hotjar, Google Search Console, Google Ads, Meta Ads (Facebook and Instagram), Reddit Ads, TikTok Ads, and other digital marketing platforms. Each of these providers processes data in accordance with its own privacy policy.",
      ],
    },
    {
      heading: "4. Third-Party and Affiliate Links",
      paragraphs: [
        "The Website may contain links to third-party sites, including those of our affiliate partners. We are not responsible for the privacy practices, content, or terms of any website we do not operate.",
      ],
    },
    {
      heading: "5. When and With Whom We Share Information",
      paragraphs: [
        "We may disclose your personal information:",
      ],
      list: [
        "To our peptide eCommerce partners, who sell products strictly for research purposes",
        "To service providers who assist us with payment processing, website operations, and marketing",
        "When required to comply with applicable law or legal process",
        "To protect our rights or the rights and safety of others",
      ],
    },
    {
      heading: "6. Data Security",
      paragraphs: [
        "We use reasonable administrative, technical, and physical safeguards to protect your personal information from unauthorized access, misuse, or disclosure. However, no method of transmitting or storing data is completely secure, and we cannot guarantee absolute security.",
      ],
    },
    {
      heading: "7. Your Rights and Choices",
      paragraphs: [
        "Depending on your location, you may have the right to:",
      ],
      list: [
        "Access or update the personal information we hold about you",
        "Cancel your membership",
        "Opt out of marketing communications",
        "Request that we delete your personal information",
      ],
      paragraphsAfter: [
        "To make any of these requests, please email us at info@houseoflifesciences.com.",
      ],
    },
    {
      heading: "8. Cookie Choices",
      paragraphs: [
        "You can manage or disable cookies through your browser settings. Please note that disabling cookies may affect how certain parts of the Website function.",
      ],
    },
    {
      heading: "9. Children's Privacy",
      paragraphs: [
        "The Website is intended for individuals 18 years of age and older. We do not knowingly collect personal information from anyone under the age of 18.",
      ],
    },
    {
      heading: "10. Updates to This Policy",
      paragraphs: [
        "We may update or revise this Privacy Policy from time to time. Any changes will be posted on this page along with a revised effective date.",
      ],
    },
    {
      heading: "11. Contact Us",
      paragraphs: [
        "If you have questions or concerns about this Privacy Policy, please contact us at info@houseoflifesciences.com.",
      ],
    },
  ],
};

export const termsAndConditions: LegalDocument = {
  title: "Terms & Conditions",
  effectiveDate: "August 10, 2026",
  intro: "Welcome to House of Life Sciences LLC (\u201cCompany,\u201d \u201cwe,\u201d \u201cus,\u201d or \u201cour\u201d). These Terms & Conditions (\u201cTerms\u201d) govern your access to and use of houseoflifesciences.com and any related services (the \u201cWebsite\u201d). Please read them carefully. By accessing or using the Website, you agree to be bound by these Terms. If you do not agree with them, please do not use the Website.",
  sections: [
    {
      heading: "1. Eligibility and Use of the Website",
      paragraphs: [
        "The Website is intended solely for adults aged 18 and older. By accessing or using it, you represent and warrant that you are at least 18 years of age.",
        "Membership and Access. Some of our educational material is freely available to the public. Other resources \u2014 including our courses and peptide dosing guides \u2014 are reserved for members or available through a one-time purchase. Memberships renew automatically each month until you cancel. You may cancel at any time by emailing info@houseoflifesciences.com. Please note that all sales are final and no refunds are issued under any circumstances.",
      ],
    },
    {
      heading: "2. Educational Purpose; Not Medical Advice",
      paragraphs: [
        "Everything we publish \u2014 including our courses, guides, articles, and other content \u2014 is provided for general educational and informational purposes only and does not constitute medical advice. Although our content discusses peptides, including their use and dosing, it is not a substitute for consultation, diagnosis, or treatment by a qualified healthcare professional. Always seek the guidance of your physician or another licensed provider before making any health-related decisions. House of Life Sciences LLC accepts no liability for any loss, injury, or damage claimed to arise from reliance on information found on the Website.",
      ],
    },
    {
      heading: "3. No Guaranteed Outcomes",
      paragraphs: [
        "We make no promises or guarantees regarding any specific result you may achieve from the information, content, or products referenced on the Website.",
      ],
    },
    {
      heading: "4. Affiliate Links and Third-Party Relationships",
      paragraphs: [
        "The Website may contain affiliate links and feature partnerships that direct you to third-party websites. We do not control and are not responsible for the content, policies, or transactions of those external sites. From time to time, we may also share member information with peptide eCommerce partners who sell peptides strictly for research purposes. These partners operate under their own terms and privacy practices, for which they alone are responsible.",
      ],
    },
    {
      heading: "5. Payments, Subscriptions, and Refunds",
      paragraphs: [
        "All membership, course, and digital download payments are handled through secure third-party payment processors. By purchasing a membership or product, you authorize recurring monthly charges until you cancel. We do not provide refunds for any reason. To stop future billing, please contact us at info@houseoflifesciences.com before your next renewal date.",
      ],
    },
    {
      heading: "6. Intellectual Property",
      paragraphs: [
        "All materials on the Website \u2014 including text, graphics, logos, course content, videos, and guides \u2014 are the exclusive property of House of Life Sciences LLC and are protected by copyright, trademark, and other applicable intellectual property laws. You may not reproduce, copy, modify, distribute, republish, or otherwise exploit any part of our content without our prior written consent.",
      ],
    },
    {
      heading: "7. Data Collection and Privacy",
      paragraphs: [
        "In operating the Website, we collect personal details such as your name, email address, phone number, mailing address, and payment information. We also use third-party analytics and advertising tools to understand how visitors interact with our site, including but not limited to Google Analytics, Hotjar, Google Ads, Meta Ads, Reddit Ads, and TikTok Ads. For a full explanation of how we handle your data, please review our Privacy Policy.",
      ],
    },
    {
      heading: "8. Limitation of Liability",
      paragraphs: [
        "To the fullest extent permitted by law, House of Life Sciences LLC disclaims all liability for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Website or your reliance on any content it contains.",
      ],
    },
    {
      heading: "9. Indemnification",
      paragraphs: [
        "You agree to defend, indemnify, and hold harmless House of Life Sciences LLC and its affiliates, officers, employees, and partners from and against any claims, losses, liabilities, damages, or expenses (including reasonable legal fees) arising out of your use of the Website or your violation of these Terms.",
      ],
    },
    {
      heading: "10. Governing Law",
      paragraphs: [
        "These Terms are governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict-of-laws principles.",
      ],
    },
    {
      heading: "11. Changes to These Terms",
      paragraphs: [
        "We reserve the right to revise or update these Terms at any time and without prior notice. Your continued use of the Website after any changes take effect constitutes your acceptance of the updated Terms.",
      ],
    },
    {
      heading: "12. Contact Us",
      paragraphs: [
        "If you have any questions about these Terms & Conditions, please contact us at info@houseoflifesciences.com.",
      ],
    },
  ],
};

export const legalDocuments: Record<string, LegalDocument> = {
  privacy: privacyPolicy,
  terms: termsAndConditions,
};
