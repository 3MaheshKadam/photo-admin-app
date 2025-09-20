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

const { width, height } = Dimensions.get('window');

const ServicesPage = () => {
  const [servicesData, setServicesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [title, setTitle] = useState('');
  const [services, setServices] = useState([{ title: '', description: '', image: '', buttonText: '' }]);

  const API_BASE_URL = 'https://photographer-protfolio.vercel.app';

  useEffect(() => {
    fetchServicesData();
  }, []);

  const fetchServicesData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('GET Response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 404) {
          setServicesData(null);
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setServicesData(data);
    } catch (error) {
      console.error('Error fetching services data:', error);
      if (!error.message.includes('Services not found')) {
        Alert.alert('Error', `Failed to load services data: ${error.message}`);
      }
      setServicesData(null);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode) => {
    console.log('Opening modal with mode:', mode, 'servicesData:', servicesData);
    setModalMode(mode);
    if (mode === 'edit' && servicesData) {
      setTitle(servicesData.title || '');
      setServices(
        servicesData.services?.map(srv => ({
          title: srv.title || '',
          description: srv.description || '',
          image: srv.image || '',
          buttonText: srv.buttonText || '',
        })) || [{ title: '', description: '', image: '', buttonText: '' }],
      );
    } else if (mode === 'create') {
      setTitle('');
      setServices([{ title: '', description: '', image: '', buttonText: '' }]);
    }
    setModalVisible(true);
    console.log('Modal state:', { modalMode: mode, modalVisible: true });
  };

  const handleSave = async () => {
    if (modalMode !== 'create' && modalMode !== 'edit') return;
    if (!title.trim() || services.some(srv => !srv.title.trim() || !srv.description.trim())) {
      Alert.alert('Error', 'Please fill in all required fields (title, service titles, and descriptions).');
      return;
    }

    setLoading(true);
    try {
      const body = {
        title,
        services: services
          .filter(srv => srv.title.trim() && srv.description.trim())
          .map(srv => ({
            title: srv.title,
            description: srv.description,
            image: srv.image || '',
            buttonText: srv.buttonText || 'Learn More',
          })),
      };
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`${method} Response:`, { status: response.status, data });

      if (response.ok) {
        setServicesData(data);
        setModalVisible(false);
        Alert.alert('Success', `Services ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        fetchServicesData();
      } else {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`${method} Error:`, error);
      Alert.alert('Error', `Failed to ${modalMode === 'create' ? 'create' : 'update'} services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('DELETE Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setServicesData(null);
      setModalVisible(false);
      Alert.alert('Success', 'Services deleted successfully');
    } catch (error) {
      console.error('Error deleting services data:', error);
      Alert.alert('Error', `Failed to delete services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { title: '', description: '', image: '', buttonText: '' }]);
  };

  const removeService = (index) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServicesData().finally(() => setRefreshing(false));
  };

  const renderServiceCard = (service, index) => (
    <View key={index} className="w-[48%] mb-4">
      <View className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
        <LinearGradient
          colors={['#FB923C', '#F97316']}
          className="rounded-2xl overflow-hidden"
        >
          <Image
            source={{ uri: `${API_BASE_URL}${service.image || '/default-service.jpg'}` }}
            className="w-full h-30"
            resizeMode="cover"
          />
          <View className="p-4">
            <Text className="text-white text-sm font-bold mb-2">{service.title}</Text>
            <Text className="text-white text-xs leading-4 opacity-90 mb-3" numberOfLines={3}>
              {service.description}
            </Text>
            <TouchableOpacity className="bg-white bg-opacity-90 py-2 px-4 rounded-2xl self-start">
              <Text className="text-orange-600 text-xs font-bold">{service.buttonText}</Text>
            </TouchableOpacity>
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
        <Text className="mt-3 text-base text-amber-800 font-medium">Loading Services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FEF7ED" />
      
      {/* Enhanced Action Buttons Header */}
      <View className="bg-white px-5 py-4 border-b border-orange-200 shadow-sm">
        <Text className="text-2xl font-bold text-amber-900 mb-4">Services Management</Text>
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
          
          {servicesData && (
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
                {/* <Text className="text-white text-sm font-semibold ml-2">Delete</Text> */}
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
        {servicesData ? (
          <>
            {/* Enhanced Header Section */}
            <View className="px-5 pt-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-4">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="briefcase-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">{servicesData.title}</Text>
                </View>
              </View>
            </View>

            {/* Enhanced Services Section */}
            <View className="px-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-6">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="diamond-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">Our Services</Text>
                </View>
                <View className="flex-row flex-wrap justify-between">
                  {servicesData.services?.map((service, index) =>
                    renderServiceCard(service, index)
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
              <Text className="text-2xl font-bold text-amber-900 mb-3 text-center">No Services Data Found</Text>
              <Text className="text-base text-amber-700 text-center mb-6 leading-6">
                The services section doesn't exist yet or has been deleted. {'\n'}Create a new one to get started.
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity 
                  className="bg-amber-600 px-6 py-3 rounded-xl flex-row items-center shadow-sm" 
                  onPress={fetchServicesData}
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
                  <Text className="text-xl font-bold text-gray-900 mb-2">Delete Services</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Are you sure you want to delete this services section? This action cannot be undone.
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
                      {modalMode === 'create' ? 'Create Services' : 'Edit Services'}
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
                        placeholder="e.g., Our Photography Services"
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={setTitle}
                      />
                    </View>
                    
                    {/* Services Section */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-3">Services</Text>
                      {services.map((srv, index) => (
                        <View key={index} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-base font-semibold text-gray-700">Service {index + 1}</Text>
                            {services.length > 1 && (
                              <TouchableOpacity
                                className="bg-red-500 p-2 rounded-lg"
                                onPress={() => removeService(index)}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Service Title *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Commercial Photography"
                            placeholderTextColor="#9CA3AF"
                            value={srv.title}
                            onChangeText={(text) => handleServiceChange(index, 'title', text)}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Description *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., High-quality product and brand photography..."
                            placeholderTextColor="#9CA3AF"
                            value={srv.description}
                            onChangeText={(text) => handleServiceChange(index, 'description', text)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ minHeight: 80 }}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Image URL</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., /services/commercial.jpg"
                            placeholderTextColor="#9CA3AF"
                            value={srv.image}
                            onChangeText={(text) => handleServiceChange(index, 'image', text)}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Button Text</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900"
                            placeholder="e.g., Explore More"
                            placeholderTextColor="#9CA3AF"
                            value={srv.buttonText}
                            onChangeText={(text) => handleServiceChange(index, 'buttonText', text)}
                          />
                        </View>
                      ))}
                      
                      <TouchableOpacity 
                        className="bg-orange-500 py-3 px-4 rounded-xl flex-row items-center justify-center"
                        onPress={addService}
                      >
                        <Icon name="add" size={18} color="#FFFFFF" />
                        <Text className="text-white text-base font-semibold ml-2">Add Service</Text>
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

export default ServicesPage;