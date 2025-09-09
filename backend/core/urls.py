from django.urls import path, re_path
from . import views

urlpatterns = [
    # Auth & profile
    path('register', views.register),
    path('login', views.login_jwt),
    path('me', views.me),

    # Tags & public Q&A
    path('tags', views.tags),
    path('questions', views.questions),
    path('questions/suggest', views.question_suggest),
    path('questions/<int:qid>', views.question_detail),
    path('questions/<int:qid>/answers', views.answers),
    path('answers/<int:aid>', views.answer_detail),
    path('answers/<int:aid>/like', views.like_answer),
    path('answers/<int:aid>/mark-best', views.mark_best),

    # Points, leaderboard, logs
    path('points/balance', views.points_balance),
    path('points/transactions', views.point_transactions),
    path('redeem-qr', views.redeem_qr),
    path('log-chat', views.log_chat),
    path('leaderboard', views.leaderboard),

    # Search (hashtag / username / keyword)
    path('search', views.search),

    # Notifications
    path('notifications', views.notifications),
    path('notifications/read', views.notifications_read),
    path('notifications/mark-read', views.notifications_mark_read),  # alias

    # Direct (private) questions
    path('direct-questions', views.direct_questions),
    path('direct-questions/<int:pk>', views.direct_question_detail),

    # Password reset & username reminder
    path('forgot-password', views.forgot_password),
    path('reset-password', views.reset_password),
    path('forgot-username', views.forgot_username),

    # auth/ aliases (keep frontend happy if it uses /auth/*)
    path('auth/forgot-password', views.forgot_password),
    path('auth/reset-password', views.reset_password),
    path('auth/forgot-username', views.forgot_username),

    re_path(r'^auth/registration/?$', views.register),
    re_path(r'^register/?$', views.register),
    re_path(r'^auth/register/?$', views.register),

    # Health check
    path('ping', views.ping),
]
