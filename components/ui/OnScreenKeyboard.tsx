import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';

type OnScreenKeyboardProps = {
  onKeyPressed: (key: string) => void;
  greenLetters: string[];
  yellowLetters: string[];
  grayLetters: string[];
};

export const ENTER = 'ENTER';
export const BACKSPACE = 'BACKSPACE';

const keys = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  [ENTER, 'z', 'x', 'c', 'v', 'b', 'n', 'm', BACKSPACE],
];

const OnScreenKeyboard = ({
  onKeyPressed,
  greenLetters,
  yellowLetters,
  grayLetters,
}: OnScreenKeyboardProps) => {
  const { width } = useWindowDimensions();
  const keyWidth = Platform.OS === 'web' ? 58 : (width - 60) / keys[0].length;
  const keyHeight = 60;

  const getKeyColor = (key: string) => {
    const upperKey = key.toUpperCase();
    if (greenLetters.includes(upperKey)) return '#6aaa64';
    if (yellowLetters.includes(upperKey)) return '#c9b458';
    if (grayLetters.includes(upperKey)) return Colors.light.gray;
    return '#ddd';
  };

  const isSpecialKey = (key: string) => key === ENTER || key === BACKSPACE;

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((key) => (
            <Pressable
              onPress={() => onKeyPressed(key)}
              key={`key-${key}`}
              style={({ pressed }) => [
                styles.key,
                { 
                  width: isSpecialKey(key) ? keyWidth * 1.5 : keyWidth, 
                  height: keyHeight,
                  backgroundColor: isSpecialKey(key) ? '#ddd' : getKeyColor(key)
                },
                pressed && { opacity: 0.8 }
              ]}>
              <Text
                style={[
                  styles.keyText,
                  key === ENTER && { fontSize: 12 },
                  !isSpecialKey(key) && (greenLetters.includes(key.toUpperCase()) ||
                    yellowLetters.includes(key.toUpperCase()) ||
                    grayLetters.includes(key.toUpperCase())) && { color: '#fff' }
                ]}>
                {isSpecialKey(key) ? (
                  key === ENTER ? (
                    'ENTER'
                  ) : (
                    <Ionicons name="backspace-outline" size={24} color="black" />
                  )
                ) : (
                  key.toUpperCase()
                )}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
};
export default OnScreenKeyboard;
const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    gap: 6,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  keyText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
});