import React from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import {
    Text,
    TopNavigation,
    TopNavigationAction,
    useTheme,
    Divider,
    Card,
    Button,
} from '@ui-kitten/components';
import { ArrowLeft, Shield, AlertTriangle, ExternalLink } from 'lucide-react-native';

// Helper function to filter out problematic style props from UI Kitten
const filterIconProps = (props: any) => {
    const { style, ...otherProps } = props;
    return otherProps;
};

export default function PrivacyPolicyScreen() {
    const theme = useTheme();

    const handleBack = () => {
        router.back();
    };

    const sections = [
        {
            title: 'Tuyên bố mục đích giáo dục',
            content:
                'Dự án phần mềm này ("VePhim") được cung cấp CHỈ DÀNH CHO MỤC ĐÍCH GIÁO DỤC VÀ TRÌNH DIỄN. VePhim được thiết kế để trình diễn kỹ thuật phát triển ứng dụng web và di động tiên tiến.',
            icon: (props: any) => <Shield {...filterIconProps(props)} />,
        },
        {
            title: 'Hạn chế sử dụng',
            content:
                'Khi truy cập, tải xuống, cài đặt hoặc sử dụng VePhim, bạn xác nhận và đồng ý rằng:\n\n1. VePhim không lưu trữ, tải lên hoặc phân phối bất kỳ nội dung phim, tệp phương tiện hoặc tài liệu có bản quyền nào trên máy chủ của mình.\n\n2. VePhim chỉ hoạt động như một ứng dụng thu thập nội dung từ các nguồn công khai, tổng hợp danh mục và công nghệ khám phá.\n\n3. Tất cả nội dung phương tiện có thể truy cập thông qua VePhim đều được lấy từ các nguồn bên thứ ba và vẫn được lưu trữ trên các nguồn đó.',
            icon: (props: any) => <AlertTriangle {...filterIconProps(props)} />,
        },
        {
            title: 'Trách nhiệm của người dùng',
            content:
                'Người dùng VePhim hoàn toàn chịu trách nhiệm về:\n\n1. Đảm bảo việc sử dụng VePhim tuân thủ tất cả các luật và quy định hiện hành liên quan đến bản quyền, quyền sở hữu trí tuệ, quyền riêng tư dữ liệu và truy cập nội dung.\n\n2. Xác minh họ có quyền hợp pháp để truy cập bất kỳ nội dung nào họ xem thông qua VePhim.\n\n3. Sử dụng các khái niệm công nghệ được trình diễn trong VePhim chỉ theo cách hợp pháp và đạo đức.',
            icon: (props: any) => <AlertTriangle {...filterIconProps(props)} />,
        },
        {
            title: 'Giới hạn trách nhiệm',
            content:
                'PHẦN MỀM VEPHIM ĐƯỢC CUNG CẤP "NGUYÊN TRẠNG", KHÔNG CÓ BẢO ĐẢM DƯỚI BẤT KỲ HÌNH THỨC NÀO, RÕ RÀNG HAY NGỤ Ý.\n\nTÁC GIẢ VÀ NGƯỜI ĐÓNG GÓP CỦA VEPHIM ĐẶC BIỆT TỪ CHỐI MỌI TRÁCH NHIỆM VỀ BẤT KỲ HÀNH VI SỬ DỤNG SAI MỤC ĐÍCH NÀO CỦA PHẦN MỀM HOẶC BẤT KỲ HOẠT ĐỘNG BẤT HỢP PHÁP NÀO ĐƯỢC TIẾN HÀNH VỚI PHẦN MỀM.',
            icon: (props: any) => <AlertTriangle {...filterIconProps(props)} />,
        },
        {
            title: 'Sở hữu trí tuệ',
            content:
                'VePhim tôn trọng quyền sở hữu trí tuệ và mong đợi người dùng của mình cũng làm như vậy. Nếu bạn tin rằng tác phẩm có bản quyền của bạn đã được sử dụng theo cách cấu thành vi phạm bản quyền, vui lòng liên hệ với người bảo trì dự án ngay lập tức.',
            icon: (props: any) => <Shield {...filterIconProps(props)} />,
        },
        {
            title: 'Chấp nhận điều khoản',
            content:
                'Bằng cách sử dụng VePhim, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi tuyên bố miễn trừ trách nhiệm này. Nếu bạn không đồng ý với bất kỳ phần nào của tuyên bố miễn trừ trách nhiệm này, bạn không được sử dụng VePhim.',
            icon: (props: any) => <Shield {...filterIconProps(props)} />,
        },
    ];

    const BackAction = () => (
        <TopNavigationAction
            icon={(props) => <ArrowLeft {...filterIconProps(props)} />}
            onPress={handleBack}
        />
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <TopNavigation
                title="Chính sách sử dụng"
                alignment="center"
                accessoryLeft={BackAction}
            />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <View style={styles.headerContainer}>
                    <Shield size={40} color={theme['color-primary-500']} />
                    <Text category="h5" style={styles.headerTitle}>
                        Chính sách sử dụng
                    </Text>
                    <Text category="p2" appearance="hint" style={styles.headerSubtitle}>
                        Vui lòng đọc kỹ chính sách này trước khi sử dụng VePhim
                    </Text>
                </View>

                <View style={styles.sectionsContainer}>
                    {sections.map((section, index) => (
                        <Card key={index} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                {section.icon({ size: 24, color: theme['color-primary-500'] })}
                                <Text category="h6" style={styles.sectionTitle}>
                                    {section.title}
                                </Text>
                            </View>
                            <Divider style={styles.divider} />
                            <Text category="p2" style={styles.sectionContent}>
                                {section.content}
                            </Text>
                        </Card>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text category="c1" appearance="hint">
                        Cập nhật lần cuối: Tháng 3 năm 2025
                    </Text>
                    <Text category="c1" appearance="hint" style={styles.contactFooter}>
                        Để biết thêm thông tin, vui lòng liên hệ:{' '}
                        <Text
                            category="c1"
                            status="primary"
                            onPress={() => Linking.openURL('mailto:contact@vephim.online')}
                        >
                            contact@vephim.online
                        </Text>
                    </Text>
                    <Button
                        appearance="ghost"
                        size="tiny"
                        status="basic"
                        accessoryLeft={(props) => (
                            <ExternalLink size={14} {...filterIconProps(props)} />
                        )}
                        onPress={() => Linking.openURL('mailto:contact@vephim.online')}
                    >
                        Liên hệ
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
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 16,
    },
    headerTitle: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        textAlign: 'center',
        maxWidth: '80%',
    },
    sectionsContainer: {
        marginBottom: 24,
    },
    sectionCard: {
        marginBottom: 16,
        borderRadius: 8,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        marginLeft: 12,
    },
    divider: {
        marginBottom: 12,
    },
    sectionContent: {
        lineHeight: 20,
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
    },
    contactFooter: {
        marginTop: 8,
    },
});
