import React from 'react';
import { PolicyScreen } from '../../components/ui/PolicyScreen';

export default function TermsScreen() {
  return <PolicyScreen title="Terms & Conditions" intro="By using Bazarr 360, you agree to use the service responsibly and follow these marketplace rules." sections={[
    { title: 'Marketplace service', body: 'Bazarr 360 provides tools for users to discover listings, publish content, communicate, and connect. Bazarr 360 does not own, inspect, or guarantee items listed by users and is not a party to private transactions.' },
    { title: 'Accounts', body: 'Provide accurate information, keep your account secure, and do not share access credentials or impersonate another person.' },
    { title: 'Listings and media', body: 'You must have the right to list an item and upload its media. Listings must be accurate, current, and placed in the correct category. Do not upload stolen, illegal, counterfeit, or misleading content.' },
    { title: 'Transactions and communication', body: 'Buyers and sellers are responsible for checking items, agreeing on terms, and complying with applicable law. Use chat respectfully and do not send spam, threats, or requests for sensitive credentials.' },
    { title: 'Reports and enforcement', body: 'We may remove content, restrict features, suspend accounts, or cooperate with lawful requests when users violate these terms or create safety risks.' },
    { title: 'Disclaimer', body: 'The service is provided on an availability basis. We do not guarantee the quality, legality, ownership, or accuracy of user-generated listings.' },
    { title: 'Changes', body: 'We may update these terms as the product changes. Continued use after an update means you accept the revised terms.' },
    { title: 'Contact', body: 'Questions about these terms can be raised through the Help & Support screen.' },
  ]} />;
}
