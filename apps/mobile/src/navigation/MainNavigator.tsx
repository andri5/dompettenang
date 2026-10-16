import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { User } from '../lib/auth';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TransactionFormScreen } from '../screens/TransactionFormScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { CategoryFormScreen } from '../screens/CategoryFormScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { BudgetScreen } from '../screens/BudgetScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { SavingsScreen } from '../screens/SavingsScreen';
import { useColors } from '../themeContext';
import { AppTabBar } from './AppTabBar';
import type { MainStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function CapturePlaceholder() {
  return <View />;
}

function MainTabs({ user, onLogout }: { user: User; onLogout: () => void }) {
  const stackNav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const openCapture = () => {
    stackNav.navigate('TransactionForm', { captureReceipt: true });
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} onCapture={openCapture} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" options={{ title: 'Beranda' }}>
        {() => <DashboardScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'Transaksi' }}
      />
      <Tab.Screen
        name="Capture"
        component={CapturePlaceholder}
        options={{ title: 'Foto Struk' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            openCapture();
          },
        }}
      />
      <Tab.Screen name="Summary" component={SummaryScreen} options={{ title: 'Ringkasan' }} />
      <Tab.Screen name="Profile" options={{ title: 'Profil' }}>
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function MainNavigator({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const colors = useColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: colors.text, fontSize: 17 },
        headerTintColor: colors.brand,
        headerBackTitle: 'Kembali',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Tabs" options={{ headerShown: false }}>
        {() => <MainTabs user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="TransactionForm"
        component={TransactionFormScreen}
        options={{
          title: 'Tambah transaksi',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Kategori' }} />
      <Stack.Screen
        name="CategoryForm"
        component={CategoryFormScreen}
        options={{ title: 'Kategori', presentation: 'modal' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Pengaturan' }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Bantuan' }} />
      <Stack.Screen name="Budget" component={BudgetScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Recurring" component={RecurringScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Savings" component={SavingsScreen} options={{ title: 'Target Tabungan' }} />
    </Stack.Navigator>
  );
}
