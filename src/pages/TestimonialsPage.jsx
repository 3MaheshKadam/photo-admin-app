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

const TestimonialsPage = () => {
  const [testimonialsData, setTestimonialsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [title, setTitle] = useState('');
  const [testimonials, setTestimonials] = useState([
    { name: '', text: '', title: '', company: '', image: '', rating: '' },
  ]);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = 'https://photographer-protfolio.vercel.app';
  const CLOUDINARY_UPLOAD_PRESET = 'shivbandhan';
  const CLOUDINARY_CLOUD_NAME = 'dqfum2awz';

  useEffect(() => {
    fetchTestimonialsData();
  }, []);

  const fetchTestimonialsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/testimonials`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('GET Response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 404) {
          setTestimonialsData(null);
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setTestimonialsData(data);
    } catch (error) {
      console.error('Error fetching testimonials data:', error);
      if (!error.message.includes('Testimonials not found')) {
        Alert.alert('Error', `Failed to load testimonials data: ${error.message}`);
      }
      setTestimonialsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (testimonialIndex) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `testimonial-${testimonialIndex}-image.jpg`,
        });
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        const uploadResult = await uploadResponse.json();

        if (uploadResult.secure_url) {
          const newTestimonials = [...testimonials];
          newTestimonials[testimonialIndex].image = uploadResult.secure_url;
          setTestimonials(newTestimonials);
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
    console.log('Opening modal with mode:', mode, 'testimonialsData:', testimonialsData);
    setModalMode(mode);
    if (mode === 'edit' && testimonialsData) {
      setTitle(testimonialsData.title || '');
      setTestimonials(
        testimonialsData.testimonials?.map(t => ({
          name: t.name || '',
          text: t.text || '',
          title: t.title || '',
          company: t.company || '',
          image: t.image || '',
          rating: t.rating?.toString() || '',
        })) || [{ name: '', text: '', title: '', company: '', image: '', rating: '' }]
      );
    } else if (mode === 'create') {
      setTitle('');
      setTestimonials([{ name: '', text: '', title: '', company: '', image: '', rating: '' }]);
    }
    setModalVisible(true);
    console.log('Modal state:', { modalMode: mode, modalVisible: true });
  };

  const handleSave = async () => {
    if (modalMode !== 'create' && modalMode !== 'edit') return;
    if (
      !title.trim() ||
      testimonials.some(
        t =>
          !t.name.trim() ||
          !t.text.trim() ||
          !t.title.trim() ||
          !t.company.trim() ||
          !t.rating ||
          isNaN(t.rating) ||
          t.rating < 1 ||
          t.rating > 5
      )
    ) {
      Alert.alert(
        'Error',
        'Please fill in all required fields (title, name, text, job title, company, rating 1-5).'
      );
      return;
    }

    setLoading(true);
    try {
      const body = {
        title,
        testimonials: testimonials
          .filter(t => t.name.trim() && t.text.trim() && t.title.trim() && t.company.trim() && t.rating)
          .map(t => ({
            name: t.name,
            text: t.text,
            title: t.title,
            company: t.company,
            image: t.image || '',
            rating: Number(t.rating),
          })),
      };
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch(`${API_BASE_URL}/api/testimonials`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`${method} Response:`, { status: response.status, data });

      if (response.ok) {
        setTestimonialsData(data);
        setModalVisible(false);
        Alert.alert('Success', `Testimonials ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        fetchTestimonialsData();
      } else {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`${method} Error:`, error);
      Alert.alert('Error', `Failed to ${modalMode === 'create' ? 'create' : 'update'} testimonials: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/testimonials`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('DELETE Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setTestimonialsData(null);
      setModalVisible(false);
      Alert.alert('Success', 'Testimonials deleted successfully');
    } catch (error) {
      console.error('Error deleting testimonials data:', error);
      Alert.alert('Error', `Failed to delete testimonials: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestimonialChange = (index, field, value) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index][field] = value;
    setTestimonials(newTestimonials);
  };

  const addTestimonial = () => {
    setTestimonials([...testimonials, { name: '', text: '', title: '', company: '', image: '', rating: '' }]);
  };

  const removeTestimonial = (index) => {
    if (testimonials.length > 1) {
      setTestimonials(testimonials.filter((_, i) => i !== index));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTestimonialsData().finally(() => setRefreshing(false));
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#F59E0B' : '#FFFFFF'}
        />
      );
    }
    return <View className="flex-row mb-2">{stars}</View>;
  };

  const renderTestimonialCard = (testimonial, index) => (
    <View key={index} className="w-[48%] mb-4">
      <View className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
        <LinearGradient colors={['#FB923C', '#F97316']} className="rounded-2xl overflow-hidden">
          {testimonial.image && (
            <Image source={{ uri: testimonial.image }} className="w-full h-24" resizeMode="cover" />
          )}
          <View className="p-4">
            <Text className="text-white text-sm font-bold mb-1">{testimonial.name}</Text>
            <Text className="text-white text-xs font-medium mb-1">{testimonial.title}, {testimonial.company}</Text>
            {renderStars(testimonial.rating)}
            <Text className="text-white text-xs leading-4 opacity-90" numberOfLines={3}>
              {testimonial.text}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-orange-50">
        <StatusBar barStyle="dark-content" backgroundColor="#FEF7ED" />
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="mt-3 text-base text-amber-800 font-medium">Loading Testimonials...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FEF7ED" />
      <View className="bg-white px-5 py-4 border-b border-orange-200 shadow-sm">
        <Text className="text-2xl font-bold text-amber-900 mb-4">Testimonials Management</Text>
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
          {testimonialsData && (
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
        {testimonialsData ? (
          <>
            <View className="px-5 pt-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-4">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="star-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">{testimonialsData.title}</Text>
                </View>
              </View>
            </View>
            <View className="px-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-6">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="heart-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">Client Feedback</Text>
                </View>
                <View className="flex-row flex-wrap justify-between">
                  {testimonialsData.testimonials?.map((testimonial, index) =>
                    renderTestimonialCard(testimonial, index)
                  )}
                </View>
              </View>
            </View>
          </>
        ) : (
          <View className="flex-1 justify-center items-center px-5" style={{ minHeight: height * 0.6 }}>
            <View className="bg-white rounded-3xl p-8 shadow-lg border border-orange-100 items-center">
              <View className="bg-orange-100 rounded-2xl p-4 mb-4">
                <Icon name="information-circle-outline" size={48} color="#F97316" />
              </View>
              <Text className="text-2xl font-bold text-amber-900 mb-3 text-center">No Testimonials Data Found</Text>
              <Text className="text-base text-amber-700 text-center mb-6 leading-6">
                The testimonials section doesn't exist yet or has been deleted. {'\n'}Create a new one to get started.
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  className="bg-amber-600 px-6 py-3 rounded-xl flex-row items-center shadow-sm"
                  onPress={fetchTestimonialsData}
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
        <View className="h-20" />
      </ScrollView>

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
                  <View className="bg-red-100 rounded-2xl p-3 mb-3">
                    <Icon name="warning" size={32} color="#EF4444" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">Delete Testimonials</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Are you sure you want to delete this testimonials section? This action cannot be undone.
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
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-row items-center">
                    <View className="bg-orange-100 rounded-xl p-2 mr-3">
                      <Icon name={modalMode === 'create' ? 'add' : 'pencil'} size={20} color="#F97316" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900">
                      {modalMode === 'create' ? 'Create Testimonials' : 'Edit Testimonials'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="bg-gray-100 rounded-xl p-2"
                  >
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={{ height: height * 0.55 }}>
                  <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-2">Title *</Text>
                      <TextInput
                        className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-base text-gray-900"
                        placeholder="e.g., Client Testimonials"
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={setTitle}
                      />
                    </View>

                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-3">Testimonials</Text>
                      {testimonials.map((t, index) => (
                        <View key={index} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-base font-semibold text-gray-700">Testimonial {index + 1}</Text>
                            {testimonials.length > 1 && (
                              <TouchableOpacity
                                className="bg-red-500 p-2 rounded-lg"
                                onPress={() => removeTestimonial(index)}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>

                          <Text className="text-sm font-semibold text-gray-700 mb-2">Name *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Jane Doe"
                            placeholderTextColor="#9CA3AF"
                            value={t.name}
                            onChangeText={(text) => handleTestimonialChange(index, 'name', text)}
                          />

                          <Text className="text-sm font-semibold text-gray-700 mb-2">Job Title *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Marketing Director"
                            placeholderTextColor="#9CA3AF"
                            value={t.title}
                            onChangeText={(text) => handleTestimonialChange(index, 'title', text)}
                          />

                          <Text className="text-sm font-semibold text-gray-700 mb-2">Company *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Creative Solutions Inc."
                            placeholderTextColor="#9CA3AF"
                            value={t.company}
                            onChangeText={(text) => handleTestimonialChange(index, 'company', text)}
                          />

                          <Text className="text-sm font-semibold text-gray-700 mb-2">Content *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Absolutely stunning photos..."
                            placeholderTextColor="#9CA3AF"
                            value={t.text}
                            onChangeText={(text) => handleTestimonialChange(index, 'text', text)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ minHeight: 80 }}
                          />

                          <Text className="text-sm font-semibold text-gray-700 mb-2">Rating (1-5) *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., 5"
                            placeholderTextColor="#9CA3AF"
                            value={t.rating}
                            onChangeText={(text) => handleTestimonialChange(index, 'rating', text)}
                            keyboardType="numeric"
                            maxLength={1}
                          />

                          <Text className="text-sm font-semibold text-gray-700 mb-2">Testimonial Image</Text>
                          <TouchableOpacity
                            className={`bg-white border border-gray-300 rounded-lg p-3 flex-row items-center justify-center ${
                              uploading ? 'opacity-60' : ''
                            }`}
                            onPress={() => handleImageUpload(index)}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <ActivityIndicator size="small" color="#F97316" />
                            ) : (
                              <>
                                <Icon name="camera" size={16} color="#F97316" />
                                <Text className="text-sm text-gray-900 ml-2">
                                  {t.image ? 'Change Image' : 'Upload Image'}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          {t.image && (
                            <View className="mt-2">
                              <Image
                                source={{ uri: t.image }}
                                className="w-24 h-24 rounded-lg"
                                resizeMode="cover"
                              />
                              <TouchableOpacity
                                className="absolute top-1 right-1 bg-red-500 p-2 rounded-full"
                                onPress={() => handleTestimonialChange(index, 'image', '')}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        className="bg-orange-500 py-3 px-4 rounded-xl flex-row items-center justify-center"
                        onPress={addTestimonial}
                      >
                        <Icon name="add" size={18} color="#FFFFFF" />
                        <Text className="text-white text-base font-semibold ml-2">Add Testimonial</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>

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

export default TestimonialsPage;