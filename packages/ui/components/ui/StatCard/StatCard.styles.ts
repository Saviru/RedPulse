import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  iconWrapper: {
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#11181C',
  },
  label: {
    fontSize: 12,
    color: '#687076',
    textAlign: 'center',
  },
});
