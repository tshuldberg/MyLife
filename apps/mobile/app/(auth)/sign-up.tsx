import { useCallback, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { registerUser, createAuthTables } from '@mylife/auth';
import { AuthForm, colors, Text } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function SignUpScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setError(undefined);

      if (!db) {
        router.replace('/(hub)');
        return;
      }

      createAuthTables(db);
      const result = registerUser(db, email, password, displayName);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace('/(hub)');
    },
    [db, router],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AuthForm mode="sign-up" onSubmit={handleSubmit} error={error} />
      <View style={styles.altLink}>
        <Text variant="caption" color={colors.textTertiary}>
          Already have an account?{' '}
        </Text>
        <Link href="/(auth)/sign-in">
          <Text variant="caption" color={colors.text}>
            Sign in
          </Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 64,
  },
  altLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
});
