/**
 * Form Validation Hook - Real-time validation with error handling
 */

import { useState, useCallback, useEffect } from 'react';
import * as yup from 'yup';

export interface FormValidationConfig {
  initialValues: Record<string, any>;
  validationSchema?: yup.ObjectSchema<any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface FormValidationState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
}

export const useFormValidation = ({
  initialValues,
  validationSchema,
  onSubmit,
  onError,
  validateOnChange = true,
  validateOnBlur = true,
  autoSave = false,
  autoSaveDelay = 1000,
}: FormValidationConfig) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Validate field
  const validateField = useCallback(
    async (name: string, value: any): Promise<string | null> => {
      if (!validationSchema) return null;

      try {
        const fieldSchema = yup.reach(validationSchema, name) as any;
        if (fieldSchema) {
          await fieldSchema.validate(value);
        }
        return null;
      } catch (error: any) {
        return error.message;
      }
    },
    [validationSchema]
  );

  // Validate all fields
  const validateForm = useCallback(async (): Promise<Record<string, string>> => {
    if (!validationSchema) return {};

    try {
      await validationSchema.validate(values, { abortEarly: false });
      return {};
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.inner) {
        error.inner.forEach((err: any) => {
          newErrors[err.path] = err.message;
        });
      }
      return newErrors;
    }
  }, [validationSchema, values]);

  // Handle change
  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({ ...prev, [name]: fieldValue }));
      setIsDirty(true);

      if (validateOnChange) {
        const error = await validateField(name, fieldValue);
        setErrors((prev) => ({
          ...prev,
          [name]: error || undefined,
        }));
      }

      // Auto-save
      if (autoSave) {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        const timer = setTimeout(() => {
          onSubmit({ ...values, [name]: fieldValue });
        }, autoSaveDelay);
        setAutoSaveTimer(timer);
      }
    },
    [validateOnChange, validateField, autoSave, autoSaveDelay, autoSaveTimer, onSubmit, values]
  );

  // Handle blur
  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validateOnBlur) {
        const error = await validateField(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: error || undefined,
        }));
      }
    },
    [validateOnBlur, validateField, values]
  );

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const newErrors = await validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
          await onSubmit(values);
          setIsDirty(false);
        } else {
          onError?.(newErrors);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, onSubmit, onError, values]
  );

  // Set field value
  const setFieldValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setIsDirty(true);
    },
    []
  );

  // Set field error
  const setFieldError = useCallback((name: string, error: string | null) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error || undefined,
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setIsValid(true);
  }, [initialValues]);

  // Validate on mount
  useEffect(() => {
    validateForm().then((newErrors) => {
      setIsValid(Object.keys(newErrors).length === 0);
    });
  }, []);

  return {
    values,
    errors,
    touched,
    isDirty,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validateField,
    validateForm,
  };
};

export default useFormValidation;
