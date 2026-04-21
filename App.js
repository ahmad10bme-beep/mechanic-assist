import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Clipboard,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import ImageScreen from './ImageScreen';

// الرابط العالمي الخاص بك على Render - تأكد من صحته 100%
const API_BASE_URL = 'https://mechanic-assist.onrender.com';
const STORAGE_KEY = '@mechanic-assist:history:v1';
const SAVED_CHATS_KEY = '@mechanic-assist:saved-chats:v1';
const THEME_COLOR_KEY = '@mechanic-assist:theme-color:v1';
const BACKGROUND_THEME_KEY = '@mechanic-assist:background-theme:v1';
const FONT_SIZE_KEY = '@mechanic-assist:font-size:v1';
const SOUND_ENABLED_KEY = '@mechanic-assist:sound-enabled:v1';

export default function App() {
  const scrollViewRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showImageScreen, setShowImageScreen] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [savedChatsModalVisible, setSavedChatsModalVisible] = useState(false);
  const [themeColor, setThemeColor] = useState('#007AFF');
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [backgroundTheme, setBackgroundTheme] = useState('dark');
  const [newMessageIndex, setNewMessageIndex] = useState(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'small', 'normal', 'large'
  const [soundEnabled, setSoundEnabled] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [emojiAnim] = useState(new Animated.Value(0));

  // Background themes with gradients and floating emojis
  const BACKGROUND_THEMES = {
    dark: { colors: ['#121212', '#1a1a2e', '#16213e'], emojis: ['✨', '⭐', '🌟', '💫'], emojiColors: ['#FFD700', '#FFA500', '#FFEC8B', '#FFF8DC'] },
    midnight: { colors: ['#0a0a1a', '#1a1a3a', '#2d1b69'], emojis: ['🌙', '✨', '🦊', '🔮', '🌟'], emojiColors: ['#FFD700', '#FF6347', '#FF8C00', '#9370DB', '#FFF'] },
    ocean: { colors: ['#001a33', '#003d5c', '#006680'], emojis: ['🌊', '🐠', '💙', '🐟', '🌊', '✨'], emojiColors: ['#00BFFF', '#FFD700', '#87CEEB', '#4682B4', '#5F9EA0', '#ADD8E6'] },
    forest: { colors: ['#0a1f0a', '#1a3a1a', '#2d5a27'], emojis: ['🌿', '🦊', '🍃', '🌲', '🦋', '🌸'], emojiColors: ['#32CD32', '#FF8C00', '#228B22', '#006400', '#FF69B4', '#90EE90'] },
    royal: { colors: ['#1a0a33', '#3d1a5c', '#5c2d91'], emojis: ['👑', '💜', '✨', '💎', '🔮', '⭐'], emojiColors: ['#FFD700', '#9370DB', '#FFA500', '#E0FFFF', '#DDA0DD', '#FFF'] },
    sunset: { colors: ['#2a1a1a', '#4a2a3a', '#8b4a5c'], emojis: ['🌅', '💖', '🦊', '🧡', '💛', '🌸'], emojiColors: ['#FF6347', '#FFD700', '#FF8C00', '#FFA07A', '#FFEC8B', '#FFB6C1'] },
    space: { colors: ['#000000', '#1a0a2e', '#2d1b4e'], emojis: ['🚀', '🌟', '👽', '🛸', '🔭', '🪐', '✨'], emojiColors: ['#FFD700', '#00BFFF', '#32CD32', '#FF69B4', '#C0C0C0', '#FFA500', '#FFF'] },
    charcoal: { colors: ['#1a1a2e', '#2d2d44', '#3d3d5c'], emojis: ['🔧', '⚙️', '🔩', '🛠️', '⚡', '💡'], emojiColors: ['#C0C0C0', '#A9A9A9', '#D3D3D3', '#696969', '#FFD700', '#FFF'] },
  };

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setMessages(parsed);
        }
        const saved = await AsyncStorage.getItem(SAVED_CHATS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setSavedChats(parsed);
        }
        const theme = await AsyncStorage.getItem(THEME_COLOR_KEY);
        if (theme) setThemeColor(theme);
        const bgTheme = await AsyncStorage.getItem(BACKGROUND_THEME_KEY);
        if (bgTheme) setBackgroundTheme(bgTheme);
        const savedFontSize = await AsyncStorage.getItem(FONT_SIZE_KEY);
        if (savedFontSize) setFontSize(savedFontSize);
        const savedSound = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
        if (savedSound !== null) setSoundEnabled(savedSound === 'true');
      } catch (e) {
        console.warn(e);
      } finally {
        setIsInitialized(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (newMessageIndex !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ]),
        { iterations: 2 }
      ).start();
    }
  }, [newMessageIndex]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(emojiAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const clearChat = async () => {
    setMessages([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setMenuVisible(false);
  };

  const saveCurrentChat = async () => {
    if (messages.length === 0) {
      Alert.alert('تنبيه', 'لا توجد محادثة لحفظها');
      return;
    }
    const chatName = `محادثة ${new Date().toLocaleDateString('ar-SA')} ${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
    const newSavedChat = { id: Date.now(), name: chatName, messages: [...messages], date: Date.now() };
    const updated = [...savedChats, newSavedChat];
    setSavedChats(updated);
    await AsyncStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated));
    Alert.alert('✅ تم الحفظ', `تم حفظ المحادثة: ${chatName}`);
    setMenuVisible(false);
  };

  const loadSavedChat = async (chat) => {
    setMessages(chat.messages);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chat.messages));
    setSavedChatsModalVisible(false);
    Alert.alert('📚 تم التحميل', `تم استعادة: ${chat.name}`);
  };

  const deleteSavedChat = async (chatId) => {
    const updated = savedChats.filter(c => c.id !== chatId);
    setSavedChats(updated);
    await AsyncStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated));
  };

  const changeThemeColor = async (color) => {
    setThemeColor(color);
    await AsyncStorage.setItem(THEME_COLOR_KEY, color);
  };

  const changeBackgroundTheme = async (theme) => {
    setBackgroundTheme(theme);
    await AsyncStorage.setItem(BACKGROUND_THEME_KEY, theme);
  };

  const changeFontSize = async (size) => {
    setFontSize(size);
    await AsyncStorage.setItem(FONT_SIZE_KEY, size);
  };

  const toggleSound = async () => {
    setSoundEnabled(!soundEnabled);
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(!soundEnabled));
  };

  const getCurrentTheme = () => BACKGROUND_THEMES[backgroundTheme] || BACKGROUND_THEMES.dark;

  const getGradientColors = () => {
    return getCurrentTheme().colors;
  };

  const renderFloatingEmojis = () => {
    const theme = getCurrentTheme();
    // Random positions scattered around the screen
    const randomPositions = [
      { left: 5, top: 100 }, { left: 280, top: 150 }, { left: 150, top: 80 },
      { left: 60, top: 300 }, { left: 300, top: 400 }, { left: 20, top: 500 },
      { left: 250, top: 600 }, { left: 100, top: 200 }, { left: 320, top: 250 },
      { left: 40, top: 450 }, { left: 200, top: 350 }, { left: 120, top: 550 },
      { left: 290, top: 120 }, { left: 15, top: 650 }, { left: 180, top: 180 },
      { left: 330, top: 500 }, { left: 70, top: 380 }, { left: 260, top: 280 },
    ];
    return theme.emojis.map((emoji, index) => {
      const pos = randomPositions[index % randomPositions.length];
      return (
        <Animated.Text
          key={index}
          style={[
            styles.floatingEmoji,
            {
              color: theme.emojiColors[index % theme.emojiColors.length],
              left: pos.left,
              top: pos.top,
              fontSize: 28 + (index % 4) * 12, // 28-64px (much bigger!)
              transform: [
                {
                  translateY: emojiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -40 + (index * 15)]
                  })
                },
                {
                  translateX: emojiAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, (index % 2 === 0 ? 20 : -20), 0]
                  })
                },
                {
                  rotate: emojiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(index % 2 === 0 ? 1 : -1) * (10 + (index * 5))}deg`]
                  })
                }
              ],
              opacity: emojiAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.9, 0.2]
              })
            }
          ]}
        >
          {emoji}
        </Animated.Text>
      );
    });
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
    const newIndex = messages.length;
    setMessages(prev => [...prev, userMsg]);
    setNewMessageIndex(newIndex);
    setTimeout(() => setNewMessageIndex(null), 3500);
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
        if (soundEnabled) {
          // Play notification beep
          try {
            const sound = new Audio.Sound();
            await sound.loadAsync(require('./assets/notification.mp3'));
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate(async (status) => {
              if (status.didJustFinish) {
                await sound.unloadAsync();
              }
            });
          } catch (e) {
            console.log('Sound not available');
          }
        }
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

  const copyMessage = (text) => {
    Clipboard.setString(text);
    Alert.alert('📋 تم النسخ', 'تم نسخ الرسالة إلى الحافظة');
  };

  const styles = getStyles(themeColor, fontSize);

  if (!isInitialized) return null;

  if (showImageScreen) {
    return <ImageScreen onBack={() => setShowImageScreen(false)} />;
  }

  return (
    <LinearGradient colors={getGradientColors()} style={styles.gradientBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {renderFloatingEmojis()}
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
            <TouchableOpacity style={styles.menuItem} onPress={saveCurrentChat}>
              <Text style={styles.menuItemText}>💾 حفظ المحادثة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setSavedChatsModalVisible(true); setMenuVisible(false); }}>
              <Text style={styles.menuItemText}>📚 المحادثات المحفوظة ({savedChats.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setColorPickerVisible(true); setMenuVisible(false); }}>
              <Text style={styles.menuItemText}>🎨 تغيير اللون</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { shareChat(); setMenuVisible(false); }}>
              <Text style={styles.menuItemText}>📤 مشاركة المحادثة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setSettingsModalVisible(true); setMenuVisible(false); }}>
              <Text style={styles.menuItemText}>⚙️ الإعدادات</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={savedChatsModalVisible} transparent={true} animationType="slide" onRequestClose={() => setSavedChatsModalVisible(false)}>
        <View style={styles.savedChatsModalOverlay}>
          <View style={styles.savedChatsModalContent}>
            <Text style={styles.savedChatsModalTitle}>📚 المحادثات المحفوظة</Text>
            <ScrollView style={styles.savedChatsScroll}>
              {savedChats.length === 0 ? (
                <Text style={styles.noSavedChatsText}>لا توجد محادثات محفوظة</Text>
              ) : (
                savedChats.map(chat => (
                  <View key={chat.id} style={styles.savedChatItem}>
                    <TouchableOpacity style={styles.savedChatButton} onPress={() => loadSavedChat(chat)}>
                      <Text style={styles.savedChatName}>{chat.name}</Text>
                      <Text style={styles.savedChatDate}>{new Date(chat.date).toLocaleDateString('ar-SA')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteChatButton} onPress={() => deleteSavedChat(chat.id)}>
                      <Text style={styles.deleteChatText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => setSavedChatsModalVisible(false)} style={styles.infoModalButton}>
              <Text style={styles.infoModalButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={colorPickerVisible} transparent={true} animationType="slide" onRequestClose={() => setColorPickerVisible(false)}>
        <View style={styles.colorPickerOverlay}>
          <ScrollView style={styles.colorPickerContent}>
            <Text style={styles.colorPickerTitle}>🎨 تخصيص المظهر</Text>
            
            <Text style={styles.colorSectionTitle}>🎈 ألوان الفقاعات</Text>
            <View style={styles.colorOptions}>
              {['#007AFF', '#34C759', '#FF3B30', '#AF52DE', '#FF9500', '#5856D6', '#FF2D55', '#5AC8FA'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, themeColor === color && styles.selectedColor]}
                  onPress={() => changeThemeColor(color)}
                />
              ))}
            </View>
            
            <Text style={styles.colorSectionTitle}>🖼️ خلفية التطبيق</Text>
            <View style={styles.themeOptions}>
              {[
                { key: 'dark', name: '🌑 داكن', colors: ['#121212', '#1a1a2e', '#16213e'] },
                { key: 'midnight', name: '🌌 ليلي', colors: ['#0a0a1a', '#1a1a3a', '#2d1b69'] },
                { key: 'ocean', name: '🌊 محيطي', colors: ['#001a33', '#003d5c', '#006680'] },
                { key: 'forest', name: '🌲 غابي', colors: ['#0a1f0a', '#1a3a1a', '#2d5a27'] },
                { key: 'royal', name: '👑 ملكي', colors: ['#1a0a33', '#3d1a5c', '#5c2d91'] },
                { key: 'sunset', name: '🌅 غروب', colors: ['#2a1a1a', '#4a2a3a', '#8b4a5c'] },
                { key: 'space', name: '🚀 فضائي', colors: ['#000000', '#1a0a2e', '#2d1b4e'] },
                { key: 'charcoal', name: '🎱 فحمي', colors: ['#1a1a2e', '#2d2d44', '#3d3d5c'] },
              ].map(theme => (
                <TouchableOpacity
                  key={theme.key}
                  style={[styles.themeOption, backgroundTheme === theme.key && styles.selectedTheme]}
                  onPress={() => changeBackgroundTheme(theme.key)}
                >
                  <LinearGradient colors={theme.colors} style={styles.themeGradientPreview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <Text style={styles.themeName}>{theme.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity onPress={() => setColorPickerVisible(false)} style={styles.infoModalButton}>
              <Text style={styles.infoModalButtonText}>تم</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={settingsModalVisible} transparent={true} animationType="slide" onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <Text style={styles.infoModalTitle}>⚙️ الإعدادات</Text>
            <ScrollView style={styles.infoModalScroll}>
              
              <Text style={styles.infoModalSection}>🔤 حجم الخط</Text>
              <View style={styles.fontSizeOptions}>
                <TouchableOpacity 
                  style={[styles.fontSizeOption, fontSize === 'small' && styles.selectedFontSize]}
                  onPress={() => changeFontSize('small')}
                >
                  <Text style={[styles.fontSizeText, {fontSize: 12}]}>صغير</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.fontSizeOption, fontSize === 'normal' && styles.selectedFontSize]}
                  onPress={() => changeFontSize('normal')}
                >
                  <Text style={[styles.fontSizeText, {fontSize: 14}]}>عادي</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.fontSizeOption, fontSize === 'large' && styles.selectedFontSize]}
                  onPress={() => changeFontSize('large')}
                >
                  <Text style={[styles.fontSizeText, {fontSize: 18}]}>كبير</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.infoModalSection}>🔊 صوت الإشعارات</Text>
              <View style={styles.soundToggleContainer}>
                <Text style={styles.soundToggleText}>تشغيل صوت عند وصول الرد</Text>
                <TouchableOpacity 
                  style={[styles.toggleButton, soundEnabled && styles.toggleActive]}
                  onPress={toggleSound}
                >
                  <Text style={styles.toggleText}>{soundEnabled ? '✓' : '✗'}</Text>
                </TouchableOpacity>
              </View>
              
            </ScrollView>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)} style={styles.infoModalButton}>
              <Text style={styles.infoModalButtonText}>تم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <TouchableOpacity 
              key={i} 
              style={[
                styles.bubble, 
                m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                newMessageIndex === i && {
                  shadowColor: glowAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: ['#ffffff', themeColor, '#FFD700', '#ffffff']
                  }),
                  shadowOpacity: glowAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3]
                  }),
                  shadowRadius: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 30]
                  }),
                  elevation: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 25]
                  }),
                  transform: [{
                    scale: glowAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.02, 1]
                    })
                  }]
                }
              ]}
              onPress={() => copyMessage(m.text)}
              onLongPress={() => copyMessage(m.text)}
            >
              <Text style={styles.bubbleText}>{m.text}</Text>
              {m.ts ? (
                <Text style={styles.bubbleTime}>
                  {new Date(m.ts).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              ) : null}
              <Text style={styles.copyHint}>📋 انقر للنسخ</Text>
            </TouchableOpacity>
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
    </LinearGradient>
  );
}

const getStyles = (themeColor, fontSize = 'normal') => {
  const getScaledSize = (baseSize) => {
    switch (fontSize) {
      case 'small': return baseSize * 0.85;
      case 'large': return baseSize * 1.25;
      default: return baseSize;
    }
  };

  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  welcomeContainer: { padding: 30, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  welcomeTitle: { color: '#fff', fontSize: getScaledSize(22), fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  welcomeText: { color: '#aaa', fontSize: getScaledSize(16), textAlign: 'center', lineHeight: getScaledSize(24), marginBottom: 20 },
  welcomeTip: { color: '#FFD700', fontSize: getScaledSize(14), textAlign: 'center', backgroundColor: '#2A2A2A', padding: 12, borderRadius: 10, overflow: 'hidden' },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontSize: getScaledSize(20), fontWeight: 'bold' },
  headerSubtitle: { color: themeColor, fontSize: getScaledSize(12), marginTop: 4 },
  menuButton: { padding: 8 },
  menuIcon: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  menuDropdown: { position: 'absolute', top: 55, left: 10, backgroundColor: '#2A2A2A', borderRadius: 10, borderWidth: 1, borderColor: '#444', minWidth: 200, zIndex: 10, elevation: 5 },
  menuItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#444' },
  menuItemText: { color: '#fff', fontSize: getScaledSize(15), textAlign: 'right' },
  messagesList: { flex: 1, padding: 15, backgroundColor: 'transparent' },
  bubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: themeColor },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: 'rgba(30,30,30,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bubbleText: { color: '#fff', fontSize: getScaledSize(15), textAlign: 'right', lineHeight: getScaledSize(22) },
  bubbleTime: { color: '#888', fontSize: getScaledSize(10), textAlign: 'right', marginTop: 4 },
  copyHint: { color: '#666', fontSize: getScaledSize(9), textAlign: 'center', marginTop: 6, opacity: 0.7 },
  fontSizeOptions: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15 },
  fontSizeOption: { backgroundColor: '#2A2A2A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginHorizontal: 5 },
  selectedFontSize: { backgroundColor: themeColor },
  fontSizeText: { color: '#fff' },
  soundToggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2A2A2A', padding: 15, borderRadius: 10, marginVertical: 10 },
  soundToggleText: { color: '#fff', fontSize: getScaledSize(14) },
  toggleButton: { width: 40, height: 25, borderRadius: 12, backgroundColor: '#666', justifyContent: 'center', alignItems: 'center' },
  toggleActive: { backgroundColor: themeColor },
  toggleText: { color: '#fff', fontWeight: 'bold' },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent' },
  chatInput: { flex: 1, backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 25, paddingHorizontal: 20, height: 45, textAlign: 'right' },
  sendButton: { backgroundColor: themeColor, marginLeft: 10, paddingHorizontal: 20, borderRadius: 25, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 10 },
  loadingText: { color: '#888', marginLeft: 10, fontSize: getScaledSize(12) },
  infoButton: { padding: 8 },
  infoIcon: { color: '#FFD700', fontSize: 24 },
  infoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  infoModalContent: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, width: '90%', maxHeight: '80%', borderWidth: 1, borderColor: '#333' },
  infoModalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  infoModalScroll: { maxHeight: 400 },
  infoModalSection: { color: themeColor, fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, textAlign: 'right' },
  infoModalText: { color: '#ccc', fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 5 },
  infoModalButton: { backgroundColor: themeColor, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 20, alignSelf: 'center' },
  savedChatsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  savedChatsModalContent: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, width: '90%', maxHeight: '70%', borderWidth: 1, borderColor: '#333' },
  savedChatsModalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  savedChatsScroll: { maxHeight: 350 },
  noSavedChatsText: { color: '#888', textAlign: 'center', fontSize: 16, marginTop: 30 },
  savedChatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', padding: 12, borderRadius: 10, marginBottom: 10 },
  savedChatButton: { flex: 1 },
  savedChatName: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  savedChatDate: { color: '#888', fontSize: 12, textAlign: 'right', marginTop: 4 },
  deleteChatButton: { padding: 8, marginLeft: 10 },
  deleteChatText: { fontSize: 18 },
  colorPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  colorPickerContent: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, width: '85%', maxHeight: '80%', borderWidth: 1, borderColor: '#333' },
  colorPickerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  colorSectionTitle: { color: themeColor, fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginTop: 15, marginBottom: 10, alignSelf: 'flex-start' },
  colorOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 10 },
  colorOption: { width: 40, height: 40, borderRadius: 20, margin: 5 },
  selectedColor: { borderWidth: 3, borderColor: '#fff' },
  themeOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 10 },
  themeOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', padding: 10, borderRadius: 10, margin: 5, minWidth: 100 },
  selectedTheme: { borderWidth: 2, borderColor: themeColor },
  gradientBackground: { flex: 1 },
  newMessageGlow: { shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  themeGradientPreview: { width: 40, height: 40, borderRadius: 8, marginLeft: 8 },
  themeName: { color: '#fff', fontSize: 13 },
  infoModalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  floatingEmoji: { 
    position: 'absolute', 
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 0,
  }
  });
};