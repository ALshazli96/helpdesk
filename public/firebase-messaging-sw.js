importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCwMZPxZcbTzxeLU1wX0Ip6Z52Aroq1YiY",
  authDomain: "helpdesk-system-ab660.firebaseapp.com",
  projectId: "helpdesk-system-ab660",
  messagingSenderId: "979214919217",
  appId: "1:979214919217:web:ee69150c7da450365c9710"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/logo192.png'
  });
});