declare module 'react-native-calendar-picker' {
    import { Component } from 'react';
    import { TextStyle, ViewStyle } from 'react-native';

    interface CalendarPickerProps {
        startFromMonday?: boolean;
        allowRangeSelection?: boolean;
        minDate?: Date;
        maxDate?: Date;
        weekdays?: string[];
        months?: string[];
        previousTitle?: string;
        nextTitle?: string;
        selectedDayColor?: string;
        selectedDayTextColor?: string;
        selectedDayStyle?: ViewStyle;
        selectedRangeStyle?: ViewStyle;
        selectedRangeStartStyle?: ViewStyle;
        selectedRangeEndStyle?: ViewStyle;
        selectedRangeStartTextStyle?: TextStyle;
        selectedRangeEndTextStyle?: TextStyle;
        todayBackgroundColor?: string;
        todayTextStyle?: TextStyle;
        textStyle?: TextStyle;
        monthTitleStyle?: TextStyle;
        yearTitleStyle?: TextStyle;
        dayLabelsWrapper?: ViewStyle;
        previousTitleStyle?: TextStyle;
        nextTitleStyle?: TextStyle;
        selectedStartDate?: Date | null;
        selectedEndDate?: Date | null;
        scaleFactor?: number;
        width?: number;
        height?: number;
        onDateChange?: (date: Date, type: 'START_DATE' | 'END_DATE') => void;
        onMonthChange?: (date: Date) => void;
        initialDate?: Date;
        customDatesStyles?: any[];
        customDayHeaderStyles?: any;
        disabledDates?: any[];
        disabledDatesTextStyle?: TextStyle;
        enableDateChange?: boolean;
        restrictMonthNavigation?: boolean;
        dayShape?: 'circle' | 'square';
        headingLevel?: number;
        selectMonthTitle?: string;
        selectYearTitle?: string;
        enableSwipe?: boolean;
        horizontal?: boolean;
    }

    export default class CalendarPicker extends Component<CalendarPickerProps> {}
}
