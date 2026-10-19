import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>M</Text>
          </View>
          <Text style={styles.brandTitle}>Melody</Text>
        </View>
        <Text style={styles.brandSubtitle}>Pure Tuber Experience</Text>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'home' && (
          <View style={styles.section}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTag}>OFFICIAL STREAMING</Text>
              <Text style={styles.heroTitle}>YouTube & Local Music</Text>
              <Text style={styles.heroDesc}>
                Compliant video playback via official YouTube player + background audio for your local device files.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Featured Categories</Text>
            <View style={styles.genreGrid}>
              {['Hip-Hop', 'Electronic', 'Lofi Beats', 'Ambient', 'Rock', 'Pop'].map((genre) => (
                <TouchableOpacity key={genre} style={styles.genreTile}>
                  <Text style={styles.genreTileText}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'search' && (
          <View style={styles.section}>
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search songs, artists, or paste YouTube link..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Text style={styles.sectionTitle}>YouTube & Music Search</Text>
            <Text style={styles.emptyText}>Enter a query above to search YouTube music videos.</Text>
          </View>
        )}

        {activeTab === 'library' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offline & Local Library</Text>
            <Text style={styles.emptyText}>Import audio files (.mp3, .m4a, .flac) to listen with screen turned off.</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
        >
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          style={[styles.navItem, activeTab === 'search' && styles.navItemActive]}
        >
          <Text style={[styles.navText, activeTab === 'search' && styles.navTextActive]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          style={[styles.navItem, activeTab === 'library' && styles.navItemActive]}
        >
          <Text style={[styles.navText, activeTab === 'library' && styles.navTextActive]}>Library</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090e',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreTile: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  genreTileText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBarContainer: {
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0b0f19',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#1e293b',
  },
  navText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#38bdf8',
  },
});
