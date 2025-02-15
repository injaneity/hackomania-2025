import React, { useState } from "react";
import { TextInput, View, StyleSheet, Pressable, Text } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import Spinner from "react-native-loading-spinner-overlay";
import { Stack } from "expo-router";

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      // Create the user on Clerk
      await signUp.create({
        emailAddress,
        password,
      });
      // Send verification Email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      // Change the UI to verify the email address
      setPendingVerification(true);
    } catch (err: any) {
      alert(err.errors.message);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      await setActive({ session: completeSignUp.createdSessionId });
    } catch (err: any) {
      alert(err.errors.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !pendingVerification }} />
      <Spinner visible={loading} />
      
      {!pendingVerification && (
        <>
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

          <Pressable onPress={onSignUpPress} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Sign up</Text>
          </Pressable>
        </>
      )}
      {pendingVerification && (
        <>
          <TextInput
            autoCapitalize="none"
            placeholder="Code..."
            placeholderTextColor="#888"
            value={code}
            onChangeText={setCode}
            style={styles.inputField}
          />

          <Pressable onPress={onPressVerify} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Verify Email</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

export default Register;

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
});
