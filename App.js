import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import ImageScreen from './ImageScreen';
import * as Sharing from 'expo-sharing';

const STORAGE_KEY = '@mechanic-assist:history:v1';
// الرابط العالمي الخاص بك على Render - تأكد من صحته 100%
const API_BASE_URL = 'https://mechanic-assist.onrender.com';

export default function App() {
  const scrollViewRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showImageScreen, setShowImageScreen] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

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

  const clearChat = async () => {
    setMessages([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setMenuVisible(false);
  };

  const newChat = () => {
    setMessages([]);
    setMenuVisible(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = { role: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

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
      Alert.alert(
        'جاري تجهيز الخبير', 
        'خبير الميكانيكا في طريقه إليك! السيرفر يستغرق حوالي 30 ثانية للعمل في أول مرة. يرجى المحاولة مرة أخرى الآن.'
      );
    } finally {
      setLoading(false);
    }
  };

  const shareChat = async () => {
    const text = messages.map(m => `${m.role === 'user' ? 'أنت' : 'المساعد'}: ${m.text}`).join('\n');
    await Sharing.shareAsync(text);
  };

  if (!isInitialized) return null;

  if (showImageScreen) {
    return <ImageScreen onBack={() => setShowImageScreen(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>المساعد التقني</Text>
            <Text style={styles.headerSubtitle}>للمبتكر أحمد الزهراني</Text>
          </View>
          <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoButton}>
            <Text style={styles.infoIcon}>❗</Text>
          </TouchableOpacity>
        </View>
        {menuVisible && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowImageScreen(true); setMenuVisible(false); }}>
              <Text style={styles.menuItemText}>🎨 مرسم القطع</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={newChat}>
              <Text style={styles.menuItemText}>📝 محادثة جديدة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={clearChat}>
              <Text style={styles.menuItemText}>🗑️ مسح المحادثة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { shareChat(); setMenuVisible(false); }}>
              <Text style={styles.menuItemText}>📤 مشاركة المحادثة</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={infoModalVisible} transparent={true} animationType="slide" onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <Text style={styles.infoModalTitle}>ℹ️ عن المشروع</Text>
            <ScrollView style={styles.infoModalScroll}>
              <Text style={styles.infoModalSection}>🎯 نبذة عن المشروع</Text>
              <Text style={styles.infoModalText}>
                تطبيق مساعد الميكانيكي هو نظام ذكي يستخدم الذكاء الاصطناعي لمساعدة ملاك السيارات في تشخيص مشاكل المركبات وتوفير حلول تقنية مفصلة مع رسومات توضيحية دقيقة لقطع الغيار.
              </Text>
              
              <Text style={styles.infoModalSection}>🔧 التخصصات</Text>
              <Text style={styles.infoModalText}>• ميكانيكا السيارات</Text>
              <Text style={styles.infoModalText}>• الكهرباء والإلكترونيات</Text>
              <Text style={styles.infoModalText}>• الحاسب والبرمجة</Text>
              <Text style={styles.infoModalText}>• التبريد والتكييف</Text>
              
              <Text style={styles.infoModalSection}>👨‍🎓 المتدربون</Text>
              <Text style={styles.infoModalText}>• أحمد الزهراني - المطور الرئيسي</Text>
              <Text style={styles.infoModalText}>• معتز القرني - المتدرب المساعد</Text>
              
              <Text style={styles.infoModalSection}>👨‍🏫 المشرف</Text>
              <Text style={styles.infoModalText}>• المهندس فيصل الطلحي</Text>
            </ScrollView>
            <TouchableOpacity onPress={() => setInfoModalVisible(false)} style={styles.infoModalButton}>
              <Text style={styles.infoModalButtonText}>✓ فهمت</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          style={styles.messagesList} 
          contentContainerStyle={{ paddingBottom: 20 }}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && !loading && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>👋 أهلاً بك في مساعد الميكانيكي!</Text>
              <Text style={styles.welcomeText}>
                أنا هنا لأساعدك في مشاكل سيارتك وتوفير معلومات مفيدة عن قطع الغيار.
              </Text>
              <Text style={styles.welcomeTip}>
                💡 تلميح: اضغط على القائمة (☰) في الأعلى لتوليد صور قطع الغيار
              </Text>
            </View>
          )}
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={styles.bubbleText}>{m.text}</Text>
              {m.ts ? <Text style={styles.bubbleTime}>{new Date(m.ts).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</Text> : null}
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
  welcomeContainer: { padding: 30, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  welcomeTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  welcomeText: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  welcomeTip: { color: '#FFD700', fontSize: 14, textAlign: 'center', backgroundColor: '#2A2A2A', padding: 12, borderRadius: 10, overflow: 'hidden' },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#007AFF', fontSize: 12, marginTop: 4 },
  menuButton: { padding: 8 },
  menuIcon: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  menuDropdown: { position: 'absolute', top: 55, left: 10, backgroundColor: '#2A2A2A', borderRadius: 10, borderWidth: 1, borderColor: '#444', minWidth: 160, zIndex: 10, elevation: 5 },
  menuItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#444' },
  menuItemText: { color: '#fff', fontSize: 15, textAlign: 'right' },
  messagesList: { flex: 1, padding: 15 },
  bubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#0B5FFF' },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  bubbleText: { color: '#fff', textAlign: 'right', lineHeight: 22 },
  bubbleTime: { color: '#888', fontSize: 10, textAlign: 'right', marginTop: 4 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#121212' },
  chatInput: { flex: 1, backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 25, paddingHorizontal: 20, height: 45, textAlign: 'right' },
  sendButton: { backgroundColor: '#007AFF', marginLeft: 10, paddingHorizontal: 20, borderRadius: 25, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 10 },
  loadingText: { color: '#888', marginLeft: 10, fontSize: 12 },
  infoButton: { padding: 8 },
  infoIcon: { color: '#FFD700', fontSize: 24 },
  infoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  infoModalContent: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, width: '90%', maxHeight: '80%', borderWidth: 1, borderColor: '#333' },
  infoModalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  infoModalScroll: { maxHeight: 400 },
  infoModalSection: { color: '#007AFF', fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, textAlign: 'right' },
  infoModalText: { color: '#ccc', fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 5 },
  infoModalButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 20, alignSelf: 'center' },
  infoModalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});