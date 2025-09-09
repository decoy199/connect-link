from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


# ---------------------------
# Tags / Profiles
# ---------------------------

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self) -> str:
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    hobbies = models.TextField(blank=True)
    years_experience = models.IntegerField(default=0)
    expertise = models.ManyToManyField(Tag, related_name='experts', blank=True)
    points_balance = models.IntegerField(default=0)
    # kept for compatibility with older frontends; not required by new UI
    avatar_url = models.URLField(blank=True)

    def __str__(self) -> str:
        return f"Profile({self.user.username})"


@receiver(post_save, sender=User)
def _create_user_profile(sender, instance: User, created: bool, **kwargs):
    """
    Ensure every User has a UserProfile so views can always access user.profile.
    """
    if created:
        UserProfile.objects.create(user=instance)


# ---------------------------
# Q&A
# ---------------------------

class Question(models.Model):
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='questions')
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='questions')
    urgent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    best_answer = models.ForeignKey('Answer', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    auto_awarded = models.BooleanField(default=False)

    # Publicly visible but with a restricted answerer (if set)
    assigned_answerer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_questions'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['urgent', '-created_at']),
        ]

    def __str__(self) -> str:
        return self.title


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='answers')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_answers', blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['question']),
        ]

    def like_count(self) -> int:
        return self.likes.count()

    def __str__(self) -> str:
        return f"Answer to Q{self.question_id} by U{self.author_id}"


# ---------------------------
# Points / Transactions
# ---------------------------

class PointTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='point_transactions')
    amount = models.IntegerField()
    reason = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self) -> str:
        sign = '+' if self.amount >= 0 else ''
        return f"{self.user.username} {sign}{self.amount} ({self.reason})"


# ---------------------------
# Notifications
# ---------------------------

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    # Optional link target to a public question (used by the frontend to navigate)
    question = models.ForeignKey(Question, null=True, blank=True, on_delete=models.CASCADE, related_name='notifications')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read', '-created_at']),
        ]

    def __str__(self) -> str:
        return f"Notification to {self.user_id}: {self.message[:40]}"


# ---------------------------
# Direct Questions (legacy/private)
# ---------------------------

class DirectQuestion(models.Model):
    """
    Private one-to-one question. Still supported for inbox/history.
    New "Ask privately but public-visible question with restricted answerer"
    uses Question.assigned_answerer instead.
    """
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='direct_questions_sent')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='direct_questions_received')
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='direct_questions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['recipient']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self) -> str:
        return f"[DM Q#{self.pk}] {self.title}"


# ---------------------------
# Chat Logs (for weekly logging / points)
# ---------------------------

class ChatLog(models.Model):
    """
    Simple 1:1 chat log. The views use:
        request.user.chats.filter(other=other).order_by('-created_at').first()
    so the FK to 'user' must have related_name='chats'.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chats'
    )
    other = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chats_with_me'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'other', '-created_at']),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} ↔ {self.other.username} @ {self.created_at:%Y-%m-%d %H:%M}"


# ---------------------------
# Helpers used by views
# ---------------------------

def award_points(user: User, amount: int, reason: str):
    """
    Add/subtract points to the user's balance and record a transaction.
    """
    profile = user.profile
    profile.points_balance = (profile.points_balance or 0) + int(amount)
    profile.save(update_fields=['points_balance'])
    PointTransaction.objects.create(user=user, amount=int(amount), reason=str(reason))


def within_week(dt) -> bool:
    return timezone.now() - dt <= timezone.timedelta(days=7)
