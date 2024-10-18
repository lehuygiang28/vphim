import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from '@ui-kitten/components';

interface MovieContentProps {
    content?: string;
    maxLines?: number;
}

export default function MovieContent({
    content = 'Phim chưa có nội dung!',
    maxLines = 3,
}: MovieContentProps) {
    const [expanded, setExpanded] = useState(false);
    const theme = useTheme();

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            <Text category="h6" style={styles.title}>
                Nội dung:
            </Text>
            <View style={styles.contentWrapper}>
                <Text
                    category="p1"
                    style={[styles.content, { color: theme['text-basic-color'] }]}
                    numberOfLines={expanded ? undefined : maxLines}
                >
                    {content}
                </Text>
            </View>
            <Button
                appearance="ghost"
                status="basic"
                onPress={toggleExpand}
                style={styles.toggleButton}
            >
                {expanded ? 'Ẩn bớt' : 'Xem thêm'}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    title: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    contentWrapper: {
        overflow: 'hidden',
    },
    content: {
        marginBottom: 8,
    },
    toggleButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 0,
    },
});
