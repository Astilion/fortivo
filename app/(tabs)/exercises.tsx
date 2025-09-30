import { StyleSheet, View, Text } from 'react-native';
import colors from '@/constants/Colors';

export default function ExercisesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista ćwiczeń</Text>
      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color:colors.text.primary,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
