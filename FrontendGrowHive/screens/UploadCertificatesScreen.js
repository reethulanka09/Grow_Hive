import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../screens/constants';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_400Regular } from '@expo-google-fonts/poppins';
import axios from 'axios';
import { IP } from '../Config/config';

const API_BASE_URL = `${IP}`;

export default function UploadCertificatesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken, userId } = route.params || {};

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [certificationIds, setCertificationIds] = useState({});
  const [certificationLinks, setCertificationLinks] = useState({});
  const [workLinks, setWorkLinks] = useState('');
  const [achievements, setAchievements] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_400Regular,
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!fontsLoaded) return null;

  const pickDocument = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true });
      if (!result.canceled && result.assets) {
        setSelectedFiles(prevFiles => {
          const newFiles = result.assets.filter(
            (newFile) => !prevFiles.some((existingFile) => existingFile.uri === newFile.uri)
          );
          return [...prevFiles, ...newFiles];
        });
      }
    } catch (error) {
      Alert.alert('Error', 'There was an error selecting the document.');
    }
  };

  const removeFile = (uriToRemove) => {
    Alert.alert('Remove File', 'Are you sure you want to remove this file from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => {
          setSelectedFiles(prevFiles => prevFiles.filter(file => file.uri !== uriToRemove));
          setCertificationIds(prevIds => {
            const newIds = { ...prevIds };
            delete newIds[uriToRemove];
            return newIds;
          });
          setCertificationLinks(prevLinks => {
            const newLinks = { ...prevLinks };
            delete newLinks[uriToRemove];
            return newLinks;
          });
        },
      },
    ]);
  };

  const handleCertificationIdChange = (uri, text) => {
    setCertificationIds(prev => ({ ...prev, [uri]: text }));
  };

  const handleCertificationLinkChange = (uri, text) => {
    setCertificationLinks(prev => ({ ...prev, [uri]: text }));
  };

  const validateCertificationIdFromPortal = async (certId, certLink) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/verify-external-cert`, {
        certId,
        certLink,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });
      return response.data.isVerified;
    } catch (error) {
      console.error('External validation error:', error);
      return false;
    }
  };

  const handleUploadAndFinish = async () => {
    if (!workLinks.trim() || !achievements.trim()) {
      Alert.alert('Error', 'Please fill in Work Links and Achievements.');
      return;
    }

    for (const uri of Object.keys(certificationIds)) {
      const certId = certificationIds[uri];
      const certLink = certificationLinks[uri];
      if (!certId || !certLink || certId.trim() === '' || certLink.trim() === '') {
        Alert.alert('Error', 'Please enter Certification ID and link for all uploaded files.');
        return;
      }
      const isVerified = await validateCertificationIdFromPortal(certId, certLink);
      // if (!isVerified) {
      //   Alert.alert('Error', `Id Successfully verified`);
      //   return;
      // }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('certificates', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
        });
        formData.append('certificationIds', certificationIds[file.uri] || '');
        formData.append('certificationLinks', certificationLinks[file.uri] || '');
      });

      await axios.post(`${API_BASE_URL}/api/upload/certificates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      await axios.put(`${API_BASE_URL}/api/auth/profile`, { workLinks, achievements }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      Alert.alert('Success', 'Profile updated and certificates uploaded.');
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
    } catch (error) {
      Alert.alert('Setup Failed', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: keyboardVisible ? 200 : 40 }}>
        <Text style={styles.heading}>Upload Certificates</Text>

        <TouchableOpacity style={styles.uploadBox} onPress={pickDocument} disabled={loading}>
          <AntDesign name="cloudupload" size={36} color={COLORS.primary} />
          <Text style={styles.uploadText}>
            {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Please upload in .pdf'}
          </Text>
        </TouchableOpacity>

        {selectedFiles.map((item) => (
          <View key={item.uri} style={styles.fileItem}>
            <MaterialIcons name="insert-drive-file" size={20} color={COLORS.text} />
            <View style={styles.fileItemContent}>
              <Text style={styles.fileName}>{item.name}</Text>
              <TextInput style={styles.certIdInput} placeholder="Enter Certification ID" value={certificationIds[item.uri] || ''} onChangeText={(text) => handleCertificationIdChange(item.uri, text)} />
              <TextInput style={styles.certIdInput} placeholder="Enter Verification Link" value={certificationLinks[item.uri] || ''} onChangeText={(text) => handleCertificationLinkChange(item.uri, text)} />
            </View>
            <TouchableOpacity onPress={() => removeFile(item.uri)}><AntDesign name="closecircleo" size={16} color={COLORS.muted} /></TouchableOpacity>
          </View>
        ))}

        <Text style={styles.label}>Work Links</Text>
        <TextInput style={styles.input} value={workLinks} onChangeText={setWorkLinks} placeholder="Paste your work links here" />

        <Text style={styles.label}>Achievements</Text>
        <TextInput style={[styles.input, { height: 120 }]} value={achievements} onChangeText={setAchievements} multiline textAlignVertical="top" placeholder="Enter your achievements" />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.nextButton} onPress={handleUploadAndFinish} disabled={loading}>
            {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Finish Setup</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  heading: { fontSize: 26, color: COLORS.text, fontFamily: 'Poppins_700Bold', marginTop: 50 },
  uploadBox: { backgroundColor: COLORS.card, borderColor: COLORS.primary, borderWidth: 2, borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadText: { color: COLORS.primary, fontSize: 16 },
  fileItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fileItemContent: { flex: 1, marginLeft: 10 },
  fileName: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  certIdInput: { borderWidth: 1, borderColor: COLORS.shadow, borderRadius: 6, padding: 8, marginBottom: 8 },
  input: { backgroundColor: COLORS.card, borderColor: COLORS.shadow, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  label: { color: COLORS.text, fontSize: 16, marginBottom: 6, marginTop: 12 },
  nextButton: { backgroundColor: COLORS.secondary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: COLORS.card, fontSize: 16 },
  buttonRow: { marginTop: 30 },
});
