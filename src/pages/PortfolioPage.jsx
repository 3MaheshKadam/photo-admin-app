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

const PortfolioPage = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Changed from projects to items to match API
  const [items, setItems] = useState([{ title: '', category: '', image: '' }]);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = 'https://photographer-protfolio.vercel.app';

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('GET Response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 404) {
          setPortfolioData(null);
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Transform API response to match component expectations
      const transformedData = {
        ...data,
        // Convert items to projects format for internal use
        projects: data.items?.map(item => ({
          title: item.title,
          description: item.description || '',
          images: item.image ? [item.image] : [], // Convert single image to array
          category: item.category
        })) || []
      };

      setPortfolioData(transformedData);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      if (!error.message.includes('Portfolio not found')) {
        Alert.alert('Error', `Failed to load portfolio data: ${error.message}`);
      }
      setPortfolioData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (itemIndex) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `portfolio-item-${itemIndex}.jpg`,
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

        if (uploadResult.secure_url) {
          const newItems = [...items];
          newItems[itemIndex].image = uploadResult.secure_url;
          setItems(newItems);
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
    console.log('Opening modal with mode:', mode, 'portfolioData:', portfolioData);
    setModalMode(mode);
    if (mode === 'edit' && portfolioData) {
      setTitle(portfolioData.title || '');
      setDescription(portfolioData.description || '');
      // Convert projects back to items format for editing
      setItems(
        portfolioData.projects?.map(proj => ({
          title: proj.title || '',
          category: proj.category || '',
          image: proj.images?.[0] || '', // Take first image only
        })) || [{ title: '', category: '', image: '' }],
      );
    } else if (mode === 'create') {
      setTitle('');
      setDescription('');
      setItems([{ title: '', category: '', image: '' }]);
    }
    setModalVisible(true);
    console.log('Modal state:', { modalMode: mode, modalVisible: true });
  };

  const handleSave = async () => {
    if (modalMode !== 'create' && modalMode !== 'edit') return;
    if (!title.trim() || items.some(item => !item.title.trim() || !item.category.trim())) {
      Alert.alert('Error', 'Please fill in all required fields (title, item titles, and categories).');
      return;
    }

    setLoading(true);
    try {
      // Transform data to match API expectations
      const body = {
        title,
        description, // API might ignore this based on schema
        items: items
          .filter(item => item.title.trim() && item.category.trim())
          .map(item => ({
            title: item.title,
            category: item.category,
            image: item.image || '', // Single image field
          })),
      };
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`${method} Response:`, { status: response.status, data });

      if (response.ok) {
        setModalVisible(false);
        Alert.alert('Success', `Portfolio ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        fetchPortfolioData(); // Refresh data
      } else {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`${method} Error:`, error);
      Alert.alert('Error', `Failed to ${modalMode === 'create' ? 'create' : 'update'} portfolio: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('DELETE Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setPortfolioData(null);
      setModalVisible(false);
      Alert.alert('Success', 'Portfolio deleted successfully');
    } catch (error) {
      console.error('Error deleting portfolio data:', error);
      Alert.alert('Error', `Failed to delete portfolio: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { title: '', category: '', image: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolioData().finally(() => setRefreshing(false));
  };

  const renderProjectCard = (project, index) => (
    <View key={index} className="w-[48%] mb-4">
      <View className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
        <LinearGradient
          colors={['#FB923C', '#F97316']}
          className="rounded-2xl overflow-hidden"
        >
          <Image
            source={{ uri: project.images[0] || 'https://via.placeholder.com/150' }}
            className="w-full h-30"
            resizeMode="cover"
          />
          <View className="p-4">
            <View className="bg-white bg-opacity-20 rounded-xl px-2 py-1 self-start mb-2">
              <Text className="text-white text-xs font-semibold">{project.category}</Text>
            </View>
            <Text className="text-white text-sm font-bold mb-1">{project.title}</Text>
            <Text className="text-white text-xs leading-4 opacity-90" numberOfLines={2}>
              {project.description}
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
        <Text className="mt-3 text-base text-amber-800 font-medium">Loading Portfolio...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FEF7ED" />
      
      {/* Enhanced Action Buttons Header */}
      <View className="bg-white px-5 py-4 border-b border-orange-200 shadow-sm">
        <Text className="text-2xl font-bold text-amber-900 mb-4">Portfolio Management</Text>
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
          
          {portfolioData && (
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
        {portfolioData ? (
          <>
            {/* Enhanced Header Section */}
            <View className="px-5 pt-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-4">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="images-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">{portfolioData.title}</Text>
                </View>
                {portfolioData.description && (
                  <Text className="text-base leading-6 text-amber-800 text-justify">
                    {portfolioData.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Enhanced Projects Section */}
            <View className="px-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-6">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="briefcase-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">Our Projects</Text>
                </View>
                <View className="flex-row flex-wrap justify-between">
                  {portfolioData.projects?.map((project, index) =>
                    renderProjectCard(project, index)
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
              <Text className="text-2xl font-bold text-amber-900 mb-3 text-center">No Portfolio Data Found</Text>
              <Text className="text-base text-amber-700 text-center mb-6 leading-6">
                The portfolio section doesn't exist yet or has been deleted. {'\n'}Create a new one to get started.
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity 
                  className="bg-amber-600 px-6 py-3 rounded-xl flex-row items-center shadow-sm" 
                  onPress={fetchPortfolioData}
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
                  <View className="bg-red-100 rounded-2xl p-3 mb-3">
                    <Icon name="warning" size={32} color="#EF4444" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">Delete Portfolio</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Are you sure you want to delete this portfolio section? This action cannot be undone.
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
                    <View className="bg-orange-100 rounded-xl p-2 mr-3">
                      <Icon name={modalMode === 'create' ? 'add' : 'pencil'} size={20} color="#F97316" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900">
                      {modalMode === 'create' ? 'Create Portfolio' : 'Edit Portfolio'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    className="bg-gray-100 rounded-xl p-2"
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
                        placeholder="e.g., Our Photography Portfolio"
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={setTitle}
                      />
                    </View>
                    
                    {/* Description Field */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-2">Description</Text>
                      <TextInput
                        className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-base text-gray-900"
                        placeholder="e.g., A collection of our best photography work..."
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{ minHeight: 100 }}
                      />
                    </View>
                    
                    {/* Portfolio Items Section */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-3">Portfolio Items</Text>
                      {items.map((item, itemIndex) => (
                        <View key={itemIndex} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-base font-semibold text-gray-700">Item {itemIndex + 1}</Text>
                            {items.length > 1 && (
                              <TouchableOpacity
                                className="bg-red-500 p-2 rounded-lg"
                                onPress={() => removeItem(itemIndex)}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Item Title *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Wedding Collection 2024"
                            placeholderTextColor="#9CA3AF"
                            value={item.title}
                            onChangeText={(text) => handleItemChange(itemIndex, 'title', text)}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Category *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Wedding"
                            placeholderTextColor="#9CA3AF"
                            value={item.category}
                            onChangeText={(text) => handleItemChange(itemIndex, 'category', text)}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Image</Text>
                          <TouchableOpacity
                            className={`bg-white border border-gray-300 rounded-lg p-3 flex-row items-center justify-center mb-3 ${uploading ? 'opacity-60' : ''}`}
                            onPress={() => handleImageUpload(itemIndex)}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <ActivityIndicator size="small" color="#F97316" />
                            ) : (
                              <>
                                <Icon name="camera" size={16} color="#F97316" />
                                <Text className="text-sm text-gray-900 ml-2">
                                  {item.image ? 'Change Image' : 'Upload Image'}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          
                          {item.image && (
                            <View className="mb-3">
                              <Image
                                source={{ uri: item.image }}
                                className="w-full h-32 rounded-lg"
                                resizeMode="cover"
                              />
                              <TouchableOpacity
                                className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
                                onPress={() => handleItemChange(itemIndex, 'image', '')}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))}
                      
                      <TouchableOpacity 
                        className="bg-orange-500 py-3 px-4 rounded-xl flex-row items-center justify-center"
                        onPress={addItem}
                      >
                        <Icon name="add" size={18} color="#FFFFFF" />
                        <Text className="text-white text-base font-semibold ml-2">Add Item</Text>
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

export default PortfolioPage;