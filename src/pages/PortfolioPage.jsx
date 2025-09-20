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

const PortfolioPage = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projects, setProjects] = useState([{ title: '', description: '', images: [''], category: '' }]);

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

      setPortfolioData(data);
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

  const openModal = (mode) => {
    console.log('Opening modal with mode:', mode, 'portfolioData:', portfolioData);
    setModalMode(mode);
    if (mode === 'edit' && portfolioData) {
      setTitle(portfolioData.title || '');
      setDescription(portfolioData.description || '');
      setProjects(
        portfolioData.projects?.map(proj => ({
          title: proj.title || '',
          description: proj.description || '',
          images: proj.images?.length ? proj.images : [''],
          category: proj.category || '',
        })) || [{ title: '', description: '', images: [''], category: '' }],
      );
    } else if (mode === 'create') {
      setTitle('');
      setDescription('');
      setProjects([{ title: '', description: '', images: [''], category: '' }]);
    }
    setModalVisible(true);
    console.log('Modal state:', { modalMode: mode, modalVisible: true });
  };

  const handleSave = async () => {
    if (modalMode !== 'create' && modalMode !== 'edit') return;
    if (!title.trim() || !description.trim() || projects.some(proj => !proj.title.trim() || !proj.category.trim())) {
      Alert.alert('Error', 'Please fill in all required fields (title, description, project titles, and categories).');
      return;
    }

    setLoading(true);
    try {
      const body = {
        title,
        description,
        projects: projects
          .filter(proj => proj.title.trim() && proj.category.trim())
          .map(proj => ({
            title: proj.title,
            description: proj.description,
            images: proj.images.filter(img => img.trim()),
            category: proj.category,
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
        setPortfolioData(data);
        setModalVisible(false);
        Alert.alert('Success', `Portfolio ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        fetchPortfolioData();
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

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...projects];
    newProjects[index][field] = value;
    setProjects(newProjects);
  };

  const handleImageChange = (projectIndex, imageIndex, value) => {
    const newProjects = [...projects];
    newProjects[projectIndex].images[imageIndex] = value;
    setProjects(newProjects);
  };

  const addProject = () => {
    setProjects([...projects, { title: '', description: '', images: [''], category: '' }]);
  };

  const removeProject = (index) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const addImage = (projectIndex) => {
    const newProjects = [...projects];
    newProjects[projectIndex].images.push('');
    setProjects(newProjects);
  };

  const removeImage = (projectIndex, imageIndex) => {
    const newProjects = [...projects];
    if (newProjects[projectIndex].images.length > 1) {
      newProjects[projectIndex].images = newProjects[projectIndex].images.filter((_, i) => i !== imageIndex);
      setProjects(newProjects);
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
            source={{ uri: `${API_BASE_URL}${project.images[0] || '/default-project.jpg'}` }}
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
                <Text className="text-base leading-6 text-amber-800 text-justify">
                  {portfolioData.description}
                </Text>
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
                      <Text className="text-base font-semibold text-gray-900 mb-2">Description *</Text>
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
                    
                    {/* Projects Section */}
                    <View className="mb-5">
                      <Text className="text-base font-semibold text-gray-900 mb-3">Projects</Text>
                      {projects.map((proj, projIndex) => (
                        <View key={projIndex} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-base font-semibold text-gray-700">Project {projIndex + 1}</Text>
                            {projects.length > 1 && (
                              <TouchableOpacity
                                className="bg-red-500 p-2 rounded-lg"
                                onPress={() => removeProject(projIndex)}
                              >
                                <Icon name="trash" size={16} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Project Title *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Wedding Collection 2024"
                            placeholderTextColor="#9CA3AF"
                            value={proj.title}
                            onChangeText={(text) => handleProjectChange(projIndex, 'title', text)}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Project Description</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Romantic moments captured..."
                            placeholderTextColor="#9CA3AF"
                            value={proj.description}
                            onChangeText={(text) => handleProjectChange(projIndex, 'description', text)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ minHeight: 80 }}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Category *</Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
                            placeholder="e.g., Wedding"
                            placeholderTextColor="#9CA3AF"
                            value={proj.category}
                            onChangeText={(text) => handleProjectChange(projIndex, 'category', text)}
                          />
                          
                          <Text className="text-sm font-semibold text-gray-700 mb-2">Images</Text>
                          {proj.images.map((img, imgIndex) => (
                            <View key={imgIndex} className="flex-row items-center mb-2">
                              <TextInput
                                className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 mr-2"
                                placeholder={`e.g., /image${imgIndex + 1}.jpg`}
                                placeholderTextColor="#9CA3AF"
                                value={img}
                                onChangeText={(text) => handleImageChange(projIndex, imgIndex, text)}
                              />
                              {proj.images.length > 1 && (
                                <TouchableOpacity
                                  className="bg-red-100 p-2 rounded-lg"
                                  onPress={() => removeImage(projIndex, imgIndex)}
                                >
                                  <Icon name="trash" size={16} color="#EF4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                          
                          <TouchableOpacity
                            className="bg-blue-500 py-2.5 px-3 rounded-lg flex-row items-center justify-center mt-2"
                            onPress={() => addImage(projIndex)}
                          >
                            <Icon name="add" size={16} color="#FFFFFF" />
                            <Text className="text-white text-sm font-semibold ml-2">Add Image</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      
                      <TouchableOpacity 
                        className="bg-orange-500 py-3 px-4 rounded-xl flex-row items-center justify-center"
                        onPress={addProject}
                      >
                        <Icon name="add" size={18} color="#FFFFFF" />
                        <Text className="text-white text-base font-semibold ml-2">Add Project</Text>
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