import { format, Locale } from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView, Text, TextInput, View } from '../src/components';
import { useTheming } from '../src/lib/native-unstyled';
import { useHeaderHeight } from '@react-navigation/elements';
import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';

export default function TabTwoScreen() {
  const { colorScheme } = useTheming()
  const { authState } = useAuth();
  const headerHeight = useHeaderHeight();
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

    const c = setInterval(() => setNow(format(Date.now(), "PPpp", { locale })), 1000);
    return () => clearInterval(c);

  }, [locale])
  return (
    <ScrollView contentContainerStyle={[styles.container]} contentInsetAdjustmentBehavior="automatic">
      <Text bg="primary:f" fg="primary:b" style={styles.title}>{now}</Text>
      <View style={styles.separator} />
      <Text>Hello {username} <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text></Text>
      <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} style={{ width: 300 }} />
      <Text fg="blue">{AuthState[authState]}</Text>
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
