import { Form } from 'antd';
import React, { useContext } from 'react';
import { FormItemProps } from 'antd/lib/form/FormItem';
import omit from 'lodash/omit';
import { FormContext } from './Form';
import { InputComponent, layoutPresets, TInputLayout } from './inputs';

type TInputWrapperProps = FormItemProps & {
  nowrap?: boolean;
  inputRef?: unknown;
  layout?: TInputLayout;
};

/**
 * Wraps Form.Item
 * Can display unwrapped content if nowrap parameter is set to true
 */
export default InputComponent(function InputWrapper(p: TInputWrapperProps) {
  const layoutPreset = useLayout(p);
  const formItemProps = omit(p, 'nowrap');
  const label = p.label;

  return p.nowrap ? (
    <>{p.children}</>
  ) : (
    <Form.Item colon={false} {...layoutPreset} {...formItemProps} label={label}>
      {formItemProps.children}
    </Form.Item>
  );
});

function useLayout(p: TInputWrapperProps) {
  // take the layout from the props and if not found take it from the form context
  const context = useContext(FormContext);
  const contextLayout = context?.layout;
  const wrapperLayout = p.layout;
  const layout = wrapperLayout || contextLayout || 'inline';
  return layoutPresets[layout] || {};
}
