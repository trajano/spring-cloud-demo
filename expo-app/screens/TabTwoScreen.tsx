import { useHeaderHeight } from '@react-navigation/elements';
import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import { format, Locale } from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Keyboard, NativeScrollEvent, NativeSyntheticEvent, ScrollView as RNScrollView, StyleSheet, TextInputFocusEventData } from 'react-native';
import { ScrollView, Text, TextInput, View } from '../src/components';
import { useTheming } from '../src/lib/native-unstyled';

export default function TabTwoScreen() {
  const { colorScheme } = useTheming()
  const { authState } = useAuth();
  const headerHeight = useHeaderHeight();
  const scrollViewRef = useRef<RNScrollView>();
  const [scrollInfo, setScrollInfo] = useState<NativeScrollEvent>();
  const locale: Locale = useMemo(() => {

    const dateFnsLocales2 = dateFnsLocales as Record<string, Locale>;
    return Localization.getLocales().map(locale => {
      // handle special cases
      return locale.languageTag.replaceAll("-", "")
    })
      .filter(localKey => !!dateFnsLocales2[localKey])
      .map(localKey => dateFnsLocales2[localKey])[0] ?? dateFnsLocales.enUS;

  }, [])
  const [now, setNow] = useState(format(Date.now(), "PPpp", { locale }))
  const [username, setUsername] = useState("")

  useEffect(() => {
    const keyboardWillShowSubscription = Keyboard.addListener("keyboardWillShow", (e) => { console.log({ keyboardWillShow: e }) });
    const keyboardDidShowSubscription = Keyboard.addListener("keyboardDidShow", (e) => { console.log({ keyboardDidShow: e }) });
    const keyboardWillHideSubscription = Keyboard.addListener("keyboardWillHide", (e) => { console.log({ keyboardWillHide: e }) });
    const keyboardDidHideSubscription = Keyboard.addListener("keyboardDidHide", (e) => { console.log({ keyboardDidHide: e }) });
    const keyboardWillChangeFrameSubscription = Keyboard.addListener("keyboardWillChangeFrame", (e) => { console.log({ keyboardWillChangeFrame: e }) });
    const keyboardDidChangeFrameSubscription = Keyboard.addListener("keyboardDidChangeFrame", (e) => { console.log({ keyboardDidChangeFrame: e }) });
    return () => {
      keyboardWillShowSubscription.remove();
      keyboardDidShowSubscription.remove();
      keyboardWillHideSubscription.remove();
      keyboardDidHideSubscription.remove();
      keyboardWillChangeFrameSubscription.remove();
      keyboardDidChangeFrameSubscription.remove();
    }
  }, [])

  useEffect(() => {

    const c = setInterval(() => setNow(format(Date.now(), "PPpp", { locale })), 1000);
    return () => clearInterval(c);

  }, [locale])

  const onFocus = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    console.log({ onFocus: e })
    scrollViewRef.current?.scrollTo({ y: 10, animated: true });
  }, [])

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" ref={scrollViewRef} onScroll={(e) => setScrollInfo(e.nativeEvent)}>
      <Text bg="primary:f" fg="primary:b" style={styles.title}>{now}</Text>
      <Text>{scrollInfo?.contentOffset.x} {scrollInfo?.contentOffset.y}</Text>
      <View style={styles.separator} />
      <Text>Hello {username} <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text></Text>
      <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} width={300} onFocus={onFocus} backgroundColor="#DDDDFF" />
      <Text fg="blue">{AuthState[authState]}</Text>
      <Text>{JSON.stringify(scrollInfo)}</Text>
      <View height={headerHeight} width={100} bg="red" fg="yellow" alignItems='center' justifyContent='center'>
        <Text fg="yellow" >{headerHeight}</Text>
      </View>
      <Button title='scroll' onPress={() => scrollViewRef.current?.scrollTo({ y: 30, animated: true })} />
      <Text style={{ fontFamily: "IBMPlexSans", fontSize: 30 }}>IBMPlexSans <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text> {colorScheme}</Text>
      <Text style={{ fontFamily: "Lexend", fontSize: 20 }}>Lexend has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text> </Text></Text>
      <Text style={{ fontFamily: "IslandMoments", fontSize: 40 }}>IslandMoments has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text></Text><Text style={{ fontWeight: "bold" }}>bold</Text></Text>
      <Text style={{ fontFamily: "IBMPlexSans", fontSize: 30 }}>IBMPlexSans <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text> {colorScheme}</Text>
      <Text style={{ fontFamily: "Lexend", fontSize: 20 }}>Lexend has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text> </Text></Text>
      <Text style={{ fontFamily: "IslandMoments", fontSize: 40 }}>IslandMoments has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text></Text><Text style={{ fontWeight: "bold" }}>bold</Text></Text>
      <Text style={{ fontFamily: "IBMPlexSans", fontSize: 30 }}>IBMPlexSans <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text> {colorScheme}</Text>
      <Text style={{ fontFamily: "Lexend", fontSize: 20 }}>Lexend has no <Text style={{ fontStyle: "italic" }}>italic <Text style={{ fontWeight: "bold" }}>bold</Text> </Text></Text>
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
