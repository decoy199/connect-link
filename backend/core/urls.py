from django.urls import path, re_path
from . import views

urlpatterns = [
    # Auth & profile
    path('register', views.register),
    path('login', views.login_jwt),
    path('me', views.me),

    # Tags & public Q&A
    path('tags', views.tags),
    path('questions', views.questions),                         # GET list (supports ?tag=&department=) / POST create
    path('questions/suggest', views.question_suggest),
    path('questions/<int:qid>', views.question_detail),         # GET / DELETE (owner within 30m)
    path('questions/<int:qid>/answers', views.answers),         # GET list / POST create
    path('answers/<int:aid>', views.answer_detail),             # PUT / DELETE
    path('answers/<int:aid>/like', views.like_answer),
    path('answers/<int:aid>/mark-best', views.mark_best),

    # Departments (for dashboard filter)
    path('departments', views.departments),

    # Points, leaderboard, logs
    path('points/balance', views.points_balance),
    path('points/transactions', views.point_transactions),
    path('points/redeem', views.redeem_qr),
    path('log-chat', views.log_chat),
    path('leaderboard', views.leaderboard),
    path('department-pets', views.department_pets),

    # Search
    path('search', views.search),

    # Notifications
    path('notifications', views.notifications),
    path('notifications/read', views.notifications_read),
    path('notifications/mark-read', views.notifications_read),  # alias

    # Direct questions
    path('direct-questions', views.direct_questions),
    path('direct-questions/<int:pk>', views.direct_question_detail),

    # Password reset & username reminder
    path('forgot-password', views.forgot_password),
    path('reset-password', views.reset_password),
    path('forgot-username', views.forgot_username),

    path('quiz/pending', views.quiz_pending),
    path('quiz/submit', views.quiz_submit),

    # Legacy/alias routes
    path('auth/forgot-password', views.forgot_password),
    path('auth/reset-password', views.reset_password),
    path('auth/forgot-username', views.forgot_username),

    re_path(r'^auth/registration/?$', views.register),
    re_path(r'^register/?$', views.register),
    re_path(r'^auth/register/?$', views.register),
]
