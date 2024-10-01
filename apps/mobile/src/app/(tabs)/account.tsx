import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export default function AccountScreen() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const theme = useTheme();

    const handleLogin = () => {
        // Implement login logic here
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        // Implement logout logic here
        setIsLoggedIn(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {isLoggedIn ? (
                <>
                    <Text style={{ color: theme.colors.onBackground }}>Welcome, User!</Text>
                    <Button
                        mode="contained"
                        onPress={() => {
                            /* Navigate to favorite movies */
                            console.log('nav favorite movies');
                        }}
                    >
                        Your Favorite Movies
                    </Button>
                    <Button mode="outlined" onPress={handleLogout} style={styles.button}>
                        Logout
                    </Button>
                </>
            ) : (
                <Button mode="contained" onPress={handleLogin}>
                    Login
                </Button>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    button: {
        marginTop: 16,
    },
});
