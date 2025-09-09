export async function registerServiceWorkerAndSubscribe(vapidPublicKey: string) {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported');
  if (!('PushManager' in window)) throw new Error('Push not supported');

  const registration = await navigator.serviceWorker.register('/sw.js');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission not granted');

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  return subscription;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
