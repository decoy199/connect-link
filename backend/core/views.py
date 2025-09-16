from datetime import timedelta
from io import BytesIO
import base64
import json
import re
import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Q, Sum, Case, When, IntegerField, Value
from django.http import JsonResponse
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination

import qrcode

from .models import (
    Tag, Question, Answer, PointTransaction, Notification, ChatLog,
    award_points, within_week, DirectQuestion
)
from .serializers import (
    UserProfileSerializer, TagSerializer, QuestionSerializer,
    AnswerSerializer, PointTransactionSerializer, NotificationSerializer
)

logger = logging.getLogger(__name__)

FRONTEND_BASE_URL = "http://localhost:5175"


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def validate_password_strength(password):
    """Validate password strength."""
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter."
    
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter."
    
    if not re.search(r'\d', password):
        return "Password must contain at least one number."
    
    return None


def send_notification_email(user, subject, message, question=None):
    """Send notification email to user."""
    try:
        if user.email:
            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Notification email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send notification email to {user.email}: {e}")


def _token_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


# ------------------------ Auth ------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Create user, set profile fields, attach expertise hashtags,
    and immediately issue JWT (auto-login).
    """
    try:
        data = request.data

        # Validate required fields
        username_raw = (data.get('username') or '').strip()
        password = data.get('password')
        email = (data.get('email', '') or '').strip().lower()

        if not password:
            return Response({'detail': 'Password is required'}, status=400)

        # Validate email format
        if email:
            try:
                validate_email(email)
            except ValidationError:
                return Response({'detail': 'Invalid email format'}, status=400)

        # Validate password strength
        password_error = validate_password_strength(password)
        if password_error:
            return Response({'detail': password_error}, status=400)

        # Handle username generation
        if username_raw:
            if User.objects.filter(username=username_raw).exists():
                return Response({'detail': 'Username already exists'}, status=400)
            username = username_raw
        else:
            if not email:
                return Response({'detail': 'Username or email is required'}, status=400)
            base = email.split('@')[0].strip()
            if not base:
                return Response({'detail': 'Invalid email for username generation'}, status=400)
            candidate = base
            counter = 0
            while User.objects.filter(username=candidate).exists():
                counter += 1
                candidate = f"{base}{counter}"
            username = candidate

        # Check if email already exists
        if email and User.objects.filter(email=email).exists():
            return Response({'detail': 'Email already exists'}, status=400)

        # Create user and set names
        user = User.objects.create_user(username=username, password=password, email=email)
        user.first_name = (data.get('first_name') or '').strip()
        user.last_name = (data.get('last_name') or '').strip()
        user.save()

        # Profile fields
        profile = user.profile
        profile.department = (data.get('department') or '').strip()
        profile.position = (data.get('position') or '').strip()
        profile.bio = (data.get('bio') or '').strip()
        profile.hobbies = (data.get('hobbies') or '').strip()
        profile.years_experience = int(data.get('years_experience', 0) or 0)
        profile.avatar_url = ''
        profile.save()

        # Expertise hashtags
        raw_tags = data.get('expertise_hashtags', [])
        if isinstance(raw_tags, str):
            raw_tags = [t.strip() for t in raw_tags.split(',')]
        names = [t.strip().lstrip('#').lower() for t in raw_tags if t and t.strip()]
        if names:
            tag_objs = []
            for nm in dict.fromkeys(names):
                tag, _ = Tag.objects.get_or_create(name=nm)
                tag_objs.append(tag)
            profile.expertise.set(tag_objs)
            profile.save()

        # Award initial points
        award_points(user, 50, 'Welcome bonus')

        # Auto-login: issue JWT
        tokens = _token_for_user(user)
        resp = Response({'token': tokens, 'user': UserProfileSerializer(profile).data}, status=201)
        resp.set_cookie('access', tokens['access'], httponly=True, secure=False, samesite='Lax', max_age=60*60*8, path='/')
        resp.set_cookie('refresh', tokens['refresh'], httponly=True, secure=False, samesite='Lax', max_age=60*60*24*7, path='/')
        
        logger.info(f"New user registered: {username} ({email})")
        return resp

    except Exception as e:
        logger.error(f"Registration error: {e}")
        return Response({'detail': 'Registration failed. Please try again.'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_jwt(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'detail': 'Invalid credentials'}, status=400)
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
            'last_name': request.user.last_name or ''
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


# ------------------------ Tags ------------------------

@api_view(['GET'])
def tags(request):
    return Response(TagSerializer(Tag.objects.all(), many=True).data)


# ------------------------ Auto award helper ------------------------

def _maybe_auto_award(q: "Question"):
    if getattr(q, 'auto_awarded', False) or getattr(q, 'best_answer_id', None):
        return
    if timezone.now() - q.created_at < timedelta(hours=24):
        return
    answers = list(q.answers.all())
    if not answers:
        if hasattr(q, 'auto_awarded'):
            q.auto_awarded = True
            q.save(update_fields=['auto_awarded'])
        return

    def key(a: "Answer"):
        likes = a.likes.count()
        yexp = a.author.profile.years_experience if a.author and hasattr(a.author, 'profile') else 0
        return (likes, yexp, -a.id)

    winner = max(answers, key=key)
    if winner.author:
        award_points(winner.author, 10, '24h top-liked answer bonus')

    if hasattr(q, 'auto_awarded'):
        q.auto_awarded = True
        q.save(update_fields=['auto_awarded'])


# ------------------------ Questions (list/create) ------------------------

@api_view(['GET', 'POST'])
def questions(request):
    """
    GET: list public questions with pagination
      - optional ?tag=tagname
      - optional ?page=1&page_size=20
    POST: create a public question
      - accepts optional recipient_id to assign a single answerer
      - Anyone can view; only assigned user can answer
      - Notifications:
          * urgent + tags -> expertise-matched users
          * assigned recipient -> "You were assigned …"
    """
    if request.method == 'GET':
        qset = Question.objects.all().order_by('-created_at')
        tag = request.GET.get('tag')
        if tag:
            qset = qset.filter(tags__name__iexact=tag.lstrip('#'))
        
        # Apply auto-awarding to all questions
        for q in qset:
            _maybe_auto_award(q)
        
        # Pagination
        paginator = StandardResultsSetPagination()
        result_page = paginator.paginate_queryset(qset, request)
        serializer = QuestionSerializer(result_page, many=True)
        
        return paginator.get_paginated_response(serializer.data)

    # POST
    data = request.data
    title = (data.get('title') or '').strip()
    body  = (data.get('body') or '').strip()
    urgent = bool(data.get('urgent', False))
    tags_in = data.get('tags', [])
    recipient_id = data.get('recipient_id')

    if not title:
        return Response({'detail': 'Title is required'}, status=400)

    q = Question.objects.create(
        author=request.user,
        title=title,
        body=body,
        urgent=urgent,
    )

    # tags
    if isinstance(tags_in, list):
        for t in tags_in:
            tname = str(t).strip().lstrip('#')
            if not tname:
                continue
            tag, _ = Tag.objects.get_or_create(name=tname)
            q.tags.add(tag)
    elif isinstance(tags_in, str):
        for raw in [s.strip() for s in tags_in.split(',') if s.strip()]:
            tname = raw.lstrip('#')
            tag, _ = Tag.objects.get_or_create(name=tname)
            q.tags.add(tag)
    q.save()
    award_points(request.user, 5, 'Posted a question')

    # Optional: assigned answerer
    assigned_user = None
    if recipient_id:
        try:
            assigned_user = User.objects.get(id=int(recipient_id))
            if hasattr(q, 'assigned_answerer'):
                q.assigned_answerer = assigned_user
                q.save(update_fields=['assigned_answerer'])
        except Exception:
            assigned_user = None

    # Notifications
    # 1) urgent + tags => expertise match
    if urgent:
        tag_names = list(q.tags.values_list('name', flat=True))
        if tag_names:
            match = Q()
            for name in tag_names:
                match |= Q(profile__expertise__name__iexact=name)
            users = User.objects.filter(match).exclude(id=request.user.id).distinct()
            for u in users:
                Notification.objects.create(
                    user=u,
                    message=f"URGENT: {q.title} (tags: {', '.join(tag_names)})",
                    question=q,
                )
                # Send email notification for urgent questions
                send_notification_email(
                    u, 
                    f"URGENT Question: {q.title}",
                    f"A new urgent question has been posted that matches your expertise:\n\n{q.title}\n\n{q.body}\n\nTags: {', '.join(tag_names)}\n\nView and answer: {FRONTEND_BASE_URL}/questions/{q.id}",
                    q
                )

    # 2) assigned recipient gets private-style notification
    if assigned_user:
        Notification.objects.create(
            user=assigned_user,
            message=f"You were assigned to answer: {q.title}",
            question=q,
        )
        # Send email notification for assigned questions
        send_notification_email(
            assigned_user,
            f"Question Assignment: {q.title}",
            f"You have been assigned to answer a question:\n\n{q.title}\n\n{q.body}\n\nPlease provide your answer: {FRONTEND_BASE_URL}/questions/{q.id}",
            q
        )

    data_out = QuestionSerializer(q).data
    return Response(data_out, status=201)


# ------------------------ Question detail (get/delete) ------------------------

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


# ------------------------ Question suggest ------------------------

@api_view(['GET'])
def question_suggest(request):
    title = request.GET.get('title', '')
    if not title:
        return Response([])
    qs = Question.objects.filter(title__icontains=title).values('id', 'title')[:5]
    return Response(list(qs))


# ------------------------ Answers (list/create) ------------------------

@api_view(['GET', 'POST'])
def answers(request, qid):
    try:
        q = Question.objects.get(id=qid)
    except Question.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)

    if request.method == 'GET':
        _maybe_auto_award(q)
        return Response(AnswerSerializer(q.answers.all().order_by('-created_at'), many=True).data)

    # Only assigned recipient can answer (if set)
    assigned_id = getattr(q, 'assigned_answerer_id', None)
    if assigned_id and request.user.id != assigned_id:
        return Response({'detail': 'Only the assigned recipient can answer this question.'}, status=403)

    # Optional rule: one answer per user
    if Answer.objects.filter(question=q, author=request.user).exists():
        return Response({'detail': 'You already answered this question'}, status=400)

    body = (request.data.get('body') or '').strip()
    if not body:
        return Response({'detail': 'Answer body is required'}, status=400)

    a = Answer.objects.create(question=q, author=request.user, body=body)
    award_points(request.user, 10, 'Answered a question')

    # Notify question author
    if q.author_id and q.author_id != request.user.id:
        Notification.objects.create(
            user=q.author,
            message=f"New answer to: {q.title}",
            question=q,
        )
        # Send email notification for new answers
        send_notification_email(
            q.author,
            f"New Answer: {q.title}",
            f"Someone answered your question:\n\n{q.title}\n\nAnswer by {request.user.get_full_name() or request.user.username}:\n{body}\n\nView the full discussion: {FRONTEND_BASE_URL}/questions/{q.id}",
            q
        )

    return Response(AnswerSerializer(a).data, status=201)


# ------------------------ Answer update/delete ------------------------

@api_view(['PUT', 'DELETE'])
def answer_detail(request, aid):
    """
    Edit or delete an answer within 30 minutes of creation; only by the author.
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

    new_body = (request.data.get('body') or '').strip()
    if not new_body:
        return Response({'detail': 'Body is required'}, status=400)
    a.body = new_body
    a.save(update_fields=['body'])
    return Response(AnswerSerializer(a).data)


# ------------------------ Like / Mark best ------------------------

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
    if a.author:
        award_points(a.author, 20, 'Best answer selected')
        Notification.objects.create(
            user=a.author,
            message=f"Your answer was marked as best: {q.title}",
            question=q,
        )
    return Response({'best_answer_id': a.id})


# ------------------------ Points / QR ------------------------

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
    payload = f"HANDRAISE|USER:{request.user.username}|POINTS:{amount}|TS:{timezone.now().isoformat()}"
    img = qrcode.make(payload)
    buf = BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode()
    return Response({'qr_data_url': f'data:image/png;base64,{b64}', 'payload': payload})


# ------------------------ 1:1 Chat log (kept) ------------------------

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


# ------------------------ Search (enhanced) ------------------------

TAG_RE = re.compile(r"#([\w-]+)")
AT_RE  = re.compile(r"@([\w.-]+)")

def _user_brief(u: User):
    p = getattr(u, 'profile', None)
    return {
        'id': u.id,
        'username': u.username,
        'name': (f"{u.first_name} {u.last_name}".strip() or u.username),
        'department': getattr(p, 'department', '') or '',
        'years_experience': getattr(p, 'years_experience', 0) or 0,
    }


@api_view(['GET'])
def search(request):
    qraw = (request.GET.get('q') or '').strip()
    if not qraw:
        return Response({'people': [], 'questions': []})

    tag_tokens = TAG_RE.findall(qraw)
    at_tokens  = AT_RE.findall(qraw)

    cleaned = qraw
    for t in tag_tokens:
        cleaned = cleaned.replace(f"#{t}", " ")
    for a in at_tokens:
        cleaned = cleaned.replace(f"@{a}", " ")
    keywords = [s for s in re.split(r"\s+", cleaned.strip()) if s]

    # People search
    people_q = Q()
    for at in at_tokens:
        people_q |= Q(username__iexact=at) | Q(username__istartswith=at)
    for kw in keywords:
        people_q |= Q(username__icontains=kw) | Q(first_name__icontains=kw) | Q(last_name__icontains=kw)
    if tag_tokens:
        people_q |= Q(profile__expertise__name__in=tag_tokens)

    priority = Case(
        When(username__in=at_tokens, then=Value(0)),
        When(username__istartswith=cleaned, then=Value(1)),
        When(first_name__iexact=cleaned, then=Value(2)),
        When(last_name__iexact=cleaned, then=Value(2)),
        When(first_name__istartswith=cleaned, then=Value(3)),
        When(last_name__istartswith=cleaned, then=Value(3)),
        When(profile__expertise__name__in=tag_tokens, then=Value(4)),
        When(Q(username__icontains=cleaned) | Q(first_name__icontains=cleaned) | Q(last_name__icontains=cleaned), then=Value(5)),
        default=Value(6),
        output_field=IntegerField()
    )

    people = (User.objects
              .filter(people_q)
              .annotate(priority=priority)
              .distinct()
              .order_by('priority', 'username')[:100])

    # Public questions search
    q_qs = Question.objects.all()
    if tag_tokens:
        q_qs = q_qs.filter(tags__name__in=tag_tokens)
    if at_tokens:
        q_qs = q_qs.filter(author__username__in=at_tokens)
    for kw in keywords:
        q_qs = q_qs.filter(
            Q(title__icontains=kw) | Q(body__icontains=kw) | Q(tags__name__icontains=kw)
        )
    q_qs = q_qs.distinct().order_by('-created_at')

    # Limit results for performance
    questions = q_qs[:20]
    people_list = people[:10]
    
    result = {
        'people': [_user_brief(u) for u in people_list],
        'questions': QuestionSerializer(questions, many=True).data,
        'total_results': len(people_list) + len(questions),
        'query': qraw
    }
    
    logger.info(f"Search query '{qraw}' returned {result['total_results']} results")
    return Response(result)


# ------------------------ Notifications ------------------------

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


# ------------------------ Leaderboard ------------------------

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


# ------------------------ Forgot / Reset / Forgot-username ------------------------

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
    print("DEV reset link:", reset_link)
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


# ------------------------ Direct (private) Questions: list/create ------------------------

def _ensure_dq_visible(request, dq: 'DirectQuestion'):
    if request.user.id not in (dq.sender_id, dq.recipient_id):
        return Response({'detail': 'Not authorized'}, status=403)
    return None


@api_view(['GET', 'POST'])
def direct_questions(request):
    """
    GET: list my direct questions (sender or recipient)
    POST: create a new direct question
      payload: { "recipient_id": int, "title": str, "body"?: str, "tags"?: [str] }
    """
    if not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=401)

    if request.method == 'GET':
        items = (DirectQuestion.objects
                 .filter(Q(sender=request.user) | Q(recipient=request.user))
                 .select_related('sender', 'recipient')
                 .prefetch_related('tags')
                 .order_by('-created_at')[:200])

        def _dq(dq):
            return {
                'id': dq.id,
                'title': dq.title,
                'body': dq.body,
                'tags': [t.name for t in dq.tags.all()],
                'sender': _user_brief(dq.sender),
                'recipient': _user_brief(dq.recipient),
                'created_at': dq.created_at.isoformat(),
            }

        return Response({'items': [_dq(d) for d in items]})

    # POST
    data = request.data or {}
    recipient_id = data.get('recipient_id')
    title = (data.get('title') or '').strip()
    body  = (data.get('body') or '').strip()
    tags_in = data.get('tags') or []

    if not recipient_id or not title:
        return Response({'detail': 'recipient_id and title are required'}, status=400)
    if int(recipient_id) == request.user.id:
        return Response({'detail': 'You cannot send a direct question to yourself'}, status=400)

    try:
        recipient = User.objects.get(id=recipient_id)
    except User.DoesNotExist:
        return Response({'detail': 'Recipient not found'}, status=404)

    dq = DirectQuestion.objects.create(
        sender=request.user,
        recipient=recipient,
        title=title,
        body=body,
    )

    if tags_in:
        norm = [str(t).strip().lstrip('#') for t in tags_in if str(t).strip()]
        existing = list(Tag.objects.filter(name__in=norm))
        existing_names = {t.name for t in existing}
        to_create = [Tag(name=n) for n in norm if n not in existing_names]
        if to_create:
            Tag.objects.bulk_create(to_create)
            existing = list(Tag.objects.filter(name__in=norm))
        dq.tags.set(existing)

    Notification.objects.create(
        user=recipient,
        message=f"You have a new direct question from {request.user.username}: {title}",
    )

    return Response({
        'id': dq.id,
        'title': dq.title,
        'body': dq.body,
        'tags': [t.name for t in dq.tags.all()],
        'sender': _user_brief(dq.sender),
        'recipient': _user_brief(dq.recipient),
        'created_at': dq.created_at.isoformat(),
    }, status=201)


# ------------------------ Direct (private) Questions: detail ------------------------

@api_view(['GET'])
def direct_question_detail(request, pk: int):
    """
    GET a single direct question.
    Visible ONLY to sender or recipient.
    """
    if not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=401)

    try:
        dq = DirectQuestion.objects.select_related('sender', 'recipient').prefetch_related('tags').get(pk=pk)
    except DirectQuestion.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)

    not_ok = _ensure_dq_visible(request, dq)
    if not_ok:
        return not_ok

    return Response({
        'id': dq.id,
        'title': dq.title,
        'body': dq.body,
        'tags': [t.name for t in dq.tags.all()],
        'sender': _user_brief(dq.sender),
        'recipient': _user_brief(dq.recipient),
        'created_at': dq.created_at.isoformat(),
    })


# ------------------------ Aliases / utilities referenced by urls ------------------------

@api_view(['POST'])
def notifications_mark_read(request):
    """
    Alias for /notifications/read to match references that call a different name.
    """
    return notifications_read(request)


@api_view(['GET'])
def ping(request):
    """
    Simple health check endpoint.
    """
    who = None
    try:
        if request.user and request.user.is_authenticated:
            who = request.user.username
    except Exception:
        pass
    return Response({'ok': True, 'user': who})
