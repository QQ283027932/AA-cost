import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from "@/contexts/AuthContext";
import { ColorSchemeProvider } from '@/hooks/useColorScheme';
import { initDatabase, getInitError } from '@/services/database';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await initDatabase();
        if (mounted) {
          console.log('Database initialized successfully');
          setDbReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        if (mounted) {
          const initErr = getInitError();
          setDbError(initErr?.message || '数据库初始化失败');
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>应用启动失败</Text>
        <Text style={styles.errorMessage}>{dbError}</Text>
        <Text style={styles.errorHint}>请尝试重新安装应用</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <ColorSchemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark"></StatusBar>
          <Stack screenOptions={{
            // 设置所有页面的切换动画为从右侧滑入，适用于iOS 和 Android
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            // 隐藏自带的头部
            headerShown: false
          }}>
            <Stack.Screen name="index" options={{ title: "" }} />
            <Stack.Screen name="detail" options={{ title: "" }} />
          </Stack>
          <Toast />
        </GestureHandlerRootView>
      </ColorSchemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorMessage: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    color: '#999',
    fontSize: 12,
  },
});
