from django.urls import path
from . import views

urlpatterns = [
    path('register', views.register),
    path('login', views.login_jwt),
    path('me', views.me),

    path('tags', views.tags),
    path('questions', views.questions),
    path('questions/suggest', views.question_suggest),
    path('questions/<int:qid>', views.question_detail),
    path('questions/<int:qid>/answers', views.answers),

    path('answers/<int:aid>/like', views.like_answer),
    path('answers/<int:aid>/mark-best', views.mark_best),

    # ★ NEW: edit/delete answer
    path('answers/<int:aid>', views.answer_detail),

    path('points/balance', views.points_balance),
    path('points/transactions', views.point_transactions),
    path('points/redeem', views.redeem_qr),

    path('chats/log', views.log_chat),
    path('search', views.search),
    path('notifications', views.notifications),
    path('notifications/read', views.notifications_read),
    path('leaderboard', views.leaderboard),
    path('auth/register', views.register),
    path('auth/login', views.login_jwt),

     # NEW: password reset + username reminder
    path('forgot-password', views.forgot_password),
    path('reset-password', views.reset_password),
    path('forgot-username', views.forgot_username),

    # auth/ aliases (keep frontend happy if it uses /auth/*)
    path('auth/forgot-password', views.forgot_password),
    path('auth/reset-password', views.reset_password),
    path('auth/forgot-username', views.forgot_username),
]
