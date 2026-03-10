# RedPulse

![Status: Under Development](https://img.shields.io/badge/Status-Under%20Development-orange.svg)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat&logo=pnpm&logoColor=white)

> **Note:** RedPulse is currently in the early stages of development.

RedPulse is a mobile application designed to bridge the gap between voluntary blood donors and medical institutions in Sri Lanka. By providing real-time inventory tracking and geo-targeted emergency alerts, the platform aims to reduce the time taken to find compatible donors during critical shortages.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or newer recommended) or [Bun](https://bun.sh/) (Only for Development)
- [pnpm](https://pnpm.io/installation) (Package Manager)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/saviru/redpulse.git
   ```

   ```bash
   cd redpulse
   ```

2. **Install dependencies** (Strictly using pnpm)

   ```bash
   pnpm install
   ```

3. **Start the Expo development server**

   ```bash
   # If using pnpm
   pnpm start
   # or
   pnpm expo start
   ```

4. **Chose Platform** (It will proide instructions)

   ```bash
   # For android
   a

   # For web
   w
   ```

## Available UI Components

This project includes a robust, reusable UI component library.

- **Typography:** `<Typo />`
- **Buttons & Controls:** `<Button />`, `<Toggle />`, `<Checkbox />`, `<Radio />`
- **Inputs:** `<Input />`, `<Select />`, `<DatePicker />`, `<BottomSheetPicker />`
- **Data Display:** `<Card />`, `<StatCard />`, `<Avatar />`, `<Badge />`, `<ListItem />`, `<ProgressBar />`
- **Layout:** `<ScreenLayout />`, `<AppBar />`, `<Divider />`

For a detailed breakdown of component props, tables, and specific usage examples, please refer to our full **[Components Documentation](components/Readme.md)**.

<br id='l1'>

## Branching & Forking

To keep the development organized and prevent direct pushes to the main branch:

1. **Fork the Repository** (If you are an external contributor):
   - Fork the repo to your own GitHub account and clone your fork locally.
2. **Create a Feature Branch**:
   - Always create a new branch from `main` before starting your work.
   - Use clear, descriptive branch names. Examples: `feat/user-login`, `ui/buttons`, `fix/card-styling`, `docs/update-readme`.
     ```bash
     git checkout -b feat/your-feature-name
     ```
3. **Commit & Push**:
   - Commit your changes with descriptive messages.
   - Push your branch to the repository.
     ```bash
     git push origin feat/your-feature-name
     ```
4. **Open a Pull Request**:
   - Open a PR against the `main` branch. Ensure tests pass before submitting. Reviewers will check code quality and UI consistency based on the existing guidelines.

## Adding or Editing UI Components

To maintain consistency, all UI components live inside the `components/ui` directory. When creating a new component, follow our folder-based structure:

1. **Create a new folder** under `components/ui/` (e.g., `components/ui/MyComponent`).
2. **Add the required files**:
   - `index.tsx`: The main React component logic.
   - `MyComponent.styles.ts`: `StyleSheet` definitions.
   - `MyComponent.types.ts`: TypeScript interfaces for your component's props.
   - `MyComponent.test.tsx`: Unit tests.
3. Keep logic clean, strictly typed, and ensure everything is thoroughly tested.
4. **Export your component**: Ensure new components are exported from their respective directories so they can be easily imported elsewhere.

Refer [Branching & Forking](#l1) for more details.

## Continuing Development

RedPulse uses **Expo Router** for file-based routing.

1. **Screens & Routes (`app/`)**:
   - Add new screens directly to the `app/` directory. For example, creating `app/login.tsx` will automatically map to the `/login` route.
   - Use `app/_layout.tsx` for shared providers, stacks, and navigation context.
2. **State & Logic**:
   - Keep complex business logic, API calls, and data layer logic separate from the UI components. Create new directories like `services/`, `store/`, or `utils/` at the root as the app scales.
   - Shared hooks should reside in the `hooks/` directory.
3. **Composing Pages**:
   - When building a new screen natively, always import controls, inputs, and layouts from the internal `components/ui` and `components/layouts` kit.

Refer [Branching & Forking](#l1) for more details.

## Testing

We use **Jest** connected with React Native Testing Library to verify component and logic functionality.

To execute the test suite, run:

```bash
# Run all tests
pnpm test

# Run tests in watch mode (useful during active development)
pnpm test --watch
```

Ensure that any new components or utilities added to the library have corresponding `.test.tsx` or `.test.ts` files to maintain high coverage and stability.
