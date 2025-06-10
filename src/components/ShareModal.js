// src/components/ShareModal.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Share,
  Linking,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

const ShareModal = ({ visible, onClose, article }) => {
  if (!article) return null;

  const shareOptions = [
    {
      id: "instagram",
      name: "Instagram",
      icon: "logo-instagram",
      color: "#E4405F",
      action: () => shareToInstagram(),
    },
    {
      id: "whatsapp",
      name: "Whatsapp",
      icon: "logo-whatsapp",
      color: "#25D366",
      action: () => shareToWhatsApp(),
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "logo-facebook",
      color: "#1877F2",
      action: () => shareToFacebook(),
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: "send",
      color: "#0088CC",
      action: () => shareToTelegram(),
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "logo-linkedin",
      color: "#0A66C2",
      action: () => shareToLinkedIn(),
    },
  ];

  const recentPeople = [
    { id: 1, name: "John Jones", avatar: "👨‍💼", hasInstagram: true },
    { id: 2, name: "Chris Davis", avatar: "👨‍🎓", hasWhatsApp: true },
    { id: 3, name: "Charlotte Hanlin", avatar: "👩‍💼", hasFacebook: true },
    { id: 4, name: "Dan Brown", avatar: "👨‍🔬", hasTelegram: true },
    { id: 5, name: "Hannah Montana", avatar: "👩‍🎤", hasLinkedIn: true },
  ];

  const shareToInstagram = async () => {
    try {
      const url = "instagram://story-camera";
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Instagram not installed",
          "Please install Instagram to share"
        );
      }
    } catch (error) {
      await Share.share({
        message: `${article.shortTitle}\n\n${article.introduction}`,
      });
    }
    onClose();
  };

  const shareToWhatsApp = async () => {
    try {
      const message = encodeURIComponent(
        `${article.shortTitle}\n\n${article.introduction}`
      );
      const url = `whatsapp://send?text=${message}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          message: `${article.shortTitle}\n\n${article.introduction}`,
        });
      }
    } catch (error) {
      await Share.share({
        message: `${article.shortTitle}\n\n${article.introduction}`,
      });
    }
    onClose();
  };

  const shareToFacebook = async () => {
    try {
      const url = "fb://";
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          message: `${article.shortTitle}\n\n${article.introduction}`,
        });
      }
    } catch (error) {
      await Share.share({
        message: `${article.shortTitle}\n\n${article.introduction}`,
      });
    }
    onClose();
  };

  const shareToTelegram = async () => {
    try {
      const message = encodeURIComponent(
        `${article.shortTitle}\n\n${article.introduction}`
      );
      const url = `tg://msg?text=${message}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          message: `${article.shortTitle}\n\n${article.introduction}`,
        });
      }
    } catch (error) {
      await Share.share({
        message: `${article.shortTitle}\n\n${article.introduction}`,
      });
    }
    onClose();
  };

  const shareToLinkedIn = async () => {
    try {
      const url = "linkedin://";
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          message: `${article.shortTitle}\n\n${article.introduction}`,
        });
      }
    } catch (error) {
      await Share.share({
        message: `${article.shortTitle}\n\n${article.introduction}`,
      });
    }
    onClose();
  };

  const shareToPerson = async (person) => {
    await Share.share({
      message: `Hi ${person.name}! Check out this article: ${article.shortTitle}\n\n${article.introduction}`,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share To</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Recent People */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent People</Text>
                <View style={styles.peopleContainer}>
                  {recentPeople.map((person) => (
                    <TouchableOpacity
                      key={person.id}
                      style={styles.personItem}
                      onPress={() => shareToPerson(person)}
                    >
                      <View style={styles.personAvatar}>
                        <Text style={styles.avatarText}>{person.avatar}</Text>
                        {/* Platform indicator */}
                        {person.hasInstagram && (
                          <View
                            style={[
                              styles.platformIndicator,
                              { backgroundColor: "#E4405F" },
                            ]}
                          >
                            <Ionicons
                              name="logo-instagram"
                              size={8}
                              color="white"
                            />
                          </View>
                        )}
                        {person.hasWhatsApp && (
                          <View
                            style={[
                              styles.platformIndicator,
                              { backgroundColor: "#25D366" },
                            ]}
                          >
                            <Ionicons
                              name="logo-whatsapp"
                              size={8}
                              color="white"
                            />
                          </View>
                        )}
                        {person.hasFacebook && (
                          <View
                            style={[
                              styles.platformIndicator,
                              { backgroundColor: "#1877F2" },
                            ]}
                          >
                            <Ionicons
                              name="logo-facebook"
                              size={8}
                              color="white"
                            />
                          </View>
                        )}
                        {person.hasTelegram && (
                          <View
                            style={[
                              styles.platformIndicator,
                              { backgroundColor: "#0088CC" },
                            ]}
                          >
                            <Ionicons name="send" size={8} color="white" />
                          </View>
                        )}
                        {person.hasLinkedIn && (
                          <View
                            style={[
                              styles.platformIndicator,
                              { backgroundColor: "#0A66C2" },
                            ]}
                          >
                            <Ionicons
                              name="logo-linkedin"
                              size={8}
                              color="white"
                            />
                          </View>
                        )}
                      </View>
                      <Text style={styles.personName} numberOfLines={2}>
                        {person.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Social Media */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Social Media</Text>
                <View style={styles.socialContainer}>
                  {shareOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.socialItem}
                      onPress={option.action}
                    >
                      <View
                        style={[
                          styles.socialIcon,
                          { backgroundColor: option.color },
                        ]}
                      >
                        <Ionicons name={option.icon} size={24} color="white" />
                      </View>
                      <Text style={styles.socialName}>{option.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  peopleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  personItem: {
    alignItems: "center",
    width: (width - 80) / 5,
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  avatarText: {
    fontSize: 20,
  },
  platformIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  personName: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    lineHeight: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialItem: {
    alignItems: "center",
    width: (width - 80) / 5,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  socialName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

export default ShareModal;
