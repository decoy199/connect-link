from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    def __str__(self): return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    hobbies = models.CharField(max_length=200, blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    expertise = models.ManyToManyField(Tag, blank=True, related_name='experts')
    points_balance = models.IntegerField(default=0)
    avatar_url = models.URLField(blank=True, default='')
    def __str__(self): return f"{self.user.username} Profile"

class Question(models.Model):
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='questions')
    urgent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    best_answer = models.ForeignKey('Answer', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    # 24時間後の自動ボーナスを付与済みかどうか
    auto_awarded = models.BooleanField(default=False)
    def __str__(self): return self.title

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_answers', blank=True)
    def like_count(self): return self.likes.count()
    def __str__(self): return f"Answer to {self.question_id} by {self.author_id}"

class PointTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='point_transactions')
    amount = models.IntegerField()
    reason = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

class ChatLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
    other = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_with')
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    # 通知対象の質問（クリックで詳細へ移動するため）
    question = models.ForeignKey(Question, null=True, blank=True, on_delete=models.CASCADE)

# Helper functions for points
def award_points(user, amount, reason):
    prof = user.profile
    prof.points_balance += amount
    prof.save(update_fields=['points_balance'])
    PointTransaction.objects.create(user=user, amount=amount, reason=reason)

def within_week(dt):
    return timezone.now() - dt <= timezone.timedelta(days=7)
