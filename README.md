# আর্নট্র্যাক — সেটআপ গাইড

## ১. Firebase প্রজেক্ট বানান
1. https://console.firebase.google.com এ যান, "Add project" চাপুন
2. প্রজেক্টের নাম দিন (যেমন: earntrack)
3. Google Analytics অফ রাখতে পারেন (দরকার নেই)

## ২. Authentication চালু করুন
1. বাম মেনু থেকে **Build > Authentication** এ যান
2. "Get started" চাপুন
3. **Sign-in method** ট্যাবে "Email/Password" চালু করুন

## ৩. Firestore Database চালু করুন
1. বাম মেনু থেকে **Build > Firestore Database** এ যান
2. "Create database" চাপুন, **production mode** বাছাই করুন (কাছাকাছি region, যেমন asia-south1)
3. তৈরি হলে **Rules** ট্যাবে গিয়ে এই প্রজেক্টের `firestore.rules` ফাইলের কন্টেন্ট কপি-পেস্ট করে **Publish** চাপুন

## ৪. ওয়েব অ্যাপ যোগ করুন ও কনফিগ কপি করুন
1. প্রজেক্ট Settings (⚙️ আইকন) > General ট্যাবে যান
2. "Your apps" এ ওয়েব আইকন (`</>`) চেপে একটা অ্যাপ যোগ করুন
3. যে কনফিগ অবজেক্ট দেখাবে সেটা `src/firebase.js` ফাইলে বসান

## ৫. প্রথম অ্যাডমিন বানান
1. অ্যাপ থেকে (ধাপ ৭ এর পর) নিজের ইমেইল দিয়ে সাইন-আপ করুন
2. Firebase Console > Authentication এ গিয়ে নিজের UID কপি করুন
3. Firestore Database > Data ট্যাবে গিয়ে ম্যানুয়ালি একটা কালেকশন বানান: `roles`
4. তার ভেতরে একটা ডকুমেন্ট বানান, Document ID = আপনার UID, ফিল্ড: `admin` (boolean) = `true`
5. এখন অ্যাপে রিলোড করলে উপরে ডান পাশে "অ্যাডমিন ভিউ" বাটন দেখাবে

## ৬. bKash/নগদ/রকেট নম্বর বসান
`src/App.jsx` ফাইলে উপরের দিকে `PAY_NUMBERS` অ্যারেতে আপনার আসল Send Money নম্বরগুলো বসান।

## ৭. লোকালি চালান
```bash
npm install
npm run dev
```
ব্রাউজারে http://localhost:5173 খুলবে।

## ৮. ইন্টারনেটে পাবলিশ করুন (ফ্রি — Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
npm run build
firebase init hosting   # public directory: dist, single-page app: yes
firebase deploy
```
এরপর একটা লিংক পাবেন (যেমন: `https://earntrack-xxxx.web.app`) যেটা যে কেউ ব্যবহার করতে পারবে।

## গুরুত্বপূর্ণ বিষয়

- **পেমেন্ট ম্যানুয়াল** — ইউজার Send Money করে ট্রানজেকশন আইডি দেবে, আপনি অ্যাডমিন প্যানেল থেকে যাচাই করে অনুমোদন করবেন। এটাতে bKash Merchant API লাগে না।
- **সিকিউরিটি** — `firestore.rules` নিশ্চিত করে যে ইউজার নিজে নিজের ব্যালেন্স বা সাবস্ক্রিপশন স্ট্যাটাস বাড়াতে পারবে না, শুধু admin role থাকা অ্যাকাউন্ট পারবে।
- **আইনি প্রস্তুতি** — বাংলাদেশে টাকা জমা নেওয়া ও উত্তোলন দেওয়া এই ধরনের প্ল্যাটফর্ম ট্রেড লাইসেন্স ও সম্ভবত বাংলাদেশ ব্যাংকের নিয়ম-কানুনের আওতায় পড়তে পারে — একজন স্থানীয় আইনজীবীর পরামর্শ নেওয়া উচিত ব্যবসা শুরুর আগে।
- **খরচ** — Firebase-এর ফ্রি Spark প্ল্যানে ছোট স্কেলে (কয়েক হাজার ইউজার পর্যন্ত) চালানো যায়, ইউজার বাড়লে Blaze প্ল্যানে যেতে হতে পারে।
