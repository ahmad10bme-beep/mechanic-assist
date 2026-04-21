import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE_URL = 'https://mechanic-assist.onrender.com';

// Background themes with gradients and floating emojis
const BACKGROUND_THEMES = [
  { id: 'dark', colors: ['#121212', '#1a1a2e', '#16213e'], emojis: ['✨', '⭐'], emojiColors: ['#FFD700', '#FFA500'] },
  { id: 'midnight', colors: ['#0a0a1a', '#1a1a3a', '#2d1b69'], emojis: ['🌙', '✨', '🦊'], emojiColors: ['#FFD700', '#FF6347', '#FF8C00'] },
  { id: 'ocean', colors: ['#001a33', '#003d5c', '#006680'], emojis: ['🌊', '🐠', '💙'], emojiColors: ['#00BFFF', '#FFD700', '#87CEEB'] },
  { id: 'forest', colors: ['#0a1f0a', '#1a3a1a', '#2d5a27'], emojis: ['🌿', '🦊', '🍃'], emojiColors: ['#32CD32', '#FF8C00', '#228B22'] },
  { id: 'royal', colors: ['#1a0a33', '#3d1a5c', '#5c2d91'], emojis: ['👑', '💜', '✨'], emojiColors: ['#FFD700', '#9370DB', '#FFA500'] },
  { id: 'sunset', colors: ['#2a1a1a', '#4a2a3a', '#8b4a5c'], emojis: ['🌅', '💖', '🦊'], emojiColors: ['#FF6347', '#FFD700', '#FF8C00'] },
  { id: 'space', colors: ['#000000', '#1a0a2e', '#2d1b4e'], emojis: ['🚀', '🌟', '👽'], emojiColors: ['#FFD700', '#00BFFF', '#32CD32'] },
  { id: 'sakura', colors: ['#2d1b2d', '#4a2a4a', '#8b4a6b'], emojis: ['🌸', '💖', '🦊'], emojiColors: ['#FFB6C1', '#FF69B4', '#FF8C00'] },
];

export default function ImageScreen({ onBack }) {
  const [partName, setPartName] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [technicalName, setTechnicalName] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgTheme, setBgTheme] = useState('dark');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [emojiAnim] = useState(new Animated.Value(0));

  const generateImage = async () => {
    if (!partName.trim() || loading) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم القطعة');
      return;
    }

    setLoading(true);
    setGeneratedImage(null);
    setTechnicalName('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/image`);
      console.log('Request body:', { partName });

      const res = await fetch(`${API_BASE_URL}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partName }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Response status:', res.status);
      console.log('Response content-type:', res.headers.get('content-type'));

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('السيرفر لم يستجب بشكل صحيح. قد يكون في طور التشغيل، يرجى المحاولة بعد 30 ثانية.');
      }

      const data = await res.json();
      console.log('Response data:', data);

      if (res.ok) {
        console.log('Image URL received:', data.imageUrl, 'Technical name:', data.partName);
        setGeneratedImage(data.imageUrl);
        if (data.partName) setTechnicalName(data.partName);
      } else {
        throw new Error(data.error || 'خطأ في توليد الصورة');
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('Image generation error details:', e);
      console.error('Error message:', e.message);
      console.error('Error type:', e.name);
      Alert.alert('خطأ', 'لم يتم توليد الصورة: ' + (e.message || 'حدث خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = async () => {
    if (!generatedImage) {
      Alert.alert('تنبيه', 'لا توجد صورة للحفظ');
      return;
    }
    Alert.alert('تم الحفظ', 'تم حفظ الصورة في المعرض بنجاح');
  };

  // Animate floating emojis
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(emojiAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getCurrentTheme = () => BACKGROUND_THEMES.find(t => t.id === bgTheme) || BACKGROUND_THEMES[0];

  const renderFloatingEmojis = () => {
    const theme = getCurrentTheme();
    return theme.emojis.map((emoji, index) => (
      <Animated.Text
        key={index}
        style={[
          styles.floatingEmoji,
          {
            color: theme.emojiColors[index % theme.emojiColors.length],
            left: 20 + (index * 80) % 300,
            top: 100 + (index * 60) % 400,
            transform: [
              {
                translateY: emojiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30 + (index * 10)]
                })
              },
              {
                rotate: emojiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${10 + (index * 5)}deg`]
                })
              }
            ],
            opacity: emojiAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.4, 0.8, 0.4]
            })
          }
        ]}
      >
        {emoji}
      </Animated.Text>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={getCurrentTheme().colors} style={styles.gradientBackground}>
        {renderFloatingEmojis()}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Text style={styles.icon}>→</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>المساعد التقني</Text>
            <Text style={styles.headerSubtitle}>للمبتكر أحمد الزهراني</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowThemePicker(true)}>
            <Text style={styles.icon}>🎨</Text>
          </TouchableOpacity>
        </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>اسم القطعة</Text>
            <TextInput
              style={styles.input}
              value={partName}
              onChangeText={setPartName}
              placeholder="مثال: فرامل، بواجي، كرسي مكينة، رديتر..."
            />
          </View>

          <TouchableOpacity style={styles.generateButton} onPress={generateImage} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>📷</Text>
                <Text style={styles.buttonText}>توليد الصورة الآن</Text>
              </>
            )}
          </TouchableOpacity>

          {generatedImage ? (
            <View style={styles.imageContainer}>
              {technicalName ? (
                <View style={styles.techBadge}>
                  <Text style={styles.techBadgeText}>{technicalName}</Text>
                </View>
              ) : null}
              <Image source={{ uri: generatedImage }} style={styles.generatedImage} resizeMode="contain" />
              <TouchableOpacity style={styles.saveButton} onPress={saveToGallery}>
                <Text style={styles.saveIcon}>✓</Text>
                <Text style={styles.saveButtonText}>حفظ في المعرض</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>ستظهر الصورة المولدة هنا</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} transparent animationType="slide" onRequestClose={() => setShowThemePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>اختر خلفية شاشة القطع 🎨</Text>
            <ScrollView style={styles.themeList}>
              {BACKGROUND_THEMES.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[styles.themeOption, bgTheme === theme.id && styles.themeOptionSelected]}
                  onPress={() => { setBgTheme(theme.id); setShowThemePicker(false); }}
                >
                  <LinearGradient colors={theme.colors} style={styles.themePreview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={styles.themeEmojis}>
                    {theme.emojis.map((e, i) => (
                      <Text key={i} style={[styles.themeEmoji, { color: theme.emojiColors[i] }]}>{e}</Text>
                    ))}
                  </View>
                  <Text style={styles.themeName}>
                    {theme.id === 'dark' ? 'ليلي' :
                     theme.id === 'midnight' ? 'منتصف الليل' :
                     theme.id === 'ocean' ? 'محيط' :
                     theme.id === 'forest' ? 'غابة' :
                     theme.id === 'royal' ? 'ملكي' :
                     theme.id === 'sunset' ? 'غروب' :
                     theme.id === 'space' ? 'فضاء' :
                     theme.id === 'sakura' ? 'ساكورا' : theme.id}
                  </Text>
                  {bgTheme === theme.id && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowThemePicker(false)}>
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#007AFF', fontSize: 12, marginTop: 4 },
  iconButton: { padding: 8 },
  icon: { color: '#fff', fontSize: 24 },
  content: { flex: 1, padding: 20 },
  inputContainer: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#333',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonIcon: { fontSize: 20, marginLeft: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imageContainer: { width: '100%', alignItems: 'center' },
  generatedImage: { width: '100%', height: 300, borderRadius: 10, marginBottom: 15, backgroundColor: '#1E1E1E' },
  saveButton: {
    backgroundColor: '#28A745',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveIcon: { fontSize: 18, marginLeft: 8, color: '#fff' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  placeholder: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { color: '#666', fontSize: 16 },
  techBadge: { 
    backgroundColor: '#007AFF',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 15, 
    marginBottom: 10,
    alignSelf: 'flex-start'
  },
  techBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  // Gradient background
  gradientBackground: { flex: 1 },
  
  // Floating emojis
  floatingEmoji: { 
    position: 'absolute', 
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  
  // Theme picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  themeList: {
    maxHeight: 400,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  themeOptionSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  themePreview: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  themeEmojis: {
    flexDirection: 'row',
    marginRight: 10,
  },
  themeEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  themeName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  checkMark: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
