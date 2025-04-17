import React, { useState, useEffect, useRef } from 'react';
import { Steps, Spin, Typography, Space, Alert, ConfigProvider, theme, Card } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LoadingOutlined,
    CheckCircleOutlined,
    RobotOutlined,
    ThunderboltOutlined,
    DatabaseOutlined,
    ApiOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// Enhanced step content with more detailed descriptions and improved icons
const SEARCH_STEPS = [
    {
        title: 'Khởi động trợ lý AI',
        description: 'Đang khởi động trợ lý tìm kiếm AI',
        icon: <ApiOutlined />,
        color: '#722ED1', // Purple
    },
    {
        title: 'Phân tích yêu cầu',
        description: 'AI đang phân tích mô tả phim bạn cung cấp',
        icon: <DatabaseOutlined />,
        color: '#13C2C2', // Cyan
    },
    {
        title: 'Tìm kiếm thông minh',
        description: 'Đang tìm kiếm các bộ phim phù hợp nhất',
        icon: <ThunderboltOutlined />,
        color: '#1890FF', // Blue
    },
    {
        title: 'Hoàn tất',
        description: 'Đã tìm thấy các kết quả phù hợp',
        icon: <CheckCircleOutlined />,
        color: '#52C41A', // Green
    },
];

// Minimum duration for each step in milliseconds
const STEP_DURATION_MS = 2500; // 2.5 seconds per step
const MIN_TOTAL_DURATION_MS = 10000; // 10 seconds minimum for complete search

interface AISearchStepsProps {
    isLoading: boolean;
    isRefetching: boolean;
    hasData: boolean;
    onCompleted?: () => void;
}

// Pulse animation for the active step
const pulseVariants = {
    pulse: {
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Floating animation for the AI robot icon
const floatVariants = {
    float: {
        y: [0, -10, 0],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

const AISearchSteps: React.FC<AISearchStepsProps> = ({
    isLoading,
    isRefetching,
    hasData,
    onCompleted,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [showSteps, setShowSteps] = useState(true);
    const [isDelaying, setIsDelaying] = useState(false);
    const searchStartTimeRef = useRef<number>(0);
    const stepTimersRef = useRef<NodeJS.Timeout[]>([]);

    // Clear all timers on component unmount
    useEffect(() => {
        return () => {
            stepTimersRef.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    // Start or restart the step progression when loading state changes
    useEffect(() => {
        if ((isLoading || isRefetching) && !isDelaying) {
            // Reset and start the step progression
            startStepProgression();
        }
    }, [isLoading, isRefetching]);

    // Handle when backend returns results before minimum time
    useEffect(() => {
        if (!isLoading && !isRefetching && showSteps) {
            const elapsedTime = Date.now() - searchStartTimeRef.current;

            if (elapsedTime < MIN_TOTAL_DURATION_MS) {
                // Backend returned early, continue steps until minimum time
                setIsDelaying(true);

                // Calculate remaining time and complete steps during that time
                const remainingTime = MIN_TOTAL_DURATION_MS - elapsedTime;
                const stepsLeft = SEARCH_STEPS.length - currentStep;
                const timePerRemainingStep = Math.max(300, remainingTime / Math.max(1, stepsLeft));

                completeRemainingSteps(timePerRemainingStep);
            } else {
                // Backend took longer than minimum time, complete immediately
                finishAndHideSteps();
            }
        }
    }, [isLoading, isRefetching, currentStep, showSteps]);

    const startStepProgression = () => {
        // Clear any existing timers
        stepTimersRef.current.forEach((timer) => clearTimeout(timer));
        stepTimersRef.current = [];

        // Reset state
        setCurrentStep(0);
        setShowSteps(true);
        setIsDelaying(false);
        searchStartTimeRef.current = Date.now();

        // Schedule the first steps to advance automatically
        for (let i = 1; i < SEARCH_STEPS.length - 1; i++) {
            const timer = setTimeout(() => {
                if (!isDelaying) {
                    setCurrentStep(i);
                }
            }, i * STEP_DURATION_MS);

            stepTimersRef.current.push(timer);
        }
    };

    const completeRemainingSteps = (stepDuration: number) => {
        // Clear any previous timers
        stepTimersRef.current.forEach((timer) => clearTimeout(timer));
        stepTimersRef.current = [];

        // Schedule completion of remaining steps with shortened durations
        for (let i = currentStep + 1; i <= SEARCH_STEPS.length; i++) {
            const timer = setTimeout(() => {
                if (i < SEARCH_STEPS.length) {
                    setCurrentStep(i);
                } else {
                    finishAndHideSteps();
                }
            }, (i - currentStep) * stepDuration);

            stepTimersRef.current.push(timer);
        }
    };

    const finishAndHideSteps = () => {
        setCurrentStep(SEARCH_STEPS.length - 1);

        // Hide steps after a short delay to show the completed state
        const timer = setTimeout(() => {
            setShowSteps(false);
            setIsDelaying(false);
            if (onCompleted) onCompleted();
        }, 500);

        stepTimersRef.current.push(timer);
    };

    // If we have data and steps are completed, don't show anything
    if (!showSteps) {
        return null;
    }

    return (
        <AnimatePresence>
            {showSteps && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', marginBottom: '2rem' }}
                >
                    <Card
                        bordered={false}
                        style={{
                            background:
                                'linear-gradient(145deg, rgba(24,144,255,0.05) 0%, rgba(114,46,209,0.1) 100%)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            overflow: 'hidden',
                            padding: '0.5rem',
                        }}
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <motion.div
                                    variants={floatVariants}
                                    animate="float"
                                    style={{
                                        display: 'inline-block',
                                        background: 'linear-gradient(120deg, #1890FF, #722ED1)',
                                        borderRadius: '50%',
                                        padding: '12px',
                                        marginBottom: '1rem',
                                        boxShadow: '0 0 15px rgba(114,46,209,0.5)',
                                    }}
                                >
                                    <RobotOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </motion.div>
                                <Title
                                    level={4}
                                    style={{
                                        margin: 0,
                                        background: 'linear-gradient(to right, #1890FF, #722ED1)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Tìm kiếm với AI
                                </Title>
                                <Paragraph type="secondary" style={{ marginTop: '0.5rem' }}>
                                    AI đang xử lý yêu cầu tìm kiếm của bạn.
                                </Paragraph>
                            </div>

                            <ConfigProvider
                                theme={{
                                    algorithm: theme.defaultAlgorithm,
                                    components: {
                                        Steps: {
                                            colorPrimary: SEARCH_STEPS[currentStep].color,
                                            controlItemBgActive: `${SEARCH_STEPS[currentStep].color}15`, // 15% opacity
                                        },
                                    },
                                }}
                            >
                                <Steps
                                    current={currentStep}
                                    items={SEARCH_STEPS.map((step, index) => ({
                                        title: (
                                            <Text
                                                strong={currentStep >= index}
                                                style={{
                                                    color:
                                                        currentStep >= index
                                                            ? step.color
                                                            : undefined,
                                                }}
                                            >
                                                {step.title}
                                            </Text>
                                        ),
                                        description: (
                                            <Text
                                                style={{
                                                    fontSize: '0.85rem',
                                                    opacity: currentStep >= index ? 1 : 0.6,
                                                }}
                                            >
                                                {step.description}
                                            </Text>
                                        ),
                                        icon:
                                            currentStep === index &&
                                            (isLoading || isRefetching || isDelaying) ? (
                                                <motion.div
                                                    variants={pulseVariants}
                                                    animate="pulse"
                                                    style={{
                                                        background: `radial-gradient(circle, ${step.color}30 0%, transparent 70%)`,
                                                        borderRadius: '50%',
                                                        padding: '8px',
                                                    }}
                                                >
                                                    <Spin
                                                        indicator={
                                                            <LoadingOutlined
                                                                style={{
                                                                    fontSize: 16,
                                                                    color: step.color,
                                                                }}
                                                                spin
                                                            />
                                                        }
                                                    />
                                                </motion.div>
                                            ) : (
                                                <span
                                                    style={{
                                                        color:
                                                            currentStep >= index
                                                                ? step.color
                                                                : undefined,
                                                    }}
                                                >
                                                    {step.icon}
                                                </span>
                                            ),
                                    }))}
                                    responsive={true}
                                    // style={{ padding: '0.5rem' }}
                                />
                            </ConfigProvider>

                            {!isLoading &&
                                !isRefetching &&
                                currentStep < SEARCH_STEPS.length - 1 && (
                                    <Alert
                                        message="Đang xử lý kết quả"
                                        description="Vui lòng đợi trong giây lát, AI đang phân tích và hoàn thiện kết quả tìm kiếm."
                                        type="info"
                                        showIcon
                                        style={{
                                            border: 'none',
                                            borderRadius: '8px',
                                            background: 'rgba(24,144,255,0.1)',
                                        }}
                                    />
                                )}

                            {currentStep === SEARCH_STEPS.length - 1 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, type: 'spring' }}
                                >
                                    <Alert
                                        message={
                                            hasData ? 'Tìm kiếm thành công!' : 'Tìm kiếm hoàn tất!'
                                        }
                                        description={
                                            hasData
                                                ? 'Đã tìm thấy kết quả phù hợp với yêu cầu của bạn.'
                                                : 'Không tìm thấy kết quả nào phù hợp với mô tả của bạn.'
                                        }
                                        type={hasData ? 'success' : 'warning'}
                                        showIcon
                                        style={{
                                            border: 'none',
                                            borderRadius: '8px',
                                            background: hasData
                                                ? 'rgba(82,196,26,0.1)'
                                                : 'rgba(250,173,20,0.1)',
                                            boxShadow: hasData
                                                ? '0 0 15px rgba(82,196,26,0.2)'
                                                : '0 0 15px rgba(250,173,20,0.2)',
                                        }}
                                    />
                                </motion.div>
                            )}
                        </Space>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AISearchSteps;
