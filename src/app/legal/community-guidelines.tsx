import React from 'react';
import { PolicyScreen } from '../../components/ui/PolicyScreen';

export default function CommunityGuidelinesScreen() {
  return <PolicyScreen title="Community Guidelines" intro="Help keep Bazarr 360 useful and safe for buyers, sellers, and local communities." sections={[
    { title: 'Be honest', body: 'Use accurate titles, prices, descriptions, locations, and photos. Do not create fake listings, manipulate engagement, or misrepresent an item.' },
    { title: 'No fraud or scams', body: 'Do not request passwords, OTPs, PINs, or advance payments through deceptive methods. Never use the app to facilitate theft, fraud, or money laundering.' },
    { title: 'Legal and safe content', body: 'Do not list illegal goods or services, weapons, controlled substances, stolen property, counterfeit goods, or content that exploits or endangers people.' },
    { title: 'Respect others', body: 'Harassment, threats, hate speech, discrimination, sexual exploitation, and abusive communication are not allowed.' },
    { title: 'Protect privacy', body: 'Do not publish another person’s private information, identity documents, financial details, or images without permission.' },
    { title: 'Report problems', body: 'Use the report controls on listings, reels, profiles, or messages when you see a violation. We may review reports and take action under our policies.' },
  ]} />;
}
