import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { toArabicNumerals } from '../../utils/habitUtils';

/**
 * Recursively converts strings and numbers within React children to Eastern Arabic numerals (٠-٩),
 * Arabic percent sign (٪), and Arabic decimal separator (٫).
 */
export const convertChildrenToArabicNumerals = (children: React.ReactNode): React.ReactNode => {
  if (children === null || children === undefined) {
    return children;
  }

  if (typeof children === 'string') {
    return toArabicNumerals(children);
  }

  if (typeof children === 'number') {
    return toArabicNumerals(children);
  }

  if (Array.isArray(children)) {
    return React.Children.map(children, (child) => convertChildrenToArabicNumerals(child));
  }

  if (React.isValidElement(children)) {
    const el = children as React.ReactElement<{ children?: React.ReactNode }>;
    if (el.props && el.props.children !== undefined) {
      return React.cloneElement(el, {
        ...el.props,
        children: convertChildrenToArabicNumerals(el.props.children),
      });
    }
  }

  return children;
};

/**
 * Standard text component for the app ensuring authentic Eastern Arabic numerals across all views.
 */
export const AppText = React.forwardRef<RNText, TextProps>(({ children, ...props }, ref) => {
  return (
    <RNText ref={ref} {...props}>
      {convertChildrenToArabicNumerals(children)}
    </RNText>
  );
});

AppText.displayName = 'AppText';

export const Text = AppText;
export default AppText;
