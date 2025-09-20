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

const ClientsPage = () => {
  const [clientsData, setClientsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clients, setClients] = useState([{ name: '', description: '', logo: '', website: '' }]);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = 'https://photographer-protfolio.vercel.app';
  const CLOUDINARY_UPLOAD_PRESET = 'shivbandhan';
  const CLOUDINARY_CLOUD_NAME = 'dqfum2awz';

  useEffect(() => {
    fetchClientsData();
  }, []);

  const fetchClientsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/clients`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('GET Response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 404) {
          setClientsData(null);
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setClientsData(data);
    } catch (error) {
      console.error('Error fetching clients data:', error);
      if (!error.message.includes('Clients not found')) {
        Alert.alert('Error', `Failed to load clients data: ${error.message}`);
      }
      setClientsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (clientIndex) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for logos
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `client-${clientIndex}-logo.jpg`,
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
          const newClients = [...clients];
          newClients[clientIndex].logo = uploadResult.secure_url;
          setClients(newClients);
        } else {
          throw new Error('Failed to upload logo to Cloudinary');
        }
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', `Failed to upload logo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openModal = (mode) => {
    console.log('Opening modal with mode:', mode, 'clientsData:', clientsData);
    setModalMode(mode);
    if (mode === 'edit' && clientsData) {
      setTitle(clientsData.title || '');
      setDescription(clientsData.description || '');
      setClients(
        clientsData.clients?.map(client => ({
          name: client.name || '',
          description: client.description || '',
          logo: client.logo || '',
          website: client.website || '',
        })) || [{ name: '', description: '', logo: '', website: '' }],
      );
    } else if (mode === 'create') {
      setTitle('');
      setDescription('');
      setClients([{ name: '', description: '', logo: '', website: '' }]);
    }
    setModalVisible(true);
    console.log('Modal state:', { modalMode: mode, modalVisible: true });
  };

  const handleSave = async () => {
    if (modalMode !== 'create' && modalMode !== 'edit') return;
    if (!title.trim() || clients.some(c => !c.name.trim() || !c.description.trim())) {
      Alert.alert('Error', 'Please fill in all required fields (title, client name, and description).');
      return;
    }

    setLoading(true);
    try {
      const body = {
        title,
        description: description.trim() || undefined,
        clients: clients
          .filter(c => c.name.trim() && c.description.trim())
          .map(c => ({
            name: c.name,
            description: c.description,
            logo: c.logo || '',
            website: c.website || '',
          })),
      };
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch(`${API_BASE_URL}/api/clients`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`${method} Response:`, { status: response.status, data });

      if (response.ok) {
        setClientsData(data);
        setModalVisible(false);
        Alert.alert('Success', `Clients ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        fetchClientsData();
      } else {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`${method} Error:`, error);
      Alert.alert('Error', `Failed to ${modalMode === 'create' ? 'create' : 'update'} clients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('DELETE Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setClientsData(null);
      setModalVisible(false);
      Alert.alert('Success', 'Clients deleted successfully');
    } catch (error) {
      console.error('Error deleting clients data:', error);
      Alert.alert('Error', `Failed to delete clients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (index, field, value) => {
    const newClients = [...clients];
    newClients[index][field] = value;
    setClients(newClients);
  };

  const addClient = () => {
    setClients([...clients, { name: '', description: '', logo: '', website: '' }]);
  };

  const removeClient = (index) => {
    if (clients.length > 1) {
      setClients(clients.filter((_, i) => i !== index));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClientsData().finally(() => setRefreshing(false));
  };

  const renderClientCard = (client, index) => (
    <View key={index} className="w-[48%] mb-4">
      <View className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
        <LinearGradient
          colors={['#FB923C', '#F97316']}
          className="rounded-2xl overflow-hidden"
        >
          {client.logo && (
            <View className="bg-white h-20 w-full flex items-center justify-center">
              <Image
                source={{ uri: client.logo }}
                className="w-16 h-16"
                resizeMode="contain"
              />
            </View>
          )}
          <View className="p-4">
            <Text className="text-white text-sm font-bold mb-2">{client.name}</Text>
            <Text className="text-white text-xs leading-4 opacity-90 mb-3" numberOfLines={3}>
              {client.description}
            </Text>
            {client.website && (
              <TouchableOpacity onPress={() => { /* Handle website link */ }}>
                <Text className="text-orange-100 text-xs font-semibold underline">Visit Website</Text>
              </TouchableOpacity>
            )}
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
        <Text className="mt-3 text-base text-amber-800 font-medium">Loading Clients...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FEF7ED" />
      
      {/* Enhanced Action Buttons Header */}
      <View className="bg-white px-5 py-4 border-b border-orange-200 shadow-sm">
        <Text className="text-2xl font-bold text-amber-900 mb-4">Clients Management</Text>
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
          
          {clientsData && (
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
        {clientsData ? (
          <>
            {/* Enhanced Header Section */}
            <View className="px-5 pt-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-4">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="business-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">{clientsData.title}</Text>
                </View>
                {clientsData.description && (
                  <Text className="text-base leading-6 text-amber-800 text-justify">
                    {clientsData.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Enhanced Clients Section */}
            <View className="px-5 mb-8">
              <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                <View className="flex-row items-center mb-6">
                  <View className="bg-orange-100 rounded-xl p-2 mr-3">
                    <Icon name="people-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-amber-900">Our Clients</Text>
                </View>
                <View className="flex-row flex-wrap justify-between">
                  {clientsData.clients?.map((client, index) =>
                    renderClientCard(client, index)
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
              <Text className="text-2xl font-bold text-amber-900 mb-3 text-center">No Clients Data Found</Text>
              <Text className="text-base text-amber-700 text-center mb-6 leading-6">
                The clients section doesn't exist yet or has been deleted. {'\n'}Create a new one to get started.
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity 
                  className="bg-amber-600 px-6 py-3 rounded-xl flex-row items-center shadow-sm" 
                  onPress={fetchClientsData}
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
                  <Text className="text-xl font-bold text-gray-900 mb-2">Delete Clients</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Are you sure you want to delete this clients section? This action cannot be undone.
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
                      {modalMode === 'create' ? 'Create Clients' : 'Edit Clients'}
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
                        placeholder="e.g., Our Valued Clients"
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
                        placeholder="e.g., We are proud to work with these amazing clients..."
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        style={{ minHeight: 80 }}
                      />
                    </View>
                    
                    {/* Clients Section */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-3">Clients</Text>
                      {clients.map((client, index) => (
                        <View key={index} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-base font-semibold text-gray-700">Client {index + 1}</Text>
                            {clients.length > 1 && (
                              <TouchableOpacity
                                className="bg-red-500 p-2 rounded-lg"
                                onPress={() => removeClient(index)}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Client Name *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., TechCorp Inc."
                            placeholderTextColor="#9CA3AF"
                            value={client.name}
                            onChangeText={(text) => handleClientChange(index, 'name', text)}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Description *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Leading technology company..."
                            placeholderTextColor="#9CA3AF"
                            value={client.description}
                            onChangeText={(text) => handleClientChange(index, 'description', text)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ minHeight: 80 }}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Client Logo</Text>
                          <TouchableOpacity
                            className={`bg-white border border-gray-300 rounded-lg p-3 flex-row items-center justify-center ${uploading ? 'opacity-60' : ''}`}
                            onPress={() => handleImageUpload(index)}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <ActivityIndicator size="small" color="#F97316" />
                            ) : (
                              <>
                                <Icon name="camera" size={16} color="#F97316" />
                                <Text className="text-sm text-gray-900 ml-2">
                                  {client.logo ? 'Change Logo' : 'Upload Logo'}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          {client.logo && (
                            <View className="mt-2">
                              <Image
                                source={{ uri: client.logo }}
                                className="w-24 h-24 rounded-lg"
                                resizeMode="contain"
                              />
                              <TouchableOpacity
                                className="absolute top-1 right-1 bg-red-500 p-2 rounded-full"
                                onPress={() => handleClientChange(index, 'logo', '')}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2 mt-3">Website URL</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900"
                            placeholder="e.g., https://techcorp.com"
                            placeholderTextColor="#9CA3AF"
                            value={client.website}
                            onChangeText={(text) => handleClientChange(index, 'website', text)}
                            keyboardType="url"
                            autoCapitalize="none"
                          />
                        </View>
                      ))}
                      
                      <TouchableOpacity 
                        className="bg-orange-500 py-3 px-4 rounded-xl flex-row items-center justify-center"
                        onPress={addClient}
                      >
                        <Icon name="add" size={18} color="#FFFFFF" />
                        <Text className="text-white text-base font-semibold ml-2">Add Client</Text>
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

export default ClientsPage;