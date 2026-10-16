import { NavigationContainer, LinkingOptions, type NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { TermsScreen } from './src/screens/TermsScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { MaintenanceScreen } from './src/screens/MaintenanceScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { getMe, type User } from './src/lib/auth';
import { getAccessToken } from './src/lib/api';
import { isMaintenanceMode } from './src/lib/maintenance';
import { PageLoader } from './src/components/PageStatus';
import { AppStatusProvider } from './src/components/AppStatusProvider';
import { DialogProvider } from './src/components/AppDialog';
import { AppUpdateBanner } from './src/components/AppUpdateBanner';
import { ThemeProvider, useTheme } from './src/themeContext';
import type { ThemeColors } from './src/theme';
import { AuthContext, type RootStackParamList } from './src/authContext';
import { trackNavigationState } from './src/lib/visitAnalytics';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'dompettenang://'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token: string) => token,
        },
      },
      Terms: 'terms',
      Privacy: 'privacy',
    },
  },
};

function AppInner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [maintenance, setMaintenance] = useState(isMaintenanceMode);
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    if (maintenance) {
      setBooting(false);
      return;
    }
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setUser(null);
          return;
        }
        const me = await getMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, [maintenance]);

  if (booting) {
    return (
      <View style={styles.boot}>
        <View style={styles.glowA} pointerEvents="none" />
        <View style={styles.glowB} pointerEvents="none" />
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons name="wallet" size={28} color="#07111f" />
          </View>
          <View>
            <Text style={styles.splashName}>Dompet Tenang</Text>
            <Text style={styles.splashBrandTag}>FINANCE OS</Text>
          </View>
        </View>
        <Text style={styles.splashTag}>Catat keuangan dengan tenang</Text>
      </View>
    );
  }

  if (maintenance) {
    return (
      <>
        <StatusBar style="light" />
        <MaintenanceScreen
          onRetry={() => {
            setMaintenance(isMaintenanceMode);
            if (!isMaintenanceMode) {
              setBooting(true);
            }
          }}
        />
      </>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <DialogProvider>
        <AppStatusProvider>
          <View style={styles.appRoot}>
            <StatusBar style={colors.statusBar} />
            <NavigationContainer
              ref={navRef}
              linking={linking}
              onReady={() => {
                trackNavigationState(navRef.current?.getRootState());
              }}
              onStateChange={(state) => {
                trackNavigationState(state);
              }}
            >
              {user ? (
                <MainNavigator user={user} onLogout={() => setUser(null)} />
              ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
                  <Stack.Screen name="Welcome" component={WelcomeScreen} />
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                  <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                  <Stack.Screen name="Terms" component={TermsScreen} />
                  <Stack.Screen name="Privacy" component={PrivacyScreen} />
                </Stack.Navigator>
              )}
            </NavigationContainer>
            <AppUpdateBanner />
          </View>
        </AppStatusProvider>
      </DialogProvider>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    appRoot: { flex: 1 },
    boot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#07111f',
    },
    glowA: {
      position: 'absolute',
      top: -40,
      left: -60,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: 'rgba(28, 200, 180, 0.28)',
    },
    glowB: {
      position: 'absolute',
      bottom: 40,
      right: -80,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: 'rgba(15, 155, 142, 0.22)',
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    logoBox: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: '#1cc8b4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    splashName: {
      color: '#fff',
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    splashBrandTag: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.6,
      marginTop: 2,
    },
    splashTag: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 13,
      fontWeight: '600',
      marginTop: 16,
    },
  });
}
