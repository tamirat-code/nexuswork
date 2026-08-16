import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { cn } from "../../../lib/cn.js";
import { Label } from "./label.jsx";

const Form = FormProvider;

const FormFieldContext = React.createContext({});
const FormField = ({ ...props }) => {
  return <FormFieldContext.Provider value={{ name: props.name }}><Controller {...props} /></FormFieldContext.Provider>;
};

const FormItemContext = React.createContext({});

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  const fieldState = getFieldState(fieldContext.name, formState);
  if (!fieldContext) throw new Error("useFormField should be used within <FormField>");
  const { id } = itemContext;
  return { id, name: fieldContext.name, formItemId: `${id}-form-item`, formDescriptionId: `${id}-form-item-description`, formMessageId: `${id}-form-item-message`, ...fieldState };
};

const FormItem = React.forwardRef(function FormItem({ className, ...props }, ref) {
  const id = React.useId();
  return <FormItemContext.Provider value={{ id }}><div ref={ref} className={cn("space-y-2", className)} {...props} /></FormItemContext.Provider>;
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef(function FormLabel({ className, ...props }, ref) {
  const { error, formItemId } = useFormField();
  return <Label ref={ref} className={cn(error && "text-brick", className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef(function FormControl({ ...props }, ref) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return <Slot ref={ref} id={formItemId} aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`} aria-invalid={!!error} {...props} />;
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef(function FormDescription({ className, ...props }, ref) {
  const { formDescriptionId } = useFormField();
  return <p ref={ref} id={formDescriptionId} className={cn("text-xs text-slate-300", className)} {...props} />;
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef(function FormMessage({ className, children, ...props }, ref) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;
  if (!body) return null;
  return (
    <p ref={ref} id={formMessageId} className={cn("text-xs font-medium text-brick", className)} {...props}>
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
