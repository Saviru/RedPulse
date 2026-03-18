export interface RadioProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  disabled?: boolean;
}
