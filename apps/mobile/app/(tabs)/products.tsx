import { View, Text, StyleSheet } from 'react-native';

export default function ProductsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Browse Products</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
