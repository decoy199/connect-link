from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q, Sum, Case, When, IntegerField, Value
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    Tag, Question, Answer, PointTransaction, Notification, ChatLog,
    award_points, within_week
)
from .serializers import (
    UserProfileSerializer, TagSerializer, QuestionSerializer,
    AnswerSerializer, PointTransactionSerializer, NotificationSerializer
)
import qrcode
from io import BytesIO
import base64


from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
import json

FRONTEND_BASE_URL = "http://localhost:5175" 


def _token_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data

    # --- username 省略時は email から生成してユニーク化（既存仕様を保持しつつ拡張） ---
    username_raw = (data.get('username') or '').strip()
    password = data.get('password')
    email = (data.get('email', '') or '').strip().lower()

    if not password:
        return Response({'detail': 'username and password required'}, status=400)

    if username_raw:
        if User.objects.filter(username=username_raw).exists():
            return Response({'detail': 'username already exists'}, status=400)
        username = username_raw
    else:
        base = email.split('@')[0].strip() if email else ''
        if not base:
            return Response({'detail': 'username and password required'}, status=400)
        candidate = base
        counter = 0
        while User.objects.filter(username=candidate).exists():
            counter += 1
            candidate = f"{base}{counter}"
        username = candidate
    # --- ここまで ---

    user = User.objects.create_user(username=username, password=password, email=email)
    profile = user.profile
    profile.department = data.get('department', '')
    profile.position = data.get('position', '')
    profile.years_experience = int(data.get('years_experience', 0) or 0)
    profile.avatar_url = data.get('avatar_url', '')
    profile.save()

    # --- 追加: サインアップ直後に JWT を発行して HttpOnly クッキーに格納（自動ログイン扱い） ---
    tokens = _token_for_user(user)
    resp = Response({'token': tokens}, status=201)
    # ローカル開発想定。必要に応じて Secure=True/SameSite を環境で切替えてください
    resp.set_cookie(
        key='access',
        value=tokens['access'],
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=60 * 60,  # 1h 目安
        path='/'
    )
    resp.set_cookie(
        key='refresh',
        value=tokens['refresh'],
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=60 * 60 * 24 * 7,  # 7d 目安
        path='/'
    )
    return resp
    # --- 追加ここまで ---


@api_view(['POST'])
@permission_classes([AllowAny])
def login_jwt(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'detail': 'Invalid credentials'}, status=400)
    # 任意: ログイン時もクッキーへ。既存動作を維持したい場合は下をコメントアウト可
    tokens = _token_for_user(user)
    resp = Response({'token': tokens})
    resp.set_cookie('access', tokens['access'], httponly=True, secure=False, samesite='Lax', max_age=60*60, path='/')
    resp.set_cookie('refresh', tokens['refresh'], httponly=True, secure=False, samesite='Lax', max_age=60*60*24*7, path='/')
    return resp


@api_view(['GET', 'PUT'])
def me(request):
    """
    GET: return profile + user fields (includes first_name/last_name).
    PUT: update profile fields and user.first_name/last_name.
    """
    if request.method == 'GET':
        payload = UserProfileSerializer(request.user.profile).data
        user_blk = payload.get('user') or {}
        user_blk.update({
            'username': request.user.username,
            'first_name': request.user.first_name or '',
            'last_name' : request.user.last_name or ''
        })
        payload['user'] = user_blk
        return Response(payload)

    p = request.user.profile
    p.department = request.data.get('department', p.department)
    p.position   = request.data.get('position', p.position)
    p.bio        = request.data.get('bio', p.bio)
    p.hobbies    = request.data.get('hobbies', p.hobbies)
    p.years_experience = int(request.data.get('years_experience', p.years_experience))
    p.avatar_url = request.data.get('avatar_url', p.avatar_url)

    tags = request.data.get('expertise', [])
    if isinstance(tags, list):
        p.expertise.clear()
        for name in tags:
            tag, _ = Tag.objects.get_or_create(name=name.strip().lstrip('#'))
            p.expertise.add(tag)

    u = request.user
    u.first_name = request.data.get('first_name', u.first_name)
    u.last_name  = request.data.get('last_name',  u.last_name)
    u.save(update_fields=['first_name', 'last_name'])

    p.save()
    payload = UserProfileSerializer(p).data
    user_blk = payload.get('user') or {}
    user_blk.update({
        'username': u.username,
        'first_name': u.first_name or '',
        'last_name' : u.last_name or ''
    })
    payload['user'] = user_blk
    return Response(payload)


@api_view(['GET'])
def tags(request):
    return Response(TagSerializer(Tag.objects.all(), many=True).data)


# ---- 24h auto-bonus helper ----------------------------------------------------
def _maybe_auto_award(q: Question):
    if q.auto_awarded or q.best_answer_id:
        return
    if timezone.now() - q.created_at < timedelta(hours=24):
        return
    answers = list(q.answers.all())
    if not answers:
        q.auto_awarded = True
        q.save(update_fields=['auto_awarded'])
        return

    def key(a: Answer):
        likes = a.likes.count()
        yexp = a.author.profile.years_experience if a.author and hasattr(a.author, 'profile') else 0
        return (likes, yexp, -a.id)

    winner = max(answers, key=key)
    if winner.author:
        award_points(winner.author, 10, '24h top-liked answer bonus')
    q.auto_awarded = True
    q.save(update_fields=['auto_awarded'])


@api_view(['GET', 'POST'])
def questions(request):
    if request.method == 'GET':
        qset = Question.objects.all().order_by('-created_at')
        tag = request.GET.get('tag')
        if tag:
            qset = qset.filter(tags__name__iexact=tag.lstrip('#'))
        for q in qset[:20]:
            _maybe_auto_award(q)
        return Response(QuestionSerializer(qset, many=True).data)

    data = request.data
    q = Question.objects.create(
        author=request.user,
        title=data.get('title', ''),
        body=data.get('body', ''),
        urgent=bool(data.get('urgent', False)),
    )
    for t in data.get('tags', []):
        tag, _ = Tag.objects.get_or_create(name=t.strip().lstrip('#'))
        q.tags.add(tag)
    q.save()
    award_points(request.user, 5, 'Posted a question')

    notified_user_count = 0
    if q.urgent:
        tag_names = list(q.tags.values_list('name', flat=True))
        match = Q()
        for name in tag_names:
            match |= Q(profile__expertise__name__iexact=name)
        users = User.objects.filter(match).exclude(id=request.user.id).distinct()
        notified_user_count = users.count()
        for u in users:
            Notification.objects.create(
                user=u,
                message=f"URGENT: {q.title} (tags: {', '.join(tag_names)})",
                question=q,
            )

    data_out = QuestionSerializer(q).data
    if q.urgent:
        data_out['notified_user_count'] = notified_user_count
    return Response(data_out, status=201)


@api_view(['GET', 'DELETE'])
def question_detail(request, qid):
    try:
        q = Question.objects.get(id=qid)
    except Question.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)

    if request.method == 'GET':
        _maybe_auto_award(q)
        return Response(QuestionSerializer(q).data)

    if q.author != request.user:
        return Response({'detail': 'Forbidden'}, status=403)
    if timezone.now() - q.created_at > timedelta(minutes=30):
        return Response({'detail': 'Delete window (30 minutes) has expired'}, status=403)
    q.delete()
    return Response(status=204)


@api_view(['GET'])
def question_suggest(request):
    title = request.GET.get('title', '')
    if not title:
        return Response([])
    qs = Question.objects.filter(title__icontains=title).values('id', 'title')[:5]
    return Response(list(qs))


@api_view(['GET', 'POST'])
def answers(request, qid):
    try:
        q = Question.objects.get(id=qid)
    except Question.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if request.method == 'GET':
        _maybe_auto_award(q)
        return Response(AnswerSerializer(q.answers.all().order_by('-created_at'), many=True).data)
    if Answer.objects.filter(question=q, author=request.user).exists():
        return Response({'detail': 'You already answered this question'}, status=400)
    a = Answer.objects.create(question=q, author=request.user, body=request.data.get('body', ''))
    award_points(request.user, 10, 'Answered a question')
    return Response(AnswerSerializer(a).data, status=201)


@api_view(['PUT', 'DELETE'])
def answer_detail(request, aid):
    """
    Edit or delete an answer within 30 minutes of creation; only by the author.
    PUT body: {"body": "<new text>"}
    """
    try:
        a = Answer.objects.select_related('author').get(id=aid)
    except Answer.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)

    if a.author_id != request.user.id:
        return Response({'detail': 'Forbidden'}, status=403)

    if timezone.now() - a.created_at > timedelta(minutes=30):
        return Response({'detail': 'Edit/Delete window (30 minutes) has expired'}, status=403)

    if request.method == 'DELETE':
        a.delete()
        return Response(status=204)

    # PUT
    new_body = (request.data.get('body') or '').strip()
    if not new_body:
        return Response({'detail': 'Body is required'}, status=400)
    a.body = new_body
    a.save(update_fields=['body'])
    return Response(AnswerSerializer(a).data)


@api_view(['POST'])
def like_answer(request, aid):
    try:
        a = Answer.objects.select_related('author').get(id=aid)
    except Answer.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if a.author_id == request.user.id:
        return Response({'detail': 'Cannot like your own answer'}, status=400)
    a.likes.add(request.user)
    return Response({'like_count': a.likes.count()})


@api_view(['POST'])
def mark_best(request, aid):
    try:
        a = Answer.objects.select_related('question').get(id=aid)
    except Answer.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    q = a.question
    if q.author != request.user:
        return Response({'detail': 'Only the asker can select best answer'}, status=403)
    q.best_answer = a
    q.save(update_fields=['best_answer'])
    award_points(a.author, 20, 'Best answer selected')
    return Response({'best_answer_id': a.id})


@api_view(['GET'])
def points_balance(request):
    return Response({'points_balance': request.user.profile.points_balance})


@api_view(['GET'])
def point_transactions(request):
    tx = request.user.point_transactions.all().order_by('-created_at')[:100]
    return Response(PointTransactionSerializer(tx, many=True).data)


@api_view(['POST'])
def redeem_qr(request):
    amount = int(request.data.get('points', 0) or 0)
    p = request.user.profile
    if amount <= 0 or amount > p.points_balance:
        return Response({'detail': 'Invalid amount'}, status=400)
    p.points_balance -= amount
    p.save(update_fields=['points_balance'])
    PointTransaction.objects.create(user=request.user, amount=-amount, reason='Redeemed at cafeteria')
    payload = f"CONNECTLINK|USER:{request.user.username}|POINTS:{amount}|TS:{timezone.now().isoformat()}"
    img = qrcode.make(payload)
    buf = BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode()
    return Response({'qr_data_url': f'data:image/png;base64,{b64}', 'payload': payload})


@api_view(['POST'])
def log_chat(request):
    other_username = request.data.get('other')
    try:
        other = User.objects.get(username=other_username)
    except User.DoesNotExist:
        return Response({'detail': 'Other user not found'}, status=404)
    last = request.user.chats.filter(other=other).order_by('-created_at').first()
    if last and within_week(last.created_at):
        return Response({'detail': 'Already logged with this person this week'}, status=400)
    ChatLog.objects.create(user=request.user, other=other)
    award_points(request.user, 10, 'Logged 1-on-1 chat')
    if request.user.profile.department and other.profile.department and request.user.profile.department != other.profile.department:
        award_points(request.user, 15, 'Cross-department bonus')
    return Response({'status': 'ok'})


@api_view(['GET'])
def search(request):
    qraw = (request.GET.get('q') or '').strip()
    if not qraw:
        return Response({'people': [], 'questions': []})
    q = qraw.lstrip('#')

    questions = (Question.objects
                 .filter(Q(title__icontains=q) | Q(body__icontains=q) | Q(tags__name__icontains=q))
                 .distinct()
                 .order_by('-created_at'))

    priority = Case(
        When(username__iexact=q, then=Value(0)),
        When(username__istartswith=q, then=Value(1)),
        When(first_name__iexact=q, then=Value(2)),
        When(last_name__iexact=q, then=Value(2)),
        When(first_name__istartswith=q, then=Value(3)),
        When(last_name__istartswith=q, then=Value(3)),
        When(profile__expertise__name__iexact=q, then=Value(4)),
        When(Q(username__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q) |
             Q(profile__expertise__name__icontains=q), then=Value(5)),
        default=Value(6),
        output_field=IntegerField()
    )

    people = (User.objects
              .filter(
                  Q(username__icontains=q) |
                  Q(first_name__icontains=q) |
                  Q(last_name__icontains=q) |
                  Q(profile__expertise__name__icontains=q)
              )
              .annotate(priority=priority)
              .distinct()
              .order_by('priority', 'username')[:100])

    return Response({
        'people': [{
            'username': u.username,
            'name': (f"{u.first_name} {u.last_name}".strip() or u.username),
            'department': u.profile.department,
            'years_experience': u.profile.years_experience
        } for u in people],
        'questions': QuestionSerializer(questions, many=True).data
    })


@api_view(['GET'])
def notifications(request):
    notes = request.user.notifications.order_by('-created_at')[:50]
    return Response(NotificationSerializer(notes, many=True).data)


@api_view(['POST'])
def notifications_read(request):
    ids = request.data.get('ids')
    qs = request.user.notifications
    if ids:
        qs = qs.filter(id__in=ids)
    updated = qs.update(read=True)
    return Response({'updated': updated})


@api_view(['GET'])
def leaderboard(request):
    data = (User.objects
            .values('profile__department')
            .annotate(points=Sum('point_transactions__amount'))
            .order_by('-points')[:10])
    return Response([
        {'department': d['profile__department'] or 'Unknown', 'points': d['points'] or 0}
        for d in data
    ])


def _json(request):
    return json.loads(request.body.decode('utf-8') or "{}")

@csrf_exempt
def forgot_password(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    data = _json(request)
    email = data.get("email", "").strip().lower()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't leak existence
        return JsonResponse({"ok": True})

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_link = f"{FRONTEND_BASE_URL}/reset-password?uid={uid}&token={token}"

    send_mail(
        subject="Reset your password",
        message=f"Click to reset: {reset_link}",
        from_email=None,
        recipient_list=[email],
        fail_silently=True,
    )
    print("DEV reset link:", reset_link)  # helpful in dev
    return JsonResponse({"ok": True})

@csrf_exempt
def reset_password(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    data = _json(request)
    uid = data.get("uid")
    token = data.get("token")
    new_password = data.get("new_password", "")

    try:
        uid_int = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid_int)
    except Exception:
        return JsonResponse({"detail": "Invalid link"}, status=400)

    if not default_token_generator.check_token(user, token):
        return JsonResponse({"detail": "Invalid or expired token"}, status=400)

    if len(new_password) < 8:
        return JsonResponse({"detail": "Password too short"}, status=400)

    user.set_password(new_password)
    user.save()
    return JsonResponse({"ok": True})

@csrf_exempt
def forgot_username(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    data = _json(request)
    email = data.get("email", "").strip().lower()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"ok": True})
    send_mail(
        subject="Your username",
        message=f"Your username is: {user.username}",
        from_email=None,
        recipient_list=[email],
        fail_silently=True,
    )
    return JsonResponse({"ok": True})
