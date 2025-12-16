import { TextField, TextFieldProps, FormHelperText } from '@mui/material';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface FormFieldProps extends Omit<TextFieldProps, 'error'> {
  error?: string | boolean;
  success?: boolean;
  helperText?: string;
}

const FormField = ({ error, success, helperText, ...props }: FormFieldProps) => {
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : helperText;

  return (
    <TextField
      {...props}
      error={hasError}
      helperText={errorMessage}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <>
            {success && !hasError && (
              <span style={{ display: 'flex', alignItems: 'center', color: '#2e7d32' }}>
                <CheckCircle size={20} />
              </span>
            )}
            {hasError && (
              <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                <AlertCircle size={20} />
              </span>
            )}
            {props.InputProps?.endAdornment}
          </>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&.Mui-focused': {
            boxShadow: hasError
              ? '0 0 0 2px rgba(211, 47, 47, 0.2)'
              : success
              ? '0 0 0 2px rgba(46, 125, 50, 0.2)'
              : '0 0 0 2px rgba(25, 118, 210, 0.2)',
          },
        },
        ...props.sx,
      }}
    />
  );
};

export default FormField;
