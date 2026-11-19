import React from 'react';
import { PolicyScreen } from '../../components/ui/PolicyScreen';

export default function PrivacyPolicyScreen() {
  return <PolicyScreen title="Privacy Policy" intro="This policy explains how Bazarr 360 handles information when you use our marketplace, listings, reels, profiles, and chat features." sections={[
    { title: 'Information we collect', body: 'We may collect account details such as your name, email address, phone number, profile information, listings, uploaded photos or videos, and messages you send through the app.' },
    { title: 'Location information', body: 'You may choose a state, city, district, or locality to find nearby listings. Precise device location is optional and is not required to browse the marketplace.' },
    { title: 'How we use information', body: 'We use information to provide the app, show relevant listings, connect buyers and sellers, protect users, prevent abuse, provide support, and improve reliability.' },
    { title: 'Sharing and visibility', body: 'Public profile and listing information can be visible to other users. We do not make private account credentials or access tokens public. We may use service providers for hosting, media storage, email, and infrastructure.' },
    { title: 'Media and messages', body: 'Uploaded listing and reel media is processed through the configured storage provider. Chat messages are shared with the participants of that conversation and may be reviewed when required for safety or moderation.' },
    { title: 'Retention and security', body: 'We retain information for as long as needed to operate the service, meet legal obligations, resolve disputes, and enforce safety rules. We use reasonable technical and organisational safeguards, but no online service can guarantee absolute security.' },
    { title: 'Your choices', body: 'You can update available profile information, control optional location access, report content, and request account deletion through Settings or Support.' },
    { title: 'Contact', body: 'For privacy questions or requests, contact Bazarr 360 through the Help & Support screen.' },
  ]} />;
}
