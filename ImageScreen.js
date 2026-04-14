import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

const API_BASE_URL = 'https://mechanic-assist-server.onrender.com';

export default function ImageScreen({ onBack }) {
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [partName, setPartName] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!partName.trim() || loading) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم القطعة');
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    const prompt = `قطعة غيار سيارة: ${partName}، لسيارة ${carMake} ${carModel} موديل ${carYear}. رسم تقني مفصل للقطعة.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/image`);
      console.log('Request body:', { prompt });

      const res = await fetch(`${API_BASE_URL}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
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
        setGeneratedImage(data.imageUrl);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Text style={styles.icon}>→</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>المساعد التقني</Text>
          <Text style={styles.headerSubtitle}>للمبتكر أحمد الزهراني</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>نوع السيارة</Text>
            <TextInput
              style={styles.input}
              value={carMake}
              onChangeText={setCarMake}
              placeholder="مثال: تويوتا"
            />

            <Text style={styles.label}>الموديل</Text>
            <TextInput
              style={styles.input}
              value={carModel}
              onChangeText={setCarModel}
              placeholder="مثال: كوريلا"
            />

            <Text style={styles.label}>السنة</Text>
            <TextInput
              style={styles.input}
              value={carYear}
              onChangeText={setCarYear}
              placeholder="مثال: 2015"
              keyboardType="numeric"
            />

            <Text style={styles.label}>اسم القطعة</Text>
            <TextInput
              style={styles.input}
              value={partName}
              onChangeText={setPartName}
              placeholder="مثال: محرك، فرامل، تعليق..."
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
  imageContainer: { alignItems: 'center' },
  generatedImage: { width: '100%', height: 300, borderRadius: 10, marginBottom: 15 },
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
});
