import { Redirect } from 'expo-router';

export default function ListingTabRedirect() {
  return <Redirect href={"/(tabs)/listings" as any} />;
}
