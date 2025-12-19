import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { X } from "lucide-react-native";

export default function ModalScreen() {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <Pressable style={styles.overlay} onPress={() => router.back()}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={() => router.back()}
          >
            <X size={24} color={Colors.cosmic.textMuted} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Information</Text>
          <Text style={styles.description}>
            This modal can be used for displaying additional information,
            confirmation dialogs, or detailed explanations.
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 14, 39, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.cosmic.card,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    minWidth: 300,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
  },
  closeIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold" as const,
    marginBottom: 16,
    color: Colors.cosmic.text,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    color: Colors.cosmic.textSecondary,
    lineHeight: 22,
    fontSize: 15,
  },
  closeButton: {
    backgroundColor: Colors.cosmic.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
  },
  closeButtonText: {
    color: Colors.cosmic.background,
    fontWeight: "700" as const,
    textAlign: "center",
    fontSize: 16,
  },
});
