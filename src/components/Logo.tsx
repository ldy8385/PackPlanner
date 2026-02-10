import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LogoProps {
    size?: number;
    variant?: 'icon' | 'full';
    color?: string;
    style?: ViewStyle;
}

const Logo: React.FC<LogoProps> = ({
    size = 40,
    variant = 'full',
    color,
    style,
}) => {
    const theme = useTheme();
    const primaryColor = color || theme.colors.primary;

    // Scale text based on icon size
    const fontSize = size * 0.75;

    return (
        <View style={[styles.container, style]}>
            <View
                style={[
                    styles.iconContainer,
                    {
                        width: size,
                        height: size,
                        borderRadius: size * 0.3,
                        backgroundColor: theme.colors.primaryContainer,
                    },
                ]}>
                <Icon
                    name="bag-personal"
                    size={size * 0.6}
                    color={primaryColor}
                />
            </View>
            {variant === 'full' && (
                <Text
                    style={[
                        styles.text,
                        {
                            fontSize: fontSize,
                            color: theme.colors.onSurface,
                            marginLeft: size * 0.25,
                        },
                    ]}>
                    PackPlanner
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontWeight: '700',
        letterSpacing: -0.5,
    },
});

export default Logo;
