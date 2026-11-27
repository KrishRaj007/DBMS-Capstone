import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_URL = 'http://172.18.14.104:5173';

export default function App() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [showConfig, setShowConfig] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B14" />
      
      {showConfig && (
        <View style={styles.configBar}>
          <TextInput
            style={styles.urlInput}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="http://172.18.14.104:5173"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              setCurrentUrl(inputUrl);
              setShowConfig(false);
            }}
          >
            <Text style={styles.saveBtnText}>Connect</Text>
          </TouchableOpacity>
        </View>
      )}

      <WebView
        key={currentUrl}
        source={{ uri: currentUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Connecting to BeatPulse...</Text>
            <Text style={styles.subText}>{currentUrl}</Text>
          </View>
        )}
        renderError={() => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to reach web app</Text>
            <Text style={styles.errorMsg}>
              Ensure your Vite dev server is running on your computer:
            </Text>
            <Text style={styles.codeSnippet}>npm run dev</Text>
            <Text style={styles.errorMsg}>
              Make sure your Android phone is on the same Wi-Fi network.
            </Text>
            <Text style={styles.errorTarget}>Target: {currentUrl}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => setShowConfig(!showConfig)}
            >
              <Text style={styles.retryBtnText}>Change IP / URL</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B14',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0B0B14',
  },
  configBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#141422',
    borderBottomWidth: 1,
    borderColor: '#242436',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#0B0B14',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333348',
  },
  saveBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0B14',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  subText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B0B14',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  errorMsg: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  codeSnippet: {
    backgroundColor: '#141422',
    color: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 10,
  },
  errorTarget: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
