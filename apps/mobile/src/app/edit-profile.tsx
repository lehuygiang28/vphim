import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
    Text,
    TopNavigation,
    TopNavigationAction,
    useTheme,
    Input,
    Button,
    Avatar,
    Spinner,
} from '@ui-kitten/components';
import { ArrowLeft, Camera, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import authStore from '~mb/stores/authStore';
import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';
import { executeMutation, apiCall } from '~mb/libs/apiClient';
import { MUTATION_ME_QUERY } from '~fe/queries/users';
import { removeStyleProperty } from '~mb/libs/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export default function EditProfileScreen() {
    const { session, setSession } = authStore();
    const theme = useTheme();
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [rawAvatarUrl, setRawAvatarUrl] = useState<string | null>(null); // Raw URL for backend
    const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(null); // Optimized URL for UI
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        if (session?.user) {
            setFullName(session.user.fullName || '');

            if (session.user.avatar?.url) {
                // Store the raw URL for backend updates
                setRawAvatarUrl(session.user.avatar.url);

                // Use optimized URL only for display
                setDisplayAvatarUrl(
                    getOptimizedImageUrl(session.user.avatar.url, {
                        height: 350,
                        width: 350,
                        quality: 100,
                    }),
                );
            }
        }
    }, [session]);

    const handleBack = () => {
        router.back();
    };

    const pickImage = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Quyền truy cập',
                    'Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện',
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];

                // Check file size
                if (selectedImage.fileSize && selectedImage.fileSize > MAX_FILE_SIZE) {
                    Alert.alert(
                        'Kích thước ảnh quá lớn',
                        'Kích thước ảnh không được vượt quá 10MB',
                    );
                    return;
                }

                // Upload image
                await uploadImage(selectedImage.uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
        }
    };

    const takePhoto = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera để chụp ảnh đại diện');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const capturedImage = result.assets[0];

                // Check file size
                if (capturedImage.fileSize && capturedImage.fileSize > MAX_FILE_SIZE) {
                    Alert.alert(
                        'Kích thước ảnh quá lớn',
                        'Kích thước ảnh không được vượt quá 10MB',
                    );
                    return;
                }

                // Upload image
                await uploadImage(capturedImage.uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại sau.');
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setIsUploading(true);

            // Create form data for upload
            const formData = new FormData();

            // Get file extension
            const uriParts = uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            // Create file object for form data
            const file = {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                type: `image/${fileType}`,
                name: `avatar-${Date.now()}.${fileType}`,
            } as any;

            formData.append('images', file);

            // Upload the image
            const response = await apiCall<{ url: string }[]>('POST', '/api/images', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response && response[0]?.url) {
                // Store the raw URL for backend
                setRawAvatarUrl(response[0].url);

                // Create optimized URL for display only
                setDisplayAvatarUrl(
                    getOptimizedImageUrl(response[0].url, {
                        height: 350,
                        width: 350,
                        quality: 100,
                    }),
                );
                setAvatarError(false);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại sau.');
            setAvatarError(true);
        } finally {
            setIsUploading(false);
        }
    };

    const saveProfile = async () => {
        if (!fullName.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập tên của bạn');
            return;
        }

        try {
            setIsLoading(true);

            // Prepare update data - use raw URL, not optimized URL
            const updateData = {
                fullName: fullName.trim(),
                avatar: rawAvatarUrl ? { url: rawAvatarUrl } : session?.user.avatar,
            };

            // Execute the mutation with proper input structure
            const result = await executeMutation<{
                _id: string;
                email: string;
                fullName: string;
                avatar?: { url: string };
            }>(MUTATION_ME_QUERY, {
                variables: {
                    input: updateData,
                },
            });
            console.log('result', result);

            if (result && session) {
                // Update the local session with new user data
                const updatedUser = {
                    ...session.user,
                    fullName: result.fullName,
                    avatar: result.avatar,
                };

                setSession({
                    ...session,
                    user: updatedUser,
                });

                Alert.alert('Thành công', 'Thông tin đã được cập nhật', [
                    { text: 'OK', onPress: handleBack },
                ]);
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const BackAction = () => (
        <TopNavigationAction
            icon={(props) => <ArrowLeft {...removeStyleProperty(props)} />}
            onPress={handleBack}
        />
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <TopNavigation
                title="Cập nhật thông tin"
                alignment="center"
                accessoryLeft={BackAction}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                        {isUploading ? (
                            <View
                                style={[
                                    styles.avatar,
                                    { backgroundColor: theme['background-basic-color-3'] },
                                ]}
                            >
                                <Spinner size="large" />
                            </View>
                        ) : (
                            <>
                                {displayAvatarUrl && !avatarError ? (
                                    <Avatar
                                        style={styles.avatar}
                                        source={{ uri: displayAvatarUrl }}
                                        size="giant"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <View
                                        style={[
                                            styles.avatar,
                                            { backgroundColor: theme['color-primary-300'] },
                                        ]}
                                    >
                                        <UserIcon color="white" size={60} />
                                    </View>
                                )}
                            </>
                        )}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.cameraButton,
                                    { backgroundColor: theme['color-primary-500'] },
                                ]}
                                onPress={takePhoto}
                                disabled={isUploading}
                            >
                                <Camera color="white" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.uploadButton,
                                    { backgroundColor: theme['color-primary-500'] },
                                ]}
                                onPress={pickImage}
                                disabled={isUploading}
                            >
                                <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text category="c1" appearance="hint" style={styles.avatarHelp}>
                        Chọn ảnh đại diện từ thư viện hoặc chụp ảnh mới
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <Text category="label" style={styles.label}>
                        Tên hiển thị
                    </Text>
                    <Input
                        placeholder="Nhập tên của bạn"
                        value={fullName}
                        onChangeText={setFullName}
                        style={styles.input}
                        accessoryLeft={(props) => (
                            <UserIcon {...removeStyleProperty(props)} size={20} />
                        )}
                    />

                    <Text category="label" style={styles.label}>
                        Email
                    </Text>
                    <Input
                        placeholder="Email"
                        value={session?.user.email || ''}
                        disabled
                        style={styles.input}
                    />

                    <Button
                        style={styles.saveButton}
                        onPress={saveProfile}
                        disabled={isLoading || isUploading || !fullName.trim()}
                        accessoryLeft={
                            isLoading
                                ? (props) => <Spinner size="small" status="control" />
                                : undefined
                        }
                    >
                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        marginBottom: 8,
        alignItems: 'center',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 16,
    },
    cameraButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    uploadButton: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    avatarHelp: {
        textAlign: 'center',
        marginTop: 8,
    },
    formContainer: {
        marginTop: 16,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        marginBottom: 16,
    },
    saveButton: {
        marginTop: 16,
    },
});
