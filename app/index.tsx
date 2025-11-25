import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to TradePlus</Text>
        <Text style={styles.subtitle}>
          A hybrid marketplace for Cash, Barter, and Cash+Barter deals
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features:</Text>
          <Text style={styles.feature}>• Buy items with cash</Text>
          <Text style={styles.feature}>• Barter items with sellers</Text>
          <Text style={styles.feature}>• Combine barter + cash</Text>
          <Text style={styles.feature}>• List items and choose payment modes</Text>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Note: This is the Expo mobile app. The web app is available at /apps/web
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  feature: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    paddingLeft: 10,
  },
  note: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  noteText: {
    fontSize: 14,
    color: '#1976d2',
  },
});




