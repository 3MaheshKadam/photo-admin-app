import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import '../../global.css'

// Import your pages
import AboutPage from '../pages/AboutPage';
import PortfolioPage from '../pages/PortfolioPage';
import ServicesPage from '../pages/ServicesPage';
import TestimonialsPage from '../pages/TestimonialsPage';
import ClientsPage from '../pages/ClientsPage';
// import AdminPage from '../pages/AdminPage';

// Import icons
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator for main app screens
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          const iconSize = focused ? 26 : 22;
          switch (route.name) {
            case 'About':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            case 'Portfolio':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Services':
              iconName = focused ? 'diamond' : 'diamond-outline';
              break;
            case 'Testimonials':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Clients':
              iconName = focused ? 'ribbon' : 'ribbon-outline';
              break;
            default:
              iconName = 'help-outline';
          }
          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: 25,
              marginTop: focused ? -4 : 0,
              backgroundColor: focused ? '#FFFFFF' : 'transparent',
              shadowColor: focused ? '#F87171' : 'transparent',
              shadowOffset: {
                width: 0,
                height: focused ? 6 : 0,
              },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: focused ? 12 : 0,
              elevation: focused ? 8 : 0,
              borderWidth: focused ? 2 : 0,
              borderColor: focused ? '#F87171' : 'transparent',
            }}>
              <LinearGradient
                colors={focused ? ['#F87171', '#EF4444'] : ['transparent', 'transparent']}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={iconName}
                  size={iconSize}
                  color={focused ? '#FFFFFF' : '#9CA3AF'}
                />
              </LinearGradient>
            </View>
          );
        },
        headerShown: false, // Remove all headers from tab screens
        tabBarActiveTintColor: '#F87171',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 25,
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -8,
          },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          paddingVertical: 12,
          paddingHorizontal: 15,
          height: 90,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          marginHorizontal: 10,
          marginBottom: Platform.OS === 'ios' ? 20 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 6,
          marginTop: 4,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          flex: 1,
          alignItems: 'center',
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="About"
        component={AboutPage}
        options={{
          title: 'About',
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioPage}
        options={{
          title: 'Portfolio',
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesPage}
        options={{
          title: 'Services',
        }}
      />
      <Tab.Screen
        name="Testimonials"
        component={TestimonialsPage}
        options={{
          title: 'Reviews',
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsPage}
        options={{
          title: 'Clients',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Remove all headers from stack screens
        }}
      >
        {/* Main Tab Navigator */}
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
       
        {/* Admin Page as Modal/Stack Screen */}
      
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;