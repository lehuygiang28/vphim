import React from 'react';
import { StyleSheet } from 'react-native';
import { Modal, Card, Text, Button } from '@ui-kitten/components';
import { AlertTriangle } from 'lucide-react-native';

interface ErrorModalProps {
    visible: boolean;
    onClose: () => void;
    errorMessage: string;
    theme: Record<string, string>;
}

export default function ErrorModal({ visible, onClose, errorMessage, theme }: ErrorModalProps) {
    return (
        <Modal
            visible={visible}
            backdropStyle={[
                styles.backdrop,
                { backgroundColor: theme['color-basic-transparent-600'] },
            ]}
            onBackdropPress={onClose}
            style={styles.modal}
        >
            <Card disabled={true} style={{ backgroundColor: theme['background-basic-color-1'] }}>
                <AlertTriangle style={styles.icon} size={48} color={theme['color-danger-500']} />
                <Text category="h6" style={[styles.title, { color: theme['text-basic-color'] }]}>
                    Có lỗi xảy ra, vui lòng thử lại sau.
                </Text>
                <Text style={[styles.message, { color: theme['text-basic-color'] }]}>
                    {errorMessage}
                </Text>
                <Button onPress={onClose} style={{ backgroundColor: theme['color-primary-500'] }}>
                    OK
                </Button>
            </Card>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        width: '80%',
        maxWidth: 300,
    },
    icon: {
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        textAlign: 'center',
        marginBottom: 16,
    },
});
