import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import type { ReactNode } from 'react';

function primitive(tag: keyof HTMLElementTagNameMap) {
  return function Primitive({
    children,
    ...props
  }: {
    children?: ReactNode;
    [key: string]: unknown;
  }) {
    const domProps = { ...props } as Record<string, unknown>;
    delete domProps.contentContainerStyle;
    delete domProps.horizontal;
    delete domProps.showsHorizontalScrollIndicator;
    delete domProps.refreshControl;
    delete domProps.activeOpacity;
    return React.createElement(tag, domProps, children);
  };
}

vi.mock('react-native', () => {
  const View = primitive('div');
  const ScrollView = primitive('div');
  const Text = primitive('span');
  const FlatList = ({
    data = [],
    keyExtractor,
    renderItem,
    ListHeaderComponent,
    ListEmptyComponent,
  }: {
    data?: unknown[];
    keyExtractor?: (item: unknown, index: number) => string;
    renderItem?: (arg: { item: unknown; index: number }) => ReactNode;
    ListHeaderComponent?: ReactNode;
    ListEmptyComponent?: ReactNode;
  }) => (
    <div>
      {ListHeaderComponent}
      {data.length === 0 ? ListEmptyComponent : null}
      {data.map((item, index) => (
        <div key={keyExtractor ? keyExtractor(item, index) : String(index)}>
          {renderItem ? renderItem({ item, index }) : null}
        </div>
      ))}
    </div>
  );
  const SectionList = ({
    sections = [],
    renderItem,
    renderSectionHeader,
  }: {
    sections?: Array<{ title?: string; data: unknown[] }>;
    renderItem?: (arg: { item: unknown; index: number }) => ReactNode;
    renderSectionHeader?: (arg: { section: { title?: string } }) => ReactNode;
  }) => (
    <div>
      {sections.map((section, sectionIndex) => (
        <div key={String(sectionIndex)}>
          {renderSectionHeader ? renderSectionHeader({ section }) : null}
          {section.data.map((item, index) => (
            <div key={`${sectionIndex}-${index}`}>
              {renderItem ? renderItem({ item, index }) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return {
    View,
    ScrollView,
    Text,
    FlatList,
    SectionList,
    RefreshControl: primitive('div'),
    ActivityIndicator: () => <div data-testid="activity-indicator" />,
    Pressable: ({
      onPress,
      children,
      ...props
    }: {
      onPress?: () => void;
      children?: ReactNode;
      [key: string]: unknown;
    }) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.activeOpacity;
      return (
      <div
        role="button"
        tabIndex={0}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          onPress?.();
        }}
        {...domProps}
      >
        {children}
      </div>
    );
    },
    TouchableOpacity: ({
      onPress,
      children,
      ...props
    }: {
      onPress?: () => void;
      children?: ReactNode;
      [key: string]: unknown;
    }) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.activeOpacity;
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            onPress?.();
          }}
          {...domProps}
        >
          {children}
        </div>
      );
    },
    TextInput: ({
      value,
      onChangeText,
      placeholder,
      ...props
    }: {
      value?: string;
      onChangeText?: (value: string) => void;
      placeholder?: string;
      [key: string]: unknown;
    }) => (
      (() => {
        const domProps = { ...props } as Record<string, unknown>;
        delete domProps.placeholderTextColor;
        delete domProps.autoCapitalize;
        delete domProps.autoCorrect;
        delete domProps.keyboardType;
        return (
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChangeText?.((event.target as HTMLInputElement).value)
        }
        {...domProps}
      />
        );
      })()
    ),
    Switch: ({
      value,
      onValueChange,
      ...props
    }: {
      value?: boolean;
      onValueChange?: (value: boolean) => void;
      [key: string]: unknown;
    }) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.trackColor;
      delete domProps.thumbColor;
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) =>
            onValueChange?.((event.target as HTMLInputElement).checked)
          }
          {...domProps}
        />
      );
    },
    StyleSheet: {
      create: <T extends Record<string, unknown>>(styles: T): T => styles,
      hairlineWidth: 1,
      absoluteFillObject: {},
    },
    Alert: {
      alert: vi.fn(),
      prompt: vi.fn(),
    },
    Dimensions: {
      get: () => ({ width: 390, height: 844 }),
    },
  };
});

vi.mock('@mylife/ui', () => ({
  Text: ({
    children,
    numberOfLines,
    onPress,
    ...props
  }: {
    children?: ReactNode;
    numberOfLines?: number;
    onPress?: () => void;
    [key: string]: unknown;
  }) => (
    <span onClick={onPress} {...props}>
      {children}
    </span>
  ),
  Card: ({
    children,
    ...props
  }: {
    children?: ReactNode;
    [key: string]: unknown;
  }) => <div {...props}>{children}</div>,
  Button: ({
    label,
    onPress,
    ...props
  }: {
    label: string;
    onPress?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onPress} {...props}>
      {label}
    </button>
  ),
  SearchBar: ({
    value,
    onChangeText,
    placeholder,
    onScanPress,
  }: {
    value?: string;
    onChangeText?: (value: string) => void;
    placeholder?: string;
    onScanPress?: () => void;
  }) => (
    <div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChangeText?.((event.target as HTMLInputElement).value)
        }
      />
      {onScanPress ? <button onClick={onScanPress}>Scan</button> : null}
    </div>
  ),
  BookCover: ({ title }: { title: string }) => <div>{title}</div>,
  StarRating: ({ rating }: { rating: number }) => <div>{`rating:${rating}`}</div>,
  ReadingGoalRing: ({ current, target }: { current: number; target: number }) => (
    <div>{`${current}/${target}`}</div>
  ),
  colors: {
    background: '#0E0C09',
    surface: '#1b1814',
    surfaceElevated: '#2a241d',
    border: '#3a332b',
    text: '#f8f4ef',
    textSecondary: '#c8bfb4',
    textTertiary: '#9a8f82',
    success: '#0f7b4d',
    danger: '#d34f4f',
    star: '#ffcc66',
    modules: {
      books: '#C9894D',
      fast: '#14B8A6',
      subs: '#EC4899',
      surf: '#3B82F6',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    xl: 999,
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
