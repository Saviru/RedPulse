# RedPulse API

This backend supports the campaign collaboration workflow:

1. Organizer creates campaign and picks a hospital.
2. Hospital accepts or rejects collaboration.
3. If accepted, campaign is published for user registration (donor/volunteer).
4. If rejected, organizer gets notified and can change hospital.

## Atlas setup

- Copy `.env.example` to `.env`.
- Fill `MONGODB_URI` with your MongoDB Atlas connection string.
- Ensure your Atlas IP access allows this machine.

## Seed database

Run:

`npm run seed`

It will create:

- one organization user
- one hospital user
- one normal user
- hospital organizations used by mobile dropdown

The command prints values for:

- `EXPO_PUBLIC_ORGANIZATION_ID`
- `EXPO_PUBLIC_HOSPITAL_ID`
- `EXPO_PUBLIC_USER_ID`

Add these to the Expo root `.env` alongside `EXPO_PUBLIC_API_BASE_URL`.
