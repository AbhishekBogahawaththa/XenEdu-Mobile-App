import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { COLORS } from '../utils/constants';

import LoginScreen from '../screens/auth/LoginScreen';
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentClasses from '../screens/student/StudentClasses';
import StudentAITutor from '../screens/student/StudentAITutor';
import StudentProfile from '../screens/student/StudentProfile';
import StudentQRCode from '../screens/student/StudentQRCode';
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import TeacherAttendance from '../screens/teacher/TeacherAttendance';
import ParentDashboard from '../screens/parent/ParentDashboard';
import StudentAttendance from '../screens/student/StudentAttendance';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ── Student Tabs ──────────────────────────────────────────────────
const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Classes') iconName = focused ? 'book' : 'book-outline';
        else if (route.name === 'My ID') iconName = focused ? 'qr-code' : 'qr-code-outline';
        else if (route.name === 'Attendance') iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
        else if (route.name === 'AI Tutor') iconName = focused ? 'sparkles' : 'sparkles-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={StudentDashboard} />
    <Tab.Screen name="Classes" component={StudentClasses} />
    <Tab.Screen name="My ID" component={StudentQRCode} />
    <Tab.Screen name="Attendance" component={StudentAttendance} />
    <Tab.Screen name="AI Tutor" component={StudentAITutor} />
    <Tab.Screen name="Profile" component={StudentProfile} />
  </Tab.Navigator>
);

// ── Teacher Tabs ──────────────────────────────────────────────────

const TeacherTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Attendance') iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={TeacherDashboard} />
    <Tab.Screen name="Attendance" component={TeacherAttendance} />
  </Tab.Navigator>
);

// ── Admin Tabs ────────────────────────────────────────────────────
const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.gold,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        backgroundColor: '#1a1a1a',
        borderTopWidth: 0,
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}
  >
    <Tab.Screen name="Dashboard" component={StudentDashboard}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
    />
  </Tab.Navigator>
);

// ── Parent Tabs ───────────────────────────────────────────────────
const ParentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={ParentDashboard} />
  </Tab.Navigator>
);

// ── Auth Stack ────────────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// ── Role based navigator ──────────────────────────────────────────
const RoleNavigator = ({ role }) => {
  switch (role) {
    case 'student': return <StudentTabs />;
    case 'teacher': return <TeacherTabs />;
    case 'admin':   return <AdminTabs />;
    case 'parent':  return <ParentTabs />;
    default:        return <StudentTabs />;
  }
};

// ── Main Navigator ────────────────────────────────────────────────
const AppNavigator = () => {
  const { user, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <RoleNavigator role={user.role} /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;