import React from 'react';
import { DatePicker, DatePickerProps } from 'antd';
import { InputComponent, TSlobsInputProps, useInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';

const ANT_DATEPICKER_FEATURES = [] as const;

export type TTextAreaInputProps = TSlobsInputProps<
  {},
  Date,
  DatePickerProps,
  ValuesOf<typeof ANT_DATEPICKER_FEATURES>
>;

export const DateInput = InputComponent((p: TTextAreaInputProps) => {
  const { inputAttrs, wrapperAttrs } = useInput('date', p, ANT_DATEPICKER_FEATURES);
  return (
    <InputWrapper {...wrapperAttrs}>
      {/* TODO: DatePicker types indicate it requires a Moment, but we
        * have been using it with a Date. I am avoiding changing the
        * code logic here, and just disabling type checking for now.
      // @ts-ignore */}
      <DatePicker
        picker="date"
        {...inputAttrs}
        onChange={(newVal, dateString) => inputAttrs.onChange(new Date(dateString))}
      />
    </InputWrapper>
  );
});
