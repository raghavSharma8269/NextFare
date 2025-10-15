import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={24}
          color="#a0d2eb"
          style={styles.settingIcon}
        />
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#0f0f15", "#1a1a24"]} style={styles.gradient}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <SettingItem
              icon="location-outline"
              title="Location Services"
              subtitle="Allow location access for nearby events"
              showArrow={false}
              rightComponent={
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: "#374151", true: "#8458B3" }}
                  thumbColor={locationEnabled ? "#a0d2eb" : "#6b7280"}
                />
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <SettingItem
              icon="person-outline"
              title="Profile"
              subtitle="View and edit your profile"
              onPress={() => navigation.navigate("Profile")}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <SettingItem
              icon="help-circle-outline"
              title="Help & FAQ"
              onPress={() => console.log("Help pressed")}
            />

            <SettingItem
              icon="mail-outline"
              title="Contact Support"
              onPress={() => console.log("Contact pressed")}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            <SettingItem
              icon="information-circle-outline"
              title="App Version"
              subtitle="1.0.0"
              showArrow={false}
            />

            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => console.log("Terms pressed")}
            />

            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => console.log("Privacy pressed")}
            />
          </View>

          <View style={styles.footer}>
            <LinearGradient
              colors={[
                "transparent",
                "rgba(160, 210, 235, 0.1)",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />
            <Text style={styles.footerText}>NextFare © 2025</Text>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: "rgba(30, 30, 46, 0.6)",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(160, 210, 235, 0.2)",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Sansation-Bold",
    fontWeight: "600",
    color: "#a0d2eb",
    backgroundColor: "rgba(26, 26, 36, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160, 210, 235, 0.1)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107, 114, 128, 0.1)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: "Sansation-Regular",
    color: "#f8f9fa",
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: "Sansation-Regular",
    color: "#9ca3af",
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    padding: 30,
    alignItems: "center",
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Sansation-Regular",
    color: "#6b7280",
  },
});

export default SettingsScreen;
