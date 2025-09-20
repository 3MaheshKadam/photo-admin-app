import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

const AboutPage = ({ navigation }) => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [specializations, setSpecializations] = useState(['']);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = 'https://photographer-protfolio.vercel.app';
  const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset'; // Replace with your Cloudinary upload preset
  const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'; // Replace with your Cloudinary cloud name

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/about`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('GET Response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 404) {
          setAboutData(null);
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setAboutData(data);
    } catch (error) {
      console.error('Error fetching about data:', error);
      if (!error.message.includes('About not found')) {
        Alert.alert('Error', `Failed to load about data: ${error.message}`);
      }
      setAboutData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Adjust aspect ratio as needed
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `about-image.jpg`,
        });
        formData.append('upload_preset', "shivbandhan");

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/dqfum2awz/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        const uploadResult = await uploadResponse.json();
        console.log(uploadResult)
        if (uploadResult.secure_url) {
          setImage(uploadResult.secure_url);
        } else {
          throw new Error('Failed to upload image to Cloudinary');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', `Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openModal = (mode) => {
    console.log('Opening modal with mode:', mode);
    setModalMode(mode);

    if (mode === 'edit' && aboutData) {
      setTitle(aboutData.title || '');
      setBio(aboutData.bio || '');
      setImage(aboutData.image || '');
      setSpecializations(aboutData.specializations?.map(spec => spec.title) || ['']);
    } else if (mode === 'create') {
      setTitle('');
      setBio('');
      setImage('');
      setSpecializations(['']);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (modalMode !== 'create' && modalMode !== 'edit') return;
    if (!title.trim() || !bio.trim() || !image.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (title, bio, image).');
      return;
    }

    setLoading(true);
    try {
      const body = {
        title,
        bio,
        image,
        specializations: specializations.filter(spec => spec.trim()).map(title => ({ title })),
      };
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch(`${API_BASE_URL}/api/about`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`${method} Response:`, { status: response.status, data });

      if (response.ok) {
        setAboutData(data);
        setModalVisible(false);
        Alert.alert('Success', `About ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
      } else {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`${method} Error:`, error);
      Alert.alert('Error', `Failed to ${modalMode === 'create' ? 'create' : 'update'} about: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/about`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('DELETE Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setAboutData(null);
      setModalVisible(false);
      Alert.alert('Success', 'About section deleted successfully');
    } catch (error) {
      console.error('Error deleting about data:', error);
      Alert.alert('Error', `Failed to delete about section: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationChange = (text, index) => {
    const newSpecializations = [...specializations];
    newSpecializations[index] = text;
    setSpecializations(newSpecializations);
  };

  const addSpecialization = () => {
    setSpecializations([...specializations, '']);
  };

  const removeSpecialization = (index) => {
    if (specializations.length > 1) {
      setSpecializations(specializations.filter((_, i) => i !== index));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAboutData().finally(() => setRefreshing(false));
  };

  const renderSpecializationCard = (specialization, index) => (
    <View key={index} className="w-[48%] mb-4">
      <View className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
        <LinearGradient
          colors={['#FB923C', '#F97316']}
          className="py-6 px-4 items-center justify-center min-h-[120px]"
        >
          <View className="bg-white/20 rounded-full p-3 mb-3">
            <Icon name="camera" size={24} color="#FFFFFF" />
          </View>
          <Text className="text-white text-sm font-bold text-center leading-5">
            {specialization.title}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-orange-50">
        <StatusBar barStyle="dark-content" backgroundColor="#FEF7ED" />
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="mt-3 text-base text-amber-800 font-medium">Loading About...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FEF7ED" />

      {/* Enhanced Action Buttons Header */}
      <View className="bg-white px-5 py-4 border-b border-orange-200 shadow-sm">
        <Text className="text-2xl font-bold text-amber-900 mb-4">About Management</Text>
        <View className="flex-row flex-wrap gap-3">
          <TouchableOpacity
            className="bg-amber-600 py-2.5 px-4 rounded-xl flex-row items-center shadow-sm"
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Icon name="refresh" size={16} color="#FFFFFF" />
            <Text className="text-white text-sm font-semibold ml-2">Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-orange-500 py-2.5 px-4 rounded-xl flex-row items-center shadow-sm"
            onPress={() => openModal('create')}
          >
            <Icon name="add" size={16} color="#FFFFFF" />
            <Text className="text-white text-sm font-semibold ml-2">Create</Text>
          </TouchableOpacity>
          {aboutData && (
            <>
              <TouchableOpacity
                className="bg-amber-500 py-2.5 px-4 rounded-xl flex-row items-center shadow-sm"
                onPress={() => openModal('edit')}
              >
                <Icon name="pencil" size={16} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold ml-2">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-500 py-2.5 px-4 rounded-xl flex-row items-center shadow-sm"
                onPress={() => openModal('delete')}
              >
                <Icon name="trash" size={16} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold ml-2">Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F97316']}
            tintColor="#F97316"
          />
        }
      >
        {aboutData ? (
          <>
            {/* Enhanced Hero Section */}
            <View className="mb-8">
              <View className="relative rounded-b-3xl overflow-hidden mx-4 mt-4" style={{ height: height * 0.35 }}>
                <Image
                  source={{ uri: aboutData.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.4)']}
                  className="absolute bottom-0 left-0 right-0 h-20 rounded-b-3xl"
                />
                <View className="absolute bottom-4 left-4 right-4">
                  <Text className="text-white text-xl font-bold">{aboutData.title}</Text>
                </View>
              </View>
            </View>

            {/* Enhanced Bio Section */}
            <View className="px-5 mb-10">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-4">
                  <View className="bg-orange-100 rounded-full p-2 mr-3">
                    <Icon name="person-circle-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">Our Story</Text>
                </View>
                <Text className="text-base leading-7 text-amber-800 text-justify">
                  {aboutData.bio}
                </Text>
              </View>
            </View>

            {/* Enhanced Specializations Section */}
            <View className="px-5 mb-10">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-6">
                  <View className="bg-orange-100 rounded-full p-2 mr-3">
                    <Icon name="diamond-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">Our Specializations</Text>
                </View>
                <View className="flex-row flex-wrap justify-between">
                  {aboutData.specializations?.map((specialization, index) =>
                    renderSpecializationCard(specialization, index)
                  )}
                </View>
              </View>
            </View>
          </>
        ) : (
          <View className="flex-1 justify-center items-center bg-orange-50 px-5" style={{ minHeight: height * 0.7 }}>
            <View className="bg-white rounded-3xl p-8 shadow-lg border border-orange-100 items-center">
              <View className="bg-orange-100 rounded-full p-4 mb-4">
                <Icon name="information-circle-outline" size={48} color="#F97316" />
              </View>
              <Text className="text-2xl font-bold text-amber-900 mb-3 text-center">No About Data Found</Text>
              <Text className="text-base text-amber-700 text-center mb-6 leading-6">
                The about section doesn't exist yet or has been deleted. {'\n'}Create a new one to get started.
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  className="bg-amber-600 px-6 py-3 rounded-xl flex-row items-center shadow-sm"
                  onPress={fetchAboutData}
                >
                  <Icon name="refresh" size={16} color="#FFFFFF" />
                  <Text className="text-white text-sm font-semibold ml-2">Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-orange-500 px-6 py-3 rounded-xl flex-row items-center shadow-sm"
                  onPress={() => openModal('create')}
                >
                  <Icon name="add" size={16} color="#FFFFFF" />
                  <Text className="text-white text-sm font-semibold ml-2">Create New</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Enhanced Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View
            className="bg-white rounded-3xl p-6 w-full shadow-2xl"
            style={{ maxWidth: width * 0.9, maxHeight: height * 0.85 }}
          >
            {modalMode === 'delete' ? (
              <>
                <View className="items-center mb-6">
                  <View className="bg-red-100 rounded-full p-3 mb-3">
                    <Icon name="warning" size={32} color="#EF4444" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">Delete About</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Are you sure you want to delete this about section? This action cannot be undone.
                  </Text>
                </View>
                <View className="flex-row justify-between gap-3">
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl items-center bg-gray-100"
                    onPress={() => setModalVisible(false)}
                  >
                    <Text className="text-gray-700 text-base font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl items-center bg-red-500 ${loading ? 'opacity-60' : ''}`}
                    onPress={handleDelete}
                    disabled={loading}
                  >
                    <Text className="text-white text-base font-semibold">
                      {loading ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Enhanced Header */}
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-row items-center">
                    <View className="bg-orange-100 rounded-full p-2 mr-3">
                      <Icon name={modalMode === 'create' ? 'add' : 'pencil'} size={20} color="#F97316" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900">
                      {modalMode === 'create' ? 'Create About' : 'Edit About'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Enhanced Form Content */}
                <View style={{ height: height * 0.55 }}>
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  >
                    {/* Title Field */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-2">Title *</Text>
                      <TextInput
                        className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-base text-gray-900"
                        placeholder="e.g., About Our Studio"
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={setTitle}
                      />
                    </View>

                    {/* Bio Field */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-2">Bio *</Text>
                      <TextInput
                        className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-base text-gray-900"
                        placeholder="Tell us about your studio..."
                        placeholderTextColor="#9CA3AF"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{ minHeight: 100 }}
                      />
                    </View>

                    {/* Image Upload Field */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-2">About Image *</Text>
                      <TouchableOpacity
                        className={`bg-orange-50 border border-orange-200 rounded-xl p-4 flex-row items-center justify-center ${uploading ? 'opacity-60' : ''}`}
                        onPress={handleImageUpload}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <ActivityIndicator size="small" color="#F97316" />
                        ) : (
                          <>
                            <Icon name="camera" size={20} color="#F97316" />
                            <Text className="text-base text-gray-900 ml-2">
                              {image ? 'Change Image' : 'Upload Image'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                      {image && (
                        <View className="mt-3">
                          <Image
                            source={{ uri: image }}
                            className="w-full h-32 rounded-xl"
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
                            onPress={() => setImage('')}
                          >
                            <Icon name="trash" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Specializations */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-3">Specializations</Text>
                      {specializations.map((spec, index) => (
                        <View key={index} className="flex-row items-center mb-3">
                          <TextInput
                            className="flex-1 bg-orange-50 border border-orange-200 rounded-xl p-4 text-base text-gray-900 mr-3"
                            placeholder={
                              index === 0 ? "e.g., Wedding Photography" :
                              index === 1 ? "e.g., Portrait Photography" :
                              index === 2 ? "e.g., Event Photography" :
                              `Specialization ${index + 1}`
                            }
                            placeholderTextColor="#9CA3AF"
                            value={spec}
                            onChangeText={(text) => handleSpecializationChange(text, index)}
                          />
                          {specializations.length > 1 && (
                            <TouchableOpacity
                              className="bg-red-100 p-3 rounded-xl"
                              onPress={() => removeSpecialization(index)}
                            >
                              <Icon name="trash" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        className="bg-orange-500 py-3 px-4 rounded-xl flex-row items-center justify-center"
                        onPress={addSpecialization}
                      >
                        <Icon name="add" size={16} color="#FFFFFF" />
                        <Text className="text-white text-sm font-semibold ml-2">Add Specialization</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>

                {/* Enhanced Action Buttons */}
                <View className="flex-row justify-between gap-3 pt-4 border-t border-gray-200">
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl items-center bg-gray-100"
                    onPress={() => setModalVisible(false)}
                  >
                    <Text className="text-gray-700 text-base font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl items-center bg-orange-500 ${loading ? 'opacity-60' : ''}`}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    <Text className="text-white text-base font-semibold">
                      {loading ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AboutPage;