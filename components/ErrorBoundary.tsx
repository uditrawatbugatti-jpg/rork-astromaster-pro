import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends React.PureComponent<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ErrorBoundary caught error:", message);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container} testID="errorBoundary">
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle} numberOfLines={4}>
          {this.state.errorMessage}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={this.handleReset}
          testID="errorBoundary.reset"
        >
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cosmic.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.cosmic.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.cosmic.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.cosmic.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buttonText: {
    color: Colors.cosmic.background,
    fontSize: 14,
    fontWeight: "800" as const,
  },
});
