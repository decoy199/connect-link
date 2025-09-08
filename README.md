
### Demo users

- `alice / pass123` (Engineering)
- `bob / pass123` (Marketing)

## Pages (6) with Navbar

- Login
- Sign Up
- Question Dashboard
- Profile
- Points & Rewards
- FAQ

## TQuick “page ↔ file” cheat sheet
Login → frontend/src/pages/Login.jsx ↔ POST /api/login (core/views.py: login_jwt)

Sign Up → frontend/src/pages/SignUp.jsx ↔ POST /api/register (views.register)

Forgot Password → frontend/src/pages/ForgotPassword.jsx ↔ POST /api/forgot-password (views.forgot_password)

Reset Password → frontend/src/pages/ResetPassword.jsx ↔ POST /api/reset-password (views.reset_password)

Forgot Username → frontend/src/pages/ForgotUsername.jsx ↔ POST /api/forgot-username (views.forgot_username)

Dashboard → frontend/src/pages/Dashboard.jsx
↔ GET/POST /api/questions, GET /api/questions/suggest, GET /api/me,
GET /api/notifications, POST /api/notifications/read,
GET /api/leaderboard, GET /api/points/balance

Question Detail → frontend/src/pages/QuestionDetail.jsx
↔ GET /api/questions/{id}, GET/POST /api/questions/{id}/answers,
POST /api/answers/{aid}/like, POST /api/answers/{aid}/mark-best,
PUT/DELETE /api/answers/{aid}

Profile → frontend/src/pages/Profile.jsx ↔ GET/PUT /api/me

Points & Rewards → frontend/src/pages/PointsRewards.jsx ↔ GET /api/points/transactions (and backend supports POST /api/points/redeem)

FAQ → frontend/src/pages/FAQ.jsx (static)

Search → frontend/src/pages/Search.jsx ↔ GET /api/search?q=...

Navbar (shared) → frontend/src/components/Navbar.jsx
↔ GET /api/notifications, POST /api/notifications/read, navigates to /search?q=...



## Page ↔ Backend files
Login
Files: connectlink/urls.py → core/urls.py → core/views.py: login_jwt
Models/serializers used: User (no serializer)

Sign Up
Files: connectlink/urls.py → core/urls.py → core/views.py: register → (profile auto-created via core/signals.py)
Models/serializers used: User, UserProfile (no serializer)

Forgot Password
Files: connectlink/urls.py → core/urls.py → core/views.py: forgot_password
Models/serializers used: User (no serializer)

Reset Password
Files: connectlink/urls.py → core/urls.py → core/views.py: reset_password
Models/serializers used: User (no serializer)

Forgot Username
Files: connectlink/urls.py → core/urls.py → core/views.py: forgot_username
Models/serializers used: User (no serializer)

Dashboard
Files:
Questions feed/create: core/urls.py → core/views.py: questions
Title suggestions: core/urls.py → core/views.py: question_suggest
Me (profile get/update): core/urls.py → core/views.py: me
Notifications list: core/urls.py → core/views.py: notifications
Mark notifications read: core/urls.py → core/views.py: notifications_read
Leaderboard: core/urls.py → core/views.py: leaderboard
Points balance: core/urls.py → core/views.py: points_balance
Models/serializers used:
Question, Tag ⟷ QuestionSerializer
UserProfile, User ⟷ UserProfileSerializer
Notification ⟷ NotificationSerializer
(Points balance reads request.user.profile: UserProfile; no serializer)

Question Detail
Files:
Load/delete question: core/urls.py → core/views.py: question_detail
List/create answers: core/urls.py → core/views.py: answers
Edit/delete own answer: core/urls.py → core/views.py: answer_detail
Like answer: core/urls.py → core/views.py: like_answer
Mark best answer: core/urls.py → core/views.py: mark_best
Models/serializers used: Question ⟷ QuestionSerializer; Answer ⟷ AnswerSerializer

Profile
Files: core/urls.py → core/views.py: me
Models/serializers used: UserProfile, User, Tag ⟷ UserProfileSerializer

Points & Rewards
Files:
Transactions: core/urls.py → core/views.py: point_transactions
Redeem (supported): core/urls.py → core/views.py: redeem_qr
Balance (shown on Dashboard, sometimes here too): core/views.py: points_balance
Models/serializers used: PointTransaction ⟷ PointTransactionSerializer; UserProfile (balance; no serializer)

FAQ
Files: (none; static page)

Search
Files: core/urls.py → core/views.py: search
Models/serializers used: Question ⟷ QuestionSerializer; also queries User, UserProfile, Tag (people block; no serializer)

Navbar (shared)
Files:
Notifications list: core/urls.py → core/views.py: notifications
Mark read: core/urls.py → core/views.py: notifications_read
Models/serializers used: Notification ⟷ NotificationSerializer