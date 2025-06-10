// src/data/sampleNotifications.js
export const sampleNotifications = [
  {
    date: "Today, 22 Jan, 2025",
    notifications: [
      {
        id: 1,
        icon: "crown",
        title: "Daily Step Goal Achieved!",
        message:
          "Awesome job, You've hit your step goal for the day. Keep moving!",
        time: "09:41 AM",
        isNew: true,
        type: "achievement",
      },
      {
        id: 2,
        icon: "trophy",
        title: "Weekly Progress Report",
        message: "Great job this week! Check your progress in the Tracker Menu",
        time: "09:35 AM",
        isNew: true,
        type: "report",
      },
      {
        id: 3,
        icon: "article",
        title: "New Article Available",
        message:
          "Check out the latest tips on healthy eating on our Articles section.",
        time: "09:41 AM",
        isNew: false,
        type: "content",
      },
    ],
  },
  {
    date: "20 Jan, 2025",
    notifications: [
      {
        id: 4,
        icon: "bolt",
        title: "Join our challenge",
        message: "Compete with friends and reach your goals together.",
        time: "16:00 PM",
        isNew: false,
        type: "challenge",
      },
      {
        id: 5,
        icon: "shield",
        title: "Account Security Update",
        message:
          "For your safety, please verify your account details. Secure your account with update",
        time: "12:20 AM",
        isNew: false,
        type: "security",
      },
    ],
  },
  {
    date: "18 Jan, 2025",
    notifications: [
      {
        id: 6,
        icon: "gift",
        title: "Don't miss out",
        message: "Get special discount on premium!",
        time: "10:00 AM",
        isNew: false,
        type: "promo",
      },
    ],
  },
];
