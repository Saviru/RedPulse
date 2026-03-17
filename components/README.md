## 🧩 UI Components Reference

This library is designed to be modular and strongly typed. A complete list of props can always be found in the respective `*.types.ts` files for each component.

---

### Typography: `<Typo />`

Used for all text across the app to maintain consistent styling and scaling.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'h1', 'h2', 'h3', 'h4', 'body', 'caption'` | Determines the size and weight of the text. |
| `color` | `string` | undefined | Overrides the default text color. |
| `align` | `'left', 'center', 'right'` | Text alignment. |
| `children` | `ReactNode` | **Required** | The text content to display. |

**Example Usage:**
```tsx
import Typo from '@/components/ui/Typo';

export default function TextExample() {
  return (
    <>
      <Typo variant="h1" align="center">Blood Banks</Typo>
      <Typo variant="body" color="#666">Select a nearby blood bank to proceed.</Typo>
    </>
  );
}
```

---

### Button: `<Button />`

Primary interaction element for forms and actions.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary', 'secondary', 'outline', 'ghost'` | `'primary'` | Visual style of the button. |
| `size` | `'sm', 'md', 'lg'` | `'md'` | Sizing footprint of the button. |
| `isLoading` | `boolean` | `false` | Shows a loading indicator and disables press. |
| `onPress` | `() => void` | **Required** | Function executed on press. |
| `children` | `ReactNode` | **Required** | Text or icon inside the button. |

**Example Usage:**
```tsx
import Button from '@/components/ui/Button';

export default function ButtonExample() {
  return (
    <Button 
      variant="primary" 
      size="lg" 
      isLoading={false} 
      onPress={() => submitForm()}
    >
      Request Blood
    </Button>
  );
}
```

---

### Input: `<Input />`

Standard text input field with built-in label and error state handling.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `undefined` | The label displayed above the input field. |
| `placeholder`| `string` | `undefined` | Placeholder text when empty. |
| `value` | `string` | `undefined` | Current value of the input. |
| `error` | `string` | `undefined` | Error message displayed below the input. |
| `onChangeText`| `(text: string) => void`| `undefined` | Callback when text changes. |

**Example Usage:**
```tsx
import { useState } from 'react';
import Input from '@/components/ui/Input';

export default function InputExample() {
  const [bloodType, setBloodType] = useState('');

  return (
    <Input 
      label="Blood Type"
      placeholder="e.g., O+"
      value={bloodType}
      onChangeText={setBloodType}
      error={!bloodType ? "Required field" : undefined}
    />
  );
}
```

---

### Card: `<Card />`

A flexible container for grouping related content, like donor details or stats.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `elevated` | `boolean` | `true` | Applies a shadow / elevation effect. |
| `padded` | `boolean` | `true` | Applies default internal padding. |
| `onPress` | `() => void` | `undefined` | Makes the card pressable if provided. |
| `children` | `ReactNode` | **Required** | Card contents. |

**Example Usage:**
```tsx
import Card from '@/components/ui/Card';
import Typo from '@/components/ui/Typo';

export default function CardExample() {
  return (
    <Card elevated={true} onPress={() => viewDetails()}>
      <Typo variant="h3">Urgent Need</Typo>
      <Typo variant="body">A- Positive blood required at General Hospital.</Typo>
    </Card>
  );
}
```

---

### Avatar: `<Avatar />`

Used to display user profile pictures or placeholders.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `source` | `ImageSourcePropType` | `undefined` | Image source (URL or local require). |
| `initials` | `string` | `undefined` | Fallback text if no image source is provided. |
| `size` | `'sm', 'md', 'lg'` | `'md'` | Defines the dimensions of the avatar. |

**Example Usage:**
```tsx
import Avatar from '@/components/ui/Avatar';

export default function AvatarExample() {
  return (
    <Avatar 
      source={{ uri: 'https://example.com/profile.jpg' }} 
      initials="JD"
      size="lg" 
    />
  );
}
```

---

### ScreenLayout & AppBar (Layouts)

Foundation for building standard application screens.

| Component | Prop | Type | Description |
| :--- | :--- | :--- | :--- |
| `<ScreenLayout>`| `scrollable` | `boolean` | Wraps children in a ScrollView if true. |
| `<AppBar>` | `title` | `string` | Main header text for the screen. |
| `<AppBar>` | `showBack` | `boolean` | Renders a back navigation button. |
| `<AppBar>` | `rightAction`| `ReactNode` | Renders an element on the right side (e.g., settings icon). |

**Example Usage:**
```tsx
import ScreenLayout from '@/components/layouts/ScreenLayout';
import AppBar from '@/components/layouts/AppBar';
import Typo from '@/components/ui/Typo';

export default function LayoutExample() {
  return (
    <ScreenLayout scrollable>
      <AppBar title="Donation History" showBack />
      {/* Page Content */}
      <Typo variant="body">You have no recent donations.</Typo>
    </ScreenLayout>
  );
}
```
