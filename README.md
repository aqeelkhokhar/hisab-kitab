# Home Hisab Kitab

A shared household finance app for families. Everyone in the family logs expenses, income and udhar (money lent or borrowed) into one shared book, and the rest of the family is notified as entries come in. Built with Expo, React Native and Firebase.

## Features

- Create a family book or join an existing one with a family code
- Simple name and PIN sign in, no email or password to remember
- Expenses with categories and a monthly dashboard of income against spending
- Udhar tracking with a running total of what is still outstanding
- Searchable transaction history
- Push notifications to the family when an expense, income or udhar entry is added, or when a new member joins

## How it is built

| Area | Choice |
| --- | --- |
| App | Expo SDK 55, React Native 0.83, Expo Router, TypeScript |
| Animation | React Native Reanimated |
| Backend | Firebase Firestore with security rules |
| Notifications | Firebase Cloud Functions triggered by Firestore writes (`onExpenseAdded`, `onIncomeAdded`, `onUdharAdded`, `onMemberJoined`) |
| Web | Runs on the web through react-native-web |

```
app/            routes for sign in, setup and the four tabs
components/ui   button, card, category picker, PIN input
context/        auth context
firebase/       Firestore and storage access
functions/      Cloud Functions that send family notifications
hooks/          monthly data aggregation
```

## Run it

```sh
yarn install
npx expo start
```

Deploy the rules and functions with the Firebase CLI from the project root.

## Author

Built by [Aqeel Ahmad](https://github.com/aqeelkhokhar), Senior Mobile Engineer. Portfolio https://aqeel-ahmad-portfolio.vercel.app/
