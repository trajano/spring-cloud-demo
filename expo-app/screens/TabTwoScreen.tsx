import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDebouncedDeepState } from '@trajano/react-hooks';
import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import { format, Locale } from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert, Button, Keyboard, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView as RNScrollView, StyleSheet, Text as RNText, TextInputFocusEventData } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, Text, TextInput, useTheming, View } from '../src/lib/native-unstyled';

export default function TabTwoScreen({ navigation }: NativeStackScreenProps<any>) {
  const { colorScheme, setColorScheme, defaultTypography } = useTheming()
  const { authState } = useAuth();
  const safeAreaInsets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const scrollViewRef = useRef<RNScrollView>();
  const [scrollInfo, setScrollInfo] = useDebouncedDeepState<NativeScrollEvent>({
    contentOffset: {
      x: 0,
      y: 0
    }
  } as NativeScrollEvent, 100);
  const locale: Locale = useMemo(() => {
    let preferredLocales = Localization.getLocales();
    if (__DEV__) {
      if (!Array.isArray(preferredLocales)) {
        // console.warn("getLocales() didn't return an array, it may be a promise when running in a debugger, defaulting to `enUS`")
        return dateFnsLocales.enUS;
      }
    }

    const dateFnsLocales2 = dateFnsLocales as Record<string, Locale>;
    return Localization.getLocales().map(locale => {
      // handle special cases
      return locale.languageTag.split("-").join("");
    })
      .filter(localKey => !!dateFnsLocales2[localKey])
      .map(localKey => dateFnsLocales2[localKey])[0] ?? dateFnsLocales.enUS;

  }, [])
  const [now, setNow] = useState(format(Date.now(), "PPpp", { locale }))
  const [username, setUsername] = useState("")
  const [keyboardLog, logKeyboardEvent] = useReducer(
    (prevState: { key: string, name: string, event: any }[], action: { eventName: string, event?: any }) => action.eventName === "clear" ? [] : [...prevState, {
      name: action.eventName,
      event: action.event,
      key: action.eventName + "-" + Date.now()
    }], []);

  useEffect(() => {
    const keyboardWillShowSubscription = Keyboard.addListener("keyboardWillShow", (e) => { logKeyboardEvent({ eventName: "keyboardWillShow", event: e }) });
    const keyboardDidShowSubscription = Keyboard.addListener("keyboardDidShow", (e) => { logKeyboardEvent({ eventName: "keyboardDidShow", event: e }) });
    const keyboardWillHideSubscription = Keyboard.addListener("keyboardWillHide", (e) => { logKeyboardEvent({ eventName: "keyboardWillHide", event: e }) });
    const keyboardDidHideSubscription = Keyboard.addListener("keyboardDidHide", (e) => { logKeyboardEvent({ eventName: "keyboardDidHide", event: e }) });
    const keyboardWillChangeFrameSubscription = Keyboard.addListener("keyboardWillChangeFrame", (e) => { logKeyboardEvent({ eventName: "keyboardWillChangeFrame", event: e }) });
    const keyboardDidChangeFrameSubscription = Keyboard.addListener("keyboardDidChangeFrame", (e) => { logKeyboardEvent({ eventName: "keyboardDidChangeFrame", event: e }) });
    return () => {
      keyboardWillShowSubscription.remove();
      keyboardDidShowSubscription.remove();
      keyboardWillHideSubscription.remove();
      keyboardDidHideSubscription.remove();
      keyboardWillChangeFrameSubscription.remove();
      keyboardDidChangeFrameSubscription.remove();
    }
  }, [])

  // useEffect(() => {

  //   const c = setInterval(() => setNow(format(Date.now(), "PPpp", { locale })), 1000);
  //   return () => clearInterval(c);

  // }, [locale])

  const onFocus = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    console.log({ onFocus: e })
    scrollViewRef.current?.scrollTo({ y: 10, animated: true });
  }, [scrollViewRef.current])

  const handleScrollButton = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 30, animated: true });
  }, [])

  useFocusEffect(useCallback(() => {
    navigation.setOptions({
      title: JSON.stringify(defaultTypography)
    })
  }, [defaultTypography]))

  return (
    <ScrollView ref={scrollViewRef}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: Platform.OS === "ios" ? 0 : headerHeight,
      }}
      scrollEventThrottle={16}
      onScroll={(e) => setScrollInfo(e.nativeEvent)}>
      <View height={headerHeight} bg="yellow">
        <Text fg="primary:f" style={styles.title}>{now}</Text>
      </View>
      <Button title={colorScheme === "light" ? "switch to dark" : "switch to light"} onPress={() => { setColorScheme(colorScheme === "light" ? "dark" : "light") }} />
      <Text>{scrollInfo?.contentOffset.x} {scrollInfo?.contentOffset.y}</Text>
      <Text>Hello {username} <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text></Text>
      <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} width={300} onFocus={onFocus} backgroundColor="#DDDDFF" />
      <Text fg="blue">{AuthState[authState]}</Text>
      <Text>{scrollInfo?.contentOffset.x} {scrollInfo?.contentOffset.y}</Text>
      <Text>{JSON.stringify(scrollInfo, null, 2)}</Text>
      <View height={headerHeight} width={100} bg="red" alignItems='center' justifyContent='center'>
        <Text fg="yellow" >{headerHeight}</Text>
      </View>
      <Button title='scroll' onPress={handleScrollButton} />
      <Button title='clear' onPress={() => logKeyboardEvent({ eventName: "clear" })} />
      <Button title='show alert' onPress={() => Alert.alert("Hello", "world", [{ text: "OK Button", onPress: () => { console.log("pressed alert") } }])} />
      {keyboardLog.map((entry) => <Text key={entry.key}>{entry.name} <Text>{JSON.stringify(entry.event)}</Text></Text>)}
      <Text style={{ fontFamily: "IBMPlexSans", fontSize: 30 }}>IBMPlexSans <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text> {colorScheme}</Text>
      <Text style={{ fontFamily: "Lexend", fontSize: 20 }}>Lexend has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text> </Text></Text>
      <Text style={{ fontFamily: "IslandMoments", fontSize: 40 }}>IslandMoments has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text></Text><Text style={{ fontWeight: "bold" }}>bold</Text></Text>
      <Text style={{ fontFamily: "IBMPlexMono", fontSize: 30 }}>IBMPlexMono <Text style={{ fontWeight: "bold", color: "red" }}>bold <Text style={{ fontStyle: "italic" }}>italic</Text> </Text><Text italic>{colorScheme}</Text></Text>
      <RNText testID="Lexend faux italic" style={{ fontFamily: "Lexend_400Regular", fontStyle: "italic", fontSize: 30 }}>(RN Text) Lexend faux italic</RNText>
      <RNText style={{ fontFamily: "Lexend_700Bold", fontStyle: "italic", fontSize: 30 }}>(RN Text) Lexend Bolded faux italic</RNText>
      <Text style={{ fontFamily: "IslandMoments", fontSize: 40 }}>IslandMoments has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text></Text><Text style={{ fontWeight: "bold" }}>bold</Text></Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
