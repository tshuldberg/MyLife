import { Redirect } from 'expo-router';

export default function PetsIndexRedirect() {
  return <Redirect href="/(pets)/pets" />;
}
