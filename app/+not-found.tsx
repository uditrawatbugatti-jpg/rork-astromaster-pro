import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import Colors from "@/constants/colors";
import { AlertCircle } from "lucide-react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        title: "Not Found",
        headerStyle: {
          backgroundColor: Colors.cosmic.background,
        },
        headerTintColor: Colors.cosmic.text,
      }} />
      <View style={styles.container}>
        <AlertCircle size={64} color={Colors.cosmic.warning} />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.description}>
          The cosmic path you seek does not exist in this realm.
        </Text>

        <Link href="/" style={styles.link}>
          <View style={styles.linkButton}>
            <Text style={styles.linkText}>Return to Dashboard</Text>
          </View>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: Colors.cosmic.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.cosmic.text,
    marginTop: 24,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.cosmic.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  link: {
    marginTop: 15,
  },
  linkButton: {
    backgroundColor: Colors.cosmic.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.cosmic.background,
  },
});
