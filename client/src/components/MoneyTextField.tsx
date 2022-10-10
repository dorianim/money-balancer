import { TextField, TextFieldProps } from '@mui/material';
import { forwardRef, ForwardedRef } from 'react';

const MoneyTextField = forwardRef(
  (props: TextFieldProps, ref: ForwardedRef<HTMLDivElement>) => {
    const modifiedProps: TextFieldProps = {
      ...props,
      defaultValue: '0.00',
      inputProps: {
        ...props.inputProps,
        inputMode: 'numeric',
        step: '0.01',
      },
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.value.replace(',', '.');
        let amount: string = e.target.value.replace(/[^0-9]/g, '');

        while (amount.length < 3) {
          amount = '0' + amount;
        }

        amount =
          amount.substring(0, amount.length - 2) +
          '.' +
          amount.substring(amount.length - 2);

        while (amount[0] === '0' && amount.length > 4) {
          amount = amount.substring(1);
        }

        e.target.value = amount;

        props.onChange && props.onChange(e);
      },
    };

    return <TextField {...modifiedProps} ref={ref} />;
  },
);
MoneyTextField.displayName = 'MoneyTextField';

export default MoneyTextField;
