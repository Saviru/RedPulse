export interface ToggleProps {
  value: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}
