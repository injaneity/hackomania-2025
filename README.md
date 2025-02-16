# Sidequest

Hackathons don't have to be painful 24-hour debugging sessions. Why not face a different kind of challenge—one that goes beyond a hackathon win and earns you social clout? Sidequest presents you with a unique premise: find nearby tech enthusiasts, challenge them to a noble game of 1v1 Wordle, and duel for honor (or points).

Sidequest offers an all-in-one platform for hackathon organizers to integrate into their pre-existing participant dashboards, boosting participant engagement and socialization—all at the cost of a few imaginary points. What more could you ask for?

## Tech Stack

- **Expo & React Native:** For rapid cross-platform mobile development.
- **Firebase:** For real-time data and backend services.
- **Clerk Auth:** For seamless authentication and user management.

## How It Works

- **Matchmaking & Duels:**  
  Players can match against other players either for fun or for points at hackathons or other events.
  
- **Leaderboard:**  
  A dynamic leaderboard displays players ranked by their score—more points equal a higher rank. Woo!

- **Sidequest:**  
  With Sidequest, hackathon participants not only compete in coding challenges but also get to socialize and network in a fun, gamified environment.

## Getting Started

### 1. Install Dependencies

Run the following command in your project directory:

```bash
npm install --legacy-peer-deps
```

### 2. Start the App

Start the Expo server with:

```bash
npx expo start -c --tunnel
```

In the output, you'll see options to open the app in a:

- [Development Build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go) (a limited sandbox for trying out app development with Expo)

> **Tip:** To best test the application, we advise scanning the QR code (on iOS) or pasting the URL (on Android) in Expo Go.

Happy questing!