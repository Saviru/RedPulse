export interface CheckboxProps {
  checked: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}
