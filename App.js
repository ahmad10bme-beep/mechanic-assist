import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mechanic-assist:history:v1';
// الرابط العالمي الخاص بك على Render - تأكد من صحته 100%
const API_BASE_URL = 'https://mechanic-assist-server.onrender.com';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setMessages(parsed);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsInitialized(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = { role: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // إنشاء "وحدة تحكم" لقطع الاتصال إذا طال الانتظار جداً (دقيقتين للسيرفر المجاني)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); 

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply, ts: Date.now() }]);
      } else {
        throw new Error(data.error || 'السيرفر يواجه ضغطاً حالياً');
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error(e);
      // تنبيه مخصص لحالة السيرفر "النايم"
      Alert.alert(
        'جاري تجهيز الخبير', 
        'خبير الميكانيكا في طريقه إليك! السيرفر يستغرق حوالي 30 ثانية للعمل في أول مرة. يرجى المحاولة مرة أخرى الآن.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المساعد التقني</Text>
        <Text style={styles.headerSubtitle}>للمبتكر أحمد الزهراني</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          style={styles.messagesList} 
          contentContainerStyle={{ paddingBottom: 20 }}
          ref={(ref) => { this.scrollView = ref; }}
          onContentSizeChange={() => this.scrollView.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={styles.bubbleText}>{m.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.loadingText}>جاري تحليل مشكلتك...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TextInput 
            style={styles.chatInput} 
            placeholder="اسأل خبير الميكانيكا..." 
            placeholderTextColor="#999" 
            value={input} 
            onChangeText={setInput} 
            multiline={false}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? '...' : 'إرسال'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#007AFF', fontSize: 12, marginTop: 4 },
  messagesList: { flex: 1, padding: 15 },
  bubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#0B5FFF' },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  bubbleText: { color: '#fff', textAlign: 'right', lineHeight: 22 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#121212' },
  chatInput: { flex: 1, backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 25, paddingHorizontal: 20, height: 45, textAlign: 'right' },
  sendButton: { backgroundColor: '#007AFF', marginLeft: 10, paddingHorizontal: 20, borderRadius: 25, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 10 },
  loadingText: { color: '#888', marginLeft: 10, fontSize: 12 }
});