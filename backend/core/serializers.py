
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Tag, Question, Answer, PointTransaction, Notification


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    expertise = TagSerializer(many=True, read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "user",
            "department",
            "position",
            "bio",
            "hobbies",
            "years_experience",
            "expertise",
            "points_balance",
        ]


class QuestionSerializer(serializers.ModelSerializer):
    """
    Exposes:
      - author: public-facing author (null if anonymous)
      - assigned_answerer: who is allowed to answer, when set
      - best_answer_id: id of best answer if selected
      - mine: True if the current requester is the (real) creator, regardless of anonymity
    """
    tags = TagSerializer(many=True, read_only=True)
    author = UserSerializer(read_only=True)
    best_answer_id = serializers.IntegerField(source="best_answer.id", read_only=True)
    assigned_answerer = UserBriefSerializer(read_only=True)
    mine = serializers.SerializerMethodField()

    def get_mine(self, obj):
        req = self.context.get("request")
        if not req or not req.user or not req.user.is_authenticated:
            return False
        # created_by persists the real owner even if author is hidden (anonymous)
        return (obj.created_by_id == req.user.id) or (obj.author_id == req.user.id)

    class Meta:
        model = Question
        fields = [
            "id",
            "title",
            "body",
            "tags",
            "urgent",
            "author",
            "created_at",
            "best_answer_id",
            "auto_awarded",
            "assigned_answerer",
            "mine",
        ]


class AnswerSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Answer
        fields = ["id", "question", "body", "author", "created_at", "like_count"]


class PointTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = ["id", "amount", "reason", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source="question.id", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "message", "created_at", "read", "question_id"]
