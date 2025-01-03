'use client';

import './search-input.css';

import { useState, useRef, useEffect } from 'react';
import { Input, Button, Grid } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import { useDebouncedCallback } from 'use-debounce';

const { useBreakpoint } = Grid;

interface SearchInputProps {
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    isAIMode?: boolean;
    loading?: boolean;
    placeholder?: string;
    aiPlaceholder?: string;
}

export function SearchInput({
    value,
    onChange,
    onSearch,
    isAIMode = false,
    loading = false,
    placeholder = 'Search...',
    aiPlaceholder = "Describe what you're looking for...",
}: SearchInputProps) {
    const { md } = useBreakpoint();
    const [containerHeight, setContainerHeight] = useState(isAIMode ? '6rem' : '2.5rem');
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const updateHeight = useDebouncedCallback(() => {
        if (isAIMode && textareaRef.current) {
            const element = textareaRef.current;
            // Reset height to calculate correct scrollHeight
            element.style.height = 'auto';

            // Calculate new height with min and max constraints
            const minHeight = 96; // 6rem
            const maxHeight = 192; // 12rem
            const newHeight = Math.max(
                Math.min(element.scrollHeight + 40, maxHeight), // Add padding for button
                minHeight,
            );

            if (containerRef.current) {
                containerRef.current.style.setProperty('--initial-height', containerHeight);
                containerRef.current.style.setProperty('--target-height', `${newHeight}px`);
                containerRef.current.classList.add('height-animation');
                setContainerHeight(`${newHeight}px`);
            }
        } else {
            if (containerRef.current) {
                containerRef.current.style.setProperty('--initial-height', containerHeight);
                containerRef.current.style.setProperty('--target-height', '2.5rem');
                containerRef.current.classList.add('height-animation');
                setContainerHeight('2.5rem');
            }
        }
    }, 150);

    useEffect(() => {
        updateHeight();
        return () => {
            if (containerRef.current) {
                containerRef.current.classList.remove('height-animation');
            }
        };
    }, [isAIMode, value, updateHeight]);

    // Handle animation end
    useEffect(() => {
        const container = containerRef.current;
        const handleAnimationEnd = () => {
            container?.classList.remove('height-animation');
        };

        container?.addEventListener('animationend', handleAnimationEnd);
        return () => container?.removeEventListener('animationend', handleAnimationEnd);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`search-input-container ${loading ? 'loading' : ''}`}
            style={{ height: containerHeight }}
        >
            <div className={`search-input-layer ${isAIMode ? 'visible' : ''}`}>
                <div className="textarea-wrapper">
                    <CopilotTextarea
                        ref={textareaRef}
                        className="copilot-textarea"
                        placeholder={aiPlaceholder}
                        value={value}
                        onChange={(e) => {
                            onChange?.(e.target.value);
                            updateHeight();
                        }}
                        disabled={loading}
                        disableBranding
                        autoFocus={false}
                        autosuggestionsConfig={{
                            textareaPurpose: `Vietnamese language preferred. The description should be detailed or specific about movie content, scenes, or emotions you are looking for.`,
                            chatApiConfigs: {
                                suggestionsApiConfig: {
                                    maxTokens: 100,
                                    stop: ['.', '?', '!', '\n'],
                                },
                            },
                        }}
                    />
                    <div className="search-button-wrapper">
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={() => onSearch?.(value || '')}
                            loading={loading}
                            disabled={loading}
                            size={md ? 'middle' : 'small'}
                        >
                            {md ? <>{loading ? 'Đang tìm...' : 'Tìm kiếm'}</> : ''}
                        </Button>
                    </div>
                </div>
            </div>

            <div className={`search-input-layer ${!isAIMode ? 'visible' : ''}`}>
                <Input.Search
                    placeholder={placeholder}
                    allowClear
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    onSearch={(value) => onSearch?.(value)}
                    enterButton={
                        <Button
                            icon={<SearchOutlined />}
                            type="primary"
                            loading={loading}
                            disabled={loading}
                            size={md ? 'middle' : 'small'}
                        >
                            {md ? <>{loading ? 'Đang tìm...' : 'Tìm kiếm'}</> : ''}
                        </Button>
                    }
                    disabled={loading}
                    style={{ height: '100%' }}
                />
            </div>
        </div>
    );
}
