import { useSignIn } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

const Login = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      // This indicates the user is signed in
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />
      
      <TextInput
        autoCapitalize="none"
        placeholder="simon@galaxies.dev"
        placeholderTextColor="#888"
        value={emailAddress}
        onChangeText={setEmailAddress}
        style={styles.inputField}
      />
      <TextInput
        placeholder="password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.inputField}
      />

      {/* Custom Pressable button for Login */}
      <Pressable onPress={onSignInPress} style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Login</Text>
      </Pressable>

      <Link href="/reset" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
      </Link>
      <Link href="/register" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Create Account</Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      padding: 20,
    },
    inputField: {
      marginVertical: 8,
      height: 50,
      borderWidth: 1,
      borderColor: '#fff',
      borderRadius: 20,
      paddingHorizontal: 10,
      backgroundColor: '#fff',
      color: '#000',
    },
    actionButton: {
      marginVertical: 10,
      paddingVertical: 15,
      borderRadius: 20,
      backgroundColor: '#fff',
      alignItems: 'center',
      alignSelf: 'center', 
      width: 150,
    },
    actionButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: 'bold',
    },
    link: {
      marginVertical: 5,
      alignItems: 'center',
    },
    linkText: {
      color: '#fff',
      fontSize: 14,
    },
});
