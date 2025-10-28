from django.urls import path, re_path
from . import views

urlpatterns = [
    # --- Auth & profile ---
    # /api/register and /api/register/
    path('register', views.register),
    re_path(r'^register/?$', views.register),

    # /api/login and /api/login/
    path('login', views.login_jwt),
    re_path(r'^login/?$', views.login_jwt),

    # /api/me and /api/me/
    path('me', views.me),
    re_path(r'^me/?$', views.me),

    # --- Tags & public Q&A ---
    # /api/tags and /api/tags/
    path('tags', views.tags),
    re_path(r'^tags/?$', views.tags),

    path('points/redeem', views.redeem_qr),
    re_path(r'^points/redeem/?$', views.redeem_qr),

    # /api/questions and /api/questions/
    path('questions', views.questions),
    re_path(r'^questions/?$', views.questions),

    # /api/questions/suggest and /api/questions/suggest/
    path('questions/suggest', views.question_suggest),
    re_path(r'^questions/suggest/?$', views.question_suggest),

    # /api/questions/<qid> and /api/questions/<qid>/
    path('questions/<int:qid>', views.question_detail),
    re_path(r'^questions/(?P<qid>\d+)/?$', views.question_detail),

    # /api/questions/<qid>/answers and /api/questions/<qid>/answers/
    path('questions/<int:qid>/answers', views.answers),
    re_path(r'^questions/(?P<qid>\d+)/answers/?$', views.answers),

    # /api/answers/<aid> and /api/answers/<aid>/
    path('answers/<int:aid>', views.answer_detail),
    re_path(r'^answers/(?P<aid>\d+)/?$', views.answer_detail),

    # /api/answers/<aid>/like and /api/answers/<aid>/like/
    path('answers/<int:aid>/like', views.like_answer),
    re_path(r'^answers/(?P<aid>\d+)/like/?$', views.like_answer),

    # /api/answers/<aid>/mark-best and /api/answers/<aid>/mark-best/
    path('answers/<int:aid>/mark-best', views.mark_best),
    re_path(r'^answers/(?P<aid>\d+)/mark-best/?$', views.mark_best),

    # --- Points, leaderboard, logs ---
    # /api/points/balance and /api/points/balance/
    path('points/balance', views.points_balance),
    re_path(r'^points/balance/?$', views.points_balance),

    # /api/points/transactions and /api/points/transactions/
    path('points/transactions', views.point_transactions),
    re_path(r'^points/transactions/?$', views.point_transactions),

    # /api/redeem-qr and /api/redeem-qr/
    path('redeem-qr', views.redeem_qr),
    re_path(r'^redeem-qr/?$', views.redeem_qr),

    # /api/log-chat and /api/log-chat/
    path('log-chat', views.log_chat),
    re_path(r'^log-chat/?$', views.log_chat),

    # /api/leaderboard and /api/leaderboard/
    path('leaderboard', views.leaderboard),
    re_path(r'^leaderboard/?$', views.leaderboard),

    # /api/department-pets and /api/department-pets/
    path('department-pets', views.department_pets),
    re_path(r'^department-pets/?$', views.department_pets),

    # --- Search (hashtag / username / keyword) ---
    # /api/search and /api/search/
    path('search', views.search),
    re_path(r'^search/?$', views.search),

    # --- Notifications ---
    # /api/notifications and /api/notifications/
    path('notifications', views.notifications),
    re_path(r'^notifications/?$', views.notifications),

    # /api/notifications/read and /api/notifications/read/
    path('notifications/read', views.notifications_read),
    re_path(r'^notifications/read/?$', views.notifications_read),

    # /api/notifications/mark-read and /api/notifications/mark-read/
    path('notifications/mark-read', views.notifications_mark_read),  # alias
    re_path(r'^notifications/mark-read/?$', views.notifications_mark_read),

    # --- Direct (private) questions ---
    # /api/direct-questions and /api/direct-questions/
    path('direct-questions', views.direct_questions),
    re_path(r'^direct-questions/?$', views.direct_questions),

    # /api/direct-questions/<pk> and /api/direct-questions/<pk>/
    path('direct-questions/<int:pk>', views.direct_question_detail),
    re_path(r'^direct-questions/(?P<pk>\d+)/?$', views.direct_question_detail),

    # --- Password reset & username reminder ---
    # /api/forgot-password and /api/forgot-password/
    path('forgot-password', views.forgot_password),
    re_path(r'^forgot-password/?$', views.forgot_password),

    # /api/reset-password and /api/reset-password/
    path('reset-password', views.reset_password),
    re_path(r'^reset-password/?$', views.reset_password),

    # /api/forgot-username and /api/forgot-username/
    path('forgot-username', views.forgot_username),
    re_path(r'^forgot-username/?$', views.forgot_username),

    # --- auth/* aliases for frontend compatibility ---
    path('auth/forgot-password', views.forgot_password),
    re_path(r'^auth/forgot-password/?$', views.forgot_password),

    path('auth/reset-password', views.reset_password),
    re_path(r'^auth/reset-password/?$', views.reset_password),

    path('auth/forgot-username', views.forgot_username),
    re_path(r'^auth/forgot-username/?$', views.forgot_username),

    # registration aliases (e.g. /api/auth/register, /api/auth/registration)
    re_path(r'^auth/registration/?$', views.register),
    re_path(r'^auth/register/?$', views.register),

    # --- Health check ---
    # /api/ping and /api/ping/
    path('ping', views.ping),
    re_path(r'^ping/?$', views.ping),
]
