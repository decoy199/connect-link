from django.urls import path, re_path
from . import views

urlpatterns = [
    # Auth & profile
    path('register', views.register),
    path('login', views.login_jwt),
    path('me', views.me),  # GET = fetch profile, PUT = update profile

    # Tags & public Q&A
    path('tags', views.tags),
    path('questions', views.questions),  # GET list / POST create (supports anonymous flag)
    path('questions/suggest', views.question_suggest),
    path('questions/<int:qid>', views.question_detail),  # GET / DELETE (owner can delete within 30 min)
    path('questions/<int:qid>/answers', views.answers),  # GET list answers, POST create (1 per user, assigned guard)
    path('answers/<int:aid>', views.answer_detail),      # PUT edit / DELETE within 30 min
    path('answers/<int:aid>/like', views.like_answer),
    path('answers/<int:aid>/mark-best', views.mark_best),

    # Points, leaderboard, logs
    path('points/balance', views.points_balance),
    path('points/transactions', views.point_transactions),
    path('points/redeem', views.redeem_qr),
    path('log-chat', views.log_chat),
    path('leaderboard', views.leaderboard),
    path('department-pets', views.department_pets),

    # Search (hashtag / username / keyword)
    path('search', views.search),

    # Notifications
    path('notifications', views.notifications),           # GET latest notifications
    path('notifications/read', views.notifications_read), # POST mark read
    path('notifications/mark-read', views.notifications_read),  # alias to keep frontend happy

    # Direct (private) questions
    path('direct-questions', views.direct_questions),          # GET list / POST create
    path('direct-questions/<int:pk>', views.direct_question_detail),  # GET single

    # Password reset & username reminder
    path('forgot-password', views.forgot_password),
    path('reset-password', views.reset_password),
    path('forgot-username', views.forgot_username),

    # Legacy/alias routes under /auth/* to satisfy frontend assumptions
    path('auth/forgot-password', views.forgot_password),
    path('auth/reset-password', views.reset_password),
    path('auth/forgot-username', views.forgot_username),

    re_path(r'^auth/registration/?$', views.register),
    re_path(r'^register/?$', views.register),
    re_path(r'^auth/register/?$', views.register),

    # Health check / ping
    path('ping', views.ping) if hasattr(views, 'ping') else path('ping', lambda r: __import__('django.http').http.JsonResponse({'ok': True})),
]
